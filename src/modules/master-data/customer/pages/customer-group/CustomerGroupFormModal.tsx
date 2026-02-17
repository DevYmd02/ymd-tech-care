import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { CustomerGroup } from '@customer/types/customer-types';
import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';

interface CustomerGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  initialData?: CustomerGroup | null;
  onSuccess?: () => void;
}

interface CustomerGroupFormData {
  customer_group_code: string;
  customer_group_name_th: string;
  customer_group_name_en: string;
  note: string;
}

export function CustomerGroupFormModal({
  isOpen,
  onClose,
  id,
  initialData,
  onSuccess,
}: CustomerGroupFormModalProps) {
  const isEdit = !!id || !!initialData;
  const [formData, setFormData] = useState<CustomerGroupFormData>({
    customer_group_code: '',
    customer_group_name_th: '',
    customer_group_name_en: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_group_code: initialData?.customer_group_code || '',
        customer_group_name_th: initialData?.customer_group_name_th || '',
        customer_group_name_en: initialData?.customer_group_name_en || '',
        note: initialData?.note || '',
      });
    }
  }, [isOpen, initialData, id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('Submit Customer Group:', formData);
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
        form="customer-group-form" 
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
      title={isEdit ? 'แก้ไขกลุ่มลูกค้า' : 'เพิ่มกลุ่มลูกค้าใหม่'}
      subtitle="จัดการข้อมูลเบื้องต้นสำหรับแบ่งกลุ่มลูกค้า"
      footer={footer}
    >
      <form id="customer-group-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Customer Group Code */}
        <div className="space-y-1">
          <label className={styles.label}>รหัสกลุ่มลูกค้า <span className="text-red-500">*</span></label>
          <input
            name="customer_group_code"
            value={formData.customer_group_code}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกรหัสกลุ่มลูกค้า (เช่น GC-01)"
            required
          />
        </div>
        
        {/* Name TH */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อกลุ่มลูกค้า (ภาษาไทย) <span className="text-red-500">*</span></label>
          <input
            name="customer_group_name_th"
            value={formData.customer_group_name_th}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกชื่อภาษาไทย"
            required
          />
        </div>

        {/* Name EN */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อกลุ่มลูกค้า (ภาษาอังกฤษ)</label>
          <input
            name="customer_group_name_en"
            value={formData.customer_group_name_en}
            onChange={handleChange}
            className={styles.input}
            placeholder="Customer group in English"
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
