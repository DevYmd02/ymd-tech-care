import React from 'react';
import { Database, Plus, Trash2 } from 'lucide-react';
import { styles, BANK_ACCOUNT_TYPES } from '@/constants';
import type { VendorFormData, VendorBankAccount } from '@project-types/vendor-types';

interface VendorBankInfoProps {
    formData: VendorFormData;
    addBankAccount: () => void;
    removeBankAccount: (id: string) => void;
    updateBankAccount: (id: string, field: keyof VendorBankAccount, value: string | boolean) => void;
    errors: { [key: string]: string };
}

export const VendorBankInfo: React.FC<VendorBankInfoProps> = ({
    formData,
    addBankAccount,
    removeBankAccount,
    updateBankAccount,
    errors
}) => {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Database size={20} />
                    <h3 className="font-semibold text-lg">บัญชีธนาคาร</h3>
                </div>
                <button 
                    type="button" 
                    onClick={addBankAccount}
                    className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <Plus size={16} /> เพิ่มบัญชี
                </button>
            </div>
            
            <div className="space-y-4">
                {formData.bankAccounts.map((account, index) => (
                    <div key={account.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 block">บัญชีที่ {index + 1}</h4>
                        
                        {/* Delete Button */}
                        <button 
                            type="button"
                            onClick={() => removeBankAccount(account.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={styles.label}>ชื่อธนาคาร</label>
                                <input 
                                    value={account.bankName} 
                                    onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)} 
                                    className={`${styles.input} ${errors[`bankAccounts[${index}].bankName`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                />
                                {errors[`bankAccounts[${index}].bankName`] && <p className="text-red-500 text-xs mt-1">{errors[`bankAccounts[${index}].bankName`]}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>สาขา</label>
                                <input 
                                    value={account.branchName} 
                                    onChange={(e) => updateBankAccount(account.id, 'branchName', e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>เลขที่บัญชี</label>
                                <input 
                                    value={account.accountNumber} 
                                    onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)} 
                                    className={`${styles.input} ${errors[`bankAccounts[${index}].accountNumber`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                />
                                {errors[`bankAccounts[${index}].accountNumber`] && <p className="text-red-500 text-xs mt-1">{errors[`bankAccounts[${index}].accountNumber`]}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ชื่อบัญชี</label>
                                <input 
                                    value={account.accountName} 
                                    onChange={(e) => updateBankAccount(account.id, 'accountName', e.target.value)} 
                                    className={`${styles.input} ${errors[`bankAccounts[${index}].accountName`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                />
                                {errors[`bankAccounts[${index}].accountName`] && <p className="text-red-500 text-xs mt-1">{errors[`bankAccounts[${index}].accountName`]}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ประเภทบัญชี</label>
                                <select 
                                    value={account.accountType} 
                                    onChange={(e) => updateBankAccount(account.id, 'accountType', e.target.value)} 
                                    className={styles.inputSelect}
                                >
                                    {BANK_ACCOUNT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>SWIFT Code</label>
                                <input 
                                    value={account.swiftCode} 
                                    onChange={(e) => updateBankAccount(account.id, 'swiftCode', e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={account.isMain}
                                    onChange={(e) => updateBankAccount(account.id, 'isMain', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ตั้งเป็นบัญชีหลัก</span>
                            </label>
                        </div>
                    </div>
                ))}
                {formData.bankAccounts.length === 0 && (
                    <div className="text-center py-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500">
                        ยังไม่มีบัญชีธนาคาร
                    </div>
                )}
            </div>
        </section>
    );
};
