import React from 'react';
import { Users, Phone, Mail, MapPin, ChevronDown, ChevronUp, Database, Edit2, Trash2 } from 'lucide-react';
import type { VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';

interface VendorTabProps {
    data: VendorListItem[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    handleEdit: (id: string) => void;
    handleDelete: (id: string) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const VendorTab: React.FC<VendorTabProps> = ({
    data,
    expandedId,
    toggleExpand,
    handleEdit,
    handleDelete,
    dbRelation
}) => {
    /**
     * Helper to format vendor address
     */
    const formatVendorAddress = (vendor: VendorListItem): string => {
        const addressesArray = vendor.addresses || vendor.vendorAddresses || [];
        
        if (addressesArray && addressesArray.length > 0) {
            const primaryAddr = addressesArray.find((a: { address_type?: string }) => a.address_type === 'REGISTERED') || addressesArray[0];
            if (primaryAddr) {
                const parts = [
                    primaryAddr.address,
                    primaryAddr.sub_district,
                    primaryAddr.district,
                    primaryAddr.province,
                    primaryAddr.postal_code
                ];
                const validParts = parts.filter(part => part && String(part).trim() !== '');
                if (validParts.length > 0) {
                    return validParts.join(' ');
                }
            }
        }
        
        const addressParts = [
            vendor.address_line1,
            vendor.sub_district,
            vendor.district,
            vendor.province,
            vendor.postal_code
        ];

        const validParts = addressParts.filter(part => part && part.trim() !== '');
        return validParts.length > 0 ? validParts.join(' ') : '';
    };

    if (data.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบข้อมูล {dbRelation.dbTable}</div>;
    }

    return (
        <div className="space-y-4">
            {data.map((vendor) => {
                const isExpanded = expandedId === vendor.vendor_id;
                return (
                    <div key={vendor.vendor_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(vendor.vendor_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Users size={24} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={vendor.vendor_name}>
                                                {vendor.vendor_name}
                                            </span>
                                            {vendor.status && (
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                                    vendor.status === 'ACTIVE' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {vendor.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                            <span className="whitespace-nowrap">Code: {vendor.vendor_code}</span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span className="whitespace-nowrap">Tax ID: {vendor.tax_id || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Address</p>
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {formatVendorAddress(vendor) || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {vendor.phone || '02-123-4567'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 hover:underline">
                                                    {vendor.email || 'sales@techdigital.co.th'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tax Settings</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 text-xs font-medium border border-green-500 text-green-600 rounded">
                                                VAT Registered
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium border border-orange-500 text-orange-600 rounded">
                                                WHT Applicable
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Currency</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">THB</p>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(vendor.vendor_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(vendor.vendor_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>

                                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Database size={16} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Relations</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Table:</p>
                                            <p className="text-blue-600 font-mono">{dbRelation.dbTable}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                            <p className="text-blue-600 font-mono text-xs">
                                                {dbRelation.relations.join(', ')}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">FK:</p>
                                            <p className="text-blue-600 font-mono">{dbRelation.fk}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
