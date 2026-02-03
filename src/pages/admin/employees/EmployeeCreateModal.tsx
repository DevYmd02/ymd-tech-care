import React, { useState } from 'react';
import { X, Save, UserPlus, MapPin, Building, User } from 'lucide-react';
import type { IEmployeeCreateRequest, IEmployeeAddress } from '@/interfaces/IEmployee';
import { EmployeeService } from '@/services/core/employee.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const initialAddress: IEmployeeAddress = {
  address_type: '',
  address: '',
  district: '',
  province: '',
  postal_code: '',
  country: 'Thailand',
  contact_person: '',
};

const initialFormData: Omit<IEmployeeCreateRequest, 'addresses'> = {
  branch_id: 1, 
  employee_code: '',
  employee_title_th: '',
  employee_title_en: '',
  employee_firstname_th: '',
  employee_lastname_th: '',
  employee_firstname_en: '',
  employee_lastname_en: '',
  employee_fullname: '',
  employee_startdate: new Date().toISOString().split('T')[0],
  employee_status: 'active',
  phone: '',
  email: '',
  remark: '',
  tax_id: '',
  emp_type: false,
  position_id: 1, // Default to 1
  department_id: 1, // Default to 1
  is_active: true,
  manager_employee_id: null,
};

export const EmployeeCreateModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  // Separate states for addresses
  const [contactAddr, setContactAddr] = useState<IEmployeeAddress>({
    ...initialAddress,
    address_type: 'CONTACT',
  });

  const [regAddr, setRegAddr] = useState<IEmployeeAddress>({
    ...initialAddress,
    address_type: 'REGISTERED',
  });

  // Main Form Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Address Address Handler Wrapper
  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<IEmployeeAddress>>
  ) => {
    const { name, value } = e.target;
    setter((prev: IEmployeeAddress) => ({ ...prev, [name]: value }));
  };

  // Submit Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);

    const payload: IEmployeeCreateRequest = {
      ...formData,
      addresses: [contactAddr, regAddr],
    };

    try {
      await EmployeeService.createEmployee(payload);
      alert('สร้างพนักงานสำเร็จ');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('เกิดข้อผิดพลาดในการสร้างพนักงาน');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Reusable Address Input Section
  const renderAddressInputs = (
    title: string,
    addrState: IEmployeeAddress,
    setter: React.Dispatch<React.SetStateAction<IEmployeeAddress>>
  ) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <MapPin size={16} className="text-blue-500" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">ที่อยู่ (Address)</label>
          <input
            type="text"
            name="address"
            value={addrState.address}
            onChange={(e) => handleAddressChange(e, setter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g. 123/45 ถนนสุขุมวิท"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">แขวง/ตำบล (Sub-district)</label>
          <input
            type="text"
            name="district"
            value={addrState.district}
            onChange={(e) => handleAddressChange(e, setter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">เขต/อำเภอ (District) - จังหวัด (Province)</label>
          <input
            type="text"
            name="province"
            value={addrState.province}
            onChange={(e) => handleAddressChange(e, setter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">รหัสไปรษณีย์ (Postal Code)</label>
          <input
            type="text"
            name="postal_code"
            value={addrState.postal_code}
            onChange={(e) => handleAddressChange(e, setter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">บุคคลที่ติดต่อได้ (Contact Person)</label>
          <input
            type="text"
            name="contact_person"
            value={addrState.contact_person}
            onChange={(e) => handleAddressChange(e, setter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <UserPlus size={24} />
            <h2 className="text-lg font-bold">Create New Employee</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Information Section */}
            <div className="space-y-4">
              <h3 className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <User size={16} />
                General Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสพนักงาน (Employee Code)</label>
                  <input
                    name="employee_code"
                    value={formData.employee_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="EMP-XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">สาขา (Branch)</label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value={1}>Head Office</option>
                    <option value={2}>Branch 1</option>
                  </select>
                </div>

                {/* Row 2: Thai Names */}
                <div className="flex gap-2">
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">คำนำหน้า (TH)</label>
                        <input name="employee_title_th" value={formData.employee_title_th} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" placeholder="นาย/นาง" />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อ (TH)</label>
                        <input name="employee_firstname_th" value={formData.employee_firstname_th} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">นามสกุล (TH)</label>
                        <input name="employee_lastname_th" value={formData.employee_lastname_th} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                    </div>
                </div>

                {/* Row 3: English Names */}
                <div className="flex gap-2">
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Title (EN)</label>
                        <input name="employee_title_en" value={formData.employee_title_en} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" placeholder="Mr./Mrs." />
                    </div>
                     <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Firstname (EN)</label>
                        <input name="employee_firstname_en" value={formData.employee_firstname_en} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Lastname (EN)</label>
                        <input name="employee_lastname_en" value={formData.employee_lastname_en} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                    </div>
                </div>

                {/* Row 4 */}
                <div>
                   <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">อีเมล (Email)</label>
                   <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">เบอร์โทรศัพท์ (Phone)</label>
                   <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                </div>

                {/* Status & Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">วันที่เริ่มงาน (Start Date)</label>
                  <input type="date" name="employee_startdate" value={formData.employee_startdate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">สถานะ (Status)</label>
                  <select name="employee_status" value={formData.employee_status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Building size={16} />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderAddressInputs('ที่อยู่ติดต่อ (Contact Address)', contactAddr, setContactAddr)}
                {renderAddressInputs('ที่อยู่ตามทะเบียน (Registered Address)', regAddr, setRegAddr)}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};
