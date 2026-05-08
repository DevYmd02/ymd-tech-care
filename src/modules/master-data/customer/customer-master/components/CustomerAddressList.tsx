import { useFormContext, type FieldArrayWithId } from 'react-hook-form';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerSchemaType } from '@customer/customer-master/types/customer-schema';

interface CustomerAddressListProps {
    addressFields: FieldArrayWithId<CustomerSchemaType, 'addresses', 'id'>[];
    addAddress: () => void;
    removeAddress: (index: number) => void;
}

export function CustomerAddressList({ 
    addressFields, 
    addAddress, 
    removeAddress, 
}: CustomerAddressListProps) {
    const { register, formState: { errors } } = useFormContext<CustomerSchemaType>();

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <MapPin size={20} />
                    <h3 className="font-semibold text-lg">ข้อมูลที่อยู่</h3>
                </div>
                <button 
                    type="button" 
                    onClick={addAddress}
                    className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                    <Plus size={16} /> บันทึกที่อยู่เพิ่ม
                </button>
            </div>

            <div className="space-y-4">
                {addressFields.map((field, index) => (
                    <div key={field.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                        {index > 1 && (
                            <button 
                                type="button"
                                onClick={() => removeAddress(index)}
                                className="absolute top-4 right-4 text-red-500 hover:text-red-600"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                {field.addressType === 'REGISTERED' ? 'ที่อยู่ตามทะเบียนภาษี' : field.addressType === 'CONTACT' ? 'ที่อยู่ติดต่อ' : 'ที่อยู่จัดส่ง'}
                            </span>
                            {field.addressType === 'CONTACT' && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                    <input 
                                        type="checkbox" 
                                        {...register('same_as_registered')}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-500 italic">เหมือนกับที่อยู่ตามทะเบียน</span>
                                </label>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="md:col-span-2 lg:col-span-3 space-y-1">
                                <label className={styles.label}>ที่อยู่ (เลขที่, อาคาร, ถนน) <span className="text-red-500">*</span></label>
                                <textarea 
                                    {...register(`addresses.${index}.address` as const)}
                                    className={`${styles.textarea} h-20 ${errors.addresses?.[index]?.address ? 'border-red-500' : ''}`}
                                    placeholder="กรอกข้อมูลที่อยู่..."
                                />
                                {errors.addresses?.[index]?.address && <p className="text-xs text-red-500">{errors.addresses[index].address?.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ตำบล/แขวง</label>
                                <input 
                                    {...register(`addresses.${index}.subDistrict` as const)}
                                    className={styles.input}
                                    placeholder="กรอกตำบล"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>อำเภอ/เขต <span className="text-red-500">*</span></label>
                                <input 
                                    {...register(`addresses.${index}.district` as const)}
                                    className={`${styles.input} ${errors.addresses?.[index]?.district ? 'border-red-500' : ''}`}
                                    placeholder="กรอกอำเภอ"
                                />
                                {errors.addresses?.[index]?.district && <p className="text-xs text-red-500">{errors.addresses[index].district?.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                <input 
                                    {...register(`addresses.${index}.province` as const)}
                                    className={`${styles.input} ${errors.addresses?.[index]?.province ? 'border-red-500' : ''}`}
                                    placeholder="กรอกจังหวัด"
                                />
                                {errors.addresses?.[index]?.province && <p className="text-xs text-red-500">{errors.addresses[index].province?.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                <input 
                                    {...register(`addresses.${index}.postalCode` as const)}
                                    className={`${styles.input} ${errors.addresses?.[index]?.postalCode ? 'border-red-500' : ''}`}
                                    placeholder="XXXXX"
                                />
                                {errors.addresses?.[index]?.postalCode && <p className="text-xs text-red-500">{errors.addresses[index].postalCode?.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ผู้ติดต่อ (เฉพาะที่อยู่นี้)</label>
                                <input 
                                    {...register(`addresses.${index}.contactPerson` as const)}
                                    className={styles.input}
                                    placeholder="ชื่อผู้ติดต่อ..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>อีเมล (เฉพาะที่อยู่นี้)</label>
                                <input 
                                    type="email"
                                    {...register(`addresses.${index}.email` as const)}
                                    className={`${styles.input} ${errors.addresses?.[index]?.email ? 'border-red-500' : ''}`}
                                    placeholder="email@example.com"
                                />
                                {errors.addresses?.[index]?.email && <p className="text-xs text-red-500">{errors.addresses[index].email?.message}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
