/**
 * @file PRFormModal.tsx
 * @description Modal wrapper สำหรับแสดง PR Form เป็น Popup
 * @usage เรียกใช้จาก PRListPage.tsx เมื่อกดปุ่ม "สร้างใบขอซื้อใหม่"
 * 
 * @features
 * - Overlay backdrop พร้อม blur effect
 * - แสดง PR form ที่มีอยู่แล้วใน Modal
 * - ปุ่มปิด Modal ที่มุมขวาบน
 * - Smooth animation เปิด/ปิด
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { PRFormValues } from '../../types/pr-types';
import { FileText, Minimize2, Maximize2, X } from 'lucide-react';

// PR Form Components
import { PRHeader } from './PRHeader';
import { PRInfoBar } from './PRInfoBar';
import { PRItemTable } from './PRItemTable';
import { PRSummary } from './PRSummary';
import { PRFooter } from './PRFooter';
import { PRDetailTabs } from './PRDetailTabs';
import { Toast } from '../ui/Toast';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface Props {
    isOpen: boolean;         // สถานะเปิด/ปิด Modal
    onClose: () => void;     // Callback เมื่อปิด Modal
}

// ====================================================================================
// COMPONENT - PRFormModal
// ====================================================================================

export const PRFormModal: React.FC<Props> = ({ isOpen, onClose }) => {

    // ==================== ANIMATION STATE ====================
    // Use a ref to track if we should show animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Trigger animation when modal opens
    useEffect(() => {
        if (isOpen) {
            // Reset closing state when modal opens (necessary for animation logic)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsClosing(false);
            // Delay animation start to allow DOM to render first
            const timer = setTimeout(() => {
                setIsAnimating(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setIsAnimating(false);
        // Wait for animation to complete
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // ==================== STATE ====================
    const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(null), 3000);
    };

    // ==================== FORM SETUP ====================
    const initialItems = Array(5).fill({
        item_code: "", item_name: "", warehouse: "", location: "", unit: "", qty: null, price: null, discount: null
    });

    const { control, register, handleSubmit, setValue } = useForm<PRFormValues>({
        defaultValues: {
            doc_no: "PR2026019695",
            doc_date: new Date().toISOString().split('T')[0],
            vat_rate: 7,
            discount_amount: 0,
            due_days: 7,
            is_hold: false,
            items: initialItems
        }
    });

    // ==================== HANDLERS ====================
    const onSubmit: SubmitHandler<PRFormValues> = (data) => {
        console.log("Payload พร้อมส่งไป Backend:", data);
        const total = data.items.reduce((acc, i) => acc + ((i.qty || 0) * (i.price || 0)), 0);
        alert(`บันทึกสำเร็จ! \nยอดสุทธิ: ${total.toLocaleString()} บาท`);
        handleClose();
    };

    // ถ้า Modal ปิดอยู่ ไม่ต้อง render
    if (!isOpen && !isClosing) return null;

    // ==================== STYLE CLASSES ====================
    const cardClass = "bg-white border border-gray-300 rounded-sm overflow-hidden";

    // ==================== RENDER ====================
    return (
        // Overlay with animation
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 font-sans transition-all duration-300 ease-out ${isAnimating ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
                }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Modal Container with animation - auto height, max 95vh */}
            <div
                className={`w-[95vw] max-h-[95vh] bg-white shadow-2xl rounded-lg border-4 border-blue-600 flex flex-col relative overflow-hidden transition-all duration-300 ease-out ${isAnimating
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 translate-y-4'
                    }`}
            >
                {/* -------------------- TITLE BAR -------------------- */}
                <div className="bg-blue-600 text-white px-3 py-1.5 font-bold text-sm flex justify-between items-center select-none border-b border-blue-700 flex-shrink-0">
                    {/* Left: Icon & Title */}
                    <div className="flex items-center space-x-2">
                        <div className="bg-red-500 p-1 rounded-md shadow-sm flex items-center justify-center">
                            <FileText size={14} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="tracking-wide">ใบขอซื้อ (Purchase Requisition)</span>
                    </div>

                    {/* Right: Window Control Buttons */}
                    <div className="flex items-center space-x-1">
                        <button type="button" className="w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-sm flex items-center justify-center transition-colors">
                            <Minimize2 size={12} strokeWidth={3} />
                        </button>
                        <button type="button" className="w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-sm flex items-center justify-center transition-colors">
                            <Maximize2 size={12} strokeWidth={3} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-sm flex items-center justify-center transition-colors"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* -------------------- FORM CONTENT (Scrollable) -------------------- */}
                <form className="flex-1 overflow-auto bg-gray-100 p-1.5 space-y-1">

                    {/* Card 1: Header */}
                    <div className={cardClass}>
                        <PRHeader register={register} setValue={setValue} />
                    </div>

                    {/* Card 2: Info Bar */}
                    <div className={cardClass}>
                        <PRInfoBar register={register} />
                    </div>

                    {/* Card 3: Item Table */}
                    <div className={cardClass}>
                        <PRItemTable
                            control={control}
                            register={register}
                            setValue={setValue}
                            onMinRowsError={() => showToast("ไม่สามารถลบได้ ต้องมีอย่างน้อย 5 แถว")}
                        />
                    </div>

                    {/* Card 4: Summary */}
                    <div className={cardClass}>
                        <PRSummary control={control} register={register} />
                    </div>

                    {/* Card 5: Detail Tabs */}
                    <div className={`${cardClass} p-1`}>
                        <PRDetailTabs control={control} />
                    </div>

                </form>

                {/* -------------------- FOOTER (Fixed at bottom) -------------------- */}
                <div className={`${cardClass} flex-shrink-0`}>
                    <PRFooter onSave={handleSubmit(onSubmit)} onClose={handleClose} />
                </div>

            </div>
        </div>
    );
};
