import { useState, useMemo, memo } from 'react';
import { Search, MapPin, Check } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { cn } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import type { CustomerAddress } from '@customer/customer-master/types/customer-types';

/**
 * @file CustomerAddressSearchModal.tsx
 * @description Modal สำหรับเลือกที่อยู่ของลูกค้าจาก Master Data
 */

export interface CustomerAddressSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: string) => void;
    customerId: string | number;
    title?: string;
    headerColor?: string;
}

export const CustomerAddressSearchModal = memo(({
    isOpen,
    onClose,
    onSelect,
    customerId,
    title = 'เลือกที่อยู่จัดส่ง - Select Shipping Address',
    headerColor,
}: CustomerAddressSearchModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer-addresses', customerId],
        queryFn: () => CustomerService.getById(Number(customerId)),
        enabled: isOpen && !!customerId,
    });

    const addressList = useMemo(() => {
        const addresses = customer?.customerAddresses || customer?.addresses || [];
        if (!searchTerm) return addresses;
        const lowerSearch = searchTerm.toLowerCase();
        return addresses.filter((addr) =>
            addr.address?.toLowerCase().includes(lowerSearch) ||
            addr.province?.toLowerCase().includes(lowerSearch) ||
            addr.district?.toLowerCase().includes(lowerSearch) ||
            addr.sub_district?.toLowerCase().includes(lowerSearch)
        );
    }, [customer, searchTerm]);

    const formatAddress = (addr: CustomerAddress) => {
        return [
            addr.address,
            addr.sub_district,
            addr.district,
            addr.province,
            addr.postal_code,
        ]
            .filter(Boolean)
            .join(' ');
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerColor={headerColor}
            titleIcon={
                <div className={cn('p-1.5 rounded-lg shadow-sm', headerColor ? 'bg-white/20' : 'bg-amber-600')}>
                    <MapPin size={20} className="text-white" />
                </div>
            }
            width="max-w-[900px]"
        >
            <div className="flex flex-col h-[60vh]">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาที่อยู่, จังหวัด, อำเภอ..."
                            className="w-full pl-11 pr-4 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 dark:text-white shadow-sm transition-all font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดที่อยู่...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {addressList.length > 0 ? (
                                addressList.map((addr, idx) => {
                                    const fullAddr = formatAddress(addr);
                                    return (
                                        <div
                                            key={addr.customer_address_id || idx}
                                            className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-amber-400 dark:hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all cursor-pointer group relative"
                                            onClick={() => {
                                                onSelect(fullAddr);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                                    <MapPin size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                                            ที่อยู่ {idx + 1}
                                                        </span>
                                                        {addr.is_default && (
                                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                        {addr.address_type && (
                                                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase">
                                                                {addr.address_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                                                        {fullAddr}
                                                    </p>
                                                </div>
                                                <div className="self-center">
                                                    <div className="p-2 bg-amber-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                        <Check size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <MapPin size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-bold text-gray-500">ไม่พบข้อมูลที่อยู่</p>
                                    <p className="text-sm opacity-60">ลูกค้ารายนี้อาจจะยังไม่มีการเพิ่มที่อยู่</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end px-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});

CustomerAddressSearchModal.displayName = 'CustomerAddressSearchModal';
