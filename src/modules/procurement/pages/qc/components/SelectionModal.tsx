import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, FileText } from 'lucide-react';

interface SelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  data: T[];
  columns: {
    label: string;
    key: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  }[];
  onSelect: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  searchPlaceholder?: string;
  searchKeys: (keyof T)[];
}

export function SelectionModal<T extends object>({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  columns,
  onSelect,
  keyExtractor,
  searchPlaceholder = "ค้นหา...",
  searchKeys
}: SelectionModalProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredData = data.filter(item => 
    searchKeys.some(key => {
      const val = item[key];
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white shadow-lg relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 backdrop-blur-sm"></div>
           <div className="relative flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-xs text-indigo-100 opacity-80">{subtitle}</p>
              </div>
           </div>
           <button 
              onClick={onClose}
              className="relative p-2 hover:bg-white/20 rounded-full transition-colors group"
           >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
           </button>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
           <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
              />
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
           <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                 <tr className="border-b border-gray-100 dark:border-gray-800">
                    {columns.map((col, idx) => (
                      <th key={idx} className={`px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider ${col.className || ''}`}>
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">จัดการ</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                 {filteredData.length > 0 ? (
                    filteredData.map((item) => {
                      const itemKey = keyExtractor(item);
                      return (
                        <tr 
                          key={String(itemKey)}
                          className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                        >
                           {columns.map((col, colIdx) => (
                             <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                               {typeof col.key === 'function' ? col.key(item) : (
                                  <span className={`text-sm ${colIdx === 0 ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {String(item[col.key] ?? '')}
                                  </span>
                               )}
                             </td>
                           ))}
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button 
                                 onClick={() => onSelect(item)}
                                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                              >
                                 เลือก
                              </button>
                           </td>
                        </tr>
                      );
                    })
                 ) : (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 text-sm">
                        ไม่พบข้อมูลที่ค้นหา
                      </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>,
    document.body
  );
}
