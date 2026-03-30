import React from 'react';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { QCService } from '@/modules/procurement/services/qc.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from '@/core/api/api';
import { CreateQCSchema, type CreateQCFormValues, type CreateQCPayload } from '@/modules/procurement/schemas/qc-schemas';

export const useQCForm = (onSuccess?: () => void, onClose?: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const methods = useForm<CreateQCFormValues>({
    resolver: zodResolver(CreateQCSchema) as Resolver<CreateQCFormValues>,
    defaultValues: {
      rfq_id: 0,
      winning_vq_id: 0,
      remarks: '',
      pr_id: null,
      department_id: null,
      created_by: null,
    }
  });


  const { formState: { isSubmitting } } = methods;

  /**
   * 🍞 @Agent_Toast_Synchronizer: Recursive Error Extraction for Grouped Toast
   */
  const onInvalid = (errors: FieldErrors<CreateQCFormValues>) => {
    logger.error('Form Validation Errors:', errors);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractErrorMessages = (errs: any): string[] => {
      let messages: string[] = [];
      for (const key in errs) {
        const error = errs[key];
        if (error?.message && typeof error.message === 'string') {
          let msg = error.message;
          const lowerMsg = msg.toLowerCase();
          if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('received nan')) {
            msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
          }
          messages.push(msg);
        } else if (typeof error === 'object' && error !== null) {
          messages = messages.concat(extractErrorMessages(error));
        }
      }
      return Array.from(new Set(messages));
    };

    const errorMessages = extractErrorMessages(errors);
    
    if (errorMessages.length > 0) {
      const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1' },
        React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
        React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
          errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
        )
      );
      toast(React.createElement(ErrorToastUI), 'error');
    } else {
      toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
    }
  };

  /**
   * 🧼 onSubmit: Submits purified payload with injected context
   */
  const onSubmit = async (data: CreateQCFormValues) => {
    // 1. Guard & Validation (Form level validation handled by Zod)
    if (!data.rfq_id || !data.winning_vq_id) {
      toast('ข้อมูลไม่ครบถ้วน: กรุณาระบุ RFQ และผู้ชนะประมูล', 'error');
      return;
    }

    // 2. Data Integrity Guard (Recover contextual fields from Form Object directly)
    const payload: CreateQCPayload = {
      rfq_id: Number(data.rfq_id),
      winning_vq_id: Number(data.winning_vq_id),
      pr_id: data.pr_id ? Number(data.pr_id) : 0,
      department_id: data.department_id ? Number(data.department_id) : Number(user?.employee?.department_id || 1),
      created_by: data.created_by ? Number(data.created_by) : Number(user?.employee_id || 1),
      remarks: data.remarks || '',
    };

    logger.info('[useQCForm] Submitting Purified QC Payload:', payload);

    try {
      await QCService.create(payload);
      toast('บันทึกใบเปรียบเทียบราคาสำเร็จ!', 'success');

      onClose?.();
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      logger.error('[useQCForm] Save QC Failed:', error);
      const errMsg = extractErrorMessage(error) || 'เกิดข้อผิดพลาดในการบันทึก / ไม่สามารถระบุผู้ชนะได้';
      toast(errMsg, 'error');
    }
  };

  return {
    methods,
    onSubmit,
    onInvalid,
    isSubmitting,
  };
};

