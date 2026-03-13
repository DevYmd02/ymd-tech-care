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
    created_by?: number;
  }) => {
    // 1. Guard & Validation (Zero-Any, Pure Object)
    if (!data.rfq_id || !data.winning_vq_id) {
      toast.error('ข้อมูลไม่ครบถ้วน: กรุณาระบุ RFQ และผู้ชนะประมูล');
      return;
    }

    // 🛡️ @Agent_Integrity_Guard: Strict Multi-Layer Validation
    if (!data.pr_id || Number(data.pr_id) === 0) {
      logger.error('[useQCForm] Integrity Breach: Attempted to save QC with pr_id: 0', data);
      toast.error('ข้อมูล PR ไม่สมบูรณ์: ไม่พบรหัส PR ต้นทางจาก RFQ นี้ (pr_id must not be 0)');
      return;
    }

    const payload: CreateQCPayload = {
      rfq_id: Number(data.rfq_id),
      pr_id: data.pr_id ? Number(data.pr_id) : 0, // Rule: pr_id must be a number (0 is safer than null)
      department_id: data.department_id ? Number(data.department_id) : Number(user?.employee?.department_id || 1),
      created_by: Number(data.created_by || user?.employee_id || 1),
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
