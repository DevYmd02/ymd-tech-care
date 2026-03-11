import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/schemas/vq-schemas';
import { VQService, type VQCreateData } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { RFQHeader, RFQLine, RFQDetailResponse } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { VQListItem, VQStatus } from '@/modules/procurement/types/vq-types';
import { useVQMasterData } from './useVQMasterData';

export interface ExtendedRFQHeader extends RFQHeader {
    vendor_id?: number;
    vendor_name?: string | null;
    isMulticurrency?: boolean;
}

const createEmptyLine = (): QuotationLineFormData => ({
  item_id: 0,
  item_code: '',
  item_name: '',
  qty: 1,
  unit_price: 0,
  discount_expression: '0',
  discount_amount: 0,
  net_amount: 0,
  uom_id: 0,
  uom_name: '',
  no_quote: false,
  reference_price: 0,
  status: 'OPEN'
});

interface RawVQLine {
    item_id?: number | string | null;
    item_code?: string | null;
    item_name?: string | null;
    qty?: number | string | null;
    unit_price?: number | string | null;
    discount_expression?: string | null;
    discount_raw?: string | null;
    discount_amount?: number | string | null;
    net_amount?: number | string | null;
    uom_id?: number | string | null;
    uom_name?: string | null;
    uom?: string | null;
    no_quote?: boolean | string | number | null;
    reference_price?: number | string | null;
    est_unit_price?: number | string | null;
    status?: string | null;
    remark?: string | null;
}

interface RawVQResponse extends Omit<Partial<VQListItem>, 'vq_lines'> {
    vq_lines?: RawVQLine[];
    lines?: RawVQLine[];
    items?: RawVQLine[];
}

export const useVQForm = (
  isOpen: boolean, 
  onClose: () => void, 
  initialRFQ?: ExtendedRFQHeader | null, 
  onSuccess?: () => void,
  vqId?: number | null,
  isViewMode?: boolean
) => {
  const { toast } = useToast();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  const { confirm } = useConfirmation();
  const { purchaseTaxOptions, currencyOptions, isLoading: isMasterLoading } = useVQMasterData();

  const formMethods = useForm<QuotationFormData>({
    resolver: zodResolver(QuotationHeaderSchema) as Resolver<QuotationFormData>,
    defaultValues: {
      quotation_date: new Date().toISOString(),
      status: 'DRAFT',
      vq_lines: [createEmptyLine()],
      currency: 'THB',
      exchange_rate: 1,
      tax_code_id: 0,
      discount_expression: '0'
    }
  });

  const { control, reset, handleSubmit, setValue, getValues } = formMethods;
  const { fields, append, remove, replace, insert } = useFieldArray({
    control,
    name: 'vq_lines'
  });

  // Watch for isMulticurrency changes to auto-reset
  const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });
  const watchCurrency = useWatch({ control, name: 'currency' });

  useEffect(() => {
    if (!isMulticurrency) {
      if (getValues('currency') !== 'THB' || getValues('exchange_rate') !== 1) {
        setValue('currency', 'THB');
        setValue('exchange_rate', 1);
        setValue('target_currency', '');
        setValue('exchange_rate_date', '');
      }
    }
  }, [isMulticurrency, setValue, getValues]);

  // If currency is THB, exchange rate MUST be 1
  useEffect(() => {
    if (watchCurrency === 'THB' && getValues('exchange_rate') !== 1) {
      setValue('exchange_rate', 1);
    }
  }, [watchCurrency, setValue, getValues]);

  const [vqStatus, setVqStatus] = useState<VQStatus | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dbTotals, setDbTotals] = useState<{
    subtotal: number;
    billDiscount: number;
    preTax: number;
    taxAmount: number;
    grandTotal: number;
    totalLineDiscount: number;
    taxRate: number;
  } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (vqId) {
        setIsDataLoading(true);
        // --- VIEW / EDIT MODE: Fetch Existing VQ ---
        VQService.getById(vqId).then(async (response) => {
            // @Agent_Payload_Parser - Data Normalization (Unwrap Array) 
            // We use type assertion to our specific RawVQResponse instead of any/unknown
            const data = (Array.isArray(response) ? response[0] : response) as RawVQResponse;
            
            if (!data) {
                console.warn("VQ Data Not Found for ID:", vqId);
                setIsDataLoading(false);
                return;
            }

            setVqStatus(data.status || null);

            // SPECIAL CASE: If PENDING, we must pull LATEST lines from the referenced RFQ
            let apiLines: RFQLine[] = [];
            if (data.status === 'PENDING' && data.rfq_id) {
               try {
                  const rfqDetail: RFQDetailResponse = await RFQService.getById(data.rfq_id);
                  apiLines = rfqDetail.rfqLines || rfqDetail.lines || [];
               } catch (err) {
                  logger.error('[useVQForm] Failed to fetch RFQ lines for PENDING VQ:', err);
               }
            }

            // @Agent_Payload_Parser - Line Mapping (Search for lines, vq_lines, items)
            const linesToMap = data.vq_lines || data.lines || data.items || [];
            
            // @Agent_Backend_Diagnostic - Failsafe Alert
            if (linesToMap.length === 0 && apiLines.length === 0) {
                console.warn("VQ Lines Not Found", data);
            }

            const mappedLines: QuotationLineFormData[] = (apiLines.length > 0 ? apiLines : linesToMap).map((l: RawVQLine) => {
                return {
                    ...createEmptyLine(),
                    item_id: Number(l.item_id) || 0,
                    item_code: String(l.item_code || ''),
                    item_name: String(l.item_name || ''),
                    qty: Number(l.qty) || 0,
                    unit_price: Number(l.unit_price) || 0,
                    discount_expression: String(l.discount_expression || l.discount_raw || '0'),
                    discount_amount: Number(l.discount_amount) || 0,
                    net_amount: Number(l.net_amount) || 0,
                    uom_id: Number(l.uom_id) || 0,
                    uom_name: String(l.uom_name || l.uom || ''),
                    no_quote: Boolean(l.no_quote),
                    reference_price: Number(l.reference_price || l.est_unit_price) || 0,
                    status: String(l.status || 'OPEN'),
                    remark: String(l.remark || '')
                };
            });

            // @Agent_Summary_Syncer - Sync DB Totals to UI
            setDbTotals({
                subtotal: (Number(data.base_total_amount) || 0) + (Number(data.base_discount_amount) || 0) - (Number(data.base_tax_amount) || 0),
                billDiscount: Number(data.base_discount_amount) || 0,
                preTax: (Number(data.base_total_amount) || 0) - (Number(data.base_tax_amount) || 0),
                taxAmount: Number(data.base_tax_amount) || 0,
                grandTotal: Number(data.base_total_amount) || 0,
                totalLineDiscount: 0,
                taxRate: Number(data.tax_rate) ? Number(data.tax_rate) * 100 : 0
            });

            const hydratedData = {
                quotation_no: data.vq_no || '',
                quotation_date: data.quotation_date ? new Date(data.quotation_date).toISOString() : new Date().toISOString(),
                vendor_id: Number(data.vendor_id || 0),
                vendor_code: data.vendor?.vendor_code || data.vendor_code || '',
                vendor_name: data.vendor_name || data.vendor?.vendor_name || '',
                contact_person: data.contact_person || '',
                contact_phone: data.contact_phone || '',
                contact_email: data.contact_email || '',
                currency: data.base_currency_code || 'THB',
                isMulticurrency: Boolean(data.base_currency_code && data.base_currency_code !== 'THB'),
                exchange_rate_date: data.exchange_rate_date || '',
                target_currency: data.target_currency || '',
                exchange_rate: Number(data.exchange_rate) || 1,
                payment_term_days: data.payment_term_days || 0,
                lead_time_days: data.lead_time_days || 0,
                valid_until: data.quotation_expiry_date ? new Date(data.quotation_expiry_date).toISOString() : '', 
                qc_id: Number(data.qc_id || 0),
                rfq_id: Number(data.rfq_id || 0),
                rfq_no: data.rfq_no || '',
                discount_expression: String(data.discount_expression || '0'),
                tax_code_id: Number(data.tax_code_id || 0),
                status: data.status || 'DRAFT',
                vq_lines: mappedLines
            };

            // @Agent_Form_Injector - Safe Hydration
            reset(hydratedData);
            if (mappedLines.length > 0) {
                replace(mappedLines);
            }

            if (hydratedData.vendor_id && !hydratedData.vendor_name) {
                VendorService.getById(hydratedData.vendor_id).then(v => {
                    if (v) {
                        setValue('vendor_code', v.vendor_code);
                        setValue('vendor_name', v.vendor_name);
                    }
                });
            }
            if (hydratedData.rfq_id && !hydratedData.rfq_no) {
                RFQService.getById(hydratedData.rfq_id).then(r => {
                    if (r) setValue('rfq_no', r.rfq_no);
                });
            }

            setIsDataLoading(false);
        }).catch(err => {
            logger.error('[useVQForm] Failed to fetch VQ detail:', err);
            setIsDataLoading(false);
        });
      } else if (initialRFQ) {
        // --- CREATE MODE: Auto-fill from RFQ ---
        setIsDataLoading(true);
        RFQService.getById(initialRFQ.rfq_id).then((fullRFQ: RFQDetailResponse) => {
            let mappedLines: QuotationLineFormData[] = [];
            
            if (fullRFQ.lines && fullRFQ.lines.length > 0) {
                mappedLines = fullRFQ.lines.map((line) => ({
                    ...createEmptyLine(),
                    item_id: line.item_id || 0,
                    item_code: line.item_code || '',
                    item_name: line.item_name || '',
                    qty: line.qty || 1,
                    uom_id: line.uom_id || 0,
                    uom_name: line.uom || '',
                    unit_price: 0,
                    discount_expression: '0',
                    discount_amount: 0,
                    net_amount: 0,
                    no_quote: false,
                    reference_price: line.est_unit_price || 0,
                    status: 'OPEN'
                }));
            } else {
                mappedLines = Array(5).fill(null).map(() => createEmptyLine());
            }

            // Find specific vendor if initialRFQ passed vendor_id
            const allVendors = fullRFQ.vendors || fullRFQ.rfqVendors || [];
            let selectedVendor = allVendors.find(v => v.vendor_id === initialRFQ.vendor_id);
            if (!selectedVendor && allVendors.length > 0) {
                 selectedVendor = allVendors[0];
            }

            reset({
                quotation_no: `VQ-${new Date().getFullYear()}-xxx (Auto)`,
                quotation_date: new Date().toISOString(),
                vendor_id: Number(initialRFQ.vendor_id || selectedVendor?.vendor_id) || 0, 
                vendor_code: selectedVendor?.vendor_code || '',
                vendor_name: selectedVendor?.vendor_name || initialRFQ.vendor_name || '',
                currency: fullRFQ.rfq_base_currency_code || 'THB',
                isMulticurrency: Boolean(fullRFQ.rfq_base_currency_code && fullRFQ.rfq_base_currency_code !== 'THB'),
                exchange_rate_date: fullRFQ.rfq_exchange_rate_date || '',
                target_currency: fullRFQ.rfq_quote_currency_code || '',
                exchange_rate: Number(fullRFQ.rfq_exchange_rate) || 1,
                vq_lines: mappedLines,
                payment_term_days: 0,
                lead_time_days: 0,
                qc_id: 0, 
                rfq_id: Number(fullRFQ.rfq_id) || 0,
                rfq_no: fullRFQ.rfq_no || '',
                remark: fullRFQ.remarks || '',
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default +30 days
                discount_expression: '0',
                tax_code_id: 0,
                status: 'DRAFT'
            });
            setIsDataLoading(false);
        }).catch((err) => {
            logger.error('[useVQForm] Failed to fetch RFQ details for initial load:', err);
            setIsDataLoading(false);
        });
      } else {
        // --- BLANK CREATE MODE ---
        reset({
          quotation_no: '',
          quotation_date: new Date().toISOString(),
          currency: 'THB',
          isMulticurrency: false,
          exchange_rate_date: '',
          target_currency: '',
          exchange_rate: 1,
          vq_lines: [createEmptyLine()],
          payment_term_days: 0,
          lead_time_days: 0,
          remark: '',
          tax_code_id: 0,
          vendor_id: 0,
          rfq_id: 0,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          discount_expression: '0',
          status: 'DRAFT'
        });
        setDbTotals(null);
      }
    }
  }, [isOpen, initialRFQ, vqId, reset, getValues, replace, setValue]);


  // Calculations
  // Optimized Watchers (React Compiler Friendly)
  const watchedLines = useWatch({ control, name: 'vq_lines' });
  const watchedGlobalDiscount = useWatch({ control, name: 'discount_expression' });
  const watchTaxCodeId = useWatch({ control, name: 'tax_code_id' });

  const parseDiscount = (expr: string | undefined, base: number) => {
    if (!expr) return 0;
    const cleanExpr = expr.toString().trim();
    if (cleanExpr.endsWith('%')) {
      const percent = parseFloat(cleanExpr.replace('%', '')) || 0;
      return (base * percent) / 100;
    }
    return parseFloat(cleanExpr) || 0;
  };

  const calculatedTotals = useMemo(() => {
    const lines = watchedLines || [];
    const globalDiscountExpr = watchedGlobalDiscount || '0';

    const subtotal = lines.reduce((sum, line) => {
      if (line.no_quote) return sum;
      const base = (Number(line.qty) || 0) * (Number(line.unit_price) || 0);
      const discount = parseDiscount(line.discount_expression, base);
      return sum + (base - discount);
    }, 0);

    const totalLineDiscount = lines.reduce((sum, line) => {
      if (line.no_quote) return sum;
      return sum + parseDiscount(line.discount_expression, (Number(line.qty) || 0) * (Number(line.unit_price) || 0));
    }, 0);

    const billDiscount = parseDiscount(globalDiscountExpr, subtotal);
    const preTax = subtotal - billDiscount;
    
    // Find tax rate
    const taxOption = purchaseTaxOptions.find(o => Number(o.value) === Number(watchTaxCodeId));
    const taxRatePercent = taxOption ? (Number(taxOption.original?.tax_rate) || 0) : 0;
    const taxAmount = (preTax * taxRatePercent) / 100;
    const grandTotal = preTax + taxAmount;

    return {
      subtotal,
      billDiscount, // Aligned with UI expectation (passed as discountAmount in destruct)
      preTax,
      taxAmount,    // Aligned with UI expectation (passed as vatAmount in destruct)
      grandTotal,
      totalLineDiscount,
      taxRate: taxRatePercent
    };
  }, [watchedLines, watchedGlobalDiscount, watchTaxCodeId, purchaseTaxOptions]);

  const { formState: { dirtyFields } } = formMethods;
  
  const totals = useMemo(() => {
      const hasEdit = !!dirtyFields.vq_lines || !!dirtyFields.discount_expression || !!dirtyFields.tax_code_id;
      // Use dbTotals only if it exists and there's no UI edit in the critical fields.
      return (dbTotals && !hasEdit) ? dbTotals : calculatedTotals;
  }, [dbTotals, dirtyFields, calculatedTotals]);
  
  // Error handler (The PR DNA: Recursive first error message extractor)
  const handleFormError = useCallback((fieldErrors: FieldErrors<QuotationFormData>) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      showAlert('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึกเอกสาร');
    }
  }, [showAlert]);

  // Handlers
  const handleSave = handleSubmit(async (data: QuotationFormData) => {
    if (isViewMode) return;
    try {
      if (!data.vendor_id) {
          showAlert('กรุณาเลือกรหัสผู้ขาย');
          return;
      }
      
      const filledLines = data.vq_lines.filter(l => l.item_code);
      if (filledLines.length === 0) {
          showAlert('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ');
          return;
      }
      
      // 🎯 STRICT TYPE CASTING: IDs are already numbers thanks to Zod coercion
      const payload: VQCreateData = {
          ...data,
          vendor_id: Number(data.vendor_id),
          rfq_id: data.rfq_id ? Number(data.rfq_id) : undefined,
          qc_id: data.qc_id ? Number(data.qc_id) : undefined,
          tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
          exchange_rate: Number(data.exchange_rate) || 1,
          base_currency_code: data.currency || 'THB',
          quotation_expiry_date: data.valid_until,
          remarks: data.remark,
          total_amount: totals.grandTotal,
          base_total_amount: totals.grandTotal, // Align with list page expectations
          status: data.status,
          vq_lines: data.vq_lines?.map(l => ({
              ...l,
              item_id: Number(l.item_id),
              uom_id: Number(l.uom_id),
              qty: Number(l.qty),
              unit_price: Number(l.unit_price),
              discount_expression: l.discount_expression || '0', 
              discount_amount: parseDiscount(l.discount_expression, (l.qty || 0) * (l.unit_price || 0)),
              net_amount: (Number(l.qty) * Number(l.unit_price)) - parseDiscount(l.discount_expression, (l.qty || 0) * (l.unit_price || 0))
          }))
      };

      if (vqId) {
        const response = await VQService.update(vqId, payload as Partial<VQListItem>);
        const vqNo = data.quotation_no || (response.id ? String(response.id) : vqId);
        
        // 🎯 Close-First Interaction Flow
        onClose();
        toast(`แก้ไขใบเสนอราคา ${vqNo} สำเร็จ`, 'success', 'บันทึกสำเร็จ');
      } else {
        const response = await VQService.create(payload);
        const vqNo = data.quotation_no || (response.id ? String(response.id) : '');
        
        // 🎯 Close-First Interaction Flow
        onClose();
        toast(`บันทึกใบเสนอราคา ${vqNo} สำเร็จ`, 'success', 'บันทึกสำเร็จ');
      }
      
      // Delayed query invalidation
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      logger.error('Save VQ failed:', error);
      toast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  }, handleFormError);

  const updateLineCalculation = (index: number) => {
    const qty = Number(getValues(`vq_lines.${index}.qty`) || 0);
    const price = Number(getValues(`vq_lines.${index}.unit_price`) || 0);
    const expr = getValues(`vq_lines.${index}.discount_expression`);
    const noQuote = getValues(`vq_lines.${index}.no_quote`);

    if (noQuote) {
      setValue(`vq_lines.${index}.discount_amount`, 0);
      setValue(`vq_lines.${index}.net_amount`, 0);
      return;
    }

    const base = qty * price;
    const discount = parseDiscount(expr, base);
    const net = base - discount;

    setValue(`vq_lines.${index}.discount_amount`, Number(discount.toFixed(2)));
    setValue(`vq_lines.${index}.net_amount`, Number(net.toFixed(2)));
  };

  const handleSelectRFQ = async (rfq: RFQHeader) => {
    try {
      const fullRFQ: RFQDetailResponse = await RFQService.getById(rfq.rfq_id);
      
      // Magic Auto-Fill Logic
      const apiLines: RFQLine[] = fullRFQ.rfqLines || fullRFQ.lines || [];
      const mappedLines: QuotationLineFormData[] = apiLines.map((line: RFQLine) => ({
          ...createEmptyLine(),
          item_id: line.item_id || 0,
          item_code: line.item_code || '',
          item_name: line.item_name || '',
          qty: line.qty || 1,
          uom_id: line.uom_id || 0,
          uom_name: line.uom || '',
          unit_price: 0,
          discount_expression: '0',
          discount_amount: 0,
          net_amount: 0,
          no_quote: false,
          reference_price: line.est_unit_price || 0,
          status: 'OPEN'
      }));

      // Find primary vendor and fetch full details if possible
      const primaryVendor = fullRFQ.vendors?.[0] || fullRFQ.rfqVendors?.[0];
      let vendorDetails = null;
      if (primaryVendor?.vendor_id) {
          try {
              vendorDetails = await VendorService.getById(primaryVendor.vendor_id);
          } catch (err) {
              logger.error('[useVQForm] Failed to fetch vendor details:', err);
          }
      }

        reset({
          ...getValues(),
          qc_id: 0, // Reset comparison ID
          rfq_id: Number(fullRFQ.rfq_id),
          rfq_no: fullRFQ.rfq_no,
          vendor_id: Number(primaryVendor?.vendor_id || 0),
          vendor_code: vendorDetails?.vendor_code || primaryVendor?.vendor_code || '',
          vendor_name: vendorDetails?.vendor_name || primaryVendor?.vendor_name || '',
          contact_person: vendorDetails?.contacts?.[0]?.contact_name || '',
          contact_phone: vendorDetails?.phone || '',
          contact_email: vendorDetails?.email || '',
          currency: fullRFQ.rfq_base_currency_code || 'THB',
          isMulticurrency: Boolean(fullRFQ.rfq_base_currency_code && fullRFQ.rfq_base_currency_code !== 'THB'),
          exchange_rate: Number(fullRFQ.rfq_exchange_rate) || 1,
          exchange_rate_date: fullRFQ.rfq_exchange_rate_date || '',
          target_currency: fullRFQ.rfq_quote_currency_code || '',
          payment_terms: vendorDetails?.payment_term_days ? `${vendorDetails.payment_term_days} วัน` : fullRFQ.payment_term_hint || '',
          remark: fullRFQ.remarks || '',
          vq_lines: mappedLines.length > 0 ? mappedLines : [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()]
        });

      // Return RFQ No so the component can control the Toast after closing the modal
      return fullRFQ.rfq_no;
    } catch (error) {
       logger.error('[useVQForm] Failed to fill from RFQ:', error);
       throw error;
    }
  };

  const handleClearRFQ = async () => {
    const isConfirmed = await confirm({
        title: 'ยืนยันการล้างค่า',
        description: 'ต้องการล้างการเชื่อมโยงกับ RFQ และรายการสินค้าใช่หรือไม่?',
        confirmText: 'ล้างค่า',
        cancelText: 'ยกเลิก',
        variant: 'danger'
    });

    if (isConfirmed) {
        setValue('qc_id', 0);
        setValue('rfq_no', '');
        setValue('vq_lines', [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()]);
    }
  };

  return {
    formMethods,
    fields,
    append,
    remove,
    insert,
    totals,
    handleSave,
    updateLineCalculation,
    handleSelectRFQ,
    handleClearRFQ,
    vatRate: totals.taxRate,
    createEmptyLine,
    purchaseTaxOptions,
    currencyOptions,
    isMasterLoading,
    vqStatus,
    isDataLoading
  };
};
