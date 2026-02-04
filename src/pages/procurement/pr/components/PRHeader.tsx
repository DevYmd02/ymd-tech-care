/**
 * @file PRHeader.tsx
 * @description ส่วนหัวของฟอร์มใบขอซื้อ - Full Migration to PRFormData (คง UI สีเดิม)
 */

import React from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Building2, FolderKanban, User } from 'lucide-react';
import type { PRFormData } from '@project-types/pr-types';
import type { CostCenter, Project } from '@project-types/master-data-types';
import { VendorSearch } from '@shared/VendorSearch';
import type { VendorMaster } from '@project-types/vendor-types';

interface Props {
  register: UseFormRegister<PRFormData>;
  setValue: UseFormSetValue<PRFormData>;
  watch: UseFormWatch<PRFormData>;
  costCenters: CostCenter[];
  projects: Project[];
  onVendorSelect: (vendor: VendorMaster | null) => void;
}

export const PRHeader: React.FC<Props> = ({ register, setValue, watch, costCenters, projects, onVendorSelect }) => {
  // Watch for vendor values to display in the selector
  const preferredVendorId = watch("preferred_vendor_id");
  const vendorName = watch("vendor_name");

  // Style classes (คงสไตล์เดิม + dark mode)
  const inputClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white";
  const selectClass = "h-8 w-full px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
  const labelClass = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm font-sans">
      {/* Document Status & Logo */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-pink-600 dark:text-pink-400 font-bold text-sm">สถานะเอกสาร : ร่าง (DRAFT)</h2>
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
          <input {...register("pr_no")} className={`${inputClass} bg-gray-100`} readOnly />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>วันที่ขอซื้อ</label>
          <input {...register("request_date")} type="date" className={inputClass} />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>วันที่ต้องการใช้ <span className="text-red-500">*</span></label>
          <input {...register("required_date")} type="date" className={inputClass} />
        </div>

        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>สกุลเงิน</label>
          <select className={selectClass} {...register("currency_code")}>
            <option value="THB">THB - บาท</option>
            <option value="USD">USD - ดอลลาร์</option>
            <option value="EUR">EUR - ยูโร</option>
          </select>
        </div>

        {/* Row 2: ผู้ขอซื้อ, ศูนย์ต้นทุน, โครงการ */}
        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}><User size={11} className="inline mr-1" />ชื่อผู้ขอซื้อ <span className="text-red-500">*</span></label>
          <input {...register("requester_name")} placeholder="ชื่อ-นามสกุล ผู้ขอ" className={`${inputClass} rounded-md`} />
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}><Building2 size={11} className="inline mr-1" />ศูนย์ต้นทุน <span className="text-red-500">*</span></label>
          <select className={selectClass} {...register("cost_center_id")} onChange={(e) => setValue("cost_center_id", e.target.value)}>
            <option value="">-- เลือกศูนย์ต้นทุน --</option>
            {costCenters.filter(cc => cc.is_active).map((cc) => (
              <option key={cc.cost_center_id} value={cc.cost_center_id}>
                {cc.cost_center_code} - {cc.cost_center_name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}><FolderKanban size={11} className="inline mr-1" />โครงการ <span className="text-gray-400">(ถ้ามี)</span></label>
          <select className={selectClass} {...register("project_id")} onChange={(e) => setValue("project_id", e.target.value || undefined)}>
            <option value="">-- ไม่ระบุโครงการ --</option>
            {projects.filter(p => p.status === 'ACTIVE').map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_code} - {project.project_name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: วัตถุประสงค์ , ผู้ขายที่แนะนำ */}
        <div className="col-span-12 md:col-span-8">
          <label className={labelClass}>วัตถุประสงค์ในการขอซื้อ <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2">
             <textarea 
                {...register("purpose")}
                placeholder="ระบุเหตุผลและวัตถุประสงค์ในการขอซื้อ..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={1}
              />
          </div>
         
        </div>

        <div className="col-span-12 md:col-span-4">
          <VendorSearch 
              onVendorSelect={onVendorSelect}
              selectedVendorId={preferredVendorId}
              selectedVendorName={vendorName}
              label="ผู้ขายที่แนะนำ (Preferred Vendor)"
              placeholder="ค้นหาผู้ขาย..."
          />
        </div>
      </div>
    </div>
  );
};
