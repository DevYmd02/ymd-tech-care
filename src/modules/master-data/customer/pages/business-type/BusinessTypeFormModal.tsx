import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { CustomerBusinessType } from '@customer/types/customer-types';
import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';

interface BusinessTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  initialData?: CustomerBusinessType | null;
  onSuccess?: () => void;
}

interface BusinessTypeFormData {
  business_type_code: string;
  business_type_name_th: string;
  business_type_name_en: string;
  note: string;
}

export function BusinessTypeFormModal({
  isOpen,
  onClose,
  id,
  initialData,
  onSuccess,
}: BusinessTypeFormModalProps) {
  const isEdit = !!id || !!initialData;
  const [formData, setFormData] = useState<BusinessTypeFormData>({
    business_type_code: '',
    business_type_name_th: '',
    business_type_name_en: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        business_type_code: initialData?.business_type_code || '',
        business_type_name_th: initialData?.business_type_name_th || '',
        business_type_name_en: initialData?.business_type_name_en || '',
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
      console.log('Submit Business Type:', formData);
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
        form="business-type-form" 
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
      title={isEdit ? 'แก้ไขประเภทธุรกิจ' : 'เพิ่มประเภทธุรกิจลูกค้าใหม่'}
      subtitle="จัดการข้อมูลประเภทธุรกิจของลูกค้า"
      footer={footer}
    >
      <form id="business-type-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Business Type Code */}
        <div className="space-y-1">
          <label className={styles.label}>รหัสประเภทธุรกิจ <span className="text-red-500">*</span></label>
          <input
            name="business_type_code"
            value={formData.business_type_code}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกรหัสประเภทธุรกิจ"
            required
          />
        </div>
        
        {/* Name TH */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อประเภทธุรกิจ (ภาษาไทย) <span className="text-red-500">*</span></label>
          <input
            name="business_type_name_th"
            value={formData.business_type_name_th}
            onChange={handleChange}
            className={styles.input}
            placeholder="กรอกชื่อภาษาไทย"
            required
          />
        </div>

        {/* Name EN */}
        <div className="space-y-1">
          <label className={styles.label}>ชื่อประเภทธุรกิจ (ภาษาอังกฤษ)</label>
          <input
            name="business_type_name_en"
            value={formData.business_type_name_en}
            onChange={handleChange}
            className={styles.input}
            placeholder="Business type in English"
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
