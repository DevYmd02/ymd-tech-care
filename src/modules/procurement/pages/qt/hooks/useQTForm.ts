import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/schemas/qt-schemas';
import { QTService } from '@/modules/procurement/services/qt.service';
import { logger } from '@/shared/utils/logger';
import type { RFQHeader, RFQDetailResponse } from '@/modules/procurement/types/rfq-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

const createEmptyLine = (): QuotationLineFormData => ({
  item_code: '',
  item_name: '',
  qty: 0,
  unit_price: 0,
  discount_amount: 0,
  net_amount: 0,
  uom_name: '',
  warehouse: '',
  location: '',
  no_quote: false,
});

export const useQTForm = (isOpen: boolean, onClose: () => void, initialRFQ?: RFQHeader | null, onSuccess?: () => void) => {
  const { confirm } = useConfirmation();

  const methods = useForm<QuotationFormData>({
    resolver: zodResolver(QuotationHeaderSchema),
    defaultValues: {
      quotation_no: '',
      quotation_date: new Date().toISOString().split('T')[0],
      vendor_id: '',
      currency_code: 'THB',
      exchange_rate: 1,
      lines: [createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine(), createEmptyLine()],
      payment_term_days: 30,
      lead_time_days: 7,
      remarks: '',
    }
  });

  const { control, reset, handleSubmit, setValue } = methods;
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: "lines"
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // 1. Map Auto-fill Lines from RFQ
      let mappedLines = [createEmptyLine()]; 
      const detailRFQ = initialRFQ as unknown as RFQDetailResponse; // Assert to DetailResponse to access lines safely
      
      if (detailRFQ?.lines && detailRFQ.lines.length > 0) {
          mappedLines = detailRFQ.lines.map((line) => ({
              item_code: line.item_code || '',
              item_name: line.item_name || '',
              qty: line.required_qty || 0,
              uom_name: line.uom || '',
              unit_price: 0,
              discount_amount: 0,
              net_amount: 0,
              no_quote: false,
              warehouse: '',
              location: '',
          }));
      } else {
          mappedLines = Array(5).fill(null).map(() => createEmptyLine()); // Fallback if not an RFQ flow
      }

      const defaultValues = {
        quotation_no: `QT-${new Date().getFullYear()}-xxx (Auto)`,
        quotation_date: new Date().toISOString().split('T')[0],
        vendor_id: '',
        vendor_name: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        currency_code: 'THB',
        exchange_rate: 1,
        lines: mappedLines,
        payment_term_days: 30,
        lead_time_days: 7,
        qc_id: initialRFQ?.rfq_no || '',
        remarks: ''
      };
      reset(defaultValues);
    }
  }, [isOpen, initialRFQ, reset]);

  // Calculations
  const lines = useWatch({ control, name: 'lines' });
  const vatRate = 7;

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (line.net_amount || 0), 0);
    const vatAmount = subtotal * (vatRate / 100);
    const grandTotal = subtotal + vatAmount;
    return { subtotal, vatAmount, grandTotal };
  }, [lines, vatRate]);

  // Handlers
  const handleSave = handleSubmit(async (data: QuotationFormData) => {
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

      await QTService.create(payload);
      
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
      logger.error('Save QT failed:', error);
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
              // Recalculate if untoggled, though values would be 0 anyway, so we just reset net_amount safely.
              const net = (currentLine.qty * currentLine.unit_price) - (currentLine.discount_amount || 0);
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

  return {
    methods,
    fields,
    append,
    remove,
    insert,
    totals,
    handleSave,
    updateLineCalculation,
    vatRate,
    createEmptyLine
  };
};
