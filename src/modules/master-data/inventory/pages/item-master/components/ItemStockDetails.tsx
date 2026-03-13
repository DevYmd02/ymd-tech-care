import { type FieldErrors } from 'react-hook-form';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import { 
    ITEM_COSTING_METHODS
} from '@/modules/master-data/inventory/constants/itemConstants';

import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

/**
 * @interface ItemStockDetailsProps
 * @description Strictly typed props for ItemStockDetails
 */
interface ItemStockDetailsProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
    errors: FieldErrors<ItemFormData>;
    uom?: UnitListItem[];
}

export const ItemStockDetails: React.FC<ItemStockDetailsProps> = ({
    formData,
    onChange,
    errors,
    uom = []
}) => {
    return (
        <div className="lg:col-span-4 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                Stock & Costing
            </h3>
            
            <div className="space-y-3">
                {/* UOM Section */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">หน่วยนับ (Unit of Measure)</label>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                หน่วยนับหลัก (Base UOM) *
                            </label>
                            <select 
                                value={formData.base_uom_id} 
                                onChange={(e) => onChange('base_uom_id', Number(e.target.value))} 
                                className={`w-full h-8 bg-white dark:bg-gray-700 border ${
                                    errors.base_uom_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                } rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none`}
                            >
                                <option value="">-- เลือก --</option>
                                {uom.map(u => (
                                    <option key={u.uom_id} value={u.uom_id}>{u.uom_name} ({u.uom_code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                    หน่วยนับซื้อ (Purchase)
                                </label>
                                <select 
                                    value={formData.base_uom_id || ''} 
                                    onChange={(e) => onChange('base_uom_id', Number(e.target.value))} 
                                    className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">-- เลือก --</option>
                                    {uom.map(u => (
                                        <option key={u.uom_id} value={u.uom_id}>{u.uom_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                    หน่วยนับขาย (Sale)
                                </label>
                                <select 
                                    value={formData.sale_uom_id || ''} 
                                    onChange={(e) => onChange('sale_uom_id', Number(e.target.value))} 
                                    className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">-- เลือก --</option>
                                    {uom.map(u => (
                                        <option key={u.uom_id} value={u.uom_id}>{u.uom_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-dashed border-gray-200 dark:border-gray-700" />

                {/* Stock Policy */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">นโยบายคลังสินค้า (Inventory Policy)</label>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">การตัดสต็อก (Issue Policy)</label>
                            <select 
                                value={formData.default_issue_policy || 'FIFO'} 
                                onChange={(e) => onChange('default_issue_policy', e.target.value)} 
                                className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            >
                                <option value="FIFO">FIFO (เข้าก่อนออกก่อน)</option>
                                <option value="LIFO">LIFO (เข้าหลังออกก่อน)</option>
                                <option value="FEFO">FEFO (หมดอายุก่อนออกก่อน)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">อายุการเก็บรักษา (วัน)</label>
                            <input 
                                type="number" 
                                value={formData.shelf_life_days || 0} 
                                onChange={(e) => onChange('shelf_life_days', Number(e.target.value))} 
                                className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none text-right"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Lot Control</label>
                            <select 
                                value={formData.lot_tracking_level || 'NONE'} 
                                onChange={(e) => onChange('lot_tracking_level', e.target.value)} 
                                className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            >
                                <option value="NONE">ไม่บังคับ</option>
                                <option value="OPTIONAL">ระบุหรือไม่ก็ได้</option>
                                <option value="REQUIRED">บังคับระบุ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Serial Control</label>
                            <select 
                                value={formData.serial_tracking_level || 'NONE'} 
                                onChange={(e) => onChange('serial_tracking_level', e.target.value)} 
                                className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            >
                                <option value="NONE">ไม่บังคับ</option>
                                <option value="OPTIONAL">ระบุหรือไม่ก็ได้</option>
                                <option value="REQUIRED">บังคับระบุ</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_batch_control} 
                            onChange={(e) => onChange('is_batch_control', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Batch Control</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_expiry_control} 
                            onChange={(e) => onChange('is_expiry_control', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Expiry Control</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.is_serial_control} 
                            onChange={(e) => onChange('is_serial_control', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Serial Control</span>
                    </label>
                </div>

                <hr className="border-dashed border-gray-200 dark:border-gray-700" />

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">การคำนวณต้นทุน (Costing Method)</label>
                    <select 
                        value={formData.costing_method || ''} 
                        onChange={(e) => onChange('costing_method', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_COSTING_METHODS.map(m => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
