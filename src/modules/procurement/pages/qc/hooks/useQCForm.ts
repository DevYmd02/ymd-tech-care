import { useState } from 'react';
import toast from 'react-hot-toast';
import { QCService } from '@/modules/procurement/services/qc.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';
import type { CreateQCPayload } from '@/modules/procurement/schemas/qc-schemas';

export const useQCForm = (onSuccess?: () => void, onClose?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSaveQC = async (data: {
    rfq_id: number;
    pr_id: number;
    department_id: number;
    winning_vq_id: number;
  }) => {
    // 1. Guard & Validation (Zero-Any, Pure Object)
    if (!data.rfq_id || !data.pr_id || !data.department_id || !data.winning_vq_id) {
      toast.error('ข้อมูลไม่ครบถ้วน: กรุณาระบุ RFQ, PR, แผนก และผู้ชนะประมูล');
      return;
    }

    const payload: CreateQCPayload = {
      rfq_id: Number(data.rfq_id),
      pr_id: Number(data.pr_id),
      department_id: Number(data.department_id),
      created_by: Number(user?.id || 1), // Fallback if user session is incomplete
      winning_vq_id: Number(data.winning_vq_id),
    };

    // 2. Logging Purified Payload
    logger.info('[useQCForm] Submitting Purified QC Payload:', payload);

    setIsSubmitting(true);
    
    // 3. API Execution with toast.promise for smooth UX
    try {
      await toast.promise(
        QCService.create(payload),
        {
          loading: 'กำลังบันทึกใบเปรียบเทียบราคา...',
          success: 'บันทึกใบเปรียบเทียบราคาสำเร็จ!',
          error: (err) => err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก / ไม่สามารถระบุผู้ชนะได้',
        }
      );

      // 4. Post-success interactions
      onClose?.();
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      logger.error('[useQCForm] Save QC Failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSaveQC,
  };
};
