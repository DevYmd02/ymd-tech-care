import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { CustomerType } from '@customer/types/customer-types';
import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';

interface CustomerTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  initialData?: CustomerType | null;
  onSuccess?: () => void;
}

interface CustomerTypeFormData {
  customer_type_code: string;
  customer_type_name_th: string;
  customer_type_name_en: string;
  note: string;
}

export function CustomerTypeFormModal({
  isOpen,
  onClose,
  id,
  initialData,
  onSuccess,
}: CustomerTypeFormModalProps) {
  const isEdit = !!id || !!initialData;
  const [formData, setFormData] = useState<CustomerTypeFormData>({
    customer_type_code: '',
    customer_type_name_th: '',
    customer_type_name_en: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_type_code: initialData?.customer_type_code || '',
        customer_type_name_th: initialData?.customer_type_name_th || '',
        customer_type_name_en: initialData?.customer_type_name_en || '',
        note: initialData?.note || '',
      });
    }
  }, [isOpen, initialData, id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('Submit Customer Type:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <button 
        type="button" 
        onClick={onClose} 
        className={styles.btnSecondary}
      >
        ยกเลิก
      </button>
      <button 
        type="submit" 
        form="customer-type-form" 
        disabled={isSubmitting}
        className={`${styles.btnPrimary} flex items-center gap-2`}
      >
        <Save size={18} /> {isSubmitting ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึก')}
      </button>
    </div>
  );

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'แก้ไขประเภทลูกค้า' : 'เพิ่มประเภทลูกค้าใหม่'}
      subtitle="กำหนดประเภทของลูกค้าเพื่อการจัดการข้อมูล"
      footer={footer}
    >
      <form id="customer-type-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Customer Type Code */}
        <div className="space-y-1">
          <label className={styles.label}>รหัสประเภทลูกค้า <span className="text-red-500">*</span></label>
          <input
            name="customer_type_code"
            value={formData.customer_type_code}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกรหัสประเภทลูกค้า"
            required
          />
        </div>
        
        {/* Name TH */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อประเภทลูกค้า (ภาษาไทย) <span className="text-red-500">*</span></label>
          <input
            name="customer_type_name_th"
            value={formData.customer_type_name_th}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกชื่อภาษาไทย"
            required
          />
        </div>

        {/* Name EN */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อประเภทลูกค้า (ภาษาอังกฤษ)</label>
          <input
            name="customer_type_name_en"
            value={formData.customer_type_name_en}
            onChange={handleChange}
            className={styles.input}
            placeholder="Customer type in English"
          />
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className={styles.label}>หมายเหตุ</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="กรอกหมายเหตุ (ถ้ามี)"
            rows={3}
          />
        </div>
      </form>
    </DialogFormLayout>
  );
}
