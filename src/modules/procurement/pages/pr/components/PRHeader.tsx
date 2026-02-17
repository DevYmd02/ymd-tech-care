/**
 * @file PRHeader.tsx
 * @description ส่วนหัวของฟอร์มใบขอซื้อ - Full Migration to PRFormData (คง UI สีเดิม)
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Building2, FolderKanban, User, XCircle } from 'lucide-react';
import type { PRFormData, VendorSelection } from '@/modules/procurement/types/pr-types';
import type { CostCenter, Project } from '@/modules/master-data/types/master-data-types';
import { VendorSearch } from '@/modules/master-data/vendor/components/selector/VendorSearch';
import { StatusCheckbox } from '@ui';
import type { MappedOption } from '@/modules/procurement/hooks/usePRMasterData';

interface Props {
  costCenters: MappedOption<CostCenter>[];
  projects: MappedOption<Project>[];
  onVendorSelect: (vendor: VendorSelection | null) => void;
  isEditMode: boolean;
  onVoid?: () => void;
}

export const PRHeader: React.FC<Props> = ({ costCenters, projects, onVendorSelect, isEditMode, onVoid }) => {
  const { register, watch, control, formState: { errors } } = useFormContext<PRFormData>();
  // Watch for vendor values to display in the selector
  const preferredVendorId = watch("preferred_vendor_id");
  const vendorName = watch("vendor_name");

  // Style classes (คงสไตล์เดิม + dark mode)
  const inputClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white";
  const selectClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
  const labelClass = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";
  const errorInputClass = "border-red-500 ring-1 ring-red-500";
  const errorMsgClass = "text-red-500 text-[10px] mt-0.5 font-medium";

  return (
    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm font-sans">
      {/* Document Status & Logo */}
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
                watch('is_on_hold') === 'Y' ? 'พักเรื่อง (ON HOLD)' : 'ร่าง (DRAFT)'
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

      {/* Form Fields Grid */}
      <div className="grid grid-cols-12 gap-x-4 gap-y-2">
        {/* Row 1: เลขที่เอกสาร, วันที่ขอซื้อ, วันที่ต้องการใช้, สกุลเงิน */}
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>เลขที่เอกสาร</label>
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
          <input {...register("pr_date")} type="date" className={`${inputClass} ${errors?.pr_date ? errorInputClass : ''}`} />
          {errors?.pr_date && <p className={errorMsgClass}>{errors.pr_date.message}</p>}
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>วันที่ต้องการใช้ <span className="text-red-500">*</span></label>
          <input {...register("need_by_date")} type="date" className={`${inputClass} ${errors?.need_by_date ? errorInputClass : ''}`} />
          {errors?.need_by_date && <p className={errorMsgClass}>{errors.need_by_date.message}</p>}
        </div>

        {/* Column 4: ON HOLD & CLEAR Actions */}
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>&nbsp;</label>
          <div className="flex items-center w-full h-8 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* 1. ON HOLD Checkbox */}
                <StatusCheckbox<PRFormData>
                  name="is_on_hold"
                  control={control}
                  label="ON HOLD"
                  trueValue="Y"
                  falseValue="N"
                  className="flex-1 px-2 h-full hover:bg-orange-50 dark:hover:bg-orange-950/20"
                />

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>

                {/* 2. VOID Button - Visible in Edit Mode, only if not already voided/approved */}
                {isEditMode && watch('status') !== 'CANCELLED' && watch('status') !== 'APPROVED' && watch('cancelflag') !== 'Y' ? (
                  <button
                    type="button"
                    onClick={onVoid}
                    className="flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 transition-all uppercase px-3"
                  >
                    <XCircle size={14} />
                    <span>ยกเลิกเอกสาร (Cancel)</span>
                  </button>
                ) : (
                  <div className="flex-1 h-full bg-gray-100 dark:bg-gray-800/50"></div>
                )}
             </div>
        </div>

        {/* Row 2: ผู้ขอซื้อ, ศูนย์ต้นทุน, โครงการ */}
        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}><User size={11} className="inline mr-1" />ชื่อผู้ขอซื้อ <span className="text-red-500">*</span></label>
          <input {...register("requester_name")} placeholder="ชื่อ-นามสกุล ผู้ขอ" className={`${inputClass} rounded-md ${errors?.requester_name ? errorInputClass : ''}`} />
          {errors?.requester_name && <p className={errorMsgClass}>{errors.requester_name.message}</p>}
        </div>

        <div className="col-span-12 md:col-span-4">
         <label className={labelClass}><Building2 size={11} className="inline mr-1" />ศูนย์ต้นทุน <span className="text-red-500">*</span></label>
         <Controller
           name="cost_center_id"
           control={control}
           render={({ field }) => (
             <select
               className={`${selectClass} ${errors?.cost_center_id ? errorInputClass : ''}`}
               ref={field.ref}
               name={field.name}
               onBlur={field.onBlur}
               value={field.value || ''}
               onChange={(e) => {
                 const val = e.target.value;
                 const selected = costCenters.find(cc => String(cc.value) === val);
                 field.onChange(selected ? selected.value : val);
               }}
             >
               <option value="">-- เลือกศูนย์ต้นทุน --</option>
               {costCenters.map((cc) => (
                 <option key={cc.value} value={cc.value}>
                   {cc.label}
                 </option>
               ))}
             </select>
           )}
         />
         {errors?.cost_center_id && <p className={errorMsgClass}>{errors.cost_center_id.message}</p>}
       </div>

       <div className="col-span-12 md:col-span-4">
         <label className={labelClass}><FolderKanban size={11} className="inline mr-1" />โครงการ <span className="text-gray-400">(ถ้ามี)</span></label>
         <Controller
           name="project_id"
           control={control}
           render={({ field }) => (
             <select
               className={selectClass}
               ref={field.ref}
               name={field.name}
               onBlur={field.onBlur}
               value={field.value || ''}
               onChange={(e) => {
                 const val = e.target.value;
                 const selected = projects.find(p => String(p.value) === val);
                 field.onChange(selected ? selected.value : val);
               }}
             >
               <option value="">-- ไม่ระบุโครงการ --</option>
               {projects.map((project) => (
                 <option key={project.value} value={project.value}>
                   {project.label}
                 </option>
               ))}
             </select>
           )}
         />
       </div>

        {/* Row 3: วัตถุประสงค์ , ผู้ขายที่แนะนำ */}
        <div className="col-span-12 md:col-span-8">
          <label className={labelClass}>วัตถุประสงค์ในการขอซื้อ <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2">
             <textarea 
                {...register("purpose")}
                placeholder="ระบุเหตุผลและวัตถุประสงค์ในการขอซื้อ..."
              className={`w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${errors?.purpose ? errorInputClass : ''}`}
                rows={1}
              />
              {errors?.purpose && <p className={errorMsgClass}>{errors.purpose.message}</p>}
          </div>
         
        </div>

        <div className="col-span-12 md:col-span-4">
          <VendorSearch 
              onVendorSelect={onVendorSelect}
              selectedVendorId={preferredVendorId ? String(preferredVendorId) : undefined}
              selectedVendorName={vendorName}
              label="ผู้ขายที่แนะนำ (Preferred Vendor)"
              placeholder="ค้นหาผู้ขาย..."
          />
        </div>
      </div>
    </div>
  );
};
