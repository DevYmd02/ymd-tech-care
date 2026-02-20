import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';

const RejectReasonSchema = z.object({
  reason: z.string().min(5, "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร")
});

type RejectReasonFormData = z.infer<typeof RejectReasonSchema>;

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSubmitting = false 
}) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RejectReasonFormData>({
    resolver: zodResolver(RejectReasonSchema),
    defaultValues: { reason: '' }
  });

  const onSubmit = (data: RejectReasonFormData) => {
    onConfirm(data.reason);
    reset(); // Reset form after submit
  };

  const handleClose = () => {
    reset(); // Reset form on close
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10 rounded-t-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-lg">ระบุเหตุผลการไม่อนุมัติ</h3>
          </div>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              {...register('reason')}
              disabled={isSubmitting}
              className={`w-full min-h-[120px] p-3 text-sm rounded-md border bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-offset-0 transition-all resize-none
                ${errors.reason 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30'
                }
              `}
              placeholder="ระบุเหตุผลที่ไม่อนุมัติเอกสารนี้..."
            />
            {errors.reason && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm shadow-red-200 dark:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'ยืนยันการไม่อนุมัติ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
