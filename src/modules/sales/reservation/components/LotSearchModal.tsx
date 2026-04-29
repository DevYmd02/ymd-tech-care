import React, { useState, useCallback, useMemo } from 'react';
import { Search, Tag, Check, Plus, PackagePlus, Layers, List, Edit2, MapPin } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { ReservationInventoryService } from '@sales/reservation/services/reservation-inventory.service';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatThaiDate as formatDate } from '@utils/dateUtils';
import { CreateLotModal } from './CreateLotModal';
import { MasterDataService } from '@master-data/services/master-data.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { QuickAdjustStockModal } from './QuickAdjustStockModal';
import { CreateBalanceModal } from './CreateBalanceModal';
import { ItemLotService } from '@inventory/services/item-lot.service';
import type { ItemLot } from '@inventory/types/item-lot-types';

export interface LotSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lot: LotNo) => void;
    itemId?: string | number;
    /** ชื่อสินค้า ส่งต่อไปยัง CreateLotModal เพื่อแสดงใน banner */
    itemName?: string;
    /** รหัสสินค้า ส่งต่อไปยัง CreateLotModal เพื่อแสดงใน banner */
    itemCode?: string;
    warehouseId?: string | number | null;
    locationId?: string | number | null;
    title?: string;
}

type TabType = 'available' | 'all';

export const LotSearchModal: React.FC<LotSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    itemId,
    itemName,
    itemCode,
    warehouseId,
    locationId,
    title = 'จัดการล็อตและสต็อกสินค้า'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('available');
    const [searchTerm, setSearchTerm] = useState('');
    const [ignoreFilters, setIgnoreFilters] = useState(false); // Local state to override props filter
    const debouncedSearch = useDebounce(searchTerm, 400);
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [isCreateBalanceOpen, setIsCreateBalanceOpen] = useState(false);
    
    const [selectedLotForAdjust, setSelectedLotForAdjust] = useState<LotNo | null>(null);
    const [preSelectedLotId, setPreSelectedLotId] = useState<number | undefined>(undefined);

    const numericItemId = itemId ? Number(itemId) : 0;

    // --- Auxiliary Data ---
    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-lookup'],
        queryFn: () => MasterDataService.getWarehouses(),
        enabled: isOpen
    });

    const { data: locationsResponse } = useQuery({
        queryKey: ['locations-lookup'],
        queryFn: () => LocationService.getAll({ limit: 5000 }),
        enabled: isOpen
    });
    const locations = useMemo(() => locationsResponse?.items || [], [locationsResponse]);

    const currentWarehouseName = useMemo(() => {
        if (!warehouseId) return '';
        const wh = warehouses.find(w => Number(w.warehouse_id) === Number(warehouseId));
        return wh?.warehouse_name || '';
    }, [warehouseId, warehouses]);

    const currentLocationName = useMemo(() => {
        if (!locationId) return '';
        const loc = locations.find(l => Number(l.location_id) === Number(locationId));
        return loc?.name_th || '';
    }, [locationId, locations]);

    // --- Tab 1 Data: Available Balances ---
    const { data: response, isLoading: isLoadingBalances, refetch: refetchBalances } = useQuery({
        queryKey: ['lot-lookup-reservation', debouncedSearch, itemId, warehouseId, locationId],
        queryFn: () => ReservationInventoryService.getAvailableLots({ 
            q: debouncedSearch, 
            item_id: itemId, 
            warehouse_id: warehouseId ?? undefined,
            location_id: locationId ?? undefined,
            limit: 100 
        }),
        enabled: isOpen && !!itemId && activeTab === 'available',
    });

    // --- Tab 2 Data: All Master Lots ---
    const { data: itemLotsResponse, isLoading: isLoadingItemLots, refetch: refetchMaster } = useQuery({
        queryKey: ['item-lots', numericItemId, debouncedSearch],
        queryFn: () => ItemLotService.getList(numericItemId), // Assuming getList filters by itemId
        enabled: isOpen && numericItemId > 0
    });
    
    const masterLots = useMemo(() => {
        const records = (itemLotsResponse || []) as ItemLot[];
        
        if (!debouncedSearch) return records;
        
        const q = debouncedSearch.toLowerCase();
        return records.filter(lot => 
            (String(lot.lot_no || '')).toLowerCase().includes(q)
        );
    }, [itemLotsResponse, debouncedSearch]);

    // Enrich balances with master lot data (names, dates)
    const availableLots = useMemo(() => {
        const rawBalances = response?.items || [];
        const masterRecords = (itemLotsResponse || []) as ItemLot[];
        
        // Filter by warehouse/location if props are provided to ensure strict consistency
        const balances = rawBalances.filter(balance => {
            if (ignoreFilters) return true; // Bypass filters if user requested to see all
            if (warehouseId && Number(balance.warehouse_id) !== Number(warehouseId)) return false;
            if (locationId && Number(balance.location_id) !== Number(locationId)) return false;
            return true;
        });
        
        return balances.map(balance => {
            // masterId is the reference to the master lot (lot_id in API)
            const masterId = balance.lot_id || balance.lot_no_id;
            const masterLot = masterRecords.find(l => Number(l.lot_id) === masterId);
            
            // Enrich with warehouse/location names from lookup data if missing
            const wh = warehouses.find(w => Number(w.warehouse_id) === Number(balance.warehouse_id));
            const loc = locations.find(l => Number(l.location_id) === Number(balance.location_id));
            
            return {
                ...balance,
                id: balance.lot_balance_id || balance.id, // Primary key for this row
                lot_id: masterId, // Master Lot Reference
                code: balance.code || masterLot?.lot_no || '',
                name_th: balance.name_th || masterLot?.supplier_name || '',
                mfg_date: balance.mfg_date || masterLot?.mfg_date || undefined,
                expiry_date: balance.expiry_date || masterLot?.expiry_date || undefined,
                warehouse_name: balance.warehouse_name || wh?.warehouse_name || '',
                location_name: balance.location_name || loc?.name_th || ''
            } as LotNo;
        });
    }, [response, itemLotsResponse, warehouses, locations, warehouseId, locationId, ignoreFilters]);

    // --- Handlers ---
    const handleSelect = useCallback((lot: LotNo) => {
        onSelect(lot);
        onClose();
    }, [onSelect, onClose]);

    const handleOpenAdjust = (e: React.MouseEvent, lot: LotNo) => {
        e.stopPropagation();
        setSelectedLotForAdjust(lot);
        setIsAdjustOpen(true);
    };

    const handleAddBalance = (lotId?: number) => {
        setPreSelectedLotId(lotId);
        setIsCreateBalanceOpen(true);
    };

    const handleViewStock = (lotNo: string) => {
        setSearchTerm(lotNo);
        setActiveTab('available');
    };

    const handleLotCreated = useCallback((newLotNo: string) => {
        setSearchTerm(newLotNo);
        setActiveTab('all'); // Switch to Tab 2 to see the new lot
        setIsCreateOpen(false);
        refetchMaster();
        refetchBalances();
    }, [refetchMaster, refetchBalances]);

    const isLoadingData = activeTab === 'available' ? isLoadingBalances : isLoadingItemLots;

    return (
        <>
            <DialogFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                titleIcon={
                    <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
                        <Tag size={20} className="text-white" />
                    </div>
                }
                width="max-w-[1200px]"
                headerColor="bg-purple-600"
            >
                <div className="flex flex-col h-[75vh]">
                    {/* Header Controls */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            {/* Tabs Navigation */}
                            <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800 rounded-xl w-fit">
                                <button
                                    onClick={() => setActiveTab('available')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeTab === 'available'
                                            ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <Layers size={18} />
                                    สต็อกพร้อมใช้งาน ({availableLots.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeTab === 'all'
                                            ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <List size={18} />
                                    รายการล็อตทั้งหมด ({masterLots.length})
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => numericItemId > 0 && handleAddBalance()}
                                    disabled={numericItemId <= 0}
                                    className={`h-10 px-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
                                        numericItemId > 0
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <PackagePlus size={18} />
                                    นำเข้าสต็อก
                                </button>
                                <button
                                    onClick={() => numericItemId > 0 && setIsCreateOpen(true)}
                                    disabled={numericItemId <= 0}
                                    className={`h-10 px-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
                                        numericItemId > 0
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Plus size={18} />
                                    สร้าง Lot ใหม่
                                </button>
                            </div>
                        </div>

                        {/* Filter Status Badge */}
                        {(warehouseId || locationId) && activeTab === 'available' && (
                            <div className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                                ignoreFilters 
                                    ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700' 
                                    : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                            }`}>
                                <div className={`p-1.5 rounded-lg ${ignoreFilters ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'}`}>
                                    <MapPin size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${ignoreFilters ? 'text-gray-400' : 'text-blue-500'}`}>
                                        {ignoreFilters ? 'กำลังแสดงทั้งหมด' : 'ตัวกรองตำแหน่งทำงานอยู่'}
                                    </p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {ignoreFilters 
                                            ? 'รวมสต็อกสินค้าจากทุกคลังและที่เก็บ' 
                                            : `แสดงเฉพาะสต็อกใน: ${currentWarehouseName || 'คลัง'} / ${currentLocationName || 'ที่เก็บ'}`
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIgnoreFilters(!ignoreFilters)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                        ignoreFilters
                                            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50'
                                    }`}
                                >
                                    {ignoreFilters ? 'กลับไปที่ตัวกรอง' : 'แสดงสต็อกทั้งหมด'}
                                </button>
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative group max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={activeTab === 'available' ? "ค้นหาจากสต็อกที่มีอยู่..." : "ค้นหาจากล็อตทั้งหมด..."}
                                className="w-full h-11 pl-11 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium shadow-sm transition-all text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto p-0">
                        {isLoadingData ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4" />
                                <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : activeTab === 'available' ? (
                            /* --- TABLE 1: AVAILABLE BALANCES --- */
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขล็อต (Lot No.)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">จำนวนคงเหลือ<br/>(ON HAND)</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right text-orange-600 dark:text-orange-400">ยอดจอง<br/>(RESERVED)</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right text-emerald-600 dark:text-emerald-400">พร้อมใช้งาน<br/>(AVAILABLE)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">คลัง/ที่เก็บ</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">วันผลิต/หมดอายุ</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                    {availableLots.length > 0 ? (
                                        availableLots.map((lot: LotNo) => (
                                            <tr 
                                                key={`${lot.lot_no_id || lot.id}-${lot.warehouse_id || 'nw'}-${lot.location_id || 'nl'}`} 
                                                className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group cursor-pointer"
                                                onClick={() => handleSelect(lot)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform inline-block w-fit">
                                                            {lot.code}
                                                        </span>
                                                        {lot.name_th && <span className="text-[10px] text-gray-500 mt-0.5">{lot.name_th}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {(lot.qty_on_hand ?? lot.balance_qty ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">
                                                        {(lot.qty_reserved ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {(lot.qty_available ?? lot.sale_stock ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-xs">
                                                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                                                            {lot.warehouse_name || currentWarehouseName || '-'}
                                                        </span>
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            {lot.location_name || currentLocationName || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-[11px]">
                                                        <span className="text-gray-500">MFG: {lot.mfg_date ? formatDate(lot.mfg_date) : '-'}</span>
                                                        <span className="text-gray-500">EXP: {lot.expiry_date ? formatDate(lot.expiry_date) : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={(e) => handleOpenAdjust(e, lot)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                                        >
                                                            <Edit2 size={12} /> แก้ไข
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleSelect(lot); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                        >
                                                            เลือก <Check size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center text-gray-400">
                                                    <Layers size={48} className="mb-3 opacity-20" />
                                                    <p className="font-bold">ไม่มีสต็อกพร้อมใช้งาน</p>
                                                    <p className="text-sm">กรุณาสลับไปดูที่ "รายการล็อตทั้งหมด" เพื่อนำเข้าสต็อก</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            /* --- TABLE 2: ALL MASTER LOTS --- */
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขล็อต (Lot No.)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">สถานะ</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">จำนวนคงคลังรวม</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">วันผลิต/หมดอายุ</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                    {masterLots.length > 0 ? (
                                        masterLots.map((lot) => {
                                            const id = Number(lot.lot_id);
                                            const lotNo = String(lot.lot_no || '');
                                            const status = String(lot.status || 'ACTIVE');
                                            const qtyStock = Number(lot.qty_stock || 0);
                                            const mfg = lot.mfg_date ? String(lot.mfg_date) : null;
                                            const exp = lot.expiry_date ? String(lot.expiry_date) : null;
                                            
                                            return (
                                                <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {lotNo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            status === 'ACTIVE' 
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                            {qtyStock.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                        {mfg ? formatDate(mfg) : '-'} / {exp ? formatDate(exp) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleViewStock(lotNo)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                            >
                                                                เลือก <Check size={14} />
                                                            </button>
                                                            
                                                            {qtyStock <= 0 && (
                                                                <button 
                                                                    onClick={() => handleAddBalance(id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                                >
                                                                    <PackagePlus size={14} />
                                                                    นำเข้า
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center text-gray-400">
                                                    <List size={48} className="mb-3 opacity-20" />
                                                    <p className="font-bold">ไม่พบข้อมูลล็อต</p>
                                                    <p className="text-sm">กรุณากดปุ่ม "สร้าง Lot ใหม่" หากต้องการเพิ่มล็อตเข้าระบบ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Footer Stats */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                        <div className="flex gap-6 text-sm">
                            <p className="text-gray-500 dark:text-gray-400">
                                พบทั้งหมด <span className="font-bold text-purple-600">{activeTab === 'available' ? availableLots.length : masterLots.length}</span> รายการ
                            </p>
                            {activeTab === 'available' && (
                                <p className="text-gray-500 dark:text-gray-400">
                                    รวมสต็อกพร้อมใช้: <span className="font-bold text-emerald-600">
                                        {availableLots.reduce((acc, l) => acc + (l.qty_available || 0), 0).toLocaleString('th-TH')}
                                    </span>
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </DialogFormLayout>

            {/* Sub Modals */}
            <CreateLotModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                itemId={numericItemId}
                itemName={itemName}
                itemCode={itemCode}
                onCreated={handleLotCreated}
            />

            {selectedLotForAdjust && (
                <QuickAdjustStockModal
                    isOpen={isAdjustOpen}
                    onClose={() => {
                        setIsAdjustOpen(false);
                        setSelectedLotForAdjust(null);
                    }}
                    lotId={selectedLotForAdjust.id} // This is now the balance_id
                    lotNoId={selectedLotForAdjust.lot_id || 0} // This is the master_id
                    lotNo={selectedLotForAdjust.code || ''}
                    itemName={itemName || ''}
                    warehouseName={selectedLotForAdjust.warehouse_name || currentWarehouseName}
                    locationName={selectedLotForAdjust.location_name || currentLocationName}
                    currentQty={selectedLotForAdjust.balance_qty || 0}
                    reservedQty={selectedLotForAdjust.qty_reserved || 0}
                    itemId={numericItemId}
                    warehouseId={selectedLotForAdjust.warehouse_id || (warehouseId ? Number(warehouseId) : undefined)}
                    locationId={selectedLotForAdjust.location_id || (locationId ? Number(locationId) : undefined)}
                    originalRecord={selectedLotForAdjust as unknown as Record<string, unknown>}
                />
            )}

            {isCreateBalanceOpen && (
                <CreateBalanceModal
                    isOpen={isCreateBalanceOpen}
                    onClose={() => setIsCreateBalanceOpen(false)}
                    itemId={numericItemId}
                    defaultLotId={preSelectedLotId}
                    onCreated={() => setActiveTab('available')} // Switch to Tab 1 to see the new balance
                />
            )}
        </>
    );
});
