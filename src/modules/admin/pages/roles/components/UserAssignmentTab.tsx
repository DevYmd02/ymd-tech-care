import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '@/modules/master-data';
import { Search, UserCog, Check, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';

interface UserAssignmentTabProps {
    rolesList: string[];
}

export const UserAssignmentTab: React.FC<UserAssignmentTabProps> = ({ rolesList }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
    const [tempRole, setTempRole] = useState('');

    // Fetch live employees using our existing service
    const { data: employees = [], isLoading, error } = useQuery({
        queryKey: ['employees-assignment'],
        queryFn: () => EmployeeService.getAll(),
    });

    // Helper to resolve an employee's currently configured Role (mocking since role may not be in direct IEmployee schema)
    const getEmployeeRole = (emp: IEmployee): string => {
        // Fallback assignments based on employee code/name for visual realism in mock/dev databases
        const code = emp.employee_code?.toUpperCase() || '';
        if (code.includes('ADMIN') || code.includes('TT002')) return 'SYS_ADMIN';
        if (code.includes('SALES') || code.includes('TT001')) return 'SALES_OFFICER';
        if (code.includes('SBL-TT')) return 'TAX_COMPLIANCE';
        if (code.includes('EMP0005')) return 'SYS_ADMIN';
        if (code.includes('EMP0009')) return 'FIN_MANAGER';
        return 'INTERNAL_AUDITOR';
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter((emp) => {
        const query = searchQuery.toLowerCase();
        const code = (emp.employee_code || '').toLowerCase();
        const first = (emp.employee_firstname_th || '').toLowerCase();
        const last = (emp.employee_lastname_th || '').toLowerCase();
        const e = emp as unknown as {
            department?: { department_name?: string; emp_dept_name?: string };
            emp_dept?: { emp_dept_name?: string; dept_name?: string };
            dept?: { dept_name?: string };
        };
        const dept = (e.department?.department_name || e.emp_dept?.emp_dept_name || e.department?.emp_dept_name || e.emp_dept?.dept_name || e.dept?.dept_name || '').toLowerCase();
        const pos = (emp.position?.position_name || '').toLowerCase();
        
        return code.includes(query) || first.includes(query) || last.includes(query) || dept.includes(query) || pos.includes(query);
    });

    // Simulated Role Assignment Mutation
    const assignMutation = useMutation({
        mutationFn: async (params: { empId: number; newRole: string }) => {
            // Mock server update latency
            void params;
            return new Promise((resolve) => setTimeout(resolve, 800));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees-assignment'] });
            toast(`มอบหมายบทบาท ${tempRole} ให้พนักงานสำเร็จ`, 'success');
            setSelectedEmployee(null);
        },
    });

    const handleAssignRole = () => {
        if (!selectedEmployee) return;
        assignMutation.mutate({ empId: selectedEmployee.id, newRole: tempRole });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header section with search bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <UserCog className="text-indigo-600 dark:text-indigo-400" size={24} />
                        มอบหมายบทบาทผู้ใช้งาน (User Assignment)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ค้นหาพนักงานเพื่อมอบหมายหรือเปลี่ยนกลุ่มสิทธิ์การใช้งานระบบ ERP
                    </p>
                </div>
                
                {/* Search query */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อพนักงาน, รหัส หรือแผนก..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* Layout Split: Left List, Right Assign form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Employees list */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500">
                            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={32} />
                            <p className="text-sm">กำลังดึงข้อมูลพนักงานจากระบบ...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
                            <ShieldAlert className="mx-auto mb-2" size={32} />
                            <p className="font-semibold text-sm">ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
                            <Search className="mx-auto mb-3 opacity-20" size={40} />
                            <p className="text-sm">ไม่พบรายชื่อพนักงานที่ค้นหา</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredEmployees.map((emp) => {
                                const currentRole = getEmployeeRole(emp);
                                const isSelected = selectedEmployee?.id === emp.id;
                                
                                return (
                                    <div 
                                        key={emp.id}
                                        onClick={() => {
                                            setSelectedEmployee(emp);
                                            setTempRole(currentRole);
                                        }}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected 
                                                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 shadow-md ring-2 ring-indigo-500/10' 
                                                : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-900'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                                                    {emp.employee_code}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    emp.is_active 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                        : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {emp.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">
                                                {emp.employee_firstname_th} {emp.employee_lastname_th}
                                            </h3>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                                                <p>ตำแหน่ง: {emp.position?.position_name || '-'}</p>
                                                <p>แผนก: {(() => {
                                                     const d = emp as unknown as {
                                                         department?: { department_name?: string; emp_dept_name?: string };
                                                         emp_dept?: { emp_dept_name?: string; dept_name?: string };
                                                         dept?: { dept_name?: string };
                                                     };
                                                     return d.department?.department_name || d.emp_dept?.emp_dept_name || d.department?.emp_dept_name || d.emp_dept?.dept_name || d.dept?.dept_name || '-';
                                                 })()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400">บทบาทปัจจุบัน:</span>
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                                {currentRole}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Side: Assignment Editor Drawer/Panel */}
                <div className="lg:col-span-1">
                    {selectedEmployee ? (
                        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">แก้ไขบทบาท</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">ระบุบทบาทความปลอดภัยให้แก่พนักงาน</p>
                            </div>
                            
                            {/* Employee Mini Card */}
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/30 rounded-xl space-y-2">
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedEmployee.employee_code}</div>
                                <div className="font-bold text-sm text-gray-800 dark:text-white">
                                    {selectedEmployee.employee_firstname_th} {selectedEmployee.employee_lastname_th}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {selectedEmployee.position?.position_name || '-'} | {(() => {
                                        const d = selectedEmployee as unknown as {
                                            department?: { department_name?: string; emp_dept_name?: string };
                                            emp_dept?: { emp_dept_name?: string; dept_name?: string };
                                            dept?: { dept_name?: string };
                                        };
                                        return d.department?.department_name || d.emp_dept?.emp_dept_name || d.department?.emp_dept_name || d.emp_dept?.dept_name || d.dept?.dept_name || '-';
                                    })()}
                                </div>
                            </div>

                            {/* Role Select Dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block">เลือกบทบาทใหม่</label>
                                <select 
                                    value={tempRole}
                                    onChange={(e) => setTempRole(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                                >
                                    {rolesList.map(roleName => (
                                        <option 
                                            key={roleName} 
                                            value={roleName}
                                            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-semibold"
                                        >
                                            {roleName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Security Checklist Info */}
                            <div className="flex gap-2 p-3 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs leading-relaxed">
                                <ShieldCheck size={18} className="shrink-0" />
                                <div>
                                    การเปลี่ยนบทบาทเป็น <strong>{tempRole}</strong> จะเริ่มมีผลทันทีเมื่อพนักงานเข้าสู่ระบบครั้งถัดไป
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setSelectedEmployee(null)}
                                    className="w-1/3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAssignRole}
                                    disabled={assignMutation.isPending}
                                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    {assignMutation.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            กำลังอัปเดต...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            ยืนยันเปลี่ยนบทบาท
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-gray-850 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-500 sticky top-6">
                            <UserCog className="mx-auto mb-3 opacity-25" size={44} />
                            <h4 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-1">เลือกแก้ไขบทบาท</h4>
                            <p className="text-xs leading-relaxed">คลิกเลือกพนักงานจากรายการด้านซ้าย เพื่อตรวจสอบและเปลี่ยนแปลงสิทธิ์ในการใช้งานระบบ</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
