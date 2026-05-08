import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Users } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerSchemaType } from '@customer/customer-master/types/customer-schema';

import { BusinessTypeService } from '@customer/business-type/services/business-type.service';
import { CustomerTypeService } from '@customer/customer-type/services/customer-type.service';
import { CustomerGroupService } from '@customer/customer-group/services/customer-group.service';
import { BillingGroupService } from '@customer/billing-group/services/billing-group.service';

import type { CustomerBusinessType } from '@customer/business-type/types/business-type.types';
import type { CustomerType } from '@customer/customer-type/types/customer-type.types';
import type { CustomerGroup } from '@customer/customer-group/types/customer-group.types';
import type { CustomerBillingGroup } from '@customer/billing-group/types/billing-group.types';
import { logger } from '@/shared/utils';

export function CustomerGeneralInfo() {
    const { register, formState: { errors } } = useFormContext<CustomerSchemaType>();
    const [businessTypes, setBusinessTypes] = useState<CustomerBusinessType[]>([]);
    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
    const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
    const [billingGroups, setBillingGroups] = useState<CustomerBillingGroup[]>([]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [bTypes, cTypes, cGroups, bGroups] = await Promise.all([
                    BusinessTypeService.getList(),
                    CustomerTypeService.getList(),
                    CustomerGroupService.getList(),
                    BillingGroupService.getList()
                ]);
                setBusinessTypes(bTypes.data || []);
                setCustomerTypes(cTypes.data || []);
                setCustomerGroups(cGroups.data || []);
                setBillingGroups(bGroups.data || []);
            } catch (error) {
                logger.error("Failed to fetch customer dropdown data", error);
            }
        };
        fetchDropdownData();
    }, []);

    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Users size={20} />
                <h3 className="font-semibold text-lg">ข้อมูลทั่วไป</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Customer Code & Tax ID */}
                <div className="space-y-1">
                    <label className={styles.label}>รหัสลูกค้า <span className="text-red-500">*</span></label>
                    <input 
                        {...register('customer_code')}
                        className={`${styles.input} ${errors.customer_code ? 'border-red-500' : ''}`}
                        placeholder="เช่น CUST-0001" 
                    />
                    {errors.customer_code && <p className="text-xs text-red-500">{errors.customer_code.message}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เลขประจำตัวผู้เสียภาษี</label>
                    <input 
                        {...register('tax_id')}
                        className={styles.input} 
                        placeholder="13 digits" 
                    />
                </div>

                {/* Name TH & EN */}
                <div className="space-y-1 md:col-span-2">
                    <label className={styles.label}>ชื่อลูกค้า (ไทย) <span className="text-red-500">*</span></label>
                    <input 
                        {...register('customer_name_th')}
                        className={`${styles.input} ${errors.customer_name_th ? 'border-red-500' : ''}`} 
                        placeholder="บริษัท เอบีซี จำกัด" 
                    />
                    {errors.customer_name_th && <p className="text-xs text-red-500">{errors.customer_name_th.message}</p>}
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className={styles.label}>ชื่อลูกค้า (อังกฤษ)</label>
                    <input 
                        {...register('customer_name_en')}
                        className={styles.input} 
                        placeholder="ABC Company Limited" 
                    />
                </div>

                {/* Dropdowns for Groups & Types */}
                <div className="space-y-1">
                    <label className={styles.label}>ประเภทธุรกิจลูกหนี้</label>
                    <select 
                        {...register('business_type_id')}
                        className={styles.input}
                    >
                        <option value="">-- เลือก --</option>
                        {businessTypes.map(item => (
                            <option key={item.business_type_id} value={item.business_type_id}>
                                {item.business_type_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>ประเภทลูกหนี้ <span className="text-red-500">*</span></label>
                    <select 
                        {...register('customer_type_id')}
                        className={`${styles.input} ${errors.customer_type_id ? 'border-red-500' : ''}`}
                    >
                        <option value="">-- เลือก --</option>
                        {customerTypes.map(item => (
                            <option key={item.customer_type_id} value={item.customer_type_id}>
                                {item.customer_type_name}
                            </option>
                        ))}
                    </select>
                    {errors.customer_type_id && <p className="text-xs text-red-500">{errors.customer_type_id.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>กลุ่มลูกหนี้ <span className="text-red-500">*</span></label>
                    <select 
                        {...register('customer_group_id')}
                        className={`${styles.input} ${errors.customer_group_id ? 'border-red-500' : ''}`}
                    >
                        <option value="">-- เลือก --</option>
                        {customerGroups.map(item => (
                            <option key={item.customer_group_id} value={item.customer_group_id}>
                                {item.customer_group_name}
                            </option>
                        ))}
                    </select>
                    {errors.customer_group_id && <p className="text-xs text-red-500">{errors.customer_group_id.message}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>กลุ่มวางบิล</label>
                    <select 
                        {...register('billing_group_id')}
                        className={styles.input}
                    >
                        <option value="">-- เลือก --</option>
                        {billingGroups.map(item => (
                            <option key={item.bill_group_id} value={item.bill_group_id}>
                                {item.bill_group_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                {...register('vat_registered')}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                            จดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registered)
                        </span>
                    </label>
                </div>
            </div>
        </section>
    );
}

