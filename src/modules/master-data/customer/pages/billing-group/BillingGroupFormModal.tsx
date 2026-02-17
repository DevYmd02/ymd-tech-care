import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { CustomerBillingGroup } from '@customer/types/customer-types';
import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';

interface BillingGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  initialData?: CustomerBillingGroup | null;
  onSuccess?: () => void;
}

interface BillingGroupFormData {
  billing_group_code: string;
  billing_group_name_th: string;
  billing_group_name_en: string;
  note: string;
}

export function BillingGroupFormModal({
  isOpen,
  onClose,
  id,
  initialData,
  onSuccess,
}: BillingGroupFormModalProps) {
  const isEdit = !!id || !!initialData;
  const [formData, setFormData] = useState<BillingGroupFormData>({
    billing_group_code: '',
    billing_group_name_th: '',
    billing_group_name_en: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        billing_group_code: initialData?.billing_group_code || '',
        billing_group_name_th: initialData?.billing_group_name_th || '',
        billing_group_name_en: initialData?.billing_group_name_en || '',
        note: '',
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
      console.log('Submit Billing Group:', formData);
      // Simulate API call
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
        form="billing-group-form" 
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
      title={isEdit ? 'แก้ไขกลุ่มวางบิล' : 'เพิ่มกลุ่มวางบิลใหม่'}
      subtitle="ข้อมูลเบื้องต้นสำหรับกลุ่มวางบิลลูกค้า"
      footer={footer}
    >
      <form id="billing-group-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Billing Group Code */}
        <div className="space-y-1">
          <label className={styles.label}>รหัสกลุ่มวางบิล <span className="text-red-500">*</span></label>
          <input
            name="billing_group_code"
            value={formData.billing_group_code}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกรหัสกลุ่มวางบิล (เช่น BG-MON)"
            required
          />
        </div>
        
        {/* Name TH */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อกลุ่มวางบิล (ภาษาไทย) <span className="text-red-500">*</span></label>
          <input
            name="billing_group_name_th"
            value={formData.billing_group_name_th}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกชื่อกลุ่มวางบิล"
            required
          />
        </div>

        {/* Name EN */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อกลุ่มวางบิล (ภาษาอังกฤษ)</label>
          <input
            name="billing_group_name_en"
            value={formData.billing_group_name_en}
            onChange={handleChange}
            className={styles.input}
            placeholder="Enter bill group name in English"
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
