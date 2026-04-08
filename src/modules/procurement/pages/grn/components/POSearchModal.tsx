import { useState, useMemo, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { POAService } from '@/modules/procurement/services';
import type { POListItem } from '@/modules/procurement/types';

interface POSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (po: POListItem) => void;
}

export function POSearchModal({ isOpen, onClose, onSelect }: POSearchModalProps) {
    const [poList, setPoList] = useState<POListItem[]>([]);
    const [poSearchTerm, setPoSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // -- Fetch Approved POs (POA) --
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            POAService.getList({ limit: 100 })
                .then(res => {
                    // Filter for APPROVED and PARTIAL statuses
                    const actionableItems = res.data.filter(item => 
                        item.status === 'APPROVED' || item.status === 'PARTIAL'
                    );
                    setPoList(actionableItems);
                    setIsLoading(false);
                })
                .catch(() => setIsLoading(false));
        } else {
            // Optional: reset search when closing
            setPoSearchTerm('');
        }
    }, [isOpen]);

    // -- Search/Filter Logic --
    const filteredPOList = useMemo(() => {
        if (!poSearchTerm) return poList;
        const term = poSearchTerm.toLowerCase();
        return poList.filter(po => 
            po.po_no?.toLowerCase().includes(term) || 
            (po.poa_no && po.poa_no !== '-' && po.poa_no.toLowerCase().includes(term)) || 
            po.vendor_name?.toLowerCase().includes(term)
        );
    }, [poList, poSearchTerm]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกใบสั่งซื้อ (Select Purchase Order / POA)"
            titleIcon={<Search size={20} />}
            width="max-w-6xl"
            headerColor="bg-violet-600 bg-gradient-to-r from-violet-700 to-violet-500"
        >
        <div className="p-6 flex flex-col max-h-[70vh] overflow-hidden">
                {/* Search Area */}
                <div className="mb-6 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="ค้นหาด้วยเลขที่ PO, เลขที่ POA หรือชื่อผู้ขาย..."
                        value={poSearchTerm}
                        onChange={(e) => setPoSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                        autoFocus
                    />
                    {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">เลขที่ PO (PO No.)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">เลขที่ POA (Approved No.)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">ผู้ขาย (Vendor)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center uppercase">วันที่</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center uppercase">สถานะ</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredPOList.length > 0 ? (
                                filteredPOList.map(po => (
                                    <tr key={po.po_id} className="group hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors">
                                        <td className="px-6 py-4 font-bold text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform origin-left whitespace-nowrap">{po.po_no}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white italic opacity-80 whitespace-nowrap">{po.poa_no || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap">{po.vendor_name}</td>
                                        <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 italic font-medium whitespace-nowrap">{po.po_date?.split('T')[0] || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                po.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                po.status === 'PARTIAL' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                po.status === 'ISSUED' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400/90' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onSelect(po)}
                                                className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm active:scale-95 transition-all text-xs font-bold"
                                            >
                                                เลือกข้อมูล
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center text-gray-400 bg-gray-50/30 dark:bg-gray-900/50 rounded-b-xl">
                                        <Package size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">ไม่พบข้อมูลใบสั่งซื้อที่ต้องการค้นหา</p>
                                        <button 
                                            onClick={() => setPoSearchTerm('')}
                                            className="mt-4 text-violet-600 hover:underline text-sm font-bold"
                                        >
                                            ล้างการค้นหา
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-gray-800/50">
                <button 
                    onClick={onClose} 
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 font-bold transition-all shadow-sm"
                >
                    ยกเลิก
                </button>
            </div>
        </DialogFormLayout>
    );
}
