/**
 * @file CompanyDashboard.tsx
 * @description Master Data Company Dashboard
 * @purpose Landing page for Company-related Master Data with card-based navigation
 */

import { Building2, Users, Briefcase, LayoutGrid, UserPlus, Users2, MapPin, Radio, Target, DollarSign, Tag, FileText } from 'lucide-react';
import { MasterDataHeader } from '../../pages/components/MasterDataHeader';
import { Link } from 'react-router-dom';

const COMPANY_SECTIONS = [
    {
        title: 'Company Information',
        description: 'Manage company profiles and system settings',
        items: [
            { id: 'company-info', label: 'Company Info', labelTh: 'ข้อมูลบริษัท', icon: Building2, path: '/master-data/company-info' },
            { id: 'branch', label: 'Branch', labelTh: 'รหัสสาขา', icon: Radio, path: '/master-data/branch' },
            { id: 'general-settings', label: 'General Settings', labelTh: 'ตั้งค่าทั่วไป', icon: LayoutGrid, path: '/master-data/general-settings' },
        ]
    },
    {
        title: 'Organization Structure',
        description: 'Manage departments and job roles',
        items: [
            { id: 'employee-side', label: 'Employee Side', labelTh: 'รหัสฝ่าย', icon: Briefcase, path: '/master-data/employee-side' },
            { id: 'employee-dept', label: 'Employee Dept', labelTh: 'รหัสแผนก', icon: LayoutGrid, path: '/master-data/employee-dept' },
            { id: 'job', label: 'Job', labelTh: 'รหัส Job', icon: FileText, path: '/master-data/job' },
        ]
    },
    {
        title: 'Employee Master',
        description: 'Manage employee information and groups',
        items: [
            { id: 'employee', label: 'Employee', labelTh: 'ข้อมูลพนักงาน', icon: UserPlus, path: '/master-data/employee' },
            { id: 'employee-group', label: 'Employee Group', labelTh: 'กลุ่มพนักงาน', icon: Users2, path: '/master-data/employee-group' },
            { id: 'position', label: 'Position', labelTh: 'ตำแหน่งงาน', icon: Users, path: '/master-data/position' },
        ]
    },
    {
        title: 'Sales & Market',
        description: 'Configure sales areas and channels',
        items: [
            { id: 'sales-area', label: 'Sales Area', labelTh: 'เขตการขาย', icon: MapPin, path: '/master-data/sales-area' },
            { id: 'sales-channel', label: 'Sales Channel', labelTh: 'ช่องทางการขาย', icon: Radio, path: '/master-data/sales-channel' },
            { id: 'sales-target', label: 'Sales Target', labelTh: 'เป้าการขาย', icon: Target, path: '/master-data/sales-target' },
        ]
    },
    {
        title: 'Pricing & Costs',
        description: 'Manage standard costs and price lists',
        items: [
            { id: 'standard-cost', label: 'Standard Cost', labelTh: 'ต้นทุนมาตรฐาน', icon: DollarSign, path: '/master-data/standard-cost' },
            { id: 'price-level', label: 'Price Level', labelTh: 'ระดับราคาสินค้า', icon: Tag, path: '/master-data/price-level' },
            { id: 'pricelist', label: 'Price List', labelTh: 'รายการราคาสินค้า', icon: FileText, path: '/master-data/price-list' },
        ]
    }
];

export default function CompanyDashboard() {
    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            <MasterDataHeader />
            
            <div className="mt-8 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Company Master Data</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage organizational structure, employees, sales channels, and pricing configurations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {COMPANY_SECTIONS.map((section) => (
                    <div key={section.title} className="space-y-4">
                        <div className="flex flex-col">
                            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">{section.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {section.items.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="ml-3 overflow-hidden">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.label}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{item.labelTh}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
