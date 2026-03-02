/**
 * @file QCFormModal.tsx
 * @description Modal สำหรับสร้างใบเปรียบเทียบราคา (Quote Comparison)
 * @usage เรียกจาก VQListPage เมื่อกดปุ่ม "ส่งเปรียบเทียบราคา"
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Scale, CheckSquare, Square, AlertCircle, Search } from 'lucide-react';
import { WindowFormLayout } from '@ui';

import { QCService, type QCCreateData } from '@/modules/procurement/services/qc.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { logger } from '@/shared/utils/logger';
import { QCMatrixTable } from './QCMatrixTable';
import { useQCMatrix } from '../hooks/useQCMatrix';

interface QCFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRFQNo?: string;
  initialPRNo?: string;
  onSuccess?: () => void;
}



const generateQCNumber = (): string => {
  const now = new Date();
  return `QC${now.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')} (Auto Generate)`;
};

const getTodayFormatted = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export const QCFormModal: React.FC<QCFormModalProps> = ({
  isOpen,
  onClose,
  initialRFQNo = '',
  initialPRNo = '',
  onSuccess,
}) => {
  // Form State
  const [qcNo, setQCNo] = useState(generateQCNumber());
  const [prNo, setPRNo] = useState(initialPRNo);
  const [rfqNo, setRFQNo] = useState(initialRFQNo);
  const [qcDate, setQCDate] = useState(getTodayFormatted());
  const [createdBy] = useState('ระบบอัตโนมัติ');
  const [department] = useState('จัดซื้อ');
  
  // Fetch RFQs to resolve ID from No
  const { data: rfqList } = useQuery({
      queryKey: ['rfq-list-for-qc', rfqNo],
      queryFn: () => RFQService.getList({ rfq_no: rfqNo }),
      enabled: !!rfqNo && isOpen,
  });
  
  const rfqId = useMemo(() => {
     return rfqList?.data.find(r => r.rfq_no === rfqNo)?.rfq_id;
  }, [rfqList, rfqNo]);

  // Fetch RFQ Details for Lines
  const { data: rfqDetail, isLoading: isRFQDetailLoading } = useQuery({
      queryKey: ['rfq-detail-for-qc', rfqId],
      queryFn: () => RFQService.getById(rfqId!),
      enabled: !!rfqId && isOpen,
  });

  // Fetch VQs related to this RFQ
  const { data: vqList, isLoading: isVQListLoading } = useQuery({
      queryKey: ['vq-list-for-qc', rfqNo],
      queryFn: () => VQService.getList({ rfq_no: rfqNo }),
      enabled: !!rfqNo && isOpen,
  });

  const availableVQs = useMemo(() => {
     return vqList?.data.filter(vq => vq.status === 'RECORDED') || [];
  }, [vqList]);

  // VQ Selection State
  const [selectedVQIds, setSelectedVQIds] = useState<string[]>([]);

  const selectedVQs = useMemo(() => {
     return availableVQs.filter(vq => selectedVQIds.includes(vq.quotation_id));
  }, [availableVQs, selectedVQIds]);

  const toggleVQSelection = (vqId: string) => {
      setSelectedVQIds(prev => 
          prev.includes(vqId) ? prev.filter(id => id !== vqId) : [...prev, vqId]
      );
  };

  // QC Matrix Hook
  const { matrixData, vendorTotals, selectWinner, selectAllForVendor } = useQCMatrix(
      rfqDetail?.lines || [],
      selectedVQs
  );

  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQCNo(generateQCNumber());
      setPRNo(initialPRNo || 'PR2024-xxx');
      setRFQNo(initialRFQNo || 'RFQ2024-xxx');
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
    }
  }, [isOpen, initialPRNo, initialRFQNo]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const qcData: QCCreateData = {
        pr_no: prNo,
        rfq_no: rfqNo,
        qc_date: qcDate,
        vendor_lines: vendorTotals.map(vt => {
          const vq = selectedVQs.find(v => v.quotation_id === vt.vq_id);
          return {
            vendor_code: vq?.vendor_code || '',
            vendor_name: vq?.vendor_name || '',
            vq_no: vq?.quotation_no || '',
            total_amount: vt.grand_total,
            payment_term_days: vq?.payment_term_days || 30,
            lead_time_days: vq?.lead_time_days || 7,
            valid_until: vq?.valid_until || '',
          };
        }),
      };

      const result = await QCService.create(qcData);
      
      if (result && result.qc_id) {
        window.alert('บันทึกใบเปรียบเทียบราคาสำเร็จ!');
        onSuccess?.();
        onClose();
      } else {
        window.alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      logger.error('[QCFormModal] Save QC failed:', error);
      window.alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const inputClass = "w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1";

  return (
    <>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title="สร้างใบเปรียบเทียบราคา (Quote Comparison)"
        titleIcon={<div className="bg-blue-500 p-1.5 rounded-md"><Scale size={16} strokeWidth={2.5} /></div>}
        headerColor="bg-blue-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
        footer={
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                    บันทึก
                </button>
            </div>
        }
      >
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4 space-y-4">
          
          {/* Section: Document Header */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
              <FileText size={18} />
              <h3 className="font-bold">ข้อมูลหัวเอกสาร - Document Header</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* เลขที่ใบเปรียบเทียบราคา */}
              <div>
                <label className={labelClass}>เลขที่ใบเปรียบเทียบราคา *</label>
                <input
                  type="text"
                  value={qcNo}
                  readOnly
                  className={`${inputClass} bg-gray-200 dark:bg-gray-700`}
                />
              </div>

              {/* เลขที่ PR อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ PR อ้างอิง</label>
                <input
                  type="text"
                  value={prNo}
                  onChange={(e) => setPRNo(e.target.value)}
                  placeholder="PR2024-xxx"
                  className={inputClass}
                />
              </div>

              {/* เลขที่ RFQ อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ RFQ อ้างอิง</label>
                <input
                  type="text"
                  value={rfqNo}
                  onChange={(e) => setRFQNo(e.target.value)}
                  placeholder="RFQ2024-xxx"
                  className={inputClass}
                />
              </div>

              {/* วันที่เปรียบเทียบ */}
              <div>
                <label className={labelClass}>วันที่เปรียบเทียบ *</label>
                <input
                  type="text"
                  value={qcDate}
                  readOnly
                  className={`${inputClass} bg-gray-200 dark:bg-gray-700`}
                />
              </div>

              {/* ผู้จัดทำ */}
              <div>
                <label className={labelClass}>ผู้จัดทำ</label>
                <input
                  type="text"
                  value={createdBy}
                  readOnly
                  className={`${inputClass} bg-gray-200 dark:bg-gray-700`}
                />
              </div>

              {/* แผนก/ฝ่าย */}
              <div>
                <label className={labelClass}>แผนก/ฝ่าย</label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  className={`${inputClass} bg-gray-200 dark:bg-gray-700`}
                />
              </div>
            </div>
          </div>

          {/* Section: Vendor Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                 <Search size={18} />
                 <h3 className="font-bold">เลือกใบเสนอราคาเพื่อเปรียบเทียบ - Select VQs</h3>
               </div>
            </div>

            {isVQListLoading ? (
               <div className="text-gray-500 text-sm">กำลังโหลดข้อมูล VQ...</div>
            ) : availableVQs.length === 0 ? (
               <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertCircle size={16} />
                  <span className="text-sm">ไม่พบใบเสนอราคา (VQ) ที่บันทึกราคาแล้วสำหรับ RFQ นีั้</span>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableVQs.map(vq => {
                     const isSelected = selectedVQIds.includes(vq.quotation_id);
                     return (
                        <div 
                           key={vq.quotation_id}
                           onClick={() => toggleVQSelection(vq.quotation_id)}
                           className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected 
                                 ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500' 
                                 : 'bg-white border-gray-300 hover:border-blue-400 dark:bg-gray-800 dark:border-gray-600'
                           }`}
                        >
                           <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={vq.vendor_name}>
                                 {vq.vendor_name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                 <span>{vq.quotation_no || 'ยังไม่มีเลขที่'}</span>
                                 <span className="font-medium text-gray-700 dark:text-gray-300">
                                     {vq.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                 </span>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
          </div>

          {/* Section: Vendor Comparison Matrix Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
              <Scale size={18} />
              <h3 className="font-bold">ตารางเปรียบเทียบราคา - Comparison Matrix</h3>
            </div>
            
            {isRFQDetailLoading ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลดโครงสร้างตาราง...</div>
            ) : (
                <QCMatrixTable 
                  matrixData={matrixData}
                  vendorTotals={vendorTotals}
                  onSelectWinner={selectWinner}
                  onSelectAllForVendor={selectAllForVendor}
                />
            )}
          </div>
        </div>
      </WindowFormLayout>


    </>
  );
};

export default QCFormModal;

