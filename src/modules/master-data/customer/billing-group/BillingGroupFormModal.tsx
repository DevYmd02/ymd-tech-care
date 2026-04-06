import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';
import { useBillingGroupForm } from './hooks/useBillingGroupForm';

interface BillingGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string | number;
  onSuccess?: () => void;
}

export function BillingGroupFormModal({
  isOpen,
  onClose,
  id,
  onSuccess,
}: BillingGroupFormModalProps) {
  const {
    formData,
    isSubmitting,
    isLoading,
    isEdit,
    error,
    handleChange,
    handleSubmit,
    setStatus,
  } = useBillingGroupForm({ id, onSuccess, onClose, isOpen });

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <button 
        type="button" 
        onClick={onClose} 
        className={styles.btnSecondary}
        disabled={isSubmitting}
      >
        ยกเลิก
      </button>
      <button 
        type="submit" 
        form="billing-group-form" 
        disabled={isSubmitting || isLoading}
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
      {isLoading ? (
        <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <form id="billing-group-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code & Status Row */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-1">
              <label className={styles.label}>รหัสกลุ่มวางบิล <span className="text-red-500">*</span></label>
              <input
                name="bill_group_code"
                value={formData.bill_group_code}
                onChange={handleChange}
                className={`${styles.input} ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                placeholder="กรอกรหัสกลุ่มวางบิล (เช่น BG-MON)"
                required
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <div className="flex items-center pb-2">
              <label className="flex items-center gap-2 cursor-pointer group hover:text-blue-600 transition-colors">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  สถานะใช้งาน (Active)
                </span>
              </label>
            </div>
          </div>
          
          {/* Name TH */}
          <div className="space-y-1">
            <label className={styles.label}>ชื่อกลุ่มวางบิล (ภาษาไทย) <span className="text-red-500">*</span></label>
            <input
              name="bill_group_name"
              value={formData.bill_group_name}
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
              name="bill_group_nameeng"
              value={formData.bill_group_nameeng}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter bill group name in English"
            />
          </div>

          {/* Remark */}
          <div className="space-y-1">
            <label className={styles.label}>หมายเหตุ</label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="กรอกหมายเหตุ (ถ้ามี)"
              rows={3}
            />
          </div>

        </form>
      )}
    </DialogFormLayout>
  );
}
