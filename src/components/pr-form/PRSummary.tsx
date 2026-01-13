import React from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { PRFormValues } from '../../types/pr-types';
import { Input } from '../ui/Input';

interface Props {
  control: Control<PRFormValues>;
  register: UseFormRegister<PRFormValues>;
}

export const PRSummary: React.FC<Props> = ({ control, register }) => {
  const items = useWatch({ control, name: "items" });
  const vatRate = useWatch({ control, name: "vat_rate" }) || 7;
  const discountAmount = useWatch({ control, name: "discount_amount" }) || 0;

  // คำนวณยอดเงินต่างๆ
  // ✅ คำนวณรวมส่วนลดจากแต่ละแถวในตาราง
  const totalItemDiscounts = items.reduce((sum, item) => {
    return sum + Number(item.discount || 0);
  }, 0);

  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);
    return sum + ((qty * price) - discount);
  }, 0);

  const totalAfterDiscount = totalAmount - discountAmount;
  const vatAmount = totalAfterDiscount * (vatRate / 100);
  const grandTotal = totalAfterDiscount + vatAmount;

  // ✅ แก้ตรงนี้ครับ: เปลี่ยน text-right เป็น text-left
  const labelClass = "font-bold text-gray-700 text-left self-center";

  const readOnlyClass = "w-full h-8 px-2 text-right text-sm bg-gray-100 border border-gray-300 rounded-sm focus:outline-none text-gray-700 font-medium";
  const inputClass = "w-full h-8 px-2 text-right text-sm bg-white border border-gray-300 rounded-sm focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 font-medium";

  return (
    <div className="p-2 text-sm text-gray-700">
      {/* ใช้ Grid แบ่งเป็น 4 คอลัมน์ 
         Col 1: Label (w-24)
         Col 2: Input กลาง 1 (1fr - ยืดหยุ่น)
         Col 3: Input กลาง 2 (1fr - ยืดหยุ่น)
         Col 4: ยอดเงินขวาสุด (w-32)
      */}
      <div className="grid grid-cols-[96px_100px_100px_128px] gap-2 items-center justify-end">

        {/* --- แถวที่ 1: รวม --- */}
        <div className={labelClass}>รวม</div>
        <div></div> {/* เว้นว่าง Col 2 */}
        <div></div> {/* เว้นว่าง Col 3 */}
        <div>
          <input
            type="text"
            className={readOnlyClass}
            value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>

        {/* --- แถวที่ 2: ส่วนลด --- */}
        <div className={labelClass}>ส่วนลด</div>
        <div>
          {/* ✅ แสดงรวมส่วนลดจากตารางสินค้า */}
          <input
            type="text"
            className={readOnlyClass}
            value={totalItemDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>
        <div>
          {/* ช่องกรอกส่วนลด */}
          <Input
            register={register}
            name="discount_amount"
            type="number"
            className={`${inputClass} text-red-600`}
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-bold">=</span>
          <input
            type="text"
            className={readOnlyClass}
            value={Number(discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>

        {/* --- แถวที่ 3: ภาษี VAT --- */}
        <div className={labelClass}>ภาษี VAT</div>
        <div>
          {/* ยอดก่อน VAT */}
          <input
            type="text"
            className={readOnlyClass}
            value={totalAfterDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs font-bold whitespace-nowrap">ภาษี(%)</span>
          <Input
            register={register}
            name="vat_rate"
            type="number"
            className={`${inputClass} text-center`}
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-bold">=</span>
          <input
            type="text"
            className={readOnlyClass}
            value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>

        {/* --- เส้นคั่นบางๆ --- */}
        <div className="col-span-4 border-b border-gray-300 my-1"></div>

        {/* --- แถวที่ 4: รวมทั้งสิ้น --- */}
        <div className={`${labelClass} text-black`}>รวมทั้งสิ้น</div>
        <div></div> {/* เว้นว่าง */}
        <div></div> {/* เว้นว่าง */}
        <div>
          <input
            type="text"
            className="w-full h-9 px-2 text-right font-bold text-black text-lg bg-yellow-100 border border-gray-400 rounded-sm focus:outline-none"
            value={grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            readOnly
          />
        </div>

      </div>
    </div>
  );
};