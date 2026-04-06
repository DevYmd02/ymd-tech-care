import React, { useEffect } from 'react';
import { useForm, useFieldArray, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ClipboardCheck, Save, X } from 'lucide-react';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';
import { VendorSearch } from '@/modules/master-data/vendor/components/selector/VendorSearch';
import { CreateVEFormSchema, type CreateVEFormData, type VECriteriaRowData } from '@/modules/procurement/schemas/ve-schemas';
import { VEService } from '@/modules/procurement/services/ve.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { VendorGradeEnum, EvaluationResultEnum } from '@/modules/procurement/schemas/ve-schemas';


// TODO: Import standard vendor selection modal if exists, we will use a basic field for now.
// e.g. import { VendorSelectionModal } from '@/modules/master-data/vendor/components/VendorSelectionModal';

interface VendorEvaluationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId?: string | null;
  onSuccess?: () => void;
}

const DEFAULT_CRITERIA: VECriteriaRowData[] = [
  { criteria_code: 'QUALITY', criteria_name: 'คุณภาพสินค้า/บริการ (Quality)', score: 100, weight: 40, weighted_score: 40, remark: '' },
  { criteria_code: 'DELIVERY', criteria_name: 'การส่งมอบ (Delivery)', score: 100, weight: 30, weighted_score: 30, remark: '' },
  { criteria_code: 'PRICE', criteria_name: 'ราคาและเงื่อนไข (Price)', score: 100, weight: 30, weighted_score: 30, remark: '' },
];

// ====================================================================================
// HELPER COMPONENT: EvaluationRow
// ====================================================================================

interface EvaluationRowProps {
  index: number;
  control: Control<CreateVEFormData>;
  register: UseFormRegister<CreateVEFormData>;
  setValue: UseFormSetValue<CreateVEFormData>;
  mode: 'view' | 'create';
}

const EvaluationRow: React.FC<EvaluationRowProps> = ({ index, control, register, setValue, mode }) => {
  const score = useWatch({ control, name: `criteria.${index}.score` });
  const weight = useWatch({ control, name: `criteria.${index}.weight` });
  const criteriaName = useWatch({ control, name: `criteria.${index}.criteria_name` });

  const weightedScore = (Number(score || 0) * Number(weight || 0)) / 100;

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
        {criteriaName}
      </td>
      <td className="px-5 py-4 text-center text-slate-500 font-semibold">
        {weight}%
      </td>
      <td className="px-5 py-4">
        <input
          type="number"
          {...register(`criteria.${index}.score`, { 
            valueAsNumber: true,
            min: 0,
            max: 100,
            onChange: (e) => {
              const val = parseInt(e.target.value);
              if (val > 100) {
                setValue(`criteria.${index}.score`, 100);
              } else if (val < 0) {
                setValue(`criteria.${index}.score`, 0);
              }
            }
          })}
          disabled={mode === 'view'}
          className="w-full h-9 px-3 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-indigo-700 dark:text-indigo-400 outline-none"
        />
      </td>
      <td className="px-5 py-4 text-center font-black text-lg text-blue-600 dark:text-blue-400">
        {weightedScore.toFixed(2)}
      </td>
      <td className="px-5 py-4">
        <input
          type="text"
          {...register(`criteria.${index}.remark`)}
          disabled={mode === 'view'}
          placeholder="ระบุเหตุผล (ถ้ามี)..."
          className="w-full h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
        />
      </td>
    </tr>
  );
};

export const VendorEvaluationFormModal: React.FC<VendorEvaluationFormModalProps> = ({
  isOpen,
  onClose,
  evaluationId,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const mode = evaluationId ? 'view' : 'create';

  const form = useForm<CreateVEFormData>({
    resolver: zodResolver(CreateVEFormSchema),
    defaultValues: {
      vendor_id: '',
      vendor_name: '',
      evaluation_period: '',
      evaluation_date: new Date().toISOString().split('T')[0],
      emp_id: user?.employee_id?.toString() || 'SYSTEM',
      criteria: DEFAULT_CRITERIA,
      total_score: 100,
      vendor_grade: 'Preferred',
      evaluation_result: 'PASS',
      remark: ''
    }
  });

  const { control, register, handleSubmit, setValue, formState: { isSubmitting } } = form;
  
  const watchedCriteria = useWatch({ control, name: 'criteria' });
  const watchedVendorName = useWatch({
    control,
    name: 'vendor_name',
  });
  
  // Real-time calculated totals for display
  const totalScoreValue = (watchedCriteria || []).reduce((acc, curr) => {
    return acc + (Number(curr.score || 0) * Number(curr.weight || 0)) / 100;
  }, 0);

  // Sync calculations with form state (but avoid criteria loop)
  useEffect(() => {
    let calculatedGrade: CreateVEFormData['vendor_grade'] = 'Grade C';
    let calculatedResult: CreateVEFormData['evaluation_result'] = 'TERMINATE';

    if (totalScoreValue >= 90) {
      calculatedGrade = 'Preferred';
      calculatedResult = 'PASS';
    } else if (totalScoreValue >= 80) {
      calculatedGrade = 'Grade A';
      calculatedResult = 'PASS';
    } else if (totalScoreValue >= 70) {
      calculatedGrade = 'Grade B';
      calculatedResult = 'IMPROVE';
    } else if (totalScoreValue >= 60) {
      calculatedGrade = 'Grade C';
      calculatedResult = 'IMPROVE';
    } else {
      calculatedGrade = 'Grade C';
      calculatedResult = 'TERMINATE';
    }

    // Only update if different to avoid redundant renders
    const currentTotal = form.getValues('total_score');
    if (currentTotal !== totalScoreValue) {
       setValue('total_score', totalScoreValue);
       setValue('vendor_grade', calculatedGrade);
       setValue('evaluation_result', calculatedResult);
    }
  }, [totalScoreValue, setValue, form]);

  const vendorGrade = useWatch({ control, name: 'vendor_grade' });
  const evaluationResult = useWatch({ control, name: 'evaluation_result' });

  const { fields } = useFieldArray({
    control,
    name: 'criteria'
  });

  // FIXME: Add query to fetch Evaluation Details if mode is 'view'
  
  const createMutation = useMutation({
    mutationFn: (data: CreateVEFormData) => VEService.create(data),
    onSuccess: () => {
      toast('บันทึกแบบประเมินผู้ขายสำเร็จ', 'success');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast((err as any)?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  });

  const onSubmit = (data: CreateVEFormData) => {
    createMutation.mutate(data);
  };

  const inputClass = "w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 transition-colors";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      size="full"
      title="แบบประเมินผู้ขาย (Vendor Evaluation Form)"
      subtitle="กรอกข้อมูลและผลการประเมินประสิทธิภาพของผู้ขาย"
      titleIcon={<ClipboardCheck size={24} />}
      headerColor="bg-[#1e293b]"
      footer={
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end items-center bg-white dark:bg-slate-900 sticky bottom-0 z-10 gap-x-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <X size={16} /> {mode === 'view' ? 'ปิดหน้าต่าง' : 'ยกเลิก (Cancel)'}
          </button>
          {mode !== 'view' && (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Save size={16} /> บันทึกข้อมูล (Save Evaluation)
            </button>
          )}
        </div>
      }
    >
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-8">
        <form className="max-w-[1400px] mx-auto space-y-8 pb-10">
            
          {/* SECTION 1: ข้อมูลการประเมิน (General Information) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded flex justify-center items-center text-xs">1</span>
                 ข้อมูลการประเมิน (General Information)
               </h3>
             </div>
             <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-4 md:col-span-2">
                 <VendorSearch
                   onVendorSelect={(vendor) => {
                     if (vendor) {
                       form.setValue('vendor_id', String(vendor.vendor_id), { shouldValidate: true });
                       form.setValue('vendor_name', vendor.vendor_name);
                     } else {
                       form.setValue('vendor_id', '', { shouldValidate: true });
                       form.setValue('vendor_name', '');
                     }
                   }}
                   selectedVendorName={watchedVendorName}
                   label="ชื่อผู้ขาย (Vendor)"
                   placeholder="พิมพ์เพื่อค้นหาบริษัทคู่ค้า..."
                   error={form.formState.errors.vendor_id?.message}
                   disabled={mode === 'view'}
                 />
                 <div className="hidden">
                    <input {...form.register('vendor_id')} />
                    <input {...form.register('vendor_name')} />
                 </div>
               </div>
               
               <div>
                 <label className={labelClass}>รอบการประเมิน (Evaluation Period)</label>
                 <select 
                   {...form.register('evaluation_period')}
                   disabled={mode === 'view'}
                   className={inputClass}
                 >
                   <option value="">-- เลือกรอบการประเมิน --</option>
                   <option value="2026 - ไตรมาส 1">2026 - ไตรมาส 1</option>
                   <option value="2026 - ไตรมาส 2">2026 - ไตรมาส 2</option>
                   <option value="2026 - ประจำปี">2026 - ประจำปี</option>
                 </select>
               </div>

               <div>
                 <label className={labelClass}>วันที่ประเมิน (Evaluation Date) <span className="text-red-500">*</span></label>
                 <input 
                   type="date"
                   {...form.register('evaluation_date')}
                   disabled={mode === 'view'}
                   className={inputClass}
                 />
               </div>

               <div className="md:col-span-2">
                 <label className={labelClass}>ผู้ประเมิน (Evaluated By)</label>
                 <input 
                   type="text"
                   value={user?.employee?.employee_fullname || "สมชาย ระบบดี (ผู้จัดการฝ่ายจัดซื้อ)"}
                   readOnly
                   disabled
                   className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed italic font-semibold`}
                 />
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">* ดึงข้อมูลอัตโนมัติจากระบบ</p>
               </div>
             </div>
          </div>

          {/* SECTION 2: รายละเอียดการประเมิน (Evaluation Criteria) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded flex justify-center items-center text-xs">2</span>
                 รายละเอียดการประเมิน (Evaluation Criteria)
               </h3>
             </div>
             <div className="p-0 overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b dark:border-slate-800">
                   <tr>
                     <th className="px-5 py-3">หัวข้อการประเมิน</th>
                     <th className="px-5 py-3 text-center w-24">น้ำหนัก (%)</th>
                     <th className="px-5 py-3 text-center w-32">คะแนน (0-100)</th>
                     <th className="px-5 py-3 text-center w-32">คะแนนที่ได้</th>
                     <th className="px-5 py-3">หมายเหตุ</th>
                   </tr>
                 </thead>
                 <tbody>
                   {fields.map((field, index) => (
                      <EvaluationRow
                        key={field.id}
                        index={index}
                        control={control}
                        register={register}
                        setValue={setValue}
                        mode={mode}
                      />
                    ))}
                 </tbody>
                 <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
                   <tr>
                     <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-600 dark:text-slate-400">
                       รวมคะแนน (Total Weighted Score):
                     </td>
                     <td className="px-5 py-4 text-center font-black text-xl text-emerald-600 dark:text-emerald-400">
                       {totalScoreValue.toFixed(2)}
                     </td>
                     <td></td>
                   </tr>
                 </tfoot>
               </table>
             </div>
          </div>

          {/* SECTION 3: สรุปผลการประเมิน */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded flex justify-center items-center text-xs">⭐</span>
                 สรุปผลการประเมิน (Evaluation Summary)
               </h3>
             </div>
             
             <div className="p-8 pb-10">
               <div className="flex flex-col items-center justify-center mb-8 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 py-6 rounded-xl">
                 <div className="text-sm font-bold text-slate-500 mb-2">คะแนนรวมอัตโนมัติ (Auto-calculated Total Score)</div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                      {totalScoreValue.toFixed(2)}
                    </span>
                    <span className="text-xl font-bold text-slate-500">/ 100</span>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {/* เกรดผู้ขาย */}
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">เกรดผู้ขาย (Vendor Grade)</label>
                   <div className="grid grid-cols-2 gap-3">
                     {VendorGradeEnum.options.map(grade => {
                       const isSelected = vendorGrade === grade;
                       return (
                         <div
                           key={grade}
                          className={`h-12 flex items-center justify-center rounded-lg border-2 font-bold transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                         >
                           {grade}
                         </div>
                       )
                     })}
                   </div>
                 </div>

                 {/* ผลการตัดสิน */}
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">ผลการตัดสิน (Evaluation Result)</label>
                   <div className="space-y-3">
                     {EvaluationResultEnum.options.map(result => {
                       const isSelected = evaluationResult === result;
                       let label = '';
                       let borderColor = '';
                       
                        if (result === 'PASS') { 
                          label = 'ผ่านเกณฑ์ (Pass)'; 
                          borderColor = 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'; 
                        }
                        else if (result === 'IMPROVE') { 
                          label = 'ต้องปรับปรุง (Improve)'; 
                          borderColor = 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'; 
                        }
                        else { 
                          label = 'ยกเลิกการติดต่อ (Terminate)'; 
                          borderColor = 'border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'; 
                        }

                       return (
                         <div
                           key={result}
                          className={`h-12 flex items-center px-4 rounded-lg border-2 font-bold transition-all ${isSelected ? borderColor : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                         >
                            <span className="mr-3 text-lg opacity-80">{isSelected ? '◉' : '○'}</span>
                            {label}
                         </div>
                       )
                     })}
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* SECTION 4: ข้อเสนอแนะ */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded flex justify-center items-center text-xs">4</span>
                 ข้อเสนอแนะ (Remark)
               </h3>
             </div>
             <div className="p-5">
               <textarea
                 {...form.register('remark')}
                 disabled={mode === 'view'}
                 rows={4}
                 placeholder="ระบุความคิดเห็น จุดเด่น จุดด้อย หรือข้อเสนอแนะเพิ่มเติมสำหรับการประเมินครั้งนี้..."
                 className={`${inputClass} h-auto py-3`}
               />
             </div>
          </div>
          
        </form>
      </div>
    </ModalLayout>
  );
};
