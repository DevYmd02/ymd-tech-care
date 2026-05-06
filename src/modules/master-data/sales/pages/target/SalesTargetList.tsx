/**
 * @file SalesTargetList.tsx
 * @description Main page for Managing Sale Period and Sale Target
 */

import { useState, useCallback, useEffect } from 'react';
import { Target, Users, Package } from 'lucide-react';
import { logger } from '@/shared/utils';

// Components
import { 
    PageListLayout, 
    TabPanel, 
    FilterFormBuilder, 
} from '@ui';
import type { TabItem } from '@/shared/components/ui/layout/TabPanel';
import type { FilterFieldConfig } from '@/shared/components/ui/filters/FilterFormBuilder';

// Sub-tabs & Modals
import { SalePeriodTab } from './components/SalePeriodTab';
import { SaleTargetTab } from './components/SaleTargetTab';
import { SalePeriodFormModal } from './components/SalePeriodFormModal';
import { SaleTargetFormModal } from './components/SaleTargetFormModal';

// Services
import { SalePeriodService } from './services/sale-period.service';
import { SaleTargetService } from './services/sale-target.service';

// Hooks & Types
import { useTableFilters, type TableFilters } from '@/shared/hooks/useTableFilters';
import type { 
    SalePeriodMaster, 
    SalePeriodFilters 
} from './types/sale-period.types';
import type { 
    SaleTargetMaster, 
    SaleTargetFilters 
} from './types/sale-target.types';

const STATUS_OPTIONS = [
    { label: 'ทั้งหมด', value: 'ALL' },
    { label: 'เปิดงวด (Open)', value: 'ACTIVE' },
    { label: 'ปิดงวด (Closed)', value: 'INACTIVE' },
];

export default function SalesTargetList() {
    const [activeTab, setActiveTab] = useState('monthly');
    const [monthlyTargets, setMonthlyTargets] = useState<SalePeriodMaster[]>([]);
    const [employeeTargets, setSaleTargets] = useState<SaleTargetMaster[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal states
    const [isSalePeriodModalOpen, setIsSalePeriodModalOpen] = useState(false);
    const [isSaleTargetModalOpen, setIsSaleTargetModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | number | null>(null);

    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'period_id'
        }
    });

    const tabItems: TabItem[] = [
        { id: 'monthly', label: 'เป้าขายรายเดือน', icon: <Target size={18} /> },
        { id: 'employee', label: 'เป้าการขายพนักงาน', icon: <Users size={18} /> },
        { id: 'category', label: 'เป้าการขายหมวดหมู่', icon: <Package size={18} /> },
    ];

    const monthlyFilterConfig: FilterFieldConfig<string>[] = [
        { name: 'search', label: 'รหัสเป้าการขาย', type: 'text', placeholder: 'กรอกรหัสเป้าการขาย' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ];

    const employeeFilterConfig: FilterFieldConfig<keyof TableFilters<string>>[] = [
        { name: 'search', label: 'พนักงาน/รหัสเป้าหมาย', type: 'text', placeholder: 'ค้นหาพนักงาน...' },
    ];

    const fetchMonthlyData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await SalePeriodService.getList(filters as unknown as Partial<SalePeriodFilters>);
            // Handle both PageResponse format and direct array format safely without 'any'
            let items: SalePeriodMaster[] = [];
            if (Array.isArray(response)) {
                items = response;
            } else if (response && 'items' in response) {
                items = (response as { items: SalePeriodMaster[] }).items;
            }
            setMonthlyTargets(items);
        } catch (error) {
            logger.error('Failed to fetch sale periods:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchEmployeeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await SaleTargetService.getList(filters as unknown as Partial<SaleTargetFilters>);
            setSaleTargets(response.items || []);
        } catch (error) {
            logger.error('Failed to fetch sale targets:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (activeTab === 'monthly') {
            fetchMonthlyData();
        } else if (activeTab === 'employee') {
            fetchEmployeeData();
        }
    }, [activeTab, fetchMonthlyData, fetchEmployeeData]);

    const handleAdd = () => {
        setEditId(null);
        if (activeTab === 'monthly') {
            setIsSalePeriodModalOpen(true);
        } else if (activeTab === 'employee') {
            setIsSaleTargetModalOpen(true);
        }
    };

    const handleEdit = (id: string | number) => {
        setEditId(id);
        if (activeTab === 'monthly') {
            setIsSalePeriodModalOpen(true);
        } else if (activeTab === 'employee') {
            setIsSaleTargetModalOpen(true);
        }
    };

    const handleDelete = useCallback((id: string | number) => {
        const msg = activeTab === 'monthly' ? 'คุณต้องการลบเป้าการขายนี้หรือไม่?' : 'คุณต้องการลบเป้าการขายพนักงานนี้หรือไม่?';
        if (window.confirm(msg)) {
            if (activeTab === 'monthly') {
                SalePeriodService.delete(id).then(() => fetchMonthlyData());
            } else {
                SaleTargetService.delete(id).then(() => fetchEmployeeData());
            }
        }
    }, [activeTab, fetchMonthlyData, fetchEmployeeData]);

    const SearchForm = (
        <FilterFormBuilder
            config={activeTab === 'monthly' ? monthlyFilterConfig : employeeFilterConfig}
            filters={filters}
            onFilterChange={(name, value) => setFilters({ [name]: value })}
            onSearch={activeTab === 'monthly' ? fetchMonthlyData : fetchEmployeeData}
            onReset={resetFilters}
            onCreate={activeTab !== 'category' ? handleAdd : undefined}
            createLabel={activeTab === 'monthly' ? 'สร้างเป้าการขายใหม่' : 'เพิ่มเป้าพนักงาน'}
            accentColor="indigo"
        />
    );

    return (
        <PageListLayout
            title="กำหนดเป้าการขาย"
            subtitle="จัดการช่วงเวลาและเป้าหมายการขาย (Master Data)"
            icon={Target}
            accentColor="indigo"
            searchForm={SearchForm}
            totalCount={activeTab === 'monthly' ? monthlyTargets.length : employeeTargets.length}
            isLoading={isLoading}
        >
            <TabPanel
                tabs={tabItems}
                activeTab={activeTab}
                onTabChange={(id) => {
                    setActiveTab(id);
                    resetFilters();
                }}
            >
                {activeTab === 'monthly' && (
                    <SalePeriodTab
                        data={monthlyTargets}
                        isLoading={isLoading}
                        filters={filters}
                        handlePageChange={handlePageChange}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                )}

                {activeTab === 'employee' && (
                    <SaleTargetTab
                        data={employeeTargets}
                        isLoading={isLoading}
                        filters={filters}
                        handlePageChange={handlePageChange}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                )}

                {activeTab === 'category' && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Target size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา</p>
                        <p className="text-sm">การกำหนดเป้าการขายรายหมวดหมู่สินค้า</p>
                    </div>
                )}
            </TabPanel>

            <SalePeriodFormModal 
                isOpen={isSalePeriodModalOpen}
                onClose={() => setIsSalePeriodModalOpen(false)}
                editId={editId}
                onSuccess={fetchMonthlyData}
            />

            <SaleTargetFormModal
                isOpen={isSaleTargetModalOpen}
                onClose={() => setIsSaleTargetModalOpen(false)}
                editId={editId}
                onSuccess={fetchEmployeeData}
            />
        </PageListLayout>
    );
}
