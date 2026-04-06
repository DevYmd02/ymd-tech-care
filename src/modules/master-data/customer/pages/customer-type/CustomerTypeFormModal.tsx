import { Save } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { styles } from '@/shared/constants/styles';
import { useCustomerTypeForm } from './hooks/useCustomerTypeForm';
// Removed unused CustomerType import

interface CustomerTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  onSuccess?: () => void;
}

export function CustomerTypeFormModal({
  isOpen,
  onClose,
  id,
  onSuccess,
}: CustomerTypeFormModalProps) {
  const {
    formData,
    isSubmitting,
    isLoading,
    isEdit,
    handleChange,
    handleSubmit,
    setStatus,
  } = useCustomerTypeForm({ id, onSuccess, onClose, isOpen });

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
        form="customer-type-form" 
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
      title={isEdit ? 'แก้ไขประเภทลูกค้า' : 'เพิ่มประเภทลูกค้าใหม่'}
      subtitle="กำหนดประเภทของลูกค้าเพื่อการจัดการข้อมูล"
      footer={footer}
    >
      {isLoading ? (
        <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <form id="customer-type-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code & Status Row */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-1">
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

            <div className="flex items-center pb-2">
              <label className="flex items-center gap-2 cursor-pointer group hover:text-purple-600 transition-colors">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer accent-purple-600"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  สถานะใช้งาน (Active)
                </span>
              </label>
            </div>
          </div>
          
          {/* Name TH */}
          <div className="space-y-1">
            <label className={styles.label}>ชื่อประเภทลูกค้า (ภาษาไทย) <span className="text-red-500">*</span></label>
            <input
              name="customer_type_name"
              value={formData.customer_type_name}
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
              name="customer_type_nameeng"
              value={formData.customer_type_nameeng}
              onChange={handleChange}
              className={styles.input}
              placeholder="Customer type in English"
            />
          </div>

        </form>
      )}
    </DialogFormLayout>
  );
}
