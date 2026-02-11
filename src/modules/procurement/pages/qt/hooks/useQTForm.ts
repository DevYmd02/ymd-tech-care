import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/types/qt-schemas';
import { QTService } from '@/modules/procurement/services/qt.service';
import { logger } from '@/shared/utils/logger';
import type { RFQHeader } from '@/modules/procurement/types/rfq-types';
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
        lines: Array(5).fill(null).map(() => createEmptyLine()),
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

  const updateLineCalculation = (index: number, field: keyof QuotationLineFormData, value: number) => {
      const currentLine = lines[index];
      if (!currentLine) return;

      const qty = field === 'qty' ? value : currentLine.qty;
      const price = field === 'unit_price' ? value : currentLine.unit_price;
      const discount = field === 'discount_amount' ? value : (currentLine.discount_amount || 0);

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
