import { useState } from 'react';
import { Save, FileText, Printer, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { QuotationHeaderForm } from './QuotationHeaderForm';
import { QuotationLineTable } from './QuotationLineTable';
import { QuotationSummary } from './QuotationSummary';
import type { QuotationFormData, QuotationLineData } from '../types/quotation.types';

interface QuotationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<QuotationFormData>;
    onSuccess?: () => void;
}

const DEFAULT_FORM_DATA: QuotationFormData = {
    sq_no: 'SQ2024-xxx',
    sq_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    lead_id: '',
    branch_id: '',
    currency_code: 'THB',
    status: 'DRAFT',
    valid_until: '',
    payment_term_days: 0,
    ship_date: '',
    tax_group_id: '',
    item_id: '',
    emp_area_id: '',
    emp_dept_id: '',
    job_id: '',
    onhold: 'N',
    remarks: '',
    sq_status: '',
    status_remark: '',
    discount_amount: 0,
    sub_total: 0,
    vat_amount: 0,
    total_amount: 0,
    lines: []
};

// ====================================================================================
// CONSTANTS
// ====================================================================================
const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export function QuotationFormModal({ isOpen, onClose, id, initialData, onSuccess }: QuotationFormModalProps) {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Header State
    const [formData, setFormData] = useState<QuotationFormData>(
        initialData ? { ...DEFAULT_FORM_DATA, ...initialData } : DEFAULT_FORM_DATA
    );

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: name === 'payment_term_days' || name === 'discount_amount' ? (parseFloat(value) || 0) : value 
        }));
    };

    const handleAddLine = () => {
        const newLine: QuotationLineData = { 
            item_id: '', 
            item_name: '', 
            qty: 0, 
            uom_id: 'PCS', 
            unit_price: 0, 
            line_discount: 0, 
            line_total: 0, 
            tax_code_id: '',
            note: '' 
        };
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    };

    const handleRemoveLine = (index: number) => {
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index)
        }));
    };

    const handleLineChange = (index: number, field: keyof QuotationLineData, value: string | number) => {
        const newLines = [...formData.lines];
        const updatedLine = { ...newLines[index], [field]: value };
        
        // Basic calculation for line_total
        if (field === 'qty' || field === 'unit_price' || field === 'line_discount') {
            const qty = Number(field === 'qty' ? value : updatedLine.qty) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            const disc = Number(field === 'line_discount' ? value : updatedLine.line_discount) || 0;
            updatedLine.line_total = (qty * price) - disc;
        }
        
        newLines[index] = updatedLine;
        setFormData(prev => ({ ...prev, lines: newLines }));
    };

    // Calculate Totals
    const subTotal = formData.lines.reduce((sum, line) => sum + (line.line_total || 0), 0);
    const vatAmount = subTotal * 0.07;
    const totalAmount = (subTotal + vatAmount) - (formData.discount_amount || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log('Submitting Quotation:', { ...formData, sub_total: subTotal, vat_amount: vatAmount, total_amount: totalAmount });
        
        // Simulate API delay
        await new Promise(r => setTimeout(r, 1000));
        
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
    };

    // Modal Footer
    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-4">
                {isEdit && (
                    <button 
                        type="button" 
                        className="h-10 px-6 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-bold flex items-center gap-2 border border-blue-200 dark:border-blue-800 transition-all"
                    >
                        <Printer size={18} />
                        พิมพ์ใบเสนอราคา
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {isEdit ? 'ปิด' : 'ยกเลิก'}
                </button>
                <button 
                    type="submit" 
                    form="quotation-form"
                    disabled={isSubmitting}
                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </div>
    );

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'รายละเอียดใบเสนอราคา (VIEW Sales Quotation)' : 'สร้างใบเสนอราคาใหม่ (CREATE Sales Quotation)'}
            headerColor="bg-blue-600"
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <FileText size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                <form id="quotation-form" onSubmit={handleSubmit} className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* 1. Header Section */}
                    <div className={cardClass}>
                        <div className="p-6">
                            <QuotationHeaderForm 
                                formData={formData} 
                                onChange={handleHeaderChange} 
                            />
                        </div>
                    </div>

                    {/* 2. Line Items Section */}
                    <div className={cardClass}>
                        <div className="p-6">
                            <QuotationLineTable 
                                lines={formData.lines} 
                                onAddLine={handleAddLine} 
                                onRemoveLine={handleRemoveLine}
                                onLineChange={handleLineChange}
                            />
                        </div>
                    </div>

                    {/* 3. Summary Section */}
                    <div className={cardClass}>
                        <div className="p-6">
                            <QuotationSummary 
                                subTotal={subTotal}
                                discountAmount={formData.discount_amount}
                                vatAmount={vatAmount}
                                totalAmount={totalAmount}
                                lineCount={formData.lines.length}
                                onDiscountChange={(val) => setFormData((prev) => ({ ...prev, discount_amount: val }))}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </WindowFormLayout>
    );
}
