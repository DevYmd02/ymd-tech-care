/**
 * @file QCFormModal.tsx
 * @description Modal สำหรับสร้างใบเปรียบเทียบราคา (Quote Comparison) — Vendor-Level Comparison
 * @version 3.0 — Simplified from item-level matrix to vendor-level winner selection
 * @backup The complex matrix version is preserved in _backup_v2/QCMatrixTable.tsx & _backup_v2/useQCMatrix.ts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormProvider } from 'react-hook-form';
import { AlertCircle, FileText, Search, Scale, CheckSquare, Square, Trophy, CheckCircle2, Circle, X, ShoppingBag } from 'lucide-react';
import { WindowFormLayout } from '@ui';

import { QCService } from '@/modules/procurement/services/qc.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import type { RFQHeader, VQListItem, RFQDetailResponse } from '@/modules/procurement/types';

import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import { SelectionModal } from './SelectionModal';

/** Extended interface for selection modals to handle backend fields not in base RFQHeader */
interface ExtendedRFQHeader extends RFQHeader {
  av_no?: string;
  rfq_remark?: string;
}
import { RFQSelectionModal } from './RFQSelectionModal';
import { OrgEmployeeService } from '@/modules/master-data/company/services/employee.service';
import { useQCForm } from '../hooks/useQCForm';
import { useConfirmation } from '@/shared/hooks';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils';

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
  return 'ระบบจะกรอกอัตโนมัติ';
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
  const { toast } = useToast();

  // Form Hook
  const { methods, onSubmit, onInvalid, isSubmitting: isFormSubmitting, onClose: handleClose } = useQCForm(onSuccess, onClose, mode === 'view');
  const { setValue, watch } = methods;

  // Watch Form Values
  const rfqId = watch('rfq_id');
  const winnerVQId = watch('winning_vq_id');

  // Custom Payload Context Watches
  const prId = watch('pr_id');

  // Display States (UI only)
  const [qcNo, setQCNo] = useState('');
  const [prNo, setPRNo] = useState('');
  const [avNo, setAVNo] = useState('');
  const [rfqNo, setRFQNo] = useState('');
  const [qcDate, setQCDate] = useState(getTodayFormatted());
  const [createdBy, setCreatedBy] = useState('');

  const [isRFQSelectorOpen, setIsRFQSelectorOpen] = useState(false);
  const [isPRSelectorOpen, setIsPRSelectorOpen] = useState(false);
  const [isAVSelectorOpen, setIsAVSelectorOpen] = useState(false);
  const [selectedVQIds, setSelectedVQIds] = useState<number[]>([]);

  // Fetch Existing QC Data — Only fetch full detail when in EDIT mode where we need to update.
  // In VIEW mode, initialData and list-level queries provide enough context.
  const { data: qcData } = useQuery({
    queryKey: ['qc-detail', qcId],
    queryFn: () => QCService.getById(Number(qcId)),
    enabled: !!qcId && mode === 'edit', // 🛡️ EXCLUSION: Skip for 'view' to prevent 404 noise and redundant traffic
    retry: false, 
  });


  useEffect(() => {
    // SCENARIO 1: Deep Hydration from API (Edit Mode Only)
    if (qcData && mode === 'edit') {
      const actualQCData = (qcData as Record<string, unknown>)?.data as Record<string, unknown> || qcData as Record<string, unknown>;
      setQCNo(String(actualQCData.qc_no || ''));
      setPRNo(String(actualQCData.ref_pr_no || actualQCData.pr_no || ''));
      setAVNo(String(actualQCData.approved_pr_no || actualQCData.av_no || ''));
      setValue('pr_id', Number(actualQCData.pr_id) || null);
      setRFQNo(String(actualQCData.rfq_no || ''));

      setValue('rfq_id', Number(actualQCData.rfq_id || actualQCData.rfq_header_id) || 0);
      
      const compDate = actualQCData.comparison_date;
      setQCDate(compDate ? new Date(compDate as string | number | Date).toLocaleDateString('en-GB') : getTodayFormatted());
      
      setValue('winning_vq_id', Number(actualQCData.winning_vq_id || actualQCData.vq_header_id) || 0);
      
      const remarkVal = String(actualQCData?.remark || actualQCData?.remarks || '');
      setValue('remarks', remarkVal);
      
      const creatorName = String(actualQCData?.created_by_name || actualQCData?.creator_name || actualQCData?.employee_name || '');
      if (creatorName) setCreatedBy(creatorName);

      const winnerId = actualQCData?.winning_vq_id || actualQCData.vq_header_id;
      if (winnerId) setSelectedVQIds([Number(winnerId)]);
    } 
    // SCENARIO 2: Resilient Hydration from initialData (View mode or Fallback)
    else if (initialData && (mode === 'view' || mode === 'edit')) {
      const actualInitial = (initialData as Record<string, unknown>)?.data as Record<string, unknown> || initialData as Record<string, unknown>;
      
      // Mandatory Mapping: List items often use 'rfq_header_id' while form expects 'rfq_id'
      const mappedRfqId = actualInitial.rfq_id || actualInitial.rfq_header_id;
      const mappedWinnerId = actualInitial.winning_vq_id || actualInitial.vq_header_id;

      setQCNo(String(actualInitial.qc_no || ''));
      setPRNo(String(actualInitial.ref_pr_no || actualInitial.pr_no || ''));
      setAVNo(String(actualInitial.approved_pr_no || actualInitial.av_no || ''));
      setRFQNo(String(actualInitial.rfq_no || ''));
      
      const compDate = actualInitial.comparison_date;
      const createdAt = actualInitial.created_at;
      setQCDate(compDate ? new Date(compDate as string | number | Date).toLocaleDateString('en-GB') : (createdAt ? new Date(createdAt as string | number | Date).toLocaleDateString('en-GB') : getTodayFormatted()));
      
      setValue('rfq_id', Number(mappedRfqId) || 0);
      setValue('winning_vq_id', Number(mappedWinnerId) || 0);

      const remarkVal = String(actualInitial.remark || actualInitial.remarks || '');
      setValue('remarks', remarkVal);

      const creatorName = String(actualInitial.created_by_name || actualInitial.creator_name || actualInitial.employee_name || '');
      if (creatorName) setCreatedBy(creatorName);

      if (mappedWinnerId) setSelectedVQIds([Number(mappedWinnerId)]);
      
      logger.debug('🛡️ [QCFormModal] Legitimate Hydration from initialData (Console Cleanse Mode)');
    }
  }, [qcData, initialData, mode, setValue]);

  // 👤 EFFECT: Fetch Creator Name if missing but ID is present
  useEffect(() => {
    const actualQC = (qcData as Record<string, unknown>)?.data as Record<string, unknown> || qcData as Record<string, unknown>;
    const actualInitial = (initialData as Record<string, unknown>)?.data as Record<string, unknown> || initialData as Record<string, unknown>;
    const creatorId = (actualQC?.created_by || actualInitial?.created_by) as number;
    
    if (creatorId && !createdBy && (mode === 'view' || mode === 'edit')) {
      logger.debug('👤 [QCFormModal] Attempting to fetch creator name for ID:', creatorId);
      OrgEmployeeService.get(creatorId).then((response: unknown) => {
        const emp = (response as Record<string, unknown>)?.data as Record<string, unknown> || response as Record<string, unknown>;
        const name = String(emp?.employee_name || emp?.first_name || emp?.first_name_th || emp?.employee_name_th || '');
        if (name) {
          logger.debug('✅ [QCFormModal] Found creator name:', name);
          setCreatedBy(name);
        }
      }).catch(err => logger.warn('[QCFormModal] Failed to fetch creator employee name:', err));
    }
  }, [qcData, initialData, createdBy, mode]);

  const { data: waitingList, isLoading: isWaitingListLoading } = useQuery({
    queryKey: ['waiting-for-qc-list', isOpen],
    queryFn: async () => {
      try {
        const response = await QCService.getWaitingForQC() as unknown as Record<string, unknown>;
        
        // 🎯 EXACT API BINDING: Use strictly the documents returned by the waiting-for-qc endpoint.
        // The backend already implements the business rules on what is eligible for QC creation.
        // (Previously, this failed because the response is { data: [...] } not an array itself)
        const waitingItems = Array.isArray(response) ? response : (response?.data as RFQHeader[] || []);
        
        return waitingItems;
      } catch (err) {
        logger.error('❌ [QCFormModal] Failed to fetch waiting list:', err);
        return [];
      }
    },
    enabled: isOpen,
  });

  // 📝 NEW QUERIES: AV selector now uses the 'waitingList' directly per user request.
  // We no longer fetch from AVService specifically, to ensure all 3 fields draw from the exact same API node.
  
  // Data Integrity Bridge: Clear selected VQs and winner if RFQ No changes
  useEffect(() => {
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0, { shouldValidate: true });
  }, [rfqNo, setValue]);

  // Note: Data Integrity Bridge #2 (belonging check) is now naturally handled 
  // by RFQSelectionModal's filtering and the clear-on-change effect in handleSelectPR.

  // Fetch VQs related to this RFQ by ID
  const { data: vqList, isLoading: isVQListLoading, isFetching: isVQListFetching } = useQuery({
    queryKey: ['vq-list-for-qc-by-id', rfqId],
    queryFn: async () => {
      if (!rfqId) return { data: [] as VQListItem[] };
      const items = (await QCService.getVQsWaitingForQC(Number(rfqId))) as unknown as VQListItem[];
      return { data: items || [] };
    },
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
      const recoveredPrNo = actualRfq.ref_pr_no || actualRfq.pr_no || '';
      const recoveredAvNo = actualRfq.approved_pr_no || (actualRfq as unknown as Record<string, unknown>).av_no as string || '';

      if (recoveredPrId && (prId === null || prId === 0)) {
        setValue('pr_id', Number(recoveredPrId));

        if (!prNo || prNo === '-') {
            setPRNo(recoveredPrNo);
        }
        
        if (!avNo || avNo === 'อ้างอิงจาก RFQ' || avNo === '-') {
          setAVNo(recoveredAvNo || (recoveredPrNo ? `รอ AV (${recoveredPrNo})` : '-'));
        }
      }
    }
  }, [rfqDetail, rfqId, prId, avNo, prNo, setValue]);

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
    return availableVQs.filter((vq: VQListItem) => selectedVQIds.includes((vq.vq_header_id || (vq as unknown as Record<string, unknown>).vq_id || vq.quotation_id!) as number));
  }, [availableVQs, selectedVQIds]);

  const toggleVQSelection = (vId: number) => {
    setSelectedVQIds((prev) => {
      const isSelected = prev.includes(vId);
      if (isSelected) {
        return prev.filter((id) => id !== vId);
      } else {
        if (prev.length >= 3) {
          toast('เลือกเปรียบเทียบได้สูงสุด 3 รายการเท่านั้น', 'warning');
          return prev;
        }
        return [...prev, vId];
      }
    });

    // If we deselect the current winner, clear the winner
    if (winnerVQId === vId) {
       setValue('winning_vq_id', 0, { shouldValidate: true });
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Strict Reset on Close to prevent data bleeding
      setQCNo('');
      setPRNo('');
      setAVNo('');
      setValue('pr_id', null);
      setRFQNo('');

      setValue('rfq_id', 0);
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
      setValue('winning_vq_id', 0);
      setCreatedBy('');
      return;
    }

    if (mode === 'create') {
      setQCNo(generateQCNumber());
      setPRNo(initialPRNo || '');
      setAVNo('');
      setValue('pr_id', null);
      setRFQNo(initialRFQNo || '');

      setValue('rfq_id', 0);
      setQCDate(getTodayFormatted());
      setSelectedVQIds([]);
      setValue('winning_vq_id', 0);
      
      // Load Auth Context data
      if (user?.employee) {
        setCreatedBy(user.employee.employee_fullname);
        setValue('created_by', user.employee_id);
        setValue('department_id', user.employee.department_id);
      }

    }
  }, [isOpen, mode, initialPRNo, initialRFQNo, user, setValue]);

  // Auto-select all recorded VQs when the RFQ changes (Create/Edit mode)
  useEffect(() => {
    if (mode === 'view') return; // Don't auto-reset selection in view mode
    
    const safeVqList = Array.isArray(vqList?.data) ? vqList.data : [];
    if (rfqId && safeVqList.length > 0) {
      // 🛡️ Anti-Bias Guard: Auto-select only if <= 3 items
      if (safeVqList.length <= 3) {
        const allFetchedVQs = safeVqList
          .map((vq: VQListItem) => vq.vq_header_id || (vq as unknown as Record<string, unknown>).vq_id as number || vq.quotation_id!);
        if (allFetchedVQs.length > 0) {
          setSelectedVQIds(allFetchedVQs);
        }
      } else {
        // > 3 items: Do not auto-select, force user to pick
        setSelectedVQIds([]);
      }
    }
  }, [rfqId, vqList, mode]);


  const handleSelectRFQ = (rfq: RFQHeader) => {
    setRFQNo(rfq.rfq_no);
    setValue('rfq_id', rfq.rfq_id, { shouldValidate: true });
    
    // 🔄 Reverse Sync: Fill PR & Department from RFQ (The absolute source of truth)
    const parentPrNo = rfq.ref_pr_no || rfq.pr_no || '';
    const parentPrId = rfq.pr_id;
    const parentAvNo = rfq.approved_pr_no || (rfq as unknown as Record<string, unknown>).av_no as string || '';
    // @ts-expect-error - Handle extended RFQ fields not yet in interface but present in API response
    const parentDeptId = rfq.pr?.department_id || (rfq as unknown as Record<string, number>).department_id;

    if (parentPrNo) {
        setPRNo(parentPrNo);
    } else {
        setPRNo('-');
    }

    if (parentAvNo) {
        setAVNo(parentAvNo);
    } else {
        setAVNo(parentPrNo ? `รอ AV (${parentPrNo})` : 'อ้างอิงจาก RFQ');
    }

    setValue('pr_id', parentPrId ? Number(parentPrId) : null);

    // Sync Department if available
    if (parentDeptId) {
        setValue('department_id', Number(parentDeptId));
    }


    setIsRFQSelectorOpen(false);
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
    toast(`เลือก RFQ ${rfq.rfq_no} และดึงข้อมูล PR สำเร็จ`, 'success');
  };


  const handleSelectPR = (item: RFQHeader) => {
    const parentPrNo = item.ref_pr_no || item.pr_no || '';
    const parentPrId = item.pr_id;
    const parentAvNo = (item as unknown as Record<string, unknown>).av_no as string || item.approved_pr_no || '';
    
    setPRNo(parentPrNo || '-');
    setAVNo(parentAvNo || (parentPrNo ? `รอ AV (${parentPrNo})` : 'อ้างอิงจาก RFQ'));
    setValue('pr_id', parentPrId ? Number(parentPrId) : null);
    
    if (item.rfq_no) {
        setRFQNo(item.rfq_no);
        setValue('rfq_id', item.rfq_id, { shouldValidate: true });
        toast(`เลือก PR และดึงข้อมูลที่เกี่ยวข้องสำเร็จ`, 'success');
    } else {
        setRFQNo('');
        setValue('rfq_id', 0);
    }
    
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
    setIsPRSelectorOpen(false);
  };

  const handleClearPR = () => {
    setPRNo('');
    setAVNo('');
    setValue('pr_id', null);
    setRFQNo('');

    setValue('rfq_id', 0);
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
  };



  const handleSelectActualAV = (item: RFQHeader) => {
    // Both PR, AV, and RFQ inputs share the exact same source of truth object
    const parentPrNo = item.ref_pr_no || item.pr_no || '';
    const parentPrId = item.pr_id;
    const parentAvNo = (item as unknown as Record<string, unknown>).av_no as string || item.approved_pr_no || '';
    
    setPRNo(parentPrNo || '-');
    setAVNo(parentAvNo || (parentPrNo ? `รอ AV (${parentPrNo})` : 'อ้างอิงจาก RFQ'));
    setValue('pr_id', parentPrId ? Number(parentPrId) : null);
    
    if (item.rfq_no) {
        setRFQNo(item.rfq_no);
        setValue('rfq_id', item.rfq_id, { shouldValidate: true });
        toast(`เลือก AV และดึงข้อมูลที่เกี่ยวข้องสำเร็จ`, 'success');
    } else {
        setRFQNo('');
        setValue('rfq_id', 0);
    }
    
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
    setIsAVSelectorOpen(false);
  };


  const handleClearAV = () => {
    setPRNo('');
    setAVNo('');
    setValue('pr_id', null);
    setRFQNo('');

    setValue('rfq_id', 0);
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
  };

  const handleClearRFQ = () => {
    setRFQNo('');
    setPRNo('');
    setAVNo('');
    setValue('rfq_id', 0);
    setSelectedVQIds([]);
    setValue('winning_vq_id', 0);
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
      toast('กรุณาเลือกผู้เสนอราคาที่ชนะก่อนบันทึก', 'error');
      return;
    }

    const winnerVQ = selectedVQs.find((vq: VQListItem) => (vq.vq_header_id || (vq as unknown as Record<string, unknown>).vq_id || vq.quotation_id) === winnerVQId);
    if (!winnerVQ) {
      toast('ไม่พบข้อมูลผู้เสนอราคาที่เลือก', 'error');
      return;
    }

    if (!rfqId) {
      toast('ไม่พบรหัส RFQ กรุณาเลือก RFQ อีกครั้ง', 'error');
      return;
    }

    const winner = availableVQs.find(v => (v.vq_header_id || (v as unknown as Record<string, unknown>).vq_id || v.quotation_id) === winnerVQId);
    const winnerDisplayName = winner ? getVendorDisplayName(winner) : `ใบเสนอราคาเลขที่ ${winnerVQId}`;

    const isConfirmed = await confirm({
      title: 'ยืนยันการบันทึกผล (Create QC)',
      description: `คุณต้องการยืนยันการเลือกผู้ชนะคือ "${winnerDisplayName}" และบันทึกผลการเปรียบเทียบราคาใช่หรือไม่?`,
      confirmText: 'ยืนยันการเลือกผู้ชนะ',
      cancelText: 'ตรวจสอบอีกครั้ง',
      variant: 'warning',
    });

    if (!isConfirmed) return;

    // Trigger Form Submission via React Hook Form
    // This will validate and then call the onSubmit from useQCForm
    methods.handleSubmit(onSubmit, onInvalid)();
  };


  // Styles
  const inputClass =
    'w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white';
  const labelClass = 'block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1';

  return (
    <FormProvider {...methods}>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={handleClose}
        title={mode === 'view' ? "รายละเอียดใบเปรียบเทียบราคา (Quote Comparison)" : "สร้างใบเปรียบเทียบราคา (Quote Comparison)"}
        titleIcon={
          <div className="bg-white/20 p-1.5 rounded-md shadow-sm">
            <Scale size={16} strokeWidth={2} />
          </div>
        }
        headerColor={`${mode === 'view' ? 'bg-purple-600' : 'bg-blue-600'} [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden`}
        footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isFormSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mode === 'view' ? 'ปิด' : 'ยกเลิก'}
            </button>
            {mode !== 'view' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isFormSubmitting || !winnerVQId}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                บันทึก
              </button>
            )}
          </div>
        }
      >

        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-4 space-y-4">
          
          {/* 🏆 Section: Winner Highlight (View mode only) */}
          {mode === 'view' && (() => {
            const hasWinner = !!(qcData?.winning_vq_id || initialData?.vq_header_id || winnerVQId);
            return (
              <div className={`rounded-xl border-2 p-6 transition-all shadow-lg ${
                hasWinner 
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-300 dark:from-indigo-900/10 dark:to-purple-900/10 dark:border-purple-700' 
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${
                      hasWinner ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-200 dark:bg-gray-800'
                    }`}>
                      <Trophy size={32} className={hasWinner ? 'text-purple-500 fill-purple-400' : 'text-gray-400'} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest mb-1">
                        {hasWinner ? 'ผู้ชนะการเสนอราคา (Winner Selected)' : 'ยังไม่มีการเลือกผู้ชนะ'}
                      </h2>
                    {qcData?.winning_vq_id || initialData?.vq_header_id || winnerVQId ? (() => {
                      const effWinnerId = Number(qcData?.winning_vq_id || initialData?.vq_header_id || winnerVQId);
                      const winnerVq = availableVQs.find((v: VQListItem) => (v.vq_header_id || (v as unknown as Record<string, unknown>).vq_id || v.quotation_id) === effWinnerId);
                      const winnerVqNo = winnerVq?.vq_no || winnerVq?.quotation_no || winnerVQDetail?.vq_no || 'กำลังโหลด...';

                      return (
                      <>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                          {qcData?.vendor_name || initialData?.vendor_name || initialData?.lowest_bidder_name || winnerVQDetail?.vendor_name || winnerVq?.vendor_name || 'ไม่ระบุชื่อผู้ขาย'}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                           <span className="flex items-center gap-1">
                              <FileText size={14} /> ใบเสนอราคา: {winnerVqNo}
                           </span>
                        </div>
                      </>
                      );})() : (
                      <div className="text-gray-500 italic">กรุณารอดำเนินการเปรียบเทียบราคาและคัดเลือกผู้ชนะ</div>
                    )}
                  </div>
                </div>

                { !!(qcData?.winning_vq_id || initialData?.vq_header_id) && (
                  <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/30 shadow-sm text-right">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ยอดรวมที่เสนอ (Net Amount)</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {Number(qcData?.vq_total_amount || initialData?.vq_total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-sm ml-1.5 font-bold">THB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );})()}

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
                  className={`${inputClass} font-bold text-indigo-600 bg-gray-50 ${qcNo.includes('ระบบ') ? 'italic font-normal' : ''}`}
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
                    placeholder="เลขที่ PR..."
                    className={`${inputClass} pr-10 cursor-pointer group-hover:border-blue-400 transition-colors bg-blue-50/30 font-medium`}
                    onClick={() => mode !== 'view' && setIsPRSelectorOpen(true)}
                  />
                  {mode !== 'view' && (
                    <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
                      {prNo && (
                        <button
                          type="button"
                          onClick={handleClearPR}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="ล้างค่า"
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
                <label className={labelClass}>
                  เลขที่ RFQ อ้างอิง * 
                  {rfqDetail && (
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({rfqDetail._count?.rfqVendors || rfqDetail.vendor_count || rfqDetail.vendor_total || (rfqDetail as unknown as Record<string, unknown>).rfq_vendor_count as number || rfqDetail.sent_vendors_count || rfqDetail.responded_vendors_count || rfqDetail.rfqVendors?.length || rfqDetail.vendors?.length || (rfqDetail.vendor_name ? rfqDetail.vendor_name.split(',').length : 0)} ราย)
                    </span>
                  )}
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={rfqNo}
                    readOnly
                    disabled={mode === 'view'}
                    placeholder="คลิกเลือก RFQ..."
                    className={`${inputClass} pr-10 cursor-pointer group-hover:border-blue-400 transition-colors font-medium`}
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

              {/* เลขที่ AV อ้างอิง */}
              <div>
                <label className={labelClass}>เลขที่ AV อ้างอิง *</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={avNo}
                    readOnly
                    disabled={mode === 'view'}
                    placeholder="เลขที่ AV..."
                    className={`${inputClass} pr-10 cursor-pointer group-hover:border-blue-400 transition-colors bg-blue-50/30 font-medium`}
                    onClick={() => mode !== 'view' && setIsAVSelectorOpen(true)}
                  />
                  {mode !== 'view' && (
                    <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
                      {avNo && (
                        <button
                          type="button"
                          onClick={handleClearAV}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          title="ล้างค่า"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsAVSelectorOpen(true)}
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

              {/* หมายเหตุ (Remark) */}
              <div className="md:col-span-3">
                <label className={labelClass}>หมายเหตุ (Remark)</label>
                <textarea
                  {...methods.register('remarks')}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                  disabled={mode === 'view'}
                  rows={2}
                  className={`${inputClass} h-auto py-2 resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Section: Vendor Selection */}
          {mode !== 'view' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <h3 className="font-bold">เลือกใบเสนอราคาเพื่อเปรียบเทียบ</h3>
              </div>

              {availableVQs.length > 0 && availableVQs.length <= 3 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVQIds(availableVQs.map((v: VQListItem) => (v.vq_header_id || v.vq_id || v.quotation_id) as number))}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedVQIds([]); setValue('winning_vq_id', 0, { shouldValidate: true }); }}
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
                กรุณาเลือก AV หรือ RFQ อ้างอิงด้านบนเพื่อโหลดใบเสนอราคา
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableVQs.map((vq: VQListItem, index: number) => {
                  const vId = (vq.vq_header_id || vq.vq_id || vq.quotation_id!) as number;
                  const keyId = vId ? `vq-${vId}` : `vq-idx-${index}`;
                  const isSelected = selectedVQIds.includes(vId);
                  const isDisabled = !isSelected && selectedVQIds.length >= 3;

                  return (
                    <div
                      key={keyId}
                      onClick={() => {
                        if (!isDisabled) {
                          toggleVQSelection(vId);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                        !isDisabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'
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
          )}

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
                {selectedVQs.map((vq: VQListItem, index: number) => {
                  const vId = (vq.vq_header_id || vq.vq_id || vq.quotation_id!) as number;
                  const keyId = vId ? `vq-sel-${vId}` : `vq-sel-idx-${index}`;
                  const grandTotal = Number(vq.total_amount || vq.base_total_amount) || 0;
                  const isLowest = grandTotal > 0 && grandTotal === minGrandTotal;
                  const isWinner = winnerVQId === vId;

                  return (
                    <div
                      key={keyId}
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
                          onClick={() => setValue('winning_vq_id', winnerVQId === vId ? 0 : vId, { shouldValidate: true })}
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
              {!!winnerVQId && (() => {
                const winnerVQ = selectedVQs.find((v: VQListItem) => (v.vq_header_id || (v as unknown as Record<string, unknown>).vq_id || v.quotation_id) === winnerVQId);
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
          {mode === 'view' && !!effectiveWinnerId && (
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
        data={waitingList || []}
        isLoading={isWaitingListLoading}
        prId={prId}
        prNo={avNo}
      />

      <SelectionModal<ExtendedRFQHeader>
        isOpen={isPRSelectorOpen}
        onClose={() => setIsPRSelectorOpen(false)}
        title="เลือกเลขที่ PR อ้างอิง"
        subtitle="ค้นหาเอกสารอ้างอิง (PR) ที่ต้องการ"
        data={(waitingList as ExtendedRFQHeader[]) || []}
        searchPlaceholder="ค้นหาด้วยเลขที่ PR, RFQ หรือหัวข้อ..."
        searchKeys={['pr_no', 'ref_pr_no', 'rfq_no', 'purpose', 'remarks', 'rfq_remark']}
        onSelect={(item) => handleSelectPR(item as RFQHeader)}
        keyExtractor={(item) => item.rfq_id}
        columns={[
          { 
            label: 'เลขที่ PR / RFQ', 
            key: (item) => (
              <div className="flex flex-col">
                <span className="font-bold">{item.ref_pr_no || item.pr_no || '-'}</span>
                <span className="text-[10px] text-gray-400 font-normal">{item.rfq_no || '-'}</span>
              </div>
            ), 
            className: 'w-1/3' 
          },
          { label: 'วัตถุประสงค์', key: (item) => item.purpose || item.remarks || item.rfq_remark || '-', className: 'flex-1' },
        ]}
      />

      <SelectionModal<ExtendedRFQHeader>
        isOpen={isAVSelectorOpen}
        onClose={() => setIsAVSelectorOpen(false)}
        title="เลือกเลขที่ AV อ้างอิง"
        subtitle="ค้นหาเอกสารอนุมัติ (Approved PR) ที่รอตรวจสอบ QC"
        data={(waitingList as ExtendedRFQHeader[]) || []}
        searchPlaceholder="ค้นหาด้วยเลขที่ AV, PR หรือหัวข้อ..."
        searchKeys={['av_no', 'approved_pr_no', 'pr_no', 'ref_pr_no', 'rfq_no', 'remarks', 'purpose'] as (keyof ExtendedRFQHeader)[]}
        onSelect={(item) => handleSelectActualAV(item as RFQHeader)}
        keyExtractor={(item) => item.rfq_id || item.av_no || item.rfq_no || Math.random()}
        columns={[
          { label: 'เลขที่ AV / PR', key: (item) => (
              <div className="flex flex-col">
                <span className="font-bold">{item.av_no || item.approved_pr_no || '-'}</span>
                <span className="text-[10px] text-gray-400 font-normal">{item.pr_no || item.ref_pr_no || '-'}</span>
              </div>
          ), className: 'w-1/4' },
          { 
            label: 'เลขที่ RFQ', 
            key: (item) => (
              <div className="flex flex-col">
                <span className="font-bold">{item.rfq_no || '-'}</span>
                {item.creator_name && <span className="text-[10px] text-gray-400 font-normal">{item.creator_name}</span>}
              </div>
            ), 
            className: 'w-1/4' 
          },
        ]}
      />

    </FormProvider>
  );
};

export default QCFormModal;

