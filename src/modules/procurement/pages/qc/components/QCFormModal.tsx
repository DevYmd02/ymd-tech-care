/**
 * @file QCFormModal.tsx
 * @description Modal สำหรับสร้างใบเปรียบเทียบราคา (Quote Comparison) — Vendor-Level Comparison
 * @version 3.0 — Simplified from item-level matrix to vendor-level winner selection
 * @backup The complex matrix version is preserved in _backup_v2/QCMatrixTable.tsx & _backup_v2/useQCMatrix.ts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileText, Search, Scale, CheckSquare, Square, Trophy, CheckCircle2, Circle, X, ShoppingBag } from 'lucide-react';
import { WindowFormLayout } from '@ui';

import { QCService } from '@/modules/procurement/services/qc.service';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { DepartmentService } from '@/modules/master-data/company/services/company.service';
import type { RFQHeader, PRHeader, VQListItem, RFQDetailResponse } from '@/modules/procurement/types';
import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import { SelectionModal } from './SelectionModal';
import { RFQSelectionModal } from './RFQSelectionModal';
import { useQCForm } from '../hooks/useQCForm';
import { useConfirmation } from '@/shared/hooks';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import toast from 'react-hot-toast';

interface QCFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRFQNo?: string;
  initialPRNo?: string;
  qcId?: number | null;
  mode?: 'view' | 'edit' | 'create';
  initialData?: QCListItem | null;
  onSuccess?: () => void;
}

const generateQCNumber = (): string => {
  const now = new Date();
  // Using 5 Xs to indicate auto-generation as per UI standard or a random placeholder
  return `QC${now.getFullYear()}-XXXXX (Auto Generate)`;
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
  initialData = null,
  onSuccess,
}) => {
  // Auth Context
  const { user } = useAuth();

  // Form State
  const [qcNo, setQCNo] = useState('');
  const [prId, setPRId] = useState<number | null>(null);
  const [prNo, setPRNo] = useState('');
  const [rfqId, setRFQId] = useState<number | null>(null);
  const [rfqNo, setRFQNo] = useState('');
  const [qcDate, setQCDate] = useState(getTodayFormatted());
  
  // Real-time Auth Synced States
  const [createdBy, setCreatedBy] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  const [isRFQSelectorOpen, setIsRFQSelectorOpen] = useState(false);
  const [isPRSelectorOpen, setIsPRSelectorOpen] = useState(false);

  // Reorder state declarations to fix "used before declaration" errors
  const [selectedVQIds, setSelectedVQIds] = useState<number[]>([]);
  const [winnerVQId, setWinnerVQId] = useState<number | null>(null);

  // Fetch Existing QC Data if mode is edit/view
  const { data: qcData } = useQuery({
    queryKey: ['qc-detail', qcId],
    queryFn: () => QCService.getById(Number(qcId)),
    enabled: !!qcId && (mode === 'edit' || mode === 'view'),
  });

  // Fetch Department Name
  const { data: deptData } = useQuery({
    queryKey: ['department-detail', departmentId],
    queryFn: () => DepartmentService.get(Number(departmentId)),
    enabled: !!departmentId,
  });

  useEffect(() => {
    if (deptData) {
      setDepartment(deptData.department_name);
    }
  }, [deptData]);

  useEffect(() => {
    // Priority 1: Hydrate from background API (deep detail)
    if (qcData && (mode === 'view' || mode === 'edit')) {
      setQCNo(qcData.qc_no || '');
      setPRNo(qcData.pr_no || '');
      setPRId(qcData.pr_id || null);
      setRFQNo(qcData.rfq_no || '');
      setRFQId(qcData.rfq_id || null);
      setQCDate(qcData.comparison_date ? new Date(qcData.comparison_date).toLocaleDateString('en-GB') : getTodayFormatted());
      setWinnerVQId(qcData.winning_vq_id || null);
      
      if (qcData.winning_vq_id) {
        setSelectedVQIds([qcData.winning_vq_id]);
      }
    } 
    // Priority 2: Hydrate from initialData (Hydrate First logic)
    else if (initialData && (mode === 'view' || mode === 'edit')) {
      setQCNo(initialData.qc_no || '');
      setPRNo(initialData.pr_no || '');
      setRFQNo(initialData.rfq_no || '');
      // Note: mapping other fields from QCListItem to match expected types if needed
      setWinnerVQId(initialData.vq_header_id || null);
    }
  }, [qcData, initialData, mode]);

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

  // Note: Data Integrity Bridge #2 (belonging check) is now naturally handled 
  // by RFQSelectionModal's filtering and the clear-on-change effect in handleSelectPR.

  // Fetch VQs related to this RFQ by ID
  const { data: vqList, isLoading: isVQListLoading, isFetching: isVQListFetching } = useQuery({
    queryKey: ['vq-list-for-qc-by-id', rfqId],
    queryFn: () => VQService.getVQsByRfqId(rfqId!),
    enabled: !!rfqId && isOpen,
  });

  // 🔍 DATA RECOVERY: Fetch full RFQ details to get vendor names (if VQ API is missing them)
  const { data: rfqDetail } = useQuery({
    queryKey: ['rfq-detail-for-qc', rfqId],
    queryFn: () => RFQService.getById(rfqId!),
    enabled: !!rfqId && isOpen,
  });

  // 🔍 Fetch winning VQ detail for items list (View Mode)
  const effectiveWinnerId = mode === 'view' ? (qcData?.winning_vq_id || winnerVQId) : winnerVQId;
  const { data: winnerVQDetail, isLoading: isWinnerVQDetailLoading } = useQuery({
    queryKey: ['vq-detail-for-view', effectiveWinnerId],
    queryFn: () => VQService.getById(Number(effectiveWinnerId)),
    enabled: !!effectiveWinnerId && mode === 'view' && isOpen,
  });

  // 🛰️ @Agent_Data_Bridge: Data Recovery Bridge for pr_id Persistence
  useEffect(() => {
    if (rfqDetail && rfqId) {
      // Type-safe normalization
      interface SafeRfqPayload { data?: RFQDetailResponse }
      const actualRfq = (rfqDetail as SafeRfqPayload)?.data || (rfqDetail as RFQDetailResponse);
      
      const recoveredPrId = actualRfq.pr_id;
      const recoveredPrNo = actualRfq.pr_no || actualRfq.ref_pr_no;

      if (recoveredPrId && (prId === null || prId === 0)) {
        console.log("QC_RECOVERY_SYNC:", { pr_id: recoveredPrId });
        setPRId(Number(recoveredPrId));
        
        if (!prNo || prNo === 'อ้างอิงจาก RFQ' || prNo === '-') {
          setPRNo(recoveredPrNo || `PR-ID: ${recoveredPrId}`);
        }
      }
    }
  }, [rfqDetail, rfqId, prId, prNo]);

  // 🗺️ VENDOR MAP: Deep data recovery for vendor names
  const rfqVendorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!rfqDetail) return map;

    // Type-safe normalization for potentially wrapped backend responses
    interface SafeRfqPayload { data?: RFQDetailResponse }
    const actualRfq = (rfqDetail as SafeRfqPayload)?.data || (rfqDetail as RFQDetailResponse);

    // Define local interface for nested mapping without 'any' or 'unknown'
    interface VendorData {
      rfq_vendor_id?: number;
      vendor_id?: number;
      vendor_name?: string;
      vendor?: {
        vendor_id?: number;
        vendor_name?: string;
        name_th?: string;
      };
    }

    // 1. Process 'vendors' array (Source: RFQ Detail)
    const vendors = (actualRfq.vendors || []) as VendorData[];
    vendors.forEach(v => {
      const vid = v.vendor_id || v.vendor?.vendor_id;
      const rvid = v.rfq_vendor_id;
      const vname = v.vendor_name || v.vendor?.vendor_name || v.vendor?.name_th;
      
      if (vname) {
          if (vid) map[String(vid)] = vname;
          if (rvid) map[String(rvid)] = vname;
      }
    });

    // 2. Process 'rfqVendors' array (Source: Junction Table)
    const rfqVendors = (actualRfq.rfqVendors || []) as VendorData[];
    rfqVendors.forEach(rv => {
      const vid = rv.vendor_id || rv.vendor?.vendor_id;
      const rvid = rv.rfq_vendor_id;
      const vname = rv.vendor?.vendor_name || rv.vendor?.name_th || rv.vendor_name;
      
      if (vname) {
          if (vid) map[String(vid)] = vname;
          if (rvid) map[String(rvid)] = vname;
      }
    });
    
    // 🚩 DEBUG LOG: Confirm map population (Removed)

    return map;
  }, [rfqDetail]);

  /** 🛡️ VENDOR DISPLAY HELPER: Ensures 100% name recovery or intelligent fallback */
  const getVendorDisplayName = (vq: VQListItem) => {
    const vidKey = vq.vendor_id ? String(vq.vendor_id) : '';
    const rvidKey = vq.rfq_vendor_id ? String(vq.rfq_vendor_id) : '';

    const displayName = 
      vq.vendor?.vendor_name || 
      vq.vendor_name || 
      vq.vendor?.name_th || 
      rfqVendorMap[vidKey] || 
      rfqVendorMap[rvidKey];
    
    // 🚩 DEBUG LOG: Trace elusive names (Removed)

    return displayName || `ผู้ขาย (อ้างอิง ${vq?.vq_no || vq?.quotation_no || '-'})`;
  };

  const availableVQs = useMemo(() => {
    return vqList?.data || [];
  }, [vqList]);

  // Vendor-Level Winner State (the core of simplified comparison)
  const { confirm } = useConfirmation();

  const selectedVQs = useMemo(() => {
    return availableVQs.filter((vq: VQListItem) => selectedVQIds.includes((vq.vq_header_id || vq.quotation_id!) as number));
  }, [availableVQs, selectedVQIds]);

  const toggleVQSelection = (vId: number) => {
    setSelectedVQIds((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId]
    );
    // If we deselect the current winner, clear the winner
    if (winnerVQId === vId) {
      setWinnerVQId(null);
    }
  };

  const { isSubmitting, handleSaveQC } = useQCForm(onSuccess, onClose);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Strict Reset on Close to prevent data bleeding
      setQCNo('');
      setPRNo('');
      setPRId(null);
      setRFQNo('');
      setRFQId(null);
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
      setWinnerVQId(null);
      setCreatedBy('');
      setDepartment('');
      return;
    }

    if (mode === 'create') {
      setQCNo(generateQCNumber());
      setPRNo(initialPRNo || '');
      setPRId(null);
      setRFQNo(initialRFQNo || '');
      setRFQId(null);
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
      setWinnerVQId(null);
      
      // Load Auth Context data
      if (user?.employee) {
        setCreatedBy(user.employee.employee_fullname);
        setEmployeeId(user.employee_id);
        setDepartmentId(user.employee.department_id);
        setDepartment('ฝ่ายที่เกี่ยวข้อง (กำลังระบุ...)');
      }
    }
  }, [isOpen, mode, initialPRNo, initialRFQNo, user]);

  // Auto-select all recorded VQs when the RFQ changes (Create/Edit mode)
  useEffect(() => {
    if (mode === 'view') return; // Don't auto-reset selection in view mode
    
    const safeVqList = vqList?.data || [];
    if (rfqId && safeVqList.length > 0) {
      const allFetchedVQs = safeVqList
        .map((vq: VQListItem) => vq.vq_header_id || vq.quotation_id!);
      if (allFetchedVQs.length > 0) {
        setSelectedVQIds(allFetchedVQs);
      }
    }
  }, [rfqId, vqList?.data, mode]);

  const handleSelectRFQ = (rfq: RFQHeader) => {
    setRFQNo(rfq.rfq_no);
    setRFQId(rfq.rfq_id);
    
    // 🔄 Reverse Sync: Fill PR & Department from RFQ (The absolute source of truth)
    const parentPrNo = rfq.ref_pr_no || rfq.pr_no || '';
    const parentPrId = rfq.pr_id;
    // @ts-expect-error - Handle extended RFQ fields not yet in interface but present in API response
    const parentDeptId = rfq.pr?.department_id || (rfq as unknown as Record<string, number>).department_id;

    if (parentPrNo) {
        setPRNo(parentPrNo);
    } else {
        setPRNo('อ้างอิงจาก RFQ'); // More descriptive than '-'
    }
    setPRId(parentPrId ? Number(parentPrId) : null);

    // Sync Department if available
    if (parentDeptId) {
        setDepartmentId(Number(parentDeptId));
        // Reset department name to trigger re-fetch if needed or clear stale name
        setDepartment('กำลังดึงข้อมูลแผนก...');
    }

    setIsRFQSelectorOpen(false);
    setSelectedVQIds([]);
    setWinnerVQId(null);
    toast.success(`เลือก RFQ ${rfq.rfq_no} และดึงข้อมูล PR สำเร็จ`);
  };

  const handleSelectPR = (pr: PRHeader) => {
    if (pr.pr_no !== prNo) {
        setPRNo(pr.pr_no);
        setPRId(pr.pr_id);
        // Cascading Clear: If PR changes, clear RFQ and VQs
        setRFQNo('');
        setRFQId(null);
        setSelectedVQIds([]);
        setWinnerVQId(null);
    }
    setIsPRSelectorOpen(false);
  };

  const handleClearPR = () => {
    setPRNo('');
    setPRId(null);
    // CASCADING CLEAR: Must also clear RFQ because it depends on PR
    setRFQNo('');
    setRFQId(null);
    setSelectedVQIds([]);
    setWinnerVQId(null);
  };

  const handleClearRFQ = () => {
    setRFQNo('');
    setRFQId(null);
    setSelectedVQIds([]);
    setWinnerVQId(null);
  };

  // Compute lowest Grand Total for highlighting
  const minGrandTotal = useMemo(() => {
    if (selectedVQs.length === 0) return 0;
    const totals = selectedVQs
      .map((vq: VQListItem) => Number(vq.total_amount || vq.base_total_amount) || 0)
      .filter((t: number) => t > 0);
    return totals.length > 0 ? Math.min(...totals) : 0;
  }, [selectedVQs]);

  // Per the pro-tip: we derive item_id, qty, unit, and unit_price from the winning VQ's lines,
  // with sensible defaults so Zod does not reject the payload.
  const handleSave = async () => {
    if (!winnerVQId) {
      toast.error('กรุณาเลือกผู้เสนอราคาที่ชนะก่อนบันทึก');
      return;
    }

    const winnerVQ = selectedVQs.find((vq: VQListItem) => (vq.vq_header_id || vq.quotation_id) === winnerVQId);
    if (!winnerVQ) {
      toast.error('ไม่พบข้อมูลผู้เสนอราคาที่เลือก');
      return;
    }

    if (!rfqId) {
      toast.error('ไม่พบรหัส RFQ กรุณาเลือก RFQ อีกครั้ง');
      return;
    }

    // 🎨 UI Fix: Find winner name for confirmation modal
    const winner = availableVQs.find(v => (v.vq_header_id || v.quotation_id) === winnerVQId);
    const winnerDisplayName = winner ? getVendorDisplayName(winner) : `ใบเสนอราคาเลขที่ ${winnerVQId}`;

    const isConfirmed = await confirm({
      title: 'ยืนยันการบันทึกผล (Create QC)',
      description: `คุณต้องการยืนยันการเลือกผู้ชนะคือ "${winnerDisplayName}" และบันทึกผลการเปรียบเทียบราคาใช่หรือไม่?`,
      confirmText: 'ยืนยันการเลือกผู้ชนะ',
      cancelText: 'ตรวจสอบอีกครั้ง',
      variant: 'warning',
    });

    if (!isConfirmed) return;

    // Call the purified hook logic
    await handleSaveQC({
      rfq_id: rfqId,
      pr_id: prId || 0, // Force number, fallback to 0 per Zero-Tolerance
      department_id: departmentId || user?.employee?.department_id || 1, // Fallback to User's Dept if missing
      winning_vq_id: winnerVQId,
      created_by: employeeId || Number(user?.employee_id || 1),
    });
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
        title={mode === 'view' ? "รายละเอียดใบเปรียบเทียบราคา (Quote Comparison)" : "สร้างใบเปรียบเทียบราคา (Quote Comparison)"}
        titleIcon={
          <div className="bg-blue-500 p-1.5 rounded-md">
            <Scale size={16} strokeWidth={2.5} />
          </div>
        }
        headerColor={`${mode === 'view' ? 'bg-slate-700' : 'bg-blue-600'} [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden`}
        footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mode === 'view' ? 'ปิด' : 'ยกเลิก'}
            </button>
            {mode !== 'view' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !winnerVQId}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                บันทึก
              </button>
            )}
          </div>
        }
      >
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4 space-y-4">
          
          {/* 🏆 Section: Winner Highlight (View mode only) */}
          {mode === 'view' && (
            <div className={`rounded-xl border-2 p-6 transition-all shadow-lg ${
              qcData?.winning_vq_id 
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 dark:from-amber-900/10 dark:to-orange-900/10 dark:border-amber-700' 
                : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${
                    qcData?.winning_vq_id ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-200 dark:bg-gray-800'
                  }`}>
                    <Trophy size={32} className={qcData?.winning_vq_id ? 'text-amber-500 fill-amber-400' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest mb-1">
                      {qcData?.winning_vq_id ? 'ผู้ชนะการเสนอราคา (Winner Selected)' : 'ยังไม่มีการเลือกผู้ชนะ'}
                    </h2>
                    {qcData?.winning_vq_id || initialData?.vq_header_id || winnerVQId ? (
                      <>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                          {qcData?.vendor_name || initialData?.vendor_name || initialData?.lowest_bidder_name || winnerVQDetail?.vendor_name || 'ไม่ระบุชื่อผู้ขาย'}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                           <span className="flex items-center gap-1">
                              <FileText size={14} /> ใบเสนอราคา: {winnerVQDetail?.vq_no || 'กำลังโหลด...'}
                           </span>
                           <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                           <span>สถานะ: {(qcData?.status || initialData?.status) === 'COMPLETED' ? 'ยืนยันผลแล้ว' : 'แบบร่าง'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic">กรุณารอดำเนินการเปรียบเทียบราคาและคัดเลือกผู้ชนะ</div>
                    )}
                  </div>
                </div>

                { (qcData?.winning_vq_id || initialData?.vq_header_id) && (
                  <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-4 rounded-xl border border-white dark:border-gray-800 shadow-sm text-right">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ยอดรวมที่เสนอ (Net Amount)</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {Number(qcData?.vq_total_amount || initialData?.vq_total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-sm ml-1.5 font-bold">THB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Document Header */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
              <FileText size={18} />
              <h3 className="font-bold">ข้อมูลหัวเอกสาร</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* เลขที่ใบเปรียบเทียบราคา */}
              <div>
                <label className={labelClass}>เลขที่ใบเปรียบเทียบราคา *</label>
                <input
                  type="text"
                  value={qcNo}
                  readOnly
                  disabled={true}
                  className={`${inputClass} font-bold text-indigo-600 bg-gray-50`}
                />
              </div>

              {/* เลขที่ PR อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ PR อ้างอิง *</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={prNo}
                    readOnly
                    disabled={mode === 'view'}
                    placeholder="คลิกเลือก PR..."
                    className={`${inputClass} pr-10 cursor-pointer group-hover:border-blue-400 transition-colors`}
                    onClick={() => mode !== 'view' && setIsPRSelectorOpen(true)}
                  />
                  {mode !== 'view' && (
                    <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
                      {prNo && (
                        <button
                          type="button"
                          onClick={handleClearPR}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="ล้างค่า PR"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsPRSelectorOpen(true)}
                        className="h-7 px-2 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-1 text-xs font-bold"
                      >
                        <Search size={14} /> เลือก
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* เลขที่ RFQ อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ RFQ อ้างอิง *</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={rfqNo}
                    readOnly
                    disabled={mode === 'view'}
                    placeholder="คลิกเลือก RFQ..."
                    className={`${inputClass} pr-10 cursor-pointer group-hover:border-blue-400 transition-colors`}
                    onClick={() => mode !== 'view' && setIsRFQSelectorOpen(true)}
                  />
                  {mode !== 'view' && (
                    <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
                      {rfqNo && (
                        <button
                          type="button"
                          onClick={handleClearRFQ}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="ล้างค่า RFQ"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsRFQSelectorOpen(true)}
                        className="h-7 px-2 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-1 text-xs font-bold"
                      >
                        <Search size={14} /> เลือก
                      </button>
                    </div>
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
                  disabled={mode === 'view'}
                  className={`${inputClass} ${mode === 'view' ? 'bg-gray-50' : ''}`}
                />
              </div>

              {/* ผู้จัดทำ */}
              <div>
                <label className={labelClass}>ผู้จัดทำ</label>
                <input
                  type="text"
                  value={createdBy}
                  readOnly
                  disabled={true}
                  className={`${inputClass} bg-gray-50`}
                />
              </div>

              {/* แผนก */}
              <div>
                <label className={labelClass}>แผนก</label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  disabled={true}
                  className={`${inputClass} bg-gray-50`}
                />
              </div>
            </div>
          </div>

          {/* Section: Vendor Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <h3 className="font-bold">เลือกใบเสนอราคาเพื่อเปรียบเทียบ</h3>
              </div>

              {availableVQs.length > 0 && mode !== 'view' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVQIds(availableVQs.map((v: VQListItem) => (v.vq_header_id || v.quotation_id) as number))}
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

            {isVQListLoading || (rfqId && isVQListFetching) || (rfqId && !rfqDetail) ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-gray-500 animate-pulse">กำลังดึงข้อมูลใบเสนอราคา (VQ List)...</div>
              </div>
            ) : rfqId && availableVQs.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle size={16} />
                <span className="text-sm">
                  ไม่พบใบเสนอราคา (VQ) ใดๆ สำหรับ RFQ นี้
                </span>
              </div>
            ) : availableVQs.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                กรุณาเลือก RFQ อ้างอิงด้านบนเพื่อโหลดใบเสนอราคา
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVQs.map((vq: VQListItem) => {
                  const vId = (vq.vq_header_id || vq.quotation_id!) as number;
                  const isSelected = selectedVQIds.includes(vId);
                  return (
                    <div
                      key={vId}
                      onClick={() => mode !== 'view' && toggleVQSelection(vId)}
                      className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                        mode !== 'view' ? 'cursor-pointer' : 'cursor-default'
                      } ${
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
                          title={vq.vq_no || vq.quotation_no || undefined}
                        >
                          {vq.vq_no || vq.quotation_no || 'ไม่มีเลขที่ VQ'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span className="truncate mr-2" title={getVendorDisplayName(vq)}>
                            {getVendorDisplayName(vq)}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0">
                            {Number(vq.total_amount || vq.base_total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                <h3 className="font-bold">สรุปราคาและเลือกผู้ชนะ</h3>
                {!winnerVQId && (
                  <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    ⚠ กรุณาเลือกผู้ชนะ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedVQs.map((vq: VQListItem) => {
                  const vId = (vq.vq_header_id || vq.quotation_id!) as number;
                  const grandTotal = Number(vq.total_amount || vq.base_total_amount) || 0;
                  const isLowest = grandTotal > 0 && grandTotal === minGrandTotal;
                  const isWinner = winnerVQId === vId;

                  return (
                    <div
                      key={vId}
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
                          title={getVendorDisplayName(vq)}
                        >
                          {getVendorDisplayName(vq)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {vq.vq_no || vq.quotation_no || 'ยังไม่มีเลขที่'}
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
                      {mode !== 'view' ? (
                        <button
                          type="button"
                          onClick={() => setWinnerVQId(winnerVQId === vId ? null : vId)}
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
                      ) : (
                        isWinner && (
                          <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Trophy size={16} />
                            ผู้ชนะในรายการนี้
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary Footer */}
              {winnerVQId && (() => {
                const winnerVQ = selectedVQs.find((v: VQListItem) => (v.vq_header_id || v.quotation_id) === winnerVQId);
                return winnerVQ ? (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Trophy size={16} />
                      <span className="font-medium text-sm">
                        ผู้ชนะการเสนอราคา: <strong>{getVendorDisplayName(winnerVQ)}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">ราคารวม</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {Number(winnerVQ.total_amount || winnerVQ.base_total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* 📦 Section: Items Summary (View mode with winner) */}
          {mode === 'view' && effectiveWinnerId && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                 <ShoppingBag size={18} className="text-blue-600" />
                 <h3 className="font-bold">รายการสินค้าตามใบเสนอราคาที่คัดเลือก</h3>
               </div>
               
               {isWinnerVQDetailLoading ? (
                 <div className="p-8 text-center text-gray-500 text-sm italic">กำลังดึงรายการสินค้า...</div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 w-16">#</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300">รหัส/ชื่อสินค้า</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300 w-24">จำนวน</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300 w-24">หน่วย</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300 w-32">ราคา/หน่วย</th>
                          <th className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 w-36">รวมเงิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {(winnerVQDetail?.vq_lines || []).map((line, idx) => (
                          <tr key={line.quotation_line_id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900 dark:text-gray-100">{line.item_name}</div>
                              <div className="text-xs text-gray-500">{line.item_code}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">{line.qty.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center text-gray-500">{line.uom_name || line.uom || '-'}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{(line.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {(line.net_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                         <tr>
                            <td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-500 uppercase tracking-wider">Total Summary</td>
                            <td className="px-4 py-4 text-right">
                               <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  {Number(winnerVQDetail?.total_amount || winnerVQDetail?.base_total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                               </div>
                            </td>
                         </tr>
                      </tfoot>
                   </table>
                 </div>
               )}
            </div>
          )}
        </div>
      </WindowFormLayout>

      {/* RFQ Selector Modal (Unlocked & Reverse Sync) */}
      <RFQSelectionModal
        isOpen={isRFQSelectorOpen}
        onClose={() => setIsRFQSelectorOpen(false)}
        onSelect={handleSelectRFQ}
        prId={prId}
        prNo={prNo}
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
