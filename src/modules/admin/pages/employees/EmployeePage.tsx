import React, { useState, useEffect } from 'react';
import { Plus, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { EmployeeFormModal } from '@/modules/master-data/company/pages/employee/EmployeeFormModal';
import { EmployeeService } from '@/modules/master-data';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';
import { logger } from '@/shared/utils/logger';

export const EmployeePage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Moved fetch logic inside useEffect or useCallback to ensure stability
  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EmployeeService.getAll();
      logger.info('[EmployeePage] Data received:', data);
      setEmployees(data || []);
    } catch (err) {
      logger.error('Error fetching employees:', err);
      setError('ไม่สามารถดึงข้อมูลพนักงานได้ (Unable to fetch employees)');
    } finally {
      setIsLoading(false);
    }
  };

  // STRICT RULE: Empty dependency array [] triggers this ONLY ONCE on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRefreshList = () => {
    fetchEmployees();
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600" />
            Employee Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your organization's employees
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
            <button 
                onClick={handleRefreshList}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh"
            >
            <RefreshCw size={20} />
            </button>
            <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
            <Plus size={18} />
            Create New Employee
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-10 text-center text-gray-500">
             <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
             <p>Loading employees...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 bg-red-50 text-red-700 flex flex-col items-center gap-2">
             <AlertCircle size={32} />
             <p className="font-bold">{error}</p>
             <button onClick={fetchEmployees} className="text-sm underline hover:text-red-900">Try Again</button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
           <div className="p-10 text-center text-gray-500">
             <Users size={48} className="mx-auto mb-3 text-gray-300" />
             <p>No employees found.</p>
           </div>
        )}

        {/* Table - Success State */}
        {!isLoading && !error && employees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm uppercas border-b border-gray-200 dark:border-gray-600">
                  <th className="p-4 font-semibold">Code</th>
                  <th className="p-4 font-semibold">Full Name (TH)</th>
                  <th className="p-4 font-semibold">Position</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Branch</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((emp, index) => (
                  <tr key={emp.id || emp.employee_code || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-700 dark:text-gray-300">
                    <td className="p-4 font-medium text-blue-600">{emp.employee_code}</td>
                    <td className="p-4">{emp.employee_firstname_th} {emp.employee_lastname_th}</td>
                    <td className="p-4">{emp.position?.position_name || '-'}</td>
                    <td className="p-4">{emp.department?.department_name || '-'}</td>
                    <td className="p-4">{emp.branch?.branch_name || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.is_active 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Employee Modal - Standardized */}
      <EmployeeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefreshList}
      />
    </div>
  );
};
