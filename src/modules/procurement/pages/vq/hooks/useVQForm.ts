import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/schemas/vq-schemas';
import { VQService, type VQCreateData } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { RFQHeader, RFQLine, RFQDetailResponse } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
const formatDateForInputHelper = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { VQListItem, VQStatus, QuotationLine } from '@/modules/procurement/types/vq-types';
import { useVQMasterData } from './useVQMasterData';

export interface ExtendedRFQHeader extends RFQHeader {
    vendor_id?: number;
    vendor_name?: string | null;
    isMulticurrency?: boolean;
}

const createEmptyLine = (): QuotationLineFormData => ({
  quotation_line_id: 0,
  item_id: undefined, 
  item_code: '',
  item_name: '',
  qty: 1,
  unit_price: 0,
  discount_expression: '',
  discount_amount: 0,
  net_amount: 0,
  uom_id: 0,
  uom_name: '',
  no_quote: false,
  reference_price: 0,
  status: 'OPEN',
  remark: '',
  pr_line_id: 0,
  rfq_line_id: 0
});

interface RawVQLine {
    item_id?: number | string | null;
    item_code?: string | null;
    item_name?: string | null;
    // 💧 @Agent_View_Hydrator: CamelCase and nested fallbacks for hydration
    itemCode?: string | null;
    itemName?: string | null;
    product_code?: string | null;
    product_name?: string | null;
    item?: { item_code?: string | null; item_name?: string | null };
    product?: { product_code?: string | null; product_name?: string | null };
    description?: string | null;
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
    pr_line_id?: number | string | null;
    rfq_line_id?: number | string | null;
    line_no?: number | string | null;
}

interface RawVQResponse extends Omit<Partial<VQListItem>, 'vq_lines'> {
    vq_lines?: RawVQLine[];
    vqLines?: RawVQLine[]; // 💧 @Agent_View_Hydrator: CamelCase support
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
      vq_lines: [],
      currency: 'THB',
      exchange_rate: 1,
      tax_code_id: 0,
      discount_expression: '0'
    }
  });

  const { control, reset, handleSubmit, setValue, getValues, trigger } = formMethods;
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

            // @Agent_Payload_Parser - Line Mapping (Search for vqLines, vq_lines, lines, items)
            const linesToMap = data.vqLines || data.vq_lines || data.lines || data.items || [];
            
            // @Agent_Backend_Diagnostic - Failsafe Alert
            if (linesToMap.length === 0 && apiLines.length === 0) {
                console.warn("VQ Lines Not Found", data);
            }

            const mappedLines: QuotationLineFormData[] = (apiLines.length > 0 ? apiLines : linesToMap).map((l: RawVQLine) => {
                return {
                    ...createEmptyLine(),
                    line_no: Number(l.line_no) || 0,
                    item_id: Number(l.item_id) || 0,
                    // 💧 @Agent_View_Hydrator: Multi-fallback for item details in View Mode
                    item_code: String(l.item_code || l.itemCode || l.product_code || l.item?.item_code || l.product?.product_code || ''),
                    item_name: String(l.item_name || l.itemName || l.product_name || l.item?.item_name || l.product?.product_name || l.description || ''),
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
                    remark: String(l.remark || ''),
                    pr_line_id: Number(l.pr_line_id) || 0,
                    rfq_line_id: Number(l.rfq_line_id) || 0
                };
            });

            // 🧪 @Agent_Debug_Proof: Strictly Verified Data
            console.log("🚀 [EXCAVATED_DATA]:", mappedLines);

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

            const rawHydratedData = {
                quotation_no: data.vq_no || '',
                quotation_date: data.quotation_date || new Date().toISOString(),
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
                valid_until: data.quotation_expiry_date || '', 
                qc_id: Number(data.qc_id || 0),
                rfq_id: Number(data.rfq_id || 0),
                rfq_no: data.rfq_no || '',
                discount_expression: String(data.discount_expression || '0'),
                tax_code_id: Number(data.tax_code_id || 0),
                status: data.status || 'DRAFT',
                vq_lines: mappedLines
            };

            // 📅 @Agent_Date_Standardizer: Hydrate dates correctly for HTML inputs
            const hydratedData = {
                ...rawHydratedData,
                quotation_date: formatDateForInputHelper(rawHydratedData.quotation_date),
                valid_until: formatDateForInputHelper(rawHydratedData.valid_until),
                exchange_rate_date: formatDateForInputHelper(rawHydratedData.exchange_rate_date)
            };

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
                    item_id: Number(line.item_id) || 0,
                    item_code: String(line.item_code || ''),
                    item_name: String(line.item_name || ''),
                    qty: Number(line.qty) || 1,
                    uom_id: Number(line.uom_id) || 0,
                    uom_name: String(line.uom || ''),
                    unit_price: 0,
                    discount_expression: '',
                    discount_amount: 0,
                    net_amount: 0,
                    no_quote: false,
                    reference_price: Number(line.est_unit_price) || 0,
                    pr_line_id: Number(line.pr_line_id) || 0,
                    status: 'OPEN',
                    remark: String(line.description || '')
                }));
            }

            // Find specific vendor if initialRFQ passed vendor_id
            const allVendors = fullRFQ.vendors || fullRFQ.rfqVendors || [];
            let selectedVendor = allVendors.find(v => v.vendor_id === initialRFQ.vendor_id);
            if (!selectedVendor && allVendors.length > 0) {
                 selectedVendor = allVendors[0];
            }

            const rfqData = {
                quotation_no: `VQ-${new Date().getFullYear()}-xxx (Auto)`,
                quotation_date: formatDateForInputHelper(new Date()),
                vendor_id: Number(initialRFQ.vendor_id || selectedVendor?.vendor_id) || 0, 
                vendor_code: selectedVendor?.vendor_code || '',
                vendor_name: selectedVendor?.vendor_name || initialRFQ.vendor_name || '',
                contact_person: '', 
                contact_phone: '',
                contact_email: '',
                currency: fullRFQ.rfq_base_currency_code || 'THB',
                isMulticurrency: Boolean(fullRFQ.rfq_base_currency_code && fullRFQ.rfq_base_currency_code !== 'THB'),
                exchange_rate_date: formatDateForInputHelper(fullRFQ.rfq_exchange_rate_date),
                target_currency: fullRFQ.rfq_quote_currency_code || '',
                exchange_rate: Number(fullRFQ.rfq_exchange_rate) || 1,
                vq_lines: mappedLines,
                payment_term_days: 0,
                lead_time_days: 0,
                qc_id: 0,
                rfq_id: Number(fullRFQ.rfq_id) || 0,
                rfq_no: fullRFQ.rfq_no || '',
                remark: fullRFQ.remarks || '',
                valid_until: formatDateForInputHelper(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                discount_expression: '0',
                tax_code_id: 0,
                status: 'DRAFT' as VQStatus
            };

            reset(rfqData as QuotationFormData);
            setIsDataLoading(false);
        }).catch((err) => {
            logger.error('[useVQForm] Failed to fetch RFQ details for initial load:', err);
            setIsDataLoading(false);
        });
      } else {
        // --- BLANK CREATE MODE ---
        reset({
          quotation_no: '',
          quotation_date: formatDateForInputHelper(new Date()),
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
          valid_until: formatDateForInputHelper(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
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
      return sum + (base - (Number(discount) || 0));
    }, 0);

    const totalLineDiscount = lines.reduce((sum, line) => {
      if (line.no_quote) return sum;
      return sum + (Number(parseDiscount(line.discount_expression, (Number(line.qty) || 0) * (Number(line.unit_price) || 0))) || 0);
    }, 0);

    const billDiscount = Number(parseDiscount(globalDiscountExpr, subtotal)) || 0;
    const preTax = subtotal - billDiscount;
    
    // Find tax rate
    const taxOption = purchaseTaxOptions.find(o => Number(o.value || 0) === Number(watchTaxCodeId || 0));
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
  /**
   * 🍞 @Agent_Toast_Synchronizer: Improved Error Handling with anti-spam toasts
   */
  const handleFormError = (errors: FieldErrors<QuotationFormData>) => {
    logger.error('Form Validation Errors:', errors);
    
    // Extract all error messages
    const messages: string[] = [];
    
    const extractMessages = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return;
      
      const errorObj = obj as { message?: string };
      if (errorObj.message) {
        messages.push(errorObj.message);
      } else {
        Object.values(obj as Record<string, unknown>).forEach(val => extractMessages(val));
      }
    };
    
    extractMessages(errors);
    
    // 🛡️ Anti-Spam: Unique and limit to 3
    const uniqueMessages = Array.from(new Set(messages)).slice(0, 3);
    
    if (uniqueMessages.length > 0) {
      uniqueMessages.forEach((msg) => {
        // Use a unique ID based on message to prevent identical duplicates stacking
        toast(msg, 'error');
      });
    } else {
      toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
    }
  };

  // 🧹 @Agent_Payload_Purifier: Strict Sanitization
  const sanitizeLine = (line: QuotationLineFormData, index: number): Partial<QuotationLine> => {
    return {
      line_no: index + 1, // backend: line_no should not be empty
      item_id: Number(line.item_id) || 0,
      pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : undefined,
      status: "OPEN", 
      qty: Number(line.qty) || 0,
      uom_id: Number(line.uom_id) || 0,
      unit_price: Number(line.unit_price) || 0,
      discount_expression: String(line.discount_expression || "0"),
      // 🛡️ @Agent_Ultimate_Purifier: STRICT DTO MAPPING (Lines)
      // Removal of forbidden fields: item_code, item_name, discount_amount, net_amount, no_quote, reference_price, remark, rfq_line_id
    };
  };

  const sanitizePayload = (data: QuotationFormData): VQCreateData => {
    const payload: VQCreateData = {
      // 🛡️ @Agent_Ultimate_Purifier: STRICT DTO MAPPING (Header)
      quotation_no: data.quotation_no || "-", 
      quotation_date: data.quotation_date ? new Date(data.quotation_date).toISOString() : new Date().toISOString(),
      quotation_expiry_date: data.valid_until ? new Date(data.valid_until).toISOString() : undefined,
      vendor_id: Number(data.vendor_id),
      pr_id: data.pr_id ? Number(data.pr_id) : undefined,
      rfq_id: data.rfq_id ? Number(data.rfq_id) : undefined,
      lead_time_days: Number(data.lead_time_days) || 0,
      payment_term_days: Number(data.payment_term_days) || 0,
      base_currency_code: String(data.currency || "THB"),
      quote_currency_code: data.target_currency || String(data.currency || "THB"),
      exchange_rate: Number(data.exchange_rate) || 1,
      exchange_rate_date: data.exchange_rate_date ? new Date(data.exchange_rate_date).toISOString() : new Date().toISOString(),
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      discount_expression: String(data.discount_expression || "0"),
      
      // 👤 @Agent_Auth_Injector
      created_by: 1, 

      // 🛡️ @Agent_Ultimate_Purifier: STRICT DTO MAPPING (Lines)
      vq_lines: data.vq_lines
        .filter(l => (l.item_id && Number(l.item_id) > 0)) 
        .map((l, idx) => sanitizeLine(l, idx)) as QuotationLine[]
    };
    return payload;
  };

  // Handlers
  const handleSave = handleSubmit(async (data: QuotationFormData) => {
    if (isViewMode) return;
    
    // 📢 @Agent_Safe_Logger: Shallow clone for safe logging
    logger.debug('Attempting to save VQ with data:', { ...data, vq_lines: data.vq_lines.length });

    try {
      if (!data.vendor_id) {
          showAlert('กรุณาเลือกรหัสผู้ขาย');
          return;
      }
      
      const validLines = data.vq_lines.filter(l => (l.item_id && Number(l.item_id) > 0) || (l.item_code && l.item_code.trim() !== ""));
      if (validLines.length === 0) {
          showAlert('ต้องมีรายการสินค้าอย่างน้อย 1 รายการ');
          return;
      }
      
      // 🧼 Sanitize Payload before sending
      const payload = sanitizePayload(data);
      
      // 🧪 @Agent_Debug_Helper: Explicit payload logging
      console.log('💾 Payload to Save:', JSON.stringify(payload, null, 2));

      if (vqId) {
        await VQService.update(vqId, payload as Partial<VQListItem>);
        
        onClose();
        toast(`แก้ไขใบเสนอราคาสำเร็จ`, 'success', 'บันทึกสำเร็จ');
      } else {
        await VQService.create(payload);
        
        onClose();
        toast(`บันทึกข้อมูลใบเสนอราคาสำเร็จ`, 'success', 'บันทึกสำเร็จ');
      }
      
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error: unknown) {
      // 🛡️ @Agent_Submission_Guard
      logger.error('Save VQ failed:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง';
      if (error instanceof Error && error.message.includes('circular')) {
          errorMessage = 'พบข้อผิดพลาดของข้อมูล (Circular Reference). กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ';
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
          const apiError = error as { response: { data: { message?: string } } };
          if (apiError.response?.data?.message) {
              errorMessage = apiError.response.data.message;
          }
      }

      toast(errorMessage, 'error');
    }
  }, handleFormError);

  const updateLineCalculation = (index: number) => {
    const qty = Number(getValues(`vq_lines.${index}.qty`)) || 0;
    const price = Number(getValues(`vq_lines.${index}.unit_price`)) || 0;
    const expr = getValues(`vq_lines.${index}.discount_expression`);
    const noQuote = getValues(`vq_lines.${index}.no_quote`);

    if (noQuote) {
      setValue(`vq_lines.${index}.discount_amount`, 0);
      setValue(`vq_lines.${index}.net_amount`, 0);
      return;
    }

    const base = qty * price;
    const discount = Number(parseDiscount(expr, base)) || 0;
    const net = base - discount;

    setValue(`vq_lines.${index}.discount_amount`, Number(discount.toFixed(2)) || 0);
    setValue(`vq_lines.${index}.net_amount`, Number(net.toFixed(2)) || 0);
  };

  const handleSelectRFQ = async (rfq: RFQHeader) => {
    toast('กำลังดึงข้อมูลใบขอราคาสินค้า...', 'info');
    try {
      const fullRFQ: RFQDetailResponse = await RFQService.getById(rfq.rfq_id);
      
      // Magic Auto-Fill Logic (Refined Mapping 2.0)
      const apiLines: RFQLine[] = fullRFQ.rfqLines || fullRFQ.lines || [];
      const mappedLines: QuotationLineFormData[] = apiLines.map((line: RFQLine) => ({
          ...createEmptyLine(),
          item_id: Number(line.item_id) || 0,
          // 💧 @Agent_UI_Hydrator: Ultimate strict type-safe fallback for item display
          item_code: String(line.item_code || line.itemCode || line.product_code || line.item?.item_code || line.product?.product_code || ''),
          item_name: String(line.item_name || line.itemName || line.product_name || line.item?.item_name || line.product?.product_name || line.description || ''),
          qty: Number(line.qty) || 1, // Forced coercion from API string to number
          uom_id: Number(line.uom_id) || 0, // Must be Number for dropdown binding
          uom_name: String(line.uom || ''), 
          unit_price: 0, // STRICT: Force 0 to require user input
          discount_expression: '',
          discount_amount: 0,
          net_amount: 0,
          no_quote: false,
          reference_price: Number(line.est_unit_price) || 0,
          // 🔗 @Agent_Mapping_Fixer: Explicit lineage linkage (PR -> RFQ -> VQ)
          pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : 0,
          rfq_line_id: line.rfq_line_id ? Number(line.rfq_line_id) : 0,
          status: 'OPEN',
          remark: String(line.description || '')
      }));

      // 🧪 @Agent_UI_Verifier: Log mapped lines for UI verification
      console.log("💧 Mapped Lines for UI Display:", mappedLines);

      logger.info('Mapped lines for UI:', mappedLines);

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

      const vendor_id = Number(primaryVendor?.vendor_id || 0);
      const vendor_code = vendorDetails?.vendor_code || primaryVendor?.vendor_code || '';
      const vendor_name = vendorDetails?.vendor_name || primaryVendor?.vendor_name || '';

      // Update Header Fields individually to respect the "replace() only" rule for lines
      setValue('rfq_id', Number(fullRFQ.rfq_id), { shouldValidate: true });
      setValue('rfq_no', fullRFQ.rfq_no || '', { shouldValidate: true });
      setValue('pr_id', fullRFQ.pr_id ? Number(fullRFQ.pr_id) : 0, { shouldValidate: true });
      setValue('qc_id', 0, { shouldValidate: true });
      setValue('vendor_id', vendor_id, { shouldValidate: true });
      setValue('vendor_code', vendor_code, { shouldValidate: true });
      setValue('vendor_name', vendor_name, { shouldValidate: true });
      setValue('contact_person', vendorDetails?.contacts?.[0]?.contact_name || '', { shouldValidate: true });
      setValue('contact_phone', vendorDetails?.phone || '', { shouldValidate: true });
      setValue('contact_email', vendorDetails?.email || '', { shouldValidate: true });
      setValue('currency', fullRFQ.rfq_base_currency_code || 'THB', { shouldValidate: true });
      setValue('isMulticurrency', Boolean(fullRFQ.rfq_base_currency_code && fullRFQ.rfq_base_currency_code !== 'THB'), { shouldValidate: true });
      setValue('exchange_rate', Number(fullRFQ.rfq_exchange_rate) || 1, { shouldValidate: true });
      setValue('exchange_rate_date', fullRFQ.rfq_exchange_rate_date || '', { shouldValidate: true });
      setValue('target_currency', fullRFQ.rfq_quote_currency_code || '', { shouldValidate: true });
      setValue('payment_terms', vendorDetails?.payment_term_days ? `${vendorDetails.payment_term_days} วัน` : fullRFQ.payment_term_hint || '', { shouldValidate: true });
      setValue('remark', fullRFQ.remarks || '', { shouldValidate: true });

      // Inject lines directly through replace() as per strict rule
      replace(mappedLines.length > 0 ? mappedLines : []);

      // 🍞 @Expert_Touch: Re-validate lines to clear "At least one item is required" errors
      setTimeout(() => trigger('vq_lines'), 0);

      // Return RFQ No so the component can control the Toast after closing the modal
      return fullRFQ.rfq_no;
    } catch (error: unknown) {
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
        // 1. Clear RFQ
        setValue('qc_id', 0, { shouldValidate: true });
        setValue('rfq_id', 0, { shouldValidate: true });
        setValue('rfq_no', '', { shouldValidate: true });
        
        // 2. Clear Vendor Info (Deep Clean)
        handleClearVendor();

        // 3. Clear Line Items
        replace([]);
    }
  };

  const handleClearVendor = () => {
    setValue('vendor_id', 0, { shouldValidate: true });
    setValue('vendor_code', '', { shouldValidate: true });
    setValue('vendor_name', '', { shouldValidate: true });
    setValue('contact_person', '', { shouldValidate: true });
    setValue('contact_phone', '', { shouldValidate: true });
    setValue('contact_email', '', { shouldValidate: true });
    setValue('payment_terms', '', { shouldValidate: true });
    setValue('payment_term_days', 0, { shouldValidate: true });
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
    handleClearVendor,
    vatRate: totals.taxRate,
    createEmptyLine,
    purchaseTaxOptions,
    currencyOptions,
    isMasterLoading,
    vqStatus,
    isDataLoading
  };
};
