import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RFQService, cleanParams } from '@/modules/procurement/services/rfq.service';
import type { RFQHeader } from '@/modules/procurement/types';

interface RFQSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (rfq: RFQHeader) => void;
  prId?: number | null;
  prNo?: string;
}

export function RFQSelectionModal({
  isOpen,
  onClose,
  onSelect,
  prId,
  prNo,
}: RFQSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔓 Unlocked Fetching: Trust the Backend API (No "Hybrid Fallback")
  // Fetch immediately when open. 
  // Always filter by status 'CLOSED' for business logic.
  const { data, isLoading } = useQuery({
    queryKey: ['rfq-selection-list', prId, searchTerm],
    queryFn: () => RFQService.getList(cleanParams({ 
      pr_id: prId || undefined, 
      status: 'CLOSED',
      search: searchTerm || undefined // 🎯 Search handled by API
    })),
    enabled: isOpen,
  });

  // 🧪 Debugging: Ensure data is correctly received
  useEffect(() => {
    if (data) {
      console.log("[RFQ_MODAL_API_RES]:", data);
    }
  }, [data]);

  if (!isOpen) return null;

  // 🎯 Robust Data Binding: Support both {data: []} and raw [] shapes
  const rawData = Array.isArray(data) ? data : (data?.data || []);
  const displayData = rawData; // Trusting the API result exactly

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
                <h3 className="text-lg font-bold">
                  {prNo ? `ข้อมูล RFQ อ้างอิงจากรหัส PR: ${prNo}` : "เลือกข้อมูลใบขอเสนอราคา (RFQ)"}
                </h3>
                <p className="text-xs text-indigo-100 opacity-80">ค้นหาและเลือกเอกสารที่ต้องการนำมาเปรียบเทียบ</p>
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
                placeholder="ค้นหาด้วยเลขที่ RFQ, หัวข้อ, หรือชื่อผู้ขาย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
              />
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
             </div>
           ) : (
             <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                   <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-1/4">เลขที่ (No)</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-1/6">วันที่ (Date)</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-1/4">ผู้ขาย (Vendor)</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex-1">เรื่อง/วัตถุประสงค์ (Subject)</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">จัดการ</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                   {displayData.length > 0 ? (
                      displayData.map((item: RFQHeader) => (
                        <tr 
                          key={item.rfq_id}
                          className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                        >
                           <td className="px-6 py-4">
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {item.rfq_no}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {item.rfq_date}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {item.vendor_name}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {item.purpose}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button 
                                 onClick={() => onSelect(item)}
                                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                              >
                                 เลือก
                              </button>
                           </td>
                        </tr>
                      ))
                   ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                          ไม่พบข้อมูลที่ค้นหา
                        </td>
                      </tr>
                   )}
                </tbody>
             </table>
           )}
        </div>
      </div>
    </div>,
    document.body
  );
}
