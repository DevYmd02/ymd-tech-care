import React from 'react';
import { User, Plus, Trash2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { VendorFormData, VendorContactPerson } from '@/modules/master-data/vendor/types/vendor-types';

interface VendorAdditionalContactsProps {
    formData: VendorFormData;
    addContactPerson: () => void;
    removeContactPerson: (id: string) => void;
    updateContactPerson: (id: string, field: keyof VendorContactPerson, value: string | boolean) => void;
    errors: { [key: string]: string };
}

export const VendorAdditionalContacts: React.FC<VendorAdditionalContactsProps> = ({
    formData,
    addContactPerson,
    removeContactPerson,
    updateContactPerson,
    errors
}) => {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <User size={20} />
                    <h3 className="font-semibold text-lg">ผู้ติดต่อเพิ่มเติม</h3>
                </div>
                <button 
                    type="button" 
                    onClick={addContactPerson}
                    className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <Plus size={16} /> เพิ่มผู้ติดต่อ
                </button>
            </div>
            
            <div className="space-y-4">
                {formData.additionalContacts.map((contact, index) => (
                    <div key={contact.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 block">ผู้ติดต่อที่ {index + 1}</h4>
                        
                        <button 
                            type="button"
                            onClick={() => removeContactPerson(contact.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={styles.label}>ชื่อผู้ติดต่อ</label>
                                <input 
                                    name={`additionalContacts[${index}].name`}
                                    value={contact.name} 
                                    onChange={(e) => updateContactPerson(contact.id, 'name', e.target.value)} 
                                    className={`${styles.input} ${errors[`additionalContacts[${index}].name`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                />
                                {errors[`additionalContacts[${index}].name`] && <p className="text-red-500 text-xs mt-1">{errors[`additionalContacts[${index}].name`]}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ตำแหน่ง</label>
                                <input 
                                    name={`additionalContacts[${index}].position`}
                                    value={contact.position} 
                                    onChange={(e) => updateContactPerson(contact.id, 'position', e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>โทรศัพท์</label>
                                <input 
                                    name={`additionalContacts[${index}].phone`}
                                    value={contact.phone} 
                                    onChange={(e) => updateContactPerson(contact.id, 'phone', e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>มือถือ</label>
                                <input 
                                    name={`additionalContacts[${index}].mobile`}
                                    value={contact.mobile} 
                                    onChange={(e) => updateContactPerson(contact.id, 'mobile', e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className={styles.label}>อีเมล</label>
                                <input 
                                    name={`additionalContacts[${index}].email`}
                                    value={contact.email} 
                                    onChange={(e) => updateContactPerson(contact.id, 'email', e.target.value)} 
                                    className={`${styles.input} ${errors[`additionalContacts[${index}].email`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                />
                                {errors[`additionalContacts[${index}].email`] && <p className="text-red-500 text-xs mt-1">{errors[`additionalContacts[${index}].email`]}</p>}
                            </div>
                        </div>
                        <div className="mt-3">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={contact.isMain}
                                    onChange={(e) => updateContactPerson(contact.id, 'isMain', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ตั้งเป็นผู้ติดต่อหลัก</span>
                            </label>
                        </div>
                    </div>
                ))}
                {formData.additionalContacts.length === 0 && (
                    <div className="text-center py-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500">
                        ไม่มีผู้ติดต่อเพิ่มเติม
                    </div>
                )}
            </div>
        </section>
    );
};
