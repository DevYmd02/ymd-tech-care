/**
 * @file ItemMasterForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลสินค้าและบริการ (Item Master Data)
 * @route /master-data/item
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Search, Save, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { logger } from '@utils/logger';
import { ItemMasterService } from '@/services/ItemMasterService'; // Added Service Import
import type { ItemMasterFormData } from '@project-types/master-data-types';
import { initialItemMasterFormData } from '@project-types/master-data-types';

import { 
    MOCK_CATEGORIES,
    MOCK_GROUPS,
    MOCK_BRANDS, 
    MOCK_PATTERNS, 
    MOCK_DESIGNS, 
    MOCK_SIZES, 
    MOCK_MODELS, 
    MOCK_GRADES, 
    MOCK_COLORS,
    MOCK_TYPES,
    MOCK_UOMS,
    MOCK_TAX_CODES,
    MOCK_NATURES,
    MOCK_COSTING_METHODS,
    MOCK_PRODUCT_SUBTYPES,
    MOCK_COMMISSIONS,
    getName 
} from './__mocks__/item-master-options.mock';

export default function ItemMasterForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const [formData, setFormData] = useState<ItemMasterFormData>(initialItemMasterFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Load mock data if editing
    useEffect(() => {
        if (editId) {
            const loadData = async () => {
                const existing = await ItemMasterService.getById(editId);
                if (existing) {
                    // Reverse Lookup for Dropdowns (Name -> ID)
                    const categoryId = MOCK_CATEGORIES.find(c => (existing.category_name || '').includes(c.name))?.id || '';
                    const unitName = (existing.unit_name || '').split(' (')[0];
                    const unitId = MOCK_UOMS.find(u => u.name === unitName)?.id || '';

                    setFormData({
                        ...initialItemMasterFormData,
                        item_code: existing.item_code,
                        item_name: existing.item_name,
                        item_name_en: existing.item_name_en || '',
                        marketing_name: existing.marketing_name || '',
                        billing_name: existing.billing_name || '',
                        category_id: categoryId,
                        base_uom_id: unitId,
                        item_type_code: existing.item_type_code || 'FG',
                        product_subtype_id: 'NORMAL',
                        costing_method: '',
                        commission_type: 'NONE',
                        nature_id: 'LOT',
                        is_active: existing.is_active,
                        std_amount: existing.standard_cost || 0,
                        good_brand_id: '',
                        good_class_id: '',
                        good_pattern_id: '',
                        good_design_id: '',
                        good_grade_id: '',
                        good_model_id: '',
                        good_size_id: '',
                        good_color_id: '',
                        default_tax_code: 'VAT7',
                        tax_rate: 7,
                        barcode: '',
                        discount_amount: '',
                        is_buddy: false,
                        is_on_hold: false
                    });
                }
            };
            loadData();
        }
    }, [editId]);

    const handleInputChange = (field: keyof ItemMasterFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // 1. Validation
        if (!formData.item_code.trim() || !formData.item_name.trim()) {
            setSaveError('กรุณากรอกรหัสและชื่อสินค้า');
            setTimeout(() => setSaveError(null), 3000);
            return;
        }

        // 2. Confirmation
        const result = await Swal.fire({
            title: editId ? 'ยืนยันการแก้ไข?' : 'ยืนยันการบันทึก?',
            text: editId ? 'ข้อมูลสินค้าจะถูกแก้ไขในระบบ' : 'ข้อมูลสินค้าจะถูกบันทึกในระบบ',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: editId ? 'บันทึกการแก้ไข (Update)' : 'บันทึก (Save)',
            cancelButtonText: 'ยกเลิก (Cancel)',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            background: '#1f2937',
            color: '#ffffff'
        });

        if (!result.isConfirmed) {
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Logic moved to Service (ItemMasterService)
            if (editId) {
                await ItemMasterService.update(editId, formData);
            } else {
                await ItemMasterService.create(formData);
            }
            
            logger.info('Save item data success via Service:', formData);
            
            // 4. Success Alert & Navigate
            await Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ!',
                text: 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false,
                background: '#1f2937',
                color: '#ffffff'
            });
            
            navigate('/master-data?tab=item');

        } catch (error) {
            console.error(error);
            setSaveError('เกิดข้อผิดพลาดในการบันทึก');
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                background: '#1f2937',
                color: '#ffffff'
            });
        } finally {
            setIsSaving(false);
        }
    };



    const handleFind = () => {
        const newId = prompt("Enter Item Code/ID to switch to:");
        if (newId) {
            navigate(`/master-data/item-form?id=${newId}`);
        }
    };

    return (
        <div className="p-2 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Header - Compact */}
            <div className="flex items-center justify-between gap-4 mb-1 bg-blue-600 px-3 py-1.5 rounded-xl shadow-lg shadow-blue-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                        <Package className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            {editId ? `Edit: ${formData.item_code}` : 'กำหนดรหัสสินค้าและบริการ (Item Master)'}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/master-data?tab=item')} 
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all" 
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                
                {/* 1. Header Section - Primary Identifiers (Compact) */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Item Code */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">รหัสสินค้า *</label>
                            <div className="relative flex items-center">
                                {/* Only show input content, Search icon is conditional or inside button */}
                                <input 
                                    type="text" 
                                    value={formData.item_code} 
                                    onChange={(e) => handleInputChange('item_code', e.target.value)} 
                                    readOnly={!!editId}
                                    className={`w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${editId ? 'pr-9' : ''} ${editId ? 'cursor-not-allowed opacity-90' : ''}`}
                                    placeholder="ITEM-001"
                                />
                                {editId && (
                                    <button 
                                        type="button"
                                        onClick={handleFind} 
                                        className="absolute right-0 top-0 bottom-0 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-r border border-blue-600 transition-colors flex items-center justify-center"
                                        title="Find Item"
                                    >
                                        <Search size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Item Name TH */}
                        <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อสินค้า (ไทย) *</label>
                            <input 
                                type="text" 
                                value={formData.item_name} 
                                onChange={(e) => handleInputChange('item_name', e.target.value)} 
                                className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="ระบุชื่อสินค้าภาษาไทย"
                            />
                        </div>

                        {/* Item Name EN */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อสินค้า (Eng)</label>
                            <input 
                                value={formData.item_name_en} 
                                onChange={(e) => handleInputChange('item_name_en', e.target.value)} 
                                className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter Item Name in English"
                            />
                        </div>

                        {/* Row 2: Marketing Name & Billing Name */}
                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                            {/* Marketing Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อทางการตลาด (Marketing Name)</label>
                                <input 
                                    type="text" 
                                    value={formData.marketing_name} 
                                    onChange={(e) => handleInputChange('marketing_name', e.target.value)} 
                                    className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Marketing Name"
                                />
                            </div>

                            {/* Billing Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อในการออกบิล (Billing Name)</label>
                                <input 
                                    type="text" 
                                    value={formData.billing_name} 
                                    onChange={(e) => handleInputChange('billing_name', e.target.value)} 
                                    className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Billing Name"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Details Section - 3 Column Grid (Compact) */}
                <div className="p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        
                        {/* Column 1: Attributes (Span 4) */}
                        <div className="lg:col-span-4 space-y-2">
                            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Attributes (คุณสมบัติ)</h3>
                            
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ประเภทสินค้า (Item Type)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.item_type_code} 
                                            onChange={(e) => handleInputChange('item_type_code', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_TYPES.map(t => (
                                                <option key={t.id} value={t.code}>{t.code}</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.item_type_code, MOCK_TYPES, 'code', 'name')}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">หมวดสินค้า</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.category_id} 
                                            onChange={(e) => handleInputChange('category_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_CATEGORIES.map(c => (
                                                <option key={c.id} value={c.id}>{c.code}</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.category_id, MOCK_CATEGORIES)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">กลุ่มสินค้า (Good Group)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_class_id} 
                                            onChange={(e) => handleInputChange('good_class_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_GROUPS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_class_id, MOCK_GROUPS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ยี่ห้อสินค้า (Brand)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_brand_id} 
                                            onChange={(e) => handleInputChange('good_brand_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_BRANDS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_brand_id, MOCK_BRANDS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Stacked vertically instead of 2-cols for split layout consistency */}
                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รูปแบบ (Pattern)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_pattern_id} 
                                            onChange={(e) => handleInputChange('good_pattern_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_PATTERNS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_pattern_id, MOCK_PATTERNS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">การออกแบบ (Design)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_design_id} 
                                            onChange={(e) => handleInputChange('good_design_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_DESIGNS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_design_id, MOCK_DESIGNS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">เกรด (Grade)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_grade_id || ''} 
                                            onChange={(e) => handleInputChange('good_grade_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_GRADES.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_grade_id || '', MOCK_GRADES)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รุ่น (Model)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_model_id || ''} 
                                            onChange={(e) => handleInputChange('good_model_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_MODELS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_model_id || '', MOCK_MODELS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ขนาด (Size)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_size_id} 
                                            onChange={(e) => handleInputChange('good_size_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_SIZES.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_size_id, MOCK_SIZES)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">สี (Color)</label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={formData.good_color_id || ''} 
                                            onChange={(e) => handleInputChange('good_color_id', e.target.value)} 
                                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- เลือก --</option>
                                            {MOCK_COLORS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                                        </select>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={getName(formData.good_color_id || '', MOCK_COLORS)}
                                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Stock & Cost (Span 4) */}
                        <div className="lg:col-span-4 space-y-2">
                            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Stock & Costing</h3>
                            
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">หน่วยนับหลัก (Main UOM) *</label>
                                    <select 
                                        value={formData.base_uom_id} 
                                        onChange={(e) => handleInputChange('base_uom_id', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {MOCK_UOMS.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รายการกลุ่มสินค้า (Product Subtype)</label>
                                    <select 
                                        value={formData.product_subtype_id || ''} 
                                        onChange={(e) => handleInputChange('product_subtype_id', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {MOCK_PRODUCT_SUBTYPES.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ลักษณะสินค้า (Nature)</label>
                                    <select 
                                        value={formData.nature_id || ''} 
                                        onChange={(e) => handleInputChange('nature_id', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {MOCK_NATURES.map(o => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">วิธีการคำนวณต้นทุน (Costing Method)</label>
                                    <select 
                                        value={formData.costing_method || ''} 
                                        onChange={(e) => handleInputChange('costing_method', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {MOCK_COSTING_METHODS.map(m => (
                                            <option key={m.id} value={m.id}>{m.id}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ค่าคอมมิชชั่น (Commission)</label>
                                    <select 
                                        value={formData.commission_type || ''} 
                                        onChange={(e) => handleInputChange('commission_type', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {MOCK_COMMISSIONS.map(o => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Financial & Status (Span 4) */}
                        <div className="lg:col-span-4 space-y-2">
                            <h3 className="text-sm font-semibold text-purple-400 border-b border-gray-700 pb-1 mb-2">Financial & Status</h3>
                            
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ประเภทภาษี (Tax Type)</label>
                                        <select 
                                            value={formData.default_tax_code} 
                                            onChange={(e) => handleInputChange('default_tax_code', e.target.value)} 
                                            className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                        >
                                            {MOCK_TAX_CODES.map(t => (
                                                <option key={t.id} value={t.code}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">อัตราภาษี (%)</label>
                                        <input 
                                            type="number" 
                                            value={formData.tax_rate ?? 7} 
                                            onChange={(e) => handleInputChange('tax_rate', Number(e.target.value))} 
                                            className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">กำหนดจำนวน (Amount)</label>
                                    <input 
                                        type="number" 
                                        value={formData.std_amount ?? 0} 
                                        onChange={(e) => handleInputChange('std_amount', Number(e.target.value))} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ส่วนลดสินค้า (Discount)</label>
                                    <input 
                                        type="text" 
                                        value={formData.discount_amount || ''} 
                                        onChange={(e) => handleInputChange('discount_amount', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">Barcode (หลัก)</label>
                                    <input 
                                        type="text" 
                                        value={formData.barcode || ''} 
                                        onChange={(e) => handleInputChange('barcode', e.target.value)} 
                                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                        placeholder="EAN/UPC"
                                    />
                                </div>
                                
                                {/* Status & Control Group (Compact) */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-2">
                                    <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Status & Control</h4>
                                    <div className="flex flex-col gap-2 h-full">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.is_buddy || false} 
                                                onChange={(e) => handleInputChange('is_buddy', e.target.checked)} 
                                                className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">Buddy (คู่ค้า)</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.is_on_hold || false} 
                                                onChange={(e) => handleInputChange('is_on_hold', e.target.checked)} 
                                                className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">On Hold (ระงับชั่วคราว)</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={!formData.is_active} 
                                                onChange={(e) => handleInputChange('is_active', !e.target.checked)} 
                                                className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">Inactive (เลิกใช้งาน)</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Compact) */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                    {saveError && <span className="text-red-500 dark:text-red-400 text-xs font-medium animate-pulse mr-auto">{saveError}</span>}
                    
                    <button onClick={() => navigate('/master-data?tab=item')} className="flex items-center gap-2 px-6 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-sm font-medium">
                        <X size={18} />
                        ยกเลิก
                    </button>
                    
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Saving...' : (editId ? 'Save Changes' : 'Save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
