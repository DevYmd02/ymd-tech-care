/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับ เพิ่ม/แก้ไข ข้อมูล Vendor (UI Refactor)
 * @purpose ใช้สำหรับ Quick Edit หรือ Add New จากหน้า Dashboard
 * @design Vertical layout with grouped sections (General, Contact, Address, Payment, Bank, etc.)
 */

import { 
    X, 
    Save, 
    History
} from 'lucide-react';
import type { 
    VendorMaster
} from '@project-types/vendor-types';

import { SystemAlert } from '@components/ui/SystemAlert';

import { VendorGeneralInfo } from './components/VendorGeneralInfo';
import { VendorContactInfo } from './components/VendorContactInfo';
import { VendorAddressList } from './components/VendorAddressList';
import { VendorBankInfo } from './components/VendorBankInfo';
import { VendorAdditionalContacts } from './components/VendorAdditionalContacts';
import { VendorPaymentConditions } from './components/VendorPaymentConditions';
import { VendorRemarks } from './components/VendorRemarks';

import { useVendorForm } from '@hooks/useVendorForm';


interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string; // If provided, edit mode
    initialData?: VendorMaster | null; // Pre-filled data for edit mode
    onSuccess?: () => void;
    predictedVendorId?: string; // For Add Mode: Suggested ID
}

export function VendorFormModal(props: VendorFormModalProps) {
    const { isOpen, onClose, initialData, vendorId } = props;
    const isEdit = !!vendorId || !!initialData;
    
    const {
        formData,
        errors,
        isLoading,
        isSubmitting,
        headerTitle,
        showConfirmModal,
        setShowConfirmModal,
        handleChange,
        addBankAccount,
        removeBankAccount,
        updateBankAccount,
        addContactPerson,
        removeContactPerson,
        updateContactPerson,
        addAddress,
        removeAddress,
        updateAddress,
        handleSameAsRegisteredChange,
        handleCreditLimitChange,
        handleSubmit,
        handleConfirmSave,
        systemAlert,
        setSystemAlert
    } = useVendorForm(props);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            
            {/* Validation Feedback Toast */}
            {systemAlert && (
                <SystemAlert
                    message={systemAlert.message}
                    onClose={() => setSystemAlert(null)}
                    duration={5000}
                />
            )}

            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            {headerTitle}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            กรอกข้อมูลเจ้าหนี้/ซัพพลายเออร์
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <form id="vendor-form" onSubmit={handleSubmit} className="space-y-8">
                            
                            <VendorGeneralInfo 
                                formData={formData} 
                                onChange={handleChange} 
                                errors={errors}
                            />

                            <VendorContactInfo 
                                formData={formData} 
                                onChange={handleChange} 
                                errors={errors}
                            />

                            <VendorAddressList 
                                formData={formData}
                                errors={errors}
                                addAddress={addAddress}
                                removeAddress={removeAddress}
                                updateAddress={updateAddress}
                                handleSameAsRegisteredChange={handleSameAsRegisteredChange}
                            />

                            <VendorPaymentConditions 
                                formData={formData}
                                onChange={handleChange}
                                onCreditLimitChange={handleCreditLimitChange}
                                errors={errors}
                            />

                            <VendorBankInfo 
                                formData={formData}
                                addBankAccount={addBankAccount}
                                removeBankAccount={removeBankAccount}
                                updateBankAccount={updateBankAccount}
                                errors={errors}
                            />

                            <VendorAdditionalContacts 
                                formData={formData}
                                addContactPerson={addContactPerson}
                                removeContactPerson={removeContactPerson}
                                updateContactPerson={updateContactPerson}
                                errors={errors}
                            />

                            <VendorRemarks 
                                formData={formData}
                                onChange={handleChange}
                                errors={errors}
                            />

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-10 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                    >
                        ยกเลิก
                    </button>
                    
                    {/* Last Modified Footer (Edit Mode Only) */}
                    {initialData && (
                         <div className="mr-auto flex items-center gap-2 text-xs text-gray-400 italic">
                            <History size={14} />
                            <span>
                                แก้ไขล่าสุด: {new Date(initialData.updated_at).toLocaleString('th-TH', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })} โดย {initialData.updated_by || 'Unknown'}
                            </span>
                        </div>
                    )}

                    <button 
                        type="submit"
                        form="vendor-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-2"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึก')}
                    </button>
                </div>

            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Save size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {isEdit ? 'ยืนยันการแก้ไข' : 'ยืนยันการบันทึก'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {isEdit ? 'คุณต้องการบันทึกการแก้ไขข้อมูลเจ้าหนี้ใช่หรือไม่?' : 'คุณต้องการบันทึกข้อมูลเจ้าหนี้ใช่หรือไม่?'}
                            </p>
                            <div className="flex items-center gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSave}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        isEdit ? 'ยืนยันการแก้ไข' : 'ยืนยัน'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
