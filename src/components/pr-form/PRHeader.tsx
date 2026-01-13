/**
 * @file PRHeader.tsx
 * @description ส่วนหัวของฟอร์มใบขอซื้อ (PR Form Header)
 * @purpose แสดงข้อมูลหลักของเอกสาร: ผู้ขาย, เลขที่เอกสาร, วันที่, ผู้ติดต่อ
 * @usage นำเข้าใช้ใน PRFormPage.tsx
 */

import React, { useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Search, MoreHorizontal, Calendar } from 'lucide-react';
import type { PRFormValues } from '../../types/pr-types';
import { Input } from '../ui/Input';
import { VendorSearchModal, type Vendor } from '../shared/VendorSearchModal';
import { VENDOR_DROPDOWN_OPTIONS } from '../../mocks/vendorDropdown';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/** Props ของ PRHeader */
interface Props {
   register: UseFormRegister<PRFormValues>;  // react-hook-form register function
   setValue: UseFormSetValue<PRFormValues>;  // react-hook-form setValue function
}

// ====================================================================================
// COMPONENT - PRHeader
// ====================================================================================

export const PRHeader: React.FC<Props> = ({ register, setValue }) => {

   // ==================== STATE ====================
   // ควบคุมการเปิด/ปิด Modal ค้นหาผู้ขาย
   const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

   // ==================== STYLE CLASSES ====================
   // CSS classes ที่ใช้ซ้ำหลายที่
   const inputClass = "h-8 w-full px-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50";
   const selectClass = "h-8 w-full px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white";
   const labelClass = "block text-xs font-bold text-gray-700 mb-1";
   const addonButtonClass = "h-8 w-8 border border-l-0 border-gray-300 bg-gray-100 rounded-r-md flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors";
   const searchButtonClass = "h-8 w-8 bg-blue-600 text-white rounded-r-md flex items-center justify-center hover:bg-blue-700 transition-colors border border-blue-600";

   // ==================== MOCK DATA ====================
   // ข้อมูลจำลองผู้ขายสำหรับ Dropdown (นำเข้าจาก mocks folder)
   const vendors = VENDOR_DROPDOWN_OPTIONS;

   // ==================== EVENT HANDLERS ====================

   /**
    * จัดการเมื่อเลือกผู้ขายจาก Dropdown
    * - ดึงชื่อผู้ขายจาก vendors object
    * - อัพเดทค่าใน form ด้วย setValue
    */
   const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const code = e.target.value;
      if (code && vendors[code]) {
         setValue("vendor_name", vendors[code]);
      } else {
         setValue("vendor_name", ""); // เคลียร์ค่าถ้าไม่เลือก
      }
   };

   /**
    * จัดการเมื่อเลือกผู้ขายจาก Modal
    * - อัพเดทชื่อผู้ขายใน form
    * - ปิด Modal อัตโนมัติ
    */
   const handleVendorSelect = (vendor: Vendor) => {
      setValue("vendor_name", vendor.name);
      setIsVendorModalOpen(false);
   };

   // ==================== RENDER ====================
   return (
      <div className="p-2 border-b border-gray-200 bg-white shadow-sm font-sans">

         {/* ========== DOCUMENT STATUS & COMPANY LOGO ========== */}
         <div className="flex justify-between items-start mb-2">
            {/* สถานะเอกสาร */}
            <div>
               <h2 className="text-pink-600 font-bold text-sm">สถานะเอกสาร : รออนุมัติ</h2>
            </div>
            {/* โลโก้บริษัท */}
            <div className="text-right">
               <div className="text-[10px] font-bold text-blue-800 leading-tight">YOUNGMEEDEE</div>
               <div className="text-[9px] text-gray-500 tracking-wider">FUTURE GROUP</div>
               <div className="text-[9px] font-bold text-gray-600 mt-0.5 flex justify-end items-center gap-1">
                  <span>TAKE & CARE</span>
                  <span className="text-[8px] border border-gray-400 px-0.5 rounded">SIAM BIO</span>
               </div>
            </div>
         </div>

         {/* ========== FORM FIELDS GRID ========== */}
         <div className="grid grid-cols-12 gap-x-4 gap-y-2">

            {/* -------------------- ROW 1 -------------------- */}

            {/* รหัสผู้ขาย (Dropdown) */}
            <div className="col-span-12 md:col-span-2">
               <label className={labelClass}>รหัสผู้ขาย</label>
               <select className={selectClass} onChange={handleVendorChange}>
                  <option value="">เลือก</option>
                  {Object.keys(vendors).map((code) => (
                     <option key={code} value={code}>{code}</option>
                  ))}
               </select>
            </div>

            {/* ชื่อผู้ขาย (Input + Modal Button) */}
            <div className="col-span-12 md:col-span-4">
               <label className={labelClass}>ชื่อผู้ขาย</label>
               <div className="flex">
                  <Input register={register} name="vendor_name" placeholder="ชื่อผู้ขาย" className={inputClass} />
                  {/* ปุ่ม "..." เปิด Modal ค้นหาผู้ขาย */}
                  <button type="button" className={addonButtonClass} onClick={() => setIsVendorModalOpen(true)}>
                     <MoreHorizontal size={14} />
                  </button>
               </div>
            </div>

            {/* เลขที่เอกสาร (Read-only + Search Button) */}
            <div className="col-span-12 md:col-span-3">
               <label className={labelClass}>เลขที่เอกสาร</label>
               <div className="flex">
                  <Input register={register} name="doc_no" className={inputClass} readOnly />
                  <button type="button" className={searchButtonClass}>
                     <Search size={14} />
                  </button>
               </div>
            </div>

            {/* วันที่เอกสาร (Date Picker) */}
            <div className="col-span-12 md:col-span-3">
               <label className={labelClass}>วันที่เอกสาร</label>
               <div className="flex">
                  <Input register={register} name="doc_date" type="date" className={inputClass} />
                  {/* Calendar Icon (non-interactive) */}
                  <div className="h-8 w-8 border border-l-0 border-gray-300 bg-blue-50 text-blue-500 rounded-r-md flex items-center justify-center pointer-events-none">
                     <Calendar size={14} />
                  </div>
               </div>
            </div>

            {/* -------------------- ROW 2 -------------------- */}

            {/* ชื่อผู้ติดต่อ */}
            <div className="col-span-12 md:col-span-6">
               <label className={labelClass}>ชื่อผู้ติดต่อ</label>
               <Input register={register} name="contact_name" className={`${inputClass} rounded-md`} />
            </div>

            {/* ต้องการภายใน (จำนวนวัน) */}
            <div className="col-span-12 md:col-span-3">
               <label className={labelClass}>ต้องการภายใน</label>
               <Input register={register} name="due_days" type="number" className={`${inputClass} rounded-md text-center`} />
            </div>

            {/* On Hold Checkbox */}
            <div className="col-span-12 md:col-span-3 flex items-end pb-2">
               <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input type="checkbox" {...register("is_hold")} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-gray-700">On Hold</span>
               </label>
            </div>

         </div>

         {/* ========== VENDOR SEARCH MODAL ========== */}
         {/* Modal สำหรับค้นหาและเลือกผู้ขาย */}
         <VendorSearchModal
            isOpen={isVendorModalOpen}
            onClose={() => setIsVendorModalOpen(false)}
            onSelect={handleVendorSelect}
         />
      </div>
   );
};