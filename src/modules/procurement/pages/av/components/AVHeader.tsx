import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Building2, FolderKanban, User, Calendar } from 'lucide-react';
import type { VendorSelection } from '@/modules/procurement/types/pr-types';
import type { CostCenter, Project } from '@/modules/master-data/types/master-data-types';
import { VendorSearch } from '@/modules/master-data/vendor/components/selector/VendorSearch';
import { StatusCheckbox } from '@ui';
import type { AVFormData } from '../schemas/av.schema';

interface Props {
  prId?: number;
  costCenters: CostCenter[];
  projects: Project[];
  onVendorSelect: (vendor: VendorSelection | null) => void;
  isEditMode?: boolean;
  onVoid?: () => void;
  readOnly?: boolean;
}

export const AVHeader: React.FC<Props> = ({ prId, costCenters, projects, onVendorSelect, readOnly = true }) => {
  const { register, watch, control, formState: { errors } } = useFormContext<AVFormData>();
  const preferredVendorId = watch("preferred_vendor_id");
  const vendorName = watch("vendor_name");

  const inputClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white";
  const selectClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
  const labelClass = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";
  const errorInputClass = "border-red-500 ring-1 ring-red-500";


  const formatDisplayDate = (val?: string) => {
    if (!val) return '';
    if (val.includes('-') && val.length >= 10) {
      const [y, m, d] = val.split('-');
      return `${d.substring(0, 2)}/${m}/${y}`;
    }
    return val;
  };

  return (
    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm font-sans">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-0.5">
          <h2 className={`font-bold text-sm ${
              watch('cancelflag') === 'Y' || watch('status') === 'CANCELLED' ? 'text-red-500' :
              watch('status') === 'APPROVED' ? 'text-green-500' :
              watch('is_on_hold') === 'Y' ? 'text-orange-500' : 'text-pink-600 dark:text-pink-400'
          }`}>
            สถานะ : {
                watch('cancelflag') === 'Y' || watch('status') === 'CANCELLED' ? 'ยกเลิก (VOID)' :
                watch('status') === 'APPROVED' ? 'อนุมัติแล้ว (APPROVED)' :
                watch('is_on_hold') === 'Y' ? 'พักเรื่อง (ON HOLD)' : 'รออนุมัติ (PENDING)'
            }
          </h2>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-bold text-blue-800 dark:text-blue-400 leading-tight">YOUNGMEEDEE</div>
          <div className="text-[9px] text-gray-500 dark:text-gray-400 tracking-wider">FUTURE GROUP</div>
          <div className="text-[9px] font-bold text-gray-600 dark:text-gray-400 mt-0.5 flex justify-end items-center gap-1">
            <span>TAKE & CARE</span>
            <span className="text-[8px] border border-gray-400 dark:border-gray-600 px-0.5 rounded">SIAM BIO</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-x-4 gap-y-2">
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>
            เลขที่เอกสาร {(prId || (watch as any)('id') || (watch as any)('pr_id')) ? <span className="text-gray-500 font-normal ml-1 text-[10px]">(ID: {prId || (watch as any)('id') || (watch as any)('pr_id')})</span> : ''}
          </label>
          <div className="relative">
            <input 
              {...register("pr_no")} 
              className={`${inputClass} bg-gray-100 italic ${watch("pr_no")?.startsWith('DRAFT-TEMP') ? 'text-amber-600 font-bold' : ''}`} 
              value={watch("pr_no")?.startsWith('DRAFT-TEMP') ? 'NEW (รอรันเลข)' : watch("pr_no")}
              readOnly 
            />
          </div>
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>วันที่ขอซื้อ <span className="text-red-500">*</span></label>
          <Controller
            name="pr_date"
            control={control}
            render={({ field: { value } }) => (
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  placeholder="dd/mm/yyyy"
                  value={formatDisplayDate(value)}
                  className={`${inputClass} pl-2 pr-8 ${errors?.pr_date ? errorInputClass : ''}`}
                />
                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>
            )}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>วันที่ต้องการใช้ <span className="text-red-500">*</span></label>
          <Controller
            name="need_by_date"
            control={control}
            render={({ field: { value } }) => (
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  placeholder="dd/mm/yyyy"
                  value={formatDisplayDate(value)}
                  className={`${inputClass} pl-2 pr-8 ${errors?.need_by_date ? errorInputClass : ''}`}
                />
                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>
            )}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>&nbsp;</label>
          <div className="flex items-center w-full h-8 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <StatusCheckbox<AVFormData>
                  name="is_on_hold"
                  control={control}
                  label="ON HOLD"
                  trueValue="Y"
                  falseValue="N"
                  disabled={true}
                  className="flex-1 px-2 h-full hover:bg-orange-50 dark:hover:bg-orange-950/20"
                />
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 h-full bg-gray-100 dark:bg-gray-800/50"></div>
             </div>
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}><User size={11} className="inline mr-1" />ชื่อผู้ขอซื้อ <span className="text-red-500">*</span></label>
          <input {...register("requester_name")} disabled={readOnly} placeholder="ชื่อ-นามสกุล ผู้ขอ" className={`${inputClass} rounded-md ${errors?.requester_name ? errorInputClass : ''}`} />
        </div>

        <div className="col-span-12 md:col-span-4">
         <label className={labelClass}><Building2 size={11} className="inline mr-1" />ศูนย์ต้นทุน <span className="text-red-500">*</span></label>
         <Controller
           name="cost_center_id"
           control={control}
           render={({ field }) => (
             <select
               disabled={readOnly}
               className={`${selectClass} ${errors?.cost_center_id ? errorInputClass : ''}`}
               value={field.value || ''}
             >
               <option value="">-- เลือกศูนย์ต้นทุน --</option>
               {costCenters?.map((cc) => (
                 <option key={cc.cost_center_id} value={cc.cost_center_id}>
                   {cc.cost_center_code} - {cc.cost_center_name}
                 </option>
               ))}
             </select>
           )}
         />
       </div>

       <div className="col-span-12 md:col-span-4">
         <label className={labelClass}><FolderKanban size={11} className="inline mr-1" />โครงการ <span className="text-gray-400">(ถ้ามี)</span></label>
         <Controller
           name="project_id"
           control={control}
           render={({ field }) => (
             <select
               disabled={readOnly}
               className={selectClass}
               value={field.value || ''}
             >
               <option value="">-- ไม่ระบุโครงการ --</option>
               {projects?.map((proj) => (
                 <option key={proj.project_id} value={proj.project_id}>
                   {proj.project_code} - {proj.project_name}
                 </option>
               ))}
             </select>
           )}
         />
       </div>

        <div className="col-span-12 md:col-span-8">
          <label className={labelClass}>วัตถุประสงค์ในการขอซื้อ <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2">
             <textarea 
                {...register("purpose")}
                disabled={readOnly}
                placeholder="ระบุเหตุผลและวัตถุประสงค์ในการขอซื้อ..."
              className={`w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${errors?.purpose ? errorInputClass : ''}`}
                rows={1}
              />
           </div>
        </div>

        <div className="col-span-12 md:col-span-4">
          <VendorSearch 
              onVendorSelect={onVendorSelect}
              selectedVendorId={preferredVendorId ? String(preferredVendorId) : undefined}
              selectedVendorName={vendorName}
              label="รหัสผู้ขาย"
              placeholder="ค้นหาผู้ขาย..."
              disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
