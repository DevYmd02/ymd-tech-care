/**
 * @file QCFormModal.tsx
 * @description Modal สำหรับสร้างใบเปรียบเทียบราคา (Quote Comparison) — Vendor-Level Comparison
 * @version 3.0 — Simplified from item-level matrix to vendor-level winner selection
 * @backup The complex matrix version is preserved in _backup_v2/QCMatrixTable.tsx & _backup_v2/useQCMatrix.ts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileText, Search, Scale, CheckSquare, Square, Trophy, CheckCircle2, Circle, X } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';

import { QCService } from '@/modules/procurement/services/qc.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import type { RFQHeader, PRHeader } from '@/modules/procurement/types';
import { SelectionModal } from './SelectionModal';
import { useConfirmation } from '@/shared/hooks';
import toast from 'react-hot-toast';

interface QCFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRFQNo?: string;
  initialPRNo?: string;
  qcId?: string | null;
  mode?: 'view' | 'edit' | 'create';
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
  qcId = null,
  mode = 'create',
  onSuccess,
}) => {
  // Form State
  const [qcNo, setQCNo] = useState(generateQCNumber());
  const [prNo, setPRNo] = useState(initialPRNo || '');
  const [rfqNo, setRFQNo] = useState(initialRFQNo || '');
  const [qcDate, setQCDate] = useState(getTodayFormatted());
  const [createdBy] = useState('นางสาวนรินทร์ทิพย์ ใจดี');
  const [department] = useState('ฝ่ายจัดซื้อ (Procurement)');

  const [isRFQSelectorOpen, setIsRFQSelectorOpen] = useState(false);
  const [isPRSelectorOpen, setIsPRSelectorOpen] = useState(false);

  // Fetch Existing QC Data if mode is edit/view
  const { data: qcData } = useQuery({
    queryKey: ['qc-detail', qcId],
    queryFn: () => QCService.getById(qcId!),
    enabled: !!qcId && (mode === 'edit' || mode === 'view'),
  });

  useEffect(() => {
    if (qcData) {
      setQCNo(qcData.qc_no || '');
      setPRNo(qcData.pr_no || '');
      setRFQNo(qcData.rfq_no || '');
      // Can also sync dates etc here later
    }
  }, [qcData]);

  // Fetch RFQs to resolve ID from No
  const { data: rfqList } = useQuery({
    queryKey: ['rfqs-lookup'],
    queryFn: () => RFQService.getList({ status: 'CLOSED' }),
    enabled: isOpen,
  });

  const { data: prList } = useQuery({
    queryKey: ['prs-lookup'],
    queryFn: () => PRService.getList({ status: 'APPROVED' }),
    enabled: isOpen,
  });

  // Data Integrity Bridge: Clear selected VQs and winner if RFQ No changes
  useEffect(() => {
    setSelectedVQIds([]);
    setWinnerVQId(null);
  }, [rfqNo]);

    const rfqId = useMemo(() => {
    return rfqList?.data.find((r) => r.rfq_no === rfqNo)?.rfq_id;
  }, [rfqList, rfqNo]);

  // Data Integrity Bridge #2: If the PR changes, verify if the currently selected RFQ belongs to it.
  // If it does not belong to the new PR, clear the RFQ.
  useEffect(() => {
    if (prNo && rfqNo && rfqList?.data) {
      const currentRfqDetails = rfqList.data.find(r => r.rfq_no === rfqNo);
      // Depending on the field available, compare against the parent PR
      const rfqParentPrNo = currentRfqDetails?.ref_pr_no || currentRfqDetails?.pr_no || '';
      
      if (rfqParentPrNo && rfqParentPrNo !== prNo) {
          logger.warn(`[QCFormModal] PR changed to ${prNo}, but RFQ ${rfqNo} belongs to ${rfqParentPrNo}. Clearing RFQ state...`);
          setRFQNo('');
          setSelectedVQIds([]);
          setWinnerVQId(null);
      }
    }
  }, [prNo, rfqNo, rfqList?.data]);

  // Cascading Filter: Only show RFQs belonging to the currently selected PR (if a PR is selected)
  const filteredRFQs = useMemo(() => {
      const allRFQs = rfqList?.data || [];
      if (!prNo) return allRFQs;
      
      // Filter out RFQs whose parent PR doesn't match the selected PR.
      return allRFQs.filter(rfq => {
          const rfqParentPrNo = rfq.ref_pr_no || rfq.pr_no || '';
          return !rfqParentPrNo || rfqParentPrNo === prNo;
      });
  }, [rfqList?.data, prNo]);

  // Fetch VQs related to this RFQ by ID
  const { data: vqList, isLoading: isVQListLoading } = useQuery({
    queryKey: ['vq-list-for-qc-by-id', rfqId],
    queryFn: () => VQService.getVQsByRfqId(rfqId!),
    enabled: !!rfqId && isOpen,
  });

  const availableVQs = useMemo(() => {
    return vqList?.data.filter((vq) => vq.status === 'RECORDED') || [];
  }, [vqList]);

  // VQ Selection State
  const [selectedVQIds, setSelectedVQIds] = useState<string[]>([]);

  // Vendor-Level Winner State (the core of simplified comparison)
  const [winnerVQId, setWinnerVQId] = useState<string | null>(null);
  const { confirm } = useConfirmation();

  const selectedVQs = useMemo(() => {
    return availableVQs.filter((vq) => selectedVQIds.includes(vq.quotation_id));
  }, [availableVQs, selectedVQIds]);

  const toggleVQSelection = (vqId: string) => {
    setSelectedVQIds((prev) =>
      prev.includes(vqId) ? prev.filter((id) => id !== vqId) : [...prev, vqId]
    );
    // If we deselect the current winner, clear the winner
    if (winnerVQId === vqId) {
      setWinnerVQId(null);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQCNo(generateQCNumber());
      setPRNo(initialPRNo || '');
      setRFQNo(initialRFQNo || '');
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
      setWinnerVQId(null);
    }
  }, [isOpen, initialPRNo, initialRFQNo]);

  // Auto-select all recorded VQs when the RFQ changes and VQ list is loaded
  useEffect(() => {
    if (rfqId && vqList?.data && vqList.data.length > 0) {
      const recordedVQs = vqList.data
        .filter((vq) => vq.status === 'RECORDED')
        .map((vq) => vq.quotation_id);
      if (recordedVQs.length > 0) {
        setSelectedVQIds(recordedVQs);
      }
    }
  }, [rfqId, vqList?.data]);

  const handleSelectRFQ = (rfq: RFQHeader) => {
    setRFQNo(rfq.rfq_no);
    // Strict Linking Rule (Always Overwrite):
    // Because an RFQ belongs to one and ONLY one PR, the selected RFQ is the absolute source of truth.
    // Unconditionally overwrite the PR field.
    const parentPrNo = rfq.ref_pr_no || rfq.pr_no || '';
    if (parentPrNo) {
        setPRNo(parentPrNo);
    }
    setIsRFQSelectorOpen(false);
    setSelectedVQIds([]);
    setWinnerVQId(null);
  };

  const handleSelectPR = (pr: PRHeader) => {
    setPRNo(pr.pr_no);
    setIsPRSelectorOpen(false);
  };

  const handleClearPR = () => {
    setPRNo('');
    // CASCADING CLEAR: Must also clear RFQ because it depends on PR
    setRFQNo('');
    setSelectedVQIds([]);
    setWinnerVQId(null);
  };

  const handleClearRFQ = () => {
    setRFQNo('');
    setSelectedVQIds([]);
    setWinnerVQId(null);
  };

  // Compute lowest Grand Total for highlighting
  const minGrandTotal = useMemo(() => {
    if (selectedVQs.length === 0) return 0;
    const totals = selectedVQs
      .map((vq) => vq.total_amount || 0)
      .filter((t) => t > 0);
    return totals.length > 0 ? Math.min(...totals) : 0;
  }, [selectedVQs]);

  // Build a safe, type-compliant QCCreateData payload using the winner's VQ lines.
  // Per the pro-tip: we derive item_id, qty, unit, and unit_price from the winning VQ's lines,
  // with sensible defaults so Zod does not reject the payload.
  const handleSave = async () => {
    if (!winnerVQId) {
      toast.error('กรุณาเลือกผู้เสนอราคาที่ชนะก่อนบันทึก');
      return;
    }

    const winnerVQ = selectedVQs.find((vq) => vq.quotation_id === winnerVQId);
    if (!winnerVQ) {
      toast.error('ไม่พบข้อมูลผู้เสนอราคาที่เลือก');
      return;
    }

    const isConfirmed = await confirm({
      title: 'ยืนยันการบันทึกผล',
      description: 'คุณต้องการยืนยันผลการเปรียบเทียบราคาและเลือกผู้ชนะใช่หรือไม่? ข้อมูลจะไม่สามารถแก้ไขได้หลังจากการยืนยัน',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      variant: 'warning',
    });

    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      const result = qcId
        ? await QCService.submitWinner(qcId, { winning_vq_id: winnerVQId })
        : await QCService.create({
            qc_no: generateQCNumber(),
            pr_id: prList?.data.find(pr => pr.pr_no === prNo)?.pr_id || undefined,
            rfq_id: rfqId || undefined,
            pr_no: prNo || undefined,
            rfq_no: rfqNo || undefined,
            status: 'DRAFT',
            comparison_date: qcDate,
            items: [], // Will be simplified in another pass or rely on winner VQ extraction backend side.
            winning_vq_id: winnerVQId,
        });

      if (result && result.qc_id) {
        toast.success('บันทึกใบเปรียบเทียบราคาสำเร็จ!');
        onSuccess?.();
        onClose();
      } else {
        toast.error('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      logger.error('[QCFormModal] Save QC Winner failed:', error);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก / ไม่สามารถระบุผู้ชนะได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Styles
  const inputClass =
    'w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white';
  const labelClass = 'block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1';

  return (
    <>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title="สร้างใบเปรียบเทียบราคา (Quote Comparison)"
        titleIcon={
          <div className="bg-blue-500 p-1.5 rounded-md">
            <Scale size={16} strokeWidth={2.5} />
          </div>
        }
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
              disabled={isLoading || !winnerVQId}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prNo}
                    readOnly
                    placeholder="คลิกเลือก PR..."
                    className={`${inputClass} bg-gray-50 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPRSelectorOpen(true)}
                    className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 text-sm transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Search size={14} /> เลือก
                  </button>
                  {/* Conditional Clear Button */}
                  {prNo && (
                    <button
                      type="button"
                      onClick={handleClearPR}
                      className="flex items-center justify-center w-9 h-9 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus:outline-none shrink-0"
                      title="ล้างค่า PR"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* เลขที่ RFQ อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ RFQ อ้างอิง</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rfqNo}
                    readOnly
                    placeholder="คลิกเลือก RFQ..."
                    className={`${inputClass} bg-gray-50 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsRFQSelectorOpen(true)}
                    className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 text-sm transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Search size={14} /> เลือก
                  </button>
                  {/* Conditional Clear Button */}
                  {rfqNo && (
                    <button
                      type="button"
                      onClick={handleClearRFQ}
                      className="flex items-center justify-center w-9 h-9 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus:outline-none shrink-0"
                      title="ล้างค่า RFQ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
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

              {/* แผนก */}
              <div>
                <label className={labelClass}>แผนก</label>
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
                <h3 className="font-bold">เลือกใบเสนอราคาเพื่อเปรียบเทียบ - Select VQs</h3>
              </div>

              {availableVQs.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVQIds(availableVQs.map((v) => v.quotation_id))}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedVQIds([]); setWinnerVQId(null); }}
                    className="text-xs text-gray-500 hover:underline font-medium"
                  >
                    ไม่เลือกเลย
                  </button>
                </div>
              )}
            </div>

            {isVQListLoading ? (
              <div className="text-gray-500 text-sm">กำลังโหลดข้อมูล VQ...</div>
            ) : rfqNo && availableVQs.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle size={16} />
                <span className="text-sm">
                  ไม่พบใบเสนอราคา (VQ) ที่มีสถานะ 'บันทึกราคาแล้ว' สำหรับ {rfqNo}
                </span>
              </div>
            ) : availableVQs.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                กรุณาเลือก RFQ อ้างอิงด้านบนเพื่อโหลดใบเสนอราคา
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVQs.map((vq) => {
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
                        <div
                          className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                          title={vq.vendor_name}
                        >
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

          {/* Section: Vendor Summary & Winner Selection (replaces complex matrix) */}
          {selectedVQs.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                <Scale size={18} />
                <h3 className="font-bold">สรุปราคาและเลือกผู้ชนะ - Vendor Summary</h3>
                {!winnerVQId && (
                  <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    ⚠ กรุณาเลือกผู้ชนะ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedVQs.map((vq) => {
                  const grandTotal = vq.total_amount || 0;
                  const isLowest = grandTotal > 0 && grandTotal === minGrandTotal;
                  const isWinner = winnerVQId === vq.quotation_id;

                  return (
                    <div
                      key={vq.quotation_id}
                      className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${
                        isWinner
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/30'
                          : isLowest
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      {/* Winner badge */}
                      {isWinner && (
                        <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Trophy size={10} /> ผู้ชนะ
                        </div>
                      )}
                      {/* Best price badge */}
                      {isLowest && !isWinner && (
                        <div className="absolute -top-3 left-4 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          BEST PRICE
                        </div>
                      )}

                      {/* Vendor Info */}
                      <div className="mb-3">
                        <div
                          className="font-bold text-gray-900 dark:text-gray-100 truncate text-base"
                          title={vq.vendor_name}
                        >
                          {vq.vendor_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {vq.quotation_no || 'ยังไม่มีเลขที่'}
                        </div>
                      </div>

                      {/* Grand Total */}
                      <div className="flex items-baseline justify-between mb-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Grand Total</span>
                        <span
                          className={`text-xl font-black tabular-nums ${
                            isLowest
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Select Winner Button */}
                      <button
                        type="button"
                        onClick={() => setWinnerVQId(isWinner ? null : vq.quotation_id)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                          isWinner
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        {isWinner ? (
                          <>
                            <CheckCircle2 size={16} />
                            เลือกแล้ว
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            เลือกเป็นผู้ชนะ
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Summary Footer */}
              {winnerVQId && (() => {
                const winnerVQ = selectedVQs.find((v) => v.quotation_id === winnerVQId);
                return winnerVQ ? (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Trophy size={16} />
                      <span className="font-medium text-sm">
                        ผู้ชนะการเสนอราคา: <strong>{winnerVQ.vendor_name}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">ราคารวม</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {(winnerVQ.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </WindowFormLayout>

      {/* RFQ Selector Modal */}
      <SelectionModal<RFQHeader>
        isOpen={isRFQSelectorOpen}
        onClose={() => setIsRFQSelectorOpen(false)}
        title={prNo ? `ข้อมูล RFQ อ้างอิงจากรหัส PR: ${prNo}` : "เลือกข้อมูลใบขอเสนอราคา (RFQ)"}
        subtitle="ค้นหาและเลือกเอกสารที่ต้องการนำมาเปรียบเทียบ"
        data={filteredRFQs}
        searchPlaceholder="ค้นหาด้วยเลขที่ RFQ, หัวข้อ, หรือชื่อผู้ขาย..."
        searchKeys={['rfq_no', 'purpose', 'vendor_name']}
        onSelect={handleSelectRFQ}
        keyExtractor={(rfq) => rfq.rfq_id}
        columns={[
          { label: 'เลขที่ (No)', key: 'rfq_no', className: 'w-1/4' },
          { label: 'วันที่ (Date)', key: 'rfq_date', className: 'w-1/6' },
          { label: 'ผู้ขาย (Vendor)', key: 'vendor_name', className: 'w-1/4' },
          { label: 'เรื่อง/วัตถุประสงค์ (Subject)', key: 'purpose', className: 'flex-1' },
        ]}
      />

      {/* PR Selector Modal */}
      <SelectionModal<PRHeader>
        isOpen={isPRSelectorOpen}
        onClose={() => setIsPRSelectorOpen(false)}
        title="เลือกเลขที่ PR อ้างอิง"
        subtitle="ค้นหาใบขอซื้อที่ต้องการอ้างอิง"
        data={prList?.data || []}
        searchPlaceholder="ค้นหาด้วยเลขที่ PR หรือหัวข้อ..."
        searchKeys={['pr_no', 'purpose']}
        onSelect={handleSelectPR}
        keyExtractor={(pr) => pr.pr_id}
        columns={[
          { label: 'เลขที่ PR', key: 'pr_no', className: 'w-1/3' },
          { label: 'วันที่', key: 'pr_date', className: 'w-1/4' },
          { label: 'วัตถุประสงค์', key: 'purpose', className: 'flex-1' },
        ]}
      />
    </>
  );
};

export default QCFormModal;
