import React, { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'; // ✅ Import UseFormSetValue
import { Trash2, Plus, Search, Eraser, Triangle } from 'lucide-react';
import type { PRFormValues } from '../../types/pr-types';
import { Input } from '../ui/Input';
// ✅ Import Modal ที่สร้างใหม่
import { ProductSearchModal } from '../shared/ProductSearchModal';

interface Props {
  control: Control<PRFormValues>;
  register: UseFormRegister<PRFormValues>;
  setValue: UseFormSetValue<PRFormValues>; // ✅ เพิ่ม setValue เข้ามาใน Props
  onMinRowsError: () => void;
}

interface ProductData {
  code: string;
  name: string;
  warehouse: string;
  location: string;
  unit: string;
  price: number;
}

export const PRItemTable: React.FC<Props> = ({ control, register, setValue, onMinRowsError }) => {
  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });

  // ✅ State สำหรับควบคุม Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const handleRemove = (index: number) => {
    if (fields.length <= 5) {
      onMinRowsError();
    } else {
      remove(index);
    }
  };

  const handleClear = (index: number) => {
    update(index, {
      item_code: "", item_name: "", warehouse: "", location: "",
      unit: "", qty: null, price: null, discount: null
    });
  };

  // ✅ ฟังก์ชันเปิด Modal (จำไว้ว่ากดมาจากแถวไหน)
  const handleOpenSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsModalOpen(true);
  };

  // ✅ ฟังก์ชันเมื่อเลือกสินค้าจาก Modal
  const handleSelectProduct = (product: ProductData) => {
    if (activeRowIndex !== null) {
      // ใช้ setValue เพื่ออัปเดตข้อมูลใน Form ของแถวนั้นๆ
      setValue(`items.${activeRowIndex}.item_code`, product.code);
      setValue(`items.${activeRowIndex}.item_name`, product.name);
      setValue(`items.${activeRowIndex}.warehouse`, product.warehouse);
      setValue(`items.${activeRowIndex}.location`, product.location);
      setValue(`items.${activeRowIndex}.unit`, product.unit);
      setValue(`items.${activeRowIndex}.price`, product.price);
      setValue(`items.${activeRowIndex}.qty`, 1); // ตั้งค่าเริ่มต้นเป็น 1
      setValue(`items.${activeRowIndex}.discount`, 0);
    }
    setIsModalOpen(false); // ปิด Modal
    setActiveRowIndex(null);
  };

  const tableInputClass = "w-full h-8 px-3 text-sm bg-gray-50 border border-gray-300 !rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white shadow-sm transition-all";
  const tdBaseClass = "p-1 border-r border-gray-200";

  return (
    <div className="px-4 py-4 overflow-x-auto bg-blue-50 min-h-[300px]">

      {/* ✅ ใส่ Modal ไว้ตรงนี้ */}
      <ProductSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectProduct}
      />

      <table className="w-full min-w-[1200px] border-collapse bg-white shadow-sm text-sm border border-gray-200">
        <thead className="bg-blue-600 text-white text-xs">
          <tr>
            <th className="p-2 w-12 text-center border-r border-blue-600/50 sticky left-0 z-10 bg-blue-700">No.</th>
            <th className="p-2 w-32 text-center border-r border-blue-500">รหัสสินค้า</th>
            <th className="p-2 min-w-[300px] text-center border-r border-blue-500">ชื่อสินค้า</th>
            <th className="p-2 w-24 text-center border-r border-blue-500">คลัง</th>
            <th className="p-2 w-20 text-center border-r border-blue-500">ที่เก็บ</th>
            <th className="p-2 w-20 text-center border-r border-blue-500">หน่วยนับ</th>
            <th className="p-2 w-24 text-center border-r border-blue-500">จำนวน</th>
            <th className="p-2 w-28 text-center border-r border-blue-500">ราคา/หน่วย</th>
            <th className="p-2 w-24 text-center border-r border-blue-500">ส่วนลด</th>
            <th className="p-2 w-28 text-center border-r border-blue-500">จำนวนเงิน</th>
            <th className="p-2 w-24 text-center">
              <div className="flex justify-center items-center">
                <Triangle size={12} fill="white" className="transform rotate-180 text-white" />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {fields.map((field, index) => {
            const currentItem = items?.[index];
            const qty = Number(currentItem?.qty || 0);
            const price = Number(currentItem?.price || 0);
            const discount = Number(currentItem?.discount || 0);
            const lineTotal = (qty * price) - discount;

            return (
              <tr key={field.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                <td className="p-1 text-center bg-slate-200 text-slate-700 font-bold border-r border-gray-300 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {index + 1}
                </td>

                <td className={tdBaseClass}><Input register={register} name={`items.${index}.item_code`} className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.item_name`} className={`${tableInputClass}`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.warehouse`} className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.location`} className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.unit`} className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.qty`} type="number" className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.price`} type="number" step="0.01" className={`${tableInputClass} text-center`} /></td>
                <td className={tdBaseClass}><Input register={register} name={`items.${index}.discount`} type="number" step="0.01" className={`${tableInputClass} text-center`} /></td>
                <td className={`${tdBaseClass} text-right font-bold pr-2 text-gray-700`}>{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                <td className="p-1 border-gray-200">
                  <div className="flex justify-center items-center space-x-1 h-8">
                    {/* ✅ ปุ่มค้นหา: ใส่ onClick เพื่อเปิด Modal */}
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800"
                      title="ค้นหา"
                      onClick={() => handleOpenSearch(index)}
                    >
                      <Search size={16} />
                    </button>

                    <button type="button" className="text-orange-500 hover:text-orange-700" onClick={() => handleClear(index)} title="ล้าง"><Eraser size={16} /></button>
                    <button type="button" className="text-red-500 hover:text-red-700" onClick={() => handleRemove(index)} title="ลบแถว"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => append({
          item_code: "", item_name: "", warehouse: "", location: "",
          unit: "", qty: null, price: null, discount: null
        })}
        className="mt-2 flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 text-xs font-bold transition-colors shadow-sm border border-gray-300"
      >
        <Plus size={14} className="mr-1" /> เพิ่มรายการ
      </button>
    </div>
  );
};