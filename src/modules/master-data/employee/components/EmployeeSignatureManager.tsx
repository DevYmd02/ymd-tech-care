/**
 * @file EmployeeSignatureManager.tsx
 * @description Component for managing employee signatures (List, Upload, Set Active)
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Plus,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmployeeSignatureService } from '../services/employee-signature.service';
import { clsx } from 'clsx';
import { API_BASE_URL } from '@/core/api/api';

interface Props {
  employeeId: number;
  onClose?: () => void;
}

export const EmployeeSignatureManager: React.FC<Props> = ({ employeeId, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ฟังก์ชันช่วยจัดการ URL รูปภาพ
  const getSignatureUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // ตัด /api ออกจาก Base URL เพื่อให้ได้ Root URL ของ Server
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    // รวม URL เข้าด้วยกัน (ตรวจสอบเรื่อง / ซ้ำ)
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch signatures
  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['employee-signatures', employeeId],
    queryFn: () => EmployeeSignatureService.getSignatures(employeeId),
    enabled: !!employeeId
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => 
      EmployeeSignatureService.uploadSignature(employeeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-signatures', employeeId] });
      toast.success('อัปโหลดลายเซ็นสำเร็จ');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด');
      console.error(err);
    },
    onSettled: () => setIsUploading(false)
  });

  // Set active mutation
  const setActiveMutation = useMutation({
    mutationFn: (id: number) => EmployeeSignatureService.setActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-signatures', employeeId] });
      toast.success('เปลี่ยนลายเซ็นหลักสำเร็จ');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => EmployeeSignatureService.deleteSignature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-signatures', employeeId] });
      toast.success('ลบลายเซ็นสำเร็จ');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบนามสกุลไฟล์
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        toast.error('อนุญาตเฉพาะไฟล์นามสกุล .jpg, .jpeg และ .png เท่านั้น');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 2MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsUploading(true);
      uploadMutation.mutate({ file });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500">กำลังโหลดข้อมูลลายเซ็น...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              title="กลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">จัดการลายเซ็นพนักงาน</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">จัดการและเลือกอัปโหลดลายเซ็นเพื่อใช้ในเอกสาร</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>เพิ่มลายเซ็น</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".jpg,.jpeg,.png" 
          onChange={handleFileChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {signatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
            <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>ยังไม่มีลายเซ็นในระบบ</p>
            <p className="text-sm">คลิกปุ่มด้านบนเพื่อเริ่มอัปโหลด</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {signatures.filter(s => !s.is_deleted).map((sig) => (
              <div 
                key={sig.emp_signature_id}
                className={clsx(
                  "group relative border-2 rounded-2xl p-4 transition-all duration-300",
                  sig.is_active 
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-500/10 ring-4 ring-blue-500/10" 
                    : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md dark:bg-slate-800/40"
                )}
              >
                {/* Active Badge */}
                {sig.is_active && (
                  <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-lg z-10">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                {/* Signature Preview */}
                <div className="aspect-[3/1] bg-white dark:bg-gray-100 rounded-lg border border-gray-100 dark:border-slate-700 mb-4 flex items-center justify-center overflow-hidden shadow-inner">
                  <img 
                    src={getSignatureUrl(sig.signature_url)} 
                    alt={sig.signature_name || 'Signature'} 
                    className="max-h-full max-w-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/300x100?text=Error+Loading+Image';
                    }}
                  />
                </div>

                {/* Info & Actions */}
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      อัปโหลดเมื่อ {new Date(sig.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    {!sig.is_active && (
                      <button
                        onClick={() => setActiveMutation.mutate(sig.emp_signature_id)}
                        disabled={setActiveMutation.isPending}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="ตั้งเป็นลายเซ็นหลัก"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('คุณต้องการลบลายเซ็นนี้ใช่หรือไม่?')) {
                          deleteMutation.mutate(sig.emp_signature_id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="ลบลายเซ็น"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
          <span className="font-bold">หมายเหตุ:</span> การเพิ่มลายเซ็นใหม่จะไม่ส่งผลกระทบต่อเอกสารที่อนุมัติไปแล้ว 
          ระบบจะใช้ลายเซ็นที่ตั้งค่าเป็น "หลัก" สำหรับการออกเอกสารใบใหม่เท่านั้น
        </p>
      </div>
    </div>
  );
};
