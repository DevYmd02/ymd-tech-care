import React, { useState } from 'react';
import { Controller } from 'react-hook-form'; 
import type { Control } from 'react-hook-form'; 
import { FileText, MoreHorizontal, DollarSign, FileCode, History } from 'lucide-react';
import type { PRFormValues } from '../../types/pr-types';

interface Props {
  control: Control<PRFormValues>;
}

export const PRDetailTabs: React.FC<Props> = ({ control }) => {
  const [activeTab, setActiveTab] = useState('Detail');

  const tabs = [
    { id: 'Detail', label: 'Detail', icon: <FileText size={14} /> },
    { id: 'More', label: 'More', icon: <MoreHorizontal size={14} /> },
    { id: 'Rate', label: 'Rate', icon: <DollarSign size={14} className="text-orange-500" /> },
    { id: 'Description', label: 'Description', icon: <FileCode size={14} /> },
    { id: 'History', label: 'History', icon: <History size={14} /> },
  ];

  return (
    <div className="w-full flex flex-col gap-2">
      
      {/* --- ส่วนหัว Tabs --- */}
      {/* w-full: ให้ยาวเต็มจอ */}
      <div className="flex items-center bg-gray-100 p-1 rounded-full w-full border border-gray-200">
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              /* flex-1: สั่งให้ปุ่มยืดขยายกินพื้นที่เท่าๆ กันจนเต็มแถบ */
              flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-full text-xs font-bold transition-all select-none
              ${activeTab === tab.id 
                ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50' 
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}

      </div>

      {/* --- ส่วนเนื้อหา --- */}
      {/* ลด padding (p-2) เพื่อให้กล่องดูเล็กลง */}
      <div className="bg-white border border-gray-300 rounded-md p-2 shadow-sm">
        
        {activeTab === 'Detail' && (
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                // ปรับความสูงตรงนี้: เปลี่ยนจาก h-24 เป็น h-14 (หรือ h-12 ถ้าอยากให้เล็กกว่านี้)
                className="w-full h-14 text-sm outline-none resize-none placeholder-gray-400 text-gray-700 bg-transparent"
                placeholder="กรอกหมายเหตุเพิ่มเติม..."
              />
            )}
          />
        )}

        {activeTab === 'Rate' && (
          <div className="h-14 flex items-center text-sm text-gray-600 font-medium px-2">
             ข้อมูลอัตราแลกเปลี่ยน
          </div>
        )}
        
        {activeTab !== 'Detail' && activeTab !== 'Rate' && (
           // ปรับความสูงตรงนี้ให้เท่ากับ textarea (h-14)
           <div className="h-14 flex items-center justify-center text-xs text-gray-400 italic">
              - ส่วนข้อมูล {activeTab} -
           </div>
        )}

      </div>
    </div>
  );
};