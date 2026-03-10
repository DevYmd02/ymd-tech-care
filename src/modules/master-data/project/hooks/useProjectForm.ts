import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../services/project.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { Project, ProjectStatus } from '@/modules/master-data/types/master-data-types';

export const projectSchema = z.object({
    project_code: z.string().min(1, 'กรุณากรอกรหัสโครงการ'),
    project_name: z.string().min(1, 'กรุณากรอกชื่อโครงการ'),
    description: z.string(),
    cost_center_id: z.coerce.number().min(1, 'กรุณาเลือกศูนย์ต้นทุน'),
    budget_amount: z.number().min(0, 'งบประมาณต้องไม่ต่ำกว่า 0'),
    start_date: z.string().min(1, 'กรุณาระบุวันที่เริ่มโครงการ'),
    end_date: z.string().min(1, 'กรุณาระบุวันที่สิ้นสุดโครงการ'),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] as const),
    is_active: z.boolean(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

const initialFormData: ProjectFormData = {
    project_code: '',
    project_name: '',
    description: '',
    cost_center_id: 0,
    budget_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE',
    is_active: true,
};

export function useProjectForm(editId: number | null, initialData?: Project | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema) as Resolver<ProjectFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as ProjectFormData;

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                project_code: initialData.project_code,
                project_name: initialData.project_name,
                description: initialData.description || '',
                cost_center_id: initialData.cost_center_id,
                budget_amount: initialData.budget_amount,
                start_date: initialData.start_date,
                end_date: initialData.end_date,
                status: initialData.status as ProjectStatus,
                is_active: initialData.is_active,
            });
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ProjectFormData) => {
            return editId 
                ? ProjectService.update(editId, data)
                : ProjectService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลโครงการถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save project error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<ProjectFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        register,
        formData,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm
    };
}
