/**
 * @file PRInfoBar.tsx
 * @description แถบข้อมูลเพิ่มเติมของใบขอซื้อ
 * @purpose แสดงข้อมูล: วันที่กำหนดส่ง, เครดิต, Vendor Quote, ขนส่ง, ผู้ขอซื้อ
 * @usage นำเข้าใช้ใน PRFormModal.tsx
 */

import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { PRFormValues } from '../../types/pr-types';
import { Input } from '../ui/Input';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface Props {
  register: UseFormRegister<PRFormValues>;
}

// ====================================================================================
// COMPONENT - PRInfoBar
// ====================================================================================

export const PRInfoBar: React.FC<Props> = ({ register }) => {
  // Style สำหรับหัวตาราง (สีน้ำเงิน)
  const thClass = "px-2 py-1.5 text-left font-normal border-r border-blue-500 last:border-r-0 whitespace-nowrap";

  // Style สำหรับเนื้อหา (สีขาว, ตัวหนังสือดำ)
  const tdClass = "px-2 py-1.5 border-r border-gray-300 last:border-r-0 text-gray-800 font-bold whitespace-nowrap";

  // Style สำหรับ Input ในตาราง
  const inputClass = "bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded-sm w-full h-6 text-xs focus:outline-none focus:border-blue-500";

  return (
    <div className="w-full mt-2 overflow-x-auto border border-gray-300 shadow-sm bg-white">
      <table className="w-full min-w-[800px] text-xs border-collapse">

        {/* --- ส่วนหัวตาราง (Header) --- */}
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className={`${thClass} w-48`}>วันที่กำหนดส่ง</th>
            <th className={`${thClass} w-24`}>เครดิต (วัน)</th>
            <th className={thClass}>Vendor Quote No.</th>
            <th className={thClass}>ขนส่งโดย</th>
            <th className={thClass}>ผู้ขอซื้อ</th>
          </tr>
        </thead>

        {/* --- ส่วนเนื้อหา (Content) --- */}
        <tbody>
          <tr>
            {/* 1. วันที่กำหนดส่ง (Date Picker) */}
            <td className="px-2 py-1 border-r border-gray-300">
              <Input
                register={register}
                name="delivery_date"
                type="date"
                className={inputClass}
              />
            </td>

            {/* 2. เครดิต (วัน) */}
            <td className={`${tdClass} text-center`}>
              <Input
                register={register}
                name="credit_days"
                type="number"
                className={`${inputClass} text-center`}
              />
            </td>

            {/* 3. Vendor Quote No. */}
            <td className={tdClass}>
              <Input
                register={register}
                name="vendor_quote_no"
                className={inputClass}
                placeholder="QC-XXXX-XXXXX"
              />
            </td>

            {/* 4. ขนส่งโดย */}
            <td className={tdClass}>
              <select
                {...register("shipping_method")}
                className={`${inputClass} bg-white`}
              >
                <option value="">เลือก</option>
                <option value="รถยนต์">รถยนต์</option>
                <option value="รถบรรทุก">รถบรรทุก</option>
                <option value="ไปรษณีย์">ไปรษณีย์</option>
                <option value="ขนส่งเอกชน">ขนส่งเอกชน</option>
              </select>
            </td>

            {/* 5. ผู้ขอซื้อ */}
            <td className={tdClass}>
              <Input
                register={register}
                name="requester_name"
                className={inputClass}
                placeholder="ชื่อผู้ขอซื้อ"
              />
            </td>
          </tr>
        </tbody>

      </table>
    </div>
  );
};