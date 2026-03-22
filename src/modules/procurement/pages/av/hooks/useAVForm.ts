import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

import { AVFormSchema } from '../schemas/av.schema';
import type { AVFormData, AVLineFormData } from '../schemas/av.schema';
import { AVService } from '../services/av.service';
import { usePRMasterData } from '@/modules/procurement/pages/pr/hooks/usePRMasterData';

export interface UseAVFormProps {
  id?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const useAVForm = ({ id, isOpen, onClose, onSuccess }: UseAVFormProps) => {
  const { confirm } = useConfirmation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  
  // Custom Hooks for Master Data (reusing PR master data to map names to IDs if needed)
  const { 
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    isLoading: isMasterDataLoading,
  } = usePRMasterData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejectReasonOpen, setIsRejectReasonOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const formMethods = useForm<AVFormData>({
    resolver: zodResolver(AVFormSchema) as unknown as any,
    mode: 'onBlur',
  });
  
  const { handleSubmit, setValue, reset, control } = formMethods;

  // Field Array for Lines
  const { fields: lines } = useFieldArray({
    control,
    name: 'lines'
  });

  const handleFormError = useCallback((fieldErrors: FieldErrors<AVFormData>) => {
    const errorMessages: string[] = [];
    const extractMessages = (errs: object) => {
      Object.values(errs).forEach((val) => {
        if (!val) return;
        if (typeof val.message === 'string') {
          errorMessages.push(val.message);
        } else if (typeof val === 'object') {
          extractMessages(val);
        }
      });
    };
    extractMessages(fieldErrors);
    const uniqueErrors = Array.from(new Set(errorMessages));
    if (uniqueErrors.length > 0) {
      toast(uniqueErrors.map(msg => `• ${msg}`).join('\n'), 'error', 'ตรวจสอบข้อมูลไม่ผ่าน');
    }
  }, [toast]);

  // Hydration
  useEffect(() => {
    if (isOpen && id && !isMasterDataLoading) {
      const fetchAV = async () => {
        setIsSubmitting(true);
        try {
          // Reusing AVService which points to PR endpoint
          const pr = await AVService.getPRById(id);
          if (pr) {
            // Map lines to include AV properties
            const mappedLines: AVLineFormData[] = (pr.lines || []).map((line: any) => ({
              ...line,
              is_approved: true, // Default checked
              approved_qty: Number(line.qty) || 0,
              requested_qty: Number(line.qty) || 0,
              remark: line.remark || '',
              location_name: line.location_name || line.location || '',
              discount: Number(line.discount) || 0,
            }));

            // Hydrate everything
            reset({
              ...pr,
              lines: mappedLines,
              pr_tax_code_id: pr.pr_tax_code_id ? Number(pr.pr_tax_code_id) : undefined,
              pr_tax_rate: (() => {
                if (pr.pr_tax_rate != null) return Number(pr.pr_tax_rate);
                const matchedTax = purchaseTaxOptions.find(t => String(t.value) === String(pr.pr_tax_code_id));
                return Number(matchedTax?.original?.tax_rate || 0);
              })(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch AV details:', error);
          showAlert('ดึงข้อมูลผิดพลาด');
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchAV();
    }
  }, [isOpen, id, isMasterDataLoading, reset, purchaseTaxOptions, showAlert]);

  const updateLine = useCallback((index: number, field: keyof AVLineFormData, value: any) => {
    const path = `lines.${index}.${field}` as Path<AVFormData>;
    setValue(path, value as FieldPathValue<AVFormData, typeof path>);
    
    // Auto uncheck if approved_qty is set to 0? Maybe not strictly required
    // Let user explicitly check/uncheck
  }, [setValue]);

  // Submit functions
  const handleApprove = handleSubmit(async (data: any) => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการอนุมัติ',
      description: 'คุณต้องการอนุมัติรายการที่เลือกใช่หรือไม่?',
      confirmText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
    });
    
    if (isConfirmed && id) {
      setIsSubmitting(true);
      try {
        await AVService.approvePR(id, data);
        toast('อนุมัติรายการสำเร็จ', 'success');
        onSuccess?.();
        onClose();
        queryClient.invalidateQueries({ queryKey: ['prs'] });
      } catch (err: any) {
        // Validation msg inside service already or shown via toast
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleRejectInit = () => {
    setIsRejectReasonOpen(true);
  };

  const submitReject = async (reason?: string) => {
    if (!reason?.trim()) {
      toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
      return false;
    }
    
    if (id) {
      setIsRejecting(true);
      try {
        await AVService.rejectPR(id, reason);
        toast('ไม่อนุมัติรายการสำเร็จ', 'success');
        onSuccess?.();
        onClose();
        queryClient.invalidateQueries({ queryKey: ['prs'] });
        return true;
      } catch (err: any) {
        return false;
      } finally {
        setIsRejecting(false);
        setIsRejectReasonOpen(false);
      }
    }
    return false;
  };

  const closeRejectModal = () => setIsRejectReasonOpen(false);

  return {
    isSubmitting,
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    updateLine,
    handleApprove,
    handleRejectInit,
    submitReject,
    closeRejectModal,
    isRejectReasonOpen,
    isRejecting,
    formMethods,
    lines,
    handleFormError,
  };
};
