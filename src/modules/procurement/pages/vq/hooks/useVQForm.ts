import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/schemas/vq-schemas';
import { VQService } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import type { RFQHeader, RFQDetailResponse, RFQLine } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import type { VQListItem, QuotationLine } from '@/modules/procurement/types/vq-types';
import { useVQMasterData } from './useVQMasterData';


/** Type for RFQ with incidental vendor info often passed in VQ creation flow */
export interface ExtendedRFQHeader extends RFQHeader {
    vendor_id?: string;
    vendor_name?: string | null;
    isMulticurrency?: boolean;
    exchange_rate_date?: string;
    target_currency?: string;
}

const createEmptyLine = (): QuotationLineFormData => ({
  item_code: '',
  item_name: '',
  qty: 0,
  unit_price: 0,
  discount_amount: 0,
  net_amount: 0,
  uom_name: '',
  no_quote: false,
});

export const useVQForm = (
  isOpen: boolean, 
  onClose: () => void, 
  initialRFQ?: ExtendedRFQHeader | null, 
  onSuccess?: () => void,
  vqId?: string | null,
  isViewMode?: boolean
) => {
  const { confirm } = useConfirmation();
  const { purchaseTaxOptions, isLoading: isMasterLoading } = useVQMasterData();

  const methods = useForm<QuotationFormData>({
    resolver: zodResolver(QuotationHeaderSchema) as Resolver<QuotationFormData>,
    defaultValues: {
      quotation_no: '',
      quotation_date: new Date().toISOString().split('T')[0],
      vendor_id: '',
      currency: 'THB',
      isMulticurrency: false,
      exchange_rate_date: '',
      target_currency: '',
      exchange_rate: 1,
      lines: [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()],
      payment_term_days: 30,
      lead_time_days: 7,
      remark: '',
      discount_raw: '',
      tax_code_id: '',
    }
  });

  const { control, reset, handleSubmit, setValue, getValues } = methods;
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: "lines"
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (vqId) {
        // --- VIEW / EDIT MODE: Fetch Existing VQ ---
        VQService.getById(vqId).then((data: VQListItem) => {
            reset({
                quotation_no: data.quotation_no,
                quotation_date: data.quotation_date?.split('T')[0],
                vendor_id: data.vendor_id,
                vendor_name: data.vendor_name,
                contact_person: data.contact_person,
                contact_email: data.contact_email,
                contact_phone: data.contact_phone,
                currency: data.currency,
                isMulticurrency: data.isMulticurrency || false,
                exchange_rate_date: data.exchange_rate_date,
                target_currency: data.target_currency,
                exchange_rate: data.exchange_rate,
                payment_term_days: data.payment_term_days || 0,
                lead_time_days: data.lead_time_days || 0,
                valid_until: data.valid_until?.split('T')[0],
                qc_id: data.qc_id,
                remark: data.remarks,
                discount_raw: data.discount_raw || '',
                tax_code_id: data.tax_code_id ? String(data.tax_code_id) : '',
                lines: data.lines?.map((l: QuotationLine) => ({
                    item_code: l.item_code || '',
                    item_name: l.item_name || '',
                    qty: l.qty || 0,
                    unit_price: l.unit_price || 0,
                    discount_amount: l.discount_amount || 0,
                    net_amount: l.net_amount || 0,
                    uom_name: l.uom_name || '',
                    no_quote: Boolean(l.no_quote)
                })) || []
            });
        }).catch(err => {
            logger.error('[useVQForm] Failed to fetch VQ detail:', err);
        });
      } else if (initialRFQ) {
        // --- CREATE MODE: Auto-fill from RFQ ---
        // Ensure initialRFQ is treated as the correct type if it has lines
        const rfqDetail = initialRFQ as RFQDetailResponse;
        let mappedLines: QuotationLineFormData[] = [];
        
        if (rfqDetail.lines && rfqDetail.lines.length > 0) {
            mappedLines = rfqDetail.lines.map((line) => ({
                item_code: line.item_code || '',
                item_name: line.item_name || '',
                qty: line.required_qty || 0,
                uom_name: line.uom || '',
                unit_price: 0,
                discount_amount: 0,
                net_amount: 0,
                no_quote: false,
            }));
        } else {
            mappedLines = Array(5).fill(null).map(() => createEmptyLine());
        }

        reset({
          quotation_no: `VQ-${new Date().getFullYear()}-xxx (Auto)`,
          quotation_date: new Date().toISOString().split('T')[0],
          vendor_id: initialRFQ.vendor_id || '', 
          currency: initialRFQ.currency || 'THB',
          isMulticurrency: initialRFQ.isMulticurrency || false,
          exchange_rate_date: initialRFQ.exchange_rate_date || '',
          target_currency: initialRFQ.target_currency || '',
          exchange_rate: initialRFQ.exchange_rate || 1,
          lines: mappedLines,
          payment_term_days: 30,
          lead_time_days: 7,
          qc_id: initialRFQ.rfq_no || '',
          remark: '',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default +30 days
        });
      } else {
        // --- BLANK CREATE MODE ---
        reset({
          quotation_no: '',
          quotation_date: new Date().toISOString().split('T')[0],
          vendor_id: '',
          currency: 'THB',
          isMulticurrency: false,
          exchange_rate_date: '',
          target_currency: '',
          exchange_rate: 1,
          lines: [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()],
          payment_term_days: 30,
          lead_time_days: 7,
          remark: '',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialRFQ, vqId, reset, getValues]);


  // Calculations
  const lines = useWatch({ control, name: 'lines' });
  const discountInput = useWatch({ control, name: 'discount_raw' }) || '';
  const taxCodeId = useWatch({ control, name: 'tax_code_id' });

  // Derive VAT rate from selected tax code
  const selectedTax = purchaseTaxOptions.find(t => String(t.value) === String(taxCodeId));
  const vatRate = Number(selectedTax?.original?.tax_rate ?? 0);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (line.net_amount || 0), 0);
    
    // Parse Discount
    let discountAmount = 0;
    const rawDisc = discountInput.trim();
    if (rawDisc.endsWith('%')) {
        const pct = parseFloat(rawDisc.replace('%', ''));
        if (!isNaN(pct)) discountAmount = subtotal * (pct / 100);
    } else {
        discountAmount = parseFloat(rawDisc) || 0;
    }
    
    // Total Line Discount (for summary display if needed, but VQ usually shows net on line)
    const lineDiscountTotal = lines.reduce((sum, line) => sum + (line.discount_amount || 0), 0);

    const taxableAmount = subtotal - discountAmount;
    const vatAmount = taxableAmount * (vatRate / 100);
    const grandTotal = taxableAmount + vatAmount;

    return { 
        subtotal, 
        discountAmount, 
        vatAmount, 
        grandTotal,
        totalLineDiscount: lineDiscountTotal 
    };
  }, [lines, vatRate, discountInput]);

  // Handlers
  const handleSave = handleSubmit(async (data: QuotationFormData) => {
    if (isViewMode) return;
    try {
      if (!data.vendor_id) {
         // Should be caught by validation, but double check
         return;
      }
      
      const payload = {
          ...data,
          total_amount: totals.grandTotal,
          lines: data.lines.filter(l => l.item_code) // Filter empty lines
      };

      await VQService.create(payload);
      
      await confirm({
          title: 'บันทึกสำเร็จ',
          description: 'บันทึกใบเสนอราคาเรียบร้อยแล้ว',
          confirmText: 'ตกลง',
          hideCancel: true,
          variant: 'success'
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Save VQ failed:', error);
      await confirm({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถบันทึกข้อมูลได้',
          confirmText: 'ตกลง',
          hideCancel: true,
          variant: 'danger'
      });
    }
  });

  const updateLineCalculation = (index: number, field: keyof QuotationLineFormData, value: number | boolean) => {
      const currentLine = lines[index];
      if (!currentLine) return;

      // Handle the 'No Quote' toggle
      if (field === 'no_quote') {
          setValue(`lines.${index}.no_quote`, Boolean(value));
          if (value === true) {
              setValue(`lines.${index}.unit_price`, 0);
              setValue(`lines.${index}.discount_amount`, 0);
              setValue(`lines.${index}.net_amount`, 0);
          } else {
              // Recalculate based on current form values using getValues to ensure fresh state
              const currentQty = getValues(`lines.${index}.qty`) || 0;
              const currentPrice = getValues(`lines.${index}.unit_price`) || 0;
              const currentDiscount = getValues(`lines.${index}.discount_amount`) || 0;
              const net = (currentQty * currentPrice) - currentDiscount;
              setValue(`lines.${index}.net_amount`, net);
          }
          return; // Exit early since we handled the forced reset
      }

      const isNoQuote = currentLine.no_quote;
      // If toggled 'No Quote', disallow any price updates
      if (isNoQuote && (field === 'unit_price' || field === 'discount_amount')) {
          return;
      }

      const qty = field === 'qty' ? (value as number) : currentLine.qty;
      const price = field === 'unit_price' ? (value as number) : currentLine.unit_price;
      const discount = field === 'discount_amount' ? (value as number) : (currentLine.discount_amount || 0);

      // Simple calculation
      const net = (qty * price) - discount;
      
      setValue(`lines.${index}.net_amount`, net);
  };

  const handleSelectRFQ = async (rfq: RFQHeader) => {
    try {
      const fullRFQ = await RFQService.getById(rfq.rfq_id);
      
      // Magic Auto-Fill Logic
      const mappedLines: QuotationLineFormData[] = (fullRFQ.lines || []).map((line: RFQLine) => ({
          item_code: line.item_code || '',
          item_name: line.item_name || '',
          qty: line.required_qty || 0,
          uom_name: line.uom || '',
          unit_price: 0,
          discount_amount: 0,
          net_amount: 0,
          no_quote: false,
      }));

      // Find primary vendor if available
      const primaryVendor = fullRFQ.vendors?.[0];

      reset({
        ...getValues(),
        qc_id: fullRFQ.rfq_no,
        vendor_id: primaryVendor?.vendor_id || '',
        vendor_name: primaryVendor?.vendor_name || '',
        currency: fullRFQ.currency || 'THB',
        isMulticurrency: Boolean(fullRFQ.currency && fullRFQ.currency !== 'THB'),
        exchange_rate: fullRFQ.exchange_rate || 1,
        payment_terms: fullRFQ.payment_terms || '',
        remark: fullRFQ.remarks || '',
        lines: mappedLines.length > 0 ? mappedLines : [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()]
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
        setValue('qc_id', '');
        setValue('lines', [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()]);
    }
  };

  return {
    methods,
    fields,
    append,
    remove,
    insert,
    totals,
    handleSave,
    updateLineCalculation,
    handleSelectRFQ,
    handleClearRFQ,
    vatRate,
    createEmptyLine,
    purchaseTaxOptions,
    isMasterLoading
  };
};
