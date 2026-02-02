/**
 * @file QCFormModal.tsx
 * @description Modal สำหรับสร้างใบเปรียบเทียบราคา (Quote Comparison)
 * @usage เรียกจาก QTListPage เมื่อกดปุ่ม "ส่งเปรียบเทียบราคา"
 */

import React, { useState, useEffect } from 'react';
import { FileText, Search, Trash2, Scale } from 'lucide-react';
import { WindowFormLayout } from '@layout/WindowFormLayout';
import { QCFooter } from './QCFooter';
import { VendorSearchModal } from '@shared/VendorSearchModal';
import { qcService } from '../../../../services';
import type { VendorSearchItem } from '../../../../types/vendor-types';
import type { QCCreateData } from '../../../../services/interfaces/IQCService';

interface QCFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRFQNo?: string;
  initialPRNo?: string;
  onSuccess?: () => void;
}

interface QCVendorLine {
  line_no: number;
  vendor_code: string;
  vendor_name: string;
  qt_no: string;
  total_amount: number;
  payment_term_days: number;
  lead_time_days: number;
  valid_until: string;
}

const createEmptyLine = (lineNo: number): QCVendorLine => ({
  line_no: lineNo,
  vendor_code: '',
  vendor_name: '',
  qt_no: '',
  total_amount: 0,
  payment_term_days: 30,
  lead_time_days: 7,
  valid_until: '',
});

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
  
  // Vendor Lines
  const [vendorLines, setVendorLines] = useState<QCVendorLine[]>([
    createEmptyLine(1),
    createEmptyLine(2),
    createEmptyLine(3),
  ]);

  // Vendor Search Modal
  const [isVendorSearchOpen, setIsVendorSearchOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQCNo(generateQCNumber());
      setPRNo(initialPRNo || 'PR2024-xxx');
      setRFQNo(initialRFQNo || 'RFQ2024-xxx');
      setQCDate(getTodayFormatted());
      setVendorLines([
        createEmptyLine(1),
        createEmptyLine(2),
        createEmptyLine(3),
      ]);
    }
  }, [isOpen, initialPRNo, initialRFQNo]);

  // Handlers
  const openVendorSearch = (index: number) => {
    setActiveLineIndex(index);
    setIsVendorSearchOpen(true);
  };

  const handleSelectVendor = (vendor: VendorSearchItem) => {
    if (activeLineIndex !== null) {
      setVendorLines(prev => {
        const newLines = [...prev];
        newLines[activeLineIndex] = {
          ...newLines[activeLineIndex],
          vendor_code: vendor.code,
          vendor_name: vendor.name,
        };
        return newLines;
      });
    }
    setIsVendorSearchOpen(false);
  };

  const updateLine = (index: number, field: keyof QCVendorLine, value: string | number) => {
    setVendorLines(prev => {
      const newLines = [...prev];
      newLines[index] = { ...newLines[index], [field]: value };
      return newLines;
    });
  };

  const removeLine = (index: number) => {
    if (vendorLines.length <= 1) return;
    setVendorLines(prev => prev.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })));
  };

  const addLine = () => {
    setVendorLines(prev => [...prev, createEmptyLine(prev.length + 1)]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const qcData: QCCreateData = {
        pr_no: prNo,
        rfq_no: rfqNo,
        qc_date: qcDate,
        vendor_lines: vendorLines.map(line => ({
          vendor_code: line.vendor_code,
          vendor_name: line.vendor_name,
          qt_no: line.qt_no,
          total_amount: line.total_amount,
          payment_term_days: line.payment_term_days,
          lead_time_days: line.lead_time_days,
          valid_until: line.valid_until,
        })),
      };

      const result = await qcService.create(qcData);
      
      if (result.success) {
        window.alert(result.message || 'บันทึกใบเปรียบเทียบราคาสำเร็จ!');
        onSuccess?.();
        onClose();
      } else {
        window.alert(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Save QC failed:', error);
      window.alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const inputClass = "w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1";
  const tableInputClass = "w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white text-center";

  return (
    <>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title="สร้างใบเปรียบเทียบราคา (Quote Comparison)"
        titleIcon={<div className="bg-blue-500 p-1.5 rounded-md"><Scale size={16} strokeWidth={2.5} /></div>}
        headerColor="bg-blue-600"
        footer={<QCFooter onSave={handleSave} onCancel={onClose} isLoading={isLoading} />}
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

          {/* Section: Vendor Comparison Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
              <Scale size={18} />
              <h3 className="font-bold">ตารางเปรียบเทียบราคา - Vendor Comparison Table</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-2 py-2.5 text-center font-medium w-12">ลำดับ</th>
                    <th className="px-2 py-2.5 text-center font-medium w-32">รหัสเจ้าหนี้</th>
                    <th className="px-2 py-2.5 text-left font-medium min-w-[150px]">ชื่อเจ้าหนี้</th>
                    <th className="px-2 py-2.5 text-center font-medium w-28">เลขที่ใบเสนอราคา</th>
                    <th className="px-2 py-2.5 text-center font-medium w-28">ยอดรวม (บาท)</th>
                    <th className="px-2 py-2.5 text-center font-medium w-28">เงื่อนไขชำระเงิน</th>
                    <th className="px-2 py-2.5 text-center font-medium w-24">LEAD TIME</th>
                    <th className="px-2 py-2.5 text-center font-medium w-32">ใช้ได้ถึง</th>
                    <th className="px-2 py-2.5 text-center font-medium w-16">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {vendorLines.map((line, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800">
                      <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400 font-medium">
                        {line.line_no}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={line.vendor_code}
                            onChange={(e) => updateLine(index, 'vendor_code', e.target.value)}
                            placeholder="เลือกรหัสเจ้า"
                            className={`${tableInputClass} flex-1 text-left`}
                          />
                          <button
                            type="button"
                            onClick={() => openVendorSearch(index)}
                            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                          >
                            <Search size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={line.vendor_name}
                          onChange={(e) => updateLine(index, 'vendor_name', e.target.value)}
                          placeholder="ชื่อเจ้าหนี้"
                          className={`${tableInputClass} text-left`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={line.qt_no}
                          onChange={(e) => updateLine(index, 'qt_no', e.target.value)}
                          placeholder="QT-xxx"
                          className={tableInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={line.total_amount || ''}
                          onChange={(e) => updateLine(index, 'total_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={tableInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={line.payment_term_days}
                            onChange={(e) => updateLine(index, 'payment_term_days', parseInt(e.target.value) || 0)}
                            className={`${tableInputClass} w-16`}
                          />
                          <span className="text-sm text-gray-500">วัน</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={line.lead_time_days}
                            onChange={(e) => updateLine(index, 'lead_time_days', parseInt(e.target.value) || 0)}
                            className={`${tableInputClass} w-16`}
                          />
                          <span className="text-sm text-gray-500">วัน</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={line.valid_until}
                          onChange={(e) => updateLine(index, 'valid_until', e.target.value)}
                          className={tableInputClass}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="ลบแถว"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              + เพิ่มแถว
            </button>
          </div>
        </div>
      </WindowFormLayout>

      {/* Vendor Search Modal */}
      <VendorSearchModal
        isOpen={isVendorSearchOpen}
        onClose={() => setIsVendorSearchOpen(false)}
        onSelect={handleSelectVendor}
      />
    </>
  );
};

export default QCFormModal;
