import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue, Resolver, SubmitHandler } from 'react-hook-form';
import {
  PRFormSchema,
  getPRDefaultFormValues,
  createEmptyPRLine,
  getInitialLines
} from '@/modules/procurement/schemas/pr-schemas';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { VendorSelection } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { usePRMasterData, type MappedOption } from './usePRMasterData';
import type { WarehouseListItem, Currency } from '@/modules/master-data/types/master-data-types';
import { usePRActions } from './usePRActions';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { usePRHydration } from './usePRHydration';
import { mapPRFormToPayload } from '@/modules/procurement/utils/pr-mappers';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';

const PR_CONFIG = {
  MIN_LINES: 1,
  INITIAL_LINES: 5,
} as const;

// 🎯 Helper to sanitize ISO strings to YYYY-MM-DD for HTML5 date inputs

export interface UsePRFormProps {
  id?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
}

export const usePRForm = ({ id, isOpen, onClose, onSuccess, readOnly = false }: UsePRFormProps) => {
  const isEditMode = !!id;
  const { user } = useAuth();
  const prevIsOpenRef = useRef(false);
  const { confirm } = useConfirmation();
  const queryClient = useQueryClient();
  
  // Custom Hooks
  const { 
    products, 
    warehouses, 
    costCenters, 
    projects,
    purchaseTaxOptions,
    currencies,
    masterItems,
    masterUnits,
    isLoading: isMasterDataLoading,
  } = usePRMasterData();


  const { 
    createPRMutation, updatePR, deletePR, cancelPR, 
    isActionLoading, setIsActionLoading
  } = usePRActions();

  const { toast } = useToast();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  
  const [activeTab, setActiveTab] = useState('detail');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const prevCurrencyId = useRef<string>(getPRDefaultFormValues(user).pr_base_currency_code);
  const prevCurrencyTypeId = useRef<string | undefined>(getPRDefaultFormValues(user).pr_quote_currency_code);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [activeWarehouseId, setActiveWarehouseId] = useState<number | null>(null);

  const formMethods = useForm<PRFormData>({
    defaultValues: getPRDefaultFormValues(user),
    resolver: zodResolver(PRFormSchema) as Resolver<PRFormData>,
    mode: 'onBlur',
  });
  const { handleSubmit, setValue, reset, watch, control, getFieldState, formState: { isSubmitting, errors, isDirty } } = formMethods;

  const currentStatus = watch('status');
  const effectiveReadOnly = readOnly || (!!id && currentStatus !== undefined && !['DRAFT', 'PENDING', 'REJECTED'].includes(currentStatus));

  // 🛡️ Unsaved Changes Guard
  const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
    isDirty: isDirty && !effectiveReadOnly,
    enabled: isOpen,
    onSafeClose: onClose
  });


  // 🎯 FIX: Sync requester_name from Auth User if it's currently empty (New PR)
  useEffect(() => {
    const currentRequester = watch('requester_name');
    if (user && !currentRequester && !id) {
      const name = user?.employee?.employee_fullname || user?.username || '';
      if (name) {
        setValue('requester_name', name, { shouldValidate: true, shouldDirty: false });
        setValue('requester_user_id', Number(user.id), { shouldDirty: false });
      }
    }
  }, [user, setValue, watch, id]);

  // Field Array for Lines
  const { fields: lines, append, remove, update: updateFieldArray } = useFieldArray({
    control,
    name: 'lines'
  });

  // Omniscient Error Handler: Aggregates all validation errors into one Toast
  const handleFormError = useCallback((fieldErrors: FieldErrors<PRFormData>) => {
    logger.error('Validation Errors:', fieldErrors);

    // 1. 🎯 Auto-Scroll to first error field
    const errorKeys = Object.keys(fieldErrors) as Array<keyof PRFormData>;
    const firstErrorKey = errorKeys[0];
    if (firstErrorKey) {
        // Try to find element by name attribute
        const errorElement = document.getElementsByName(firstErrorKey)[0] || 
                           document.querySelector(`[name="${firstErrorKey}"]`);
        
        if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if ('focus' in errorElement) (errorElement as HTMLElement).focus();
        } else if (firstErrorKey === 'lines') {
            // Special case for table errors
            const tableElement = document.querySelector('table');
            tableElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (String(firstErrorKey).includes('.')) {
            // Handle nested fields (e.g., lines[0].qty)
            const nestedElement = document.querySelector(`[name="${firstErrorKey}"]`);
            nestedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 2. 📝 Human-friendly Error Summary
    const extractMessages = (errs: FieldErrors<PRFormData>): string[] => {
        let messages: string[] = [];
        Object.values(errs).forEach((error) => {
            if (!error) return;
            if ('message' in error && typeof error.message === 'string') {
                messages.push(error.message);
            } else if (typeof error === 'object') {
                messages = [...messages, ...extractMessages(error as FieldErrors<PRFormData>)];
            }
        });
        return Array.from(new Set(messages));
    };

    const errorMessages = extractMessages(fieldErrors);

    if (errorMessages.length > 0) {
        const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1 text-left' },
            React.createElement('span', { className: 'font-semibold text-sm' }, 'พบข้อมูลไม่ถูกต้อง:'),
            React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
                errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
            )
        );
        toast(React.createElement(ErrorToastUI), 'error');
    } else {
        toast('กรุณาตรวจสอบข้อมูลที่ระบุให้ครบถ้วน', 'error');
    }
  }, [toast]);


  // 🎯 Request Cancellation Management
  // 🎯 Stabilize the hydration callback to prevent infinite loops during reset()
  const handleDataLoaded = useCallback((data: Partial<PRFormData>) => {
    logger.debug('[usePRForm] Data hydrated, resetting form', data.pr_no);
    reset(data);
  }, [reset]);

  // 🎯 Hydration Engine (Extracted - Now manages its own AbortController)
  const { isLoading: isPRLoading } = usePRHydration({
    id,
    isOpen,
    isMasterDataLoading,
    warehouses,
    masterItems,
    masterUnits,
    onDataLoaded: handleDataLoaded
  });

  // @deprecated Cleanup on Unmount (Now handled within individual hooks)

  // Handle New PR initialization
  useEffect(() => {
    if (isOpen && !id && !isMasterDataLoading && !prevIsOpenRef.current) {
        prevIsOpenRef.current = true;
        reset({ 
          ...getPRDefaultFormValues(user), 
          pr_no: '(รอรันเลข)', // UI Placeholder
          credit_days: '',
          payment_term_days: ''
        });
    } else if (!isOpen) {
        prevIsOpenRef.current = false;
    }
  }, [isOpen, id, isMasterDataLoading, reset, user]);

  // Currency Sync
  const sourceCurrencyCode = watch('pr_base_currency_code');
  const targetCurrencyCode = watch('pr_quote_currency_code'); 
  
  useEffect(() => {
    if (!sourceCurrencyCode) return;
    if (sourceCurrencyCode === targetCurrencyCode) {
      setValue('pr_exchange_rate', 1, { shouldDirty: false });
      prevCurrencyId.current = sourceCurrencyCode;
      prevCurrencyTypeId.current = targetCurrencyCode;
      return;
    }

    const isSourceChanged = prevCurrencyId.current !== sourceCurrencyCode;
    const isTargetChanged = prevCurrencyTypeId.current !== targetCurrencyCode;

    if (isSourceChanged && (targetCurrencyCode === prevCurrencyId.current || !targetCurrencyCode)) {
      setValue('pr_quote_currency_code', 'THB', { shouldDirty: false });
    }

    const { isDirty } = getFieldState('pr_exchange_rate');
    if (isSourceChanged || isTargetChanged || !isDirty) {
      const finalTarget = (isSourceChanged && !targetCurrencyCode) ? 'THB' : targetCurrencyCode;
      
      const sourceObj = currencies.find((c: Currency) => c.currency_code === sourceCurrencyCode);
      const targetObj = currencies.find((c: Currency) => c.currency_code === (finalTarget || 'THB'));

      const fromRate = sourceObj?.exchange_rate || 1;
      const toRate = targetObj?.exchange_rate || 1;

      const calculatedRate = fromRate / toRate;

      if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
        setValue('pr_exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
      }
    }

    prevCurrencyId.current = sourceCurrencyCode;
    prevCurrencyTypeId.current = targetCurrencyCode;
  }, [currencies, sourceCurrencyCode, targetCurrencyCode, setValue, getFieldState]);

  // Multicurrency Reset Logic
  const isMulticurrency = watch('isMulticurrency');
  useEffect(() => {
    if (!isMulticurrency) {
      const currentBase = formMethods.getValues('pr_base_currency_code');
      const currentRate = formMethods.getValues('pr_exchange_rate');
      
      // Only reset if needed to avoid infinite loops
      if (currentBase !== 'THB' || currentRate !== 1) {
        setValue('pr_base_currency_code', 'THB', { shouldDirty: false });
        setValue('pr_quote_currency_code', 'THB', { shouldDirty: false });
        setValue('pr_exchange_rate', 1, { shouldDirty: false });
      }
    }
  }, [isMulticurrency, setValue, formMethods]);
  
  // ====================================================================================
  // CALCULATION ENGINE (REACTIVE SYNC)
  // ====================================================================================
  
  // 🎯 Calculations are now derived on-the-fly in UI components (Issue #3 fix)
  // The summary fields (sub_total, tax_amount, etc.) are now calculated directly in PRFormSummary.



  const addLine = useCallback(() => append(createEmptyPRLine()), [append]);
  
  const removeLine = useCallback((index: number) => {
    if (lines.length <= PR_CONFIG.MIN_LINES) {
      showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
      return;
    }
    remove(index);
  }, [lines, remove, showAlert]);
  
  const clearLine = useCallback((index: number) => {
    updateFieldArray(index, createEmptyPRLine());
  }, [updateFieldArray]);
  
  const updateLine = useCallback((index: number, field: keyof PRLineFormData, value: string | number | undefined) => {
    // Use setValue instead of updateFieldArray to prevent field array state churn and focus loss
    const path = `lines.${index}.${field}` as Path<PRFormData>;
    setValue(path, value as FieldPathValue<PRFormData, typeof path>);
    
    // Get current line data to perform calculations
    const currentLines = watch('lines');
    const line = { ...currentLines[index] };
    
    if (field === 'est_unit_price') {
      const unitPrice = parseFloat(String(value || 0)) || 0;
      
      // W-04: Price variance warning when user edits est_unit_price
      const stdCost = line._standard_cost;
      if (stdCost && stdCost > 0 && unitPrice > 0) {
        const variance = Math.abs(unitPrice - stdCost) / stdCost;
        if (variance > 0.15) {
          toast(`⚠️ ราคาเบี่ยงเบน ${(variance * 100).toFixed(0)}% จาก Standard Cost (${stdCost.toLocaleString()})`, 'warning');
        }
      }
    }

  }, [setValue, watch, toast]);

  const handleClearLines = useCallback(async () => {
    const isConfirmed = await confirm({
        title: 'ยืนยันการล้างรายการ',
        description: 'คุณต้องการล้างรายการสินค้าทั้งหมดใช่หรือไม่?',
        confirmText: 'ล้างรายการ', cancelText: 'ยกเลิก', variant: 'danger'
    });
    if (isConfirmed) reset({ ...watch(), lines: getInitialLines() });
  }, [confirm, reset, watch]);

  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsProductModalOpen(true);
  };
  
  const openWarehouseSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsWarehouseModalOpen(true);
  };

  const openLocationSearch = (index: number) => {
    const currentWarehouse = formMethods.getValues(`lines.${index}.warehouse_id` as Path<PRFormData>);
    setActiveWarehouseId(Number(currentWarehouse)); // Snapshot exact current value synchronously (No lag)
    setActiveRowIndex(index);
    setIsLocationModalOpen(true);
  };

  const selectWarehouse = (data: WarehouseListItem) => {
    if (activeRowIndex !== null) {
      setValue(`lines.${activeRowIndex}.warehouse_id` as Path<PRFormData>, data.warehouse_id as FieldPathValue<PRFormData, Path<PRFormData>>);
      setValue(`lines.${activeRowIndex}.warehouse_code` as Path<PRFormData>, data.warehouse_code as FieldPathValue<PRFormData, Path<PRFormData>>);
      setValue(`lines.${activeRowIndex}.location` as Path<PRFormData>, '' as FieldPathValue<PRFormData, Path<PRFormData>>);
      setValue(`lines.${activeRowIndex}.location_name` as Path<PRFormData>, '' as FieldPathValue<PRFormData, Path<PRFormData>>); // Clear display name (Fix UI Bug)
      setIsWarehouseModalOpen(false);
    }
  };

  const selectLocation = (data: { location_id: number; location_name: string }) => {
    if (activeRowIndex !== null) {
      // location field in schema is string, but data is number
      setValue(`lines.${activeRowIndex}.location` as Path<PRFormData>, String(data.location_id) as FieldPathValue<PRFormData, Path<PRFormData>>);
      setValue(`lines.${activeRowIndex}.location_name` as Path<PRFormData>, data.location_name as FieldPathValue<PRFormData, Path<PRFormData>>);
      setIsLocationModalOpen(false);
    }
  };
  
  const selectProduct = (product: ItemListItem) => {
    if (activeRowIndex !== null) {
      const currentLines = watch('lines');
      const targetIndex = activeRowIndex;

      // 🛑 Prevent Duplicate Selection
      const isDuplicate = currentLines.some((line, index) => 
         index !== targetIndex && 
         line.item_id && 
         Number(line.item_id) === Number(product.item_id)
      );

      if (isDuplicate) {
         showAlert('สินค้านี้ถูกเลือกไปแล้ว กรุณาตรวจสอบอีกครั้ง');
         setIsProductModalOpen(false);
         return;
      }

        // W-01: Apply conversion factor to standard cost when using purchasing unit
        const baseCost = product.standard_cost || 0;
        const conversionFactor = product.purchasing_conversion_factor || 1;
        const unitPrice = !!product.purchasing_unit_name && conversionFactor > 1
          ? baseCost * conversionFactor
          : baseCost;

        const line: PRLineFormData = {
          ...currentLines[targetIndex],
          item_id: Number(product.item_id),
          item_code: product.item_code,
          item_name: product.item_name,
          // W-01: Map warehouse from master data
          warehouse_id: Number(product.warehouse_id || product.warehouse || 1),
          warehouse_code: warehouses.find(w => String(w.value) === String(product.warehouse_id || product.warehouse || 1))?.original?.warehouse_code || '',
          location: product.location || '',
          // 🎯 THE CRITICAL FIX: Bind the UOM Data using backend-provided keys
          uom: product.uom_name || product.uom_name || 'ชิ้น',
          uom_id: Number(product.uom_id || product.uom_id || 1),
          // Store valid units for this product so select list filters intelligently (Trap 2 fix)
          _base_uom_name: product.uom_name || product.uom_name || '',
          _base_uom_id: Number(product.uom_id || product.uom_id || 1),
          _purchasing_uom_name: product.purchasing_unit_name || '',
          _purchasing_uom_id: product.purchasing_unit_id ? Number(product.purchasing_unit_id) : undefined,
          est_unit_price: unitPrice,
          qty: 1,
          est_amount: unitPrice * 1,
          // W-04: Store original standard cost for variance check
          _standard_cost: unitPrice,
          // Vendor-Item: Track item's preferred vendor for mismatch detection
          _item_vendor_id: product.preferred_vendor_id ? Number(product.preferred_vendor_id) : undefined,
          required_receipt_type: "FULL",
          line_discount_raw: "0",
        };
      updateFieldArray(targetIndex, line);
    }
    setIsProductModalOpen(false);
  };

   useEffect(() => {
      if (isMasterDataLoading || !user?.employee?.branch_id || warehouses.length === 0) return;
       const branchWarehouse = warehouses.find((w: MappedOption<WarehouseListItem>) => String(w.original?.branch_id) === String(user.employee.branch_id));
       if (branchWarehouse) setValue('warehouse_id', Number(branchWarehouse.value), { shouldDirty: false });
   }, [isMasterDataLoading, user?.employee?.branch_id, warehouses, setValue]);

   const handleVendorSelect = (vendor: VendorSelection | null) => {
     if (vendor) {
       setValue("preferred_vendor_id", vendor.vendor_id);
       setValue("vendor_name", vendor.vendor_name);
       setValue("credit_days", vendor.payment_term_days);
       setValue("payment_term_days", vendor.payment_term_days);
     } else {
       setValue("preferred_vendor_id", undefined);
       setValue("vendor_name", '');
       setValue("credit_days", '');
       setValue("payment_term_days", '');
     }
   };

  const handleSaveData = async (data: PRFormData) => {
    // 🔍 [DIAGNOSTIC]: Capture raw RHF data before transformation
    logger.debug("🔍 [usePRForm] handleSaveData CAPTURED DATA:", JSON.parse(JSON.stringify(data)));
    
    setIsActionLoading(true);
    try {
        const isOnHold = data.is_on_hold === 'Y' || data.is_on_hold === true;

        // 🎯 Use extracted mapper utility to construct wire-ready payload
        const payload = mapPRFormToPayload(data, isEditMode);

        logger.info('🚀 [usePRForm] Submitting Payload', {
          id,
          isEditMode,
          pr_no: payload.pr_no,
          status: payload.status,
          line_count: payload.lines.length
        });
        // ─────────────────────────────────────────────────────────────────────
        
        if (isEditMode && id) {
            await updatePR(id, payload);
            
            // 🎯 RESUBMISSION FIX: If status is PENDING, we must explicitly trigger the approval process
            // via the /pending endpoint. Otherwise, it might stay "Rejected" if stale AV records exist.
            if (!isOnHold) {
                try {
                    logger.info(`🚀 [usePRForm] Triggering explicit approval process for PR ${id}`);
                    await PRService.processDirectApproval(id);
                    // ⏱️ Minor delay to allow backend processing before list refresh
                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (approveErr) {
                    logger.error('❌ [usePRForm] Failed to trigger explicit approval:', approveErr);
                    // We don't throw here so the user still sees the "Update Successful" message
                    // since the main PR update already succeeded.
                }
            }

            await confirm({
                title: 'แก้ไขสำเร็จ',
                description: isOnHold ? 'บันทึกเป็นแบบร่างแล้ว (On Hold)' : 'ส่งอนุมัติเรียบร้อยแล้ว',
                confirmText: 'ตกลง', variant: 'success'
            });
            onSuccess?.(); onClose();
            queryClient.invalidateQueries({ queryKey: ['prs'] });
            queryClient.invalidateQueries({ queryKey: ['pr', id] });
            PRService.clearAVCache(); // Final safety clear
        } else {
            const { newPR } = await createPRMutation.mutateAsync(payload);
            const displayNo = newPR.pr_no.startsWith('DRAFT-TEMP') ? 'รอรันเลข (NEW)' : newPR.pr_no;
            await confirm({
                title: isOnHold ? 'บันทึกแบบร่างสำเร็จ!' : 'สร้างใบขอซื้อสำเร็จ!',
                description: `เลขที่เอกสาร: ${displayNo}\nสถานะ: ${isOnHold ? 'แบบร่าง (On Hold)' : 'รออนุมัติ (Pending)'}`,
                confirmText: 'ตกลง', hideCancel: true, variant: 'success'
            });
            onSuccess?.(); onClose();
            queryClient.invalidateQueries({ queryKey: ['prs'] });
        }
    } catch (error) {
        // Use the centralised extractor so NestJS validation arrays are surfaced correctly
        // e.g. ["cost_center_id must not be empty", "items should not be empty"]
        const errorMessage = extractErrorMessage(error);
        logger.error('[usePRForm] handleSaveData failed', { error });
        await confirm({ title: 'เกิดข้อผิดพลาด', description: errorMessage, confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
    } finally {
        setIsActionLoading(false);
    }
  };

  const onSubmit: SubmitHandler<PRFormData> = async (data) => {
    const isOnHold = data.is_on_hold === 'Y';

    let title = isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยันการบันทึก';
    let description = isEditMode ? 'คุณต้องการบันทึกการแก้ไขเอกสารใบขอซื้อใช่หรือไม่?' : 'คุณต้องการบันทึกเอกสารใบขอซื้อใช่หรือไม่?';
    let confirmText = isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยัน';
    let variant: 'info' | 'warning' = 'info';

    if (isOnHold) {
       title = 'ยืนยันการพักเรื่อง (ON HOLD)';
       description = 'เอกสารนี้จะถูกบันทึกเป็น "แบบร่าง (On Hold)" และจะยังไม่ส่งเข้ากระบวนการอนุมัติ คุณต้องการดำเนินการต่อใช่หรือไม่?';
       confirmText = 'บันทึกแบบร่าง';
       variant = 'warning';
    }

    const isConfirmed = await confirm({
        title,
        description,
        confirmText,
        cancelText: 'ยกเลิก',
        variant
    });
    if (isConfirmed) await handleSaveData(data);
  };

  const handleDelete = async () => {
    if (!id) return;
    const currentStatus = watch('status');
    if (currentStatus && currentStatus !== 'DRAFT') {
       await confirm({ title: 'ไม่สามารถลบได้', description: 'ขออภัย เฉพาะเอกสารสถานะ "แบบร่าง" เท่านั้นที่สามารถลบได้ หากต้องการยกเลิกกรุณาใช้ปุ่ม "Void" แทน', confirmText: 'ตกลง', hideCancel: true, variant: 'warning' });
       return;
    }
    const isConfirmed = await confirm({ title: 'ยืนยันการลบ', description: 'คุณต้องการลบเอกสารนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้', confirmText: 'ลบเอกสาร', cancelText: 'ยกเลิก', variant: 'danger' });
    if (isConfirmed) {
      setIsActionLoading(true);
      try {
        if (await deletePR(id)) {
          await confirm({ title: 'ลบสำเร็จ', description: 'เอกสารถูกลบเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
          onSuccess?.(); onClose();
        }
      } finally { setIsActionLoading(false); }
    }
  };


  const handleVoid = async () => {
    if (!id) return;
    
    confirm({
        title: 'ยืนยันการยกเลิกเอกสาร',
        description: 'คุณต้องการยกเลิกเอกสารใบขอซื้อนี้ใช่หรือไม่?',
        confirmText: 'ยกเลิกเอกสาร',
        cancelText: 'ย้อนกลับ',
        variant: 'danger',
        onConfirm: async () => {
             const success = await cancelPR(id);
             if (!success) {
                 throw new Error('ไม่สามารถยกเลิกเอกสารได้');
             }
        }
    }).then((confirmed) => {
        if (confirmed) {
            confirm({ 
                title: 'ยกเลิกสำเร็จ', 
                description: 'เอกสารได้รับการยกเลิกเรียบร้อยแล้ว', 
                confirmText: 'ตกลง', 
                variant: 'success', 
                hideCancel: true 
            });
            onSuccess?.(); 
            onClose();
        }
    }).catch((error) => {
        logger.error('Void Action Failed', error);
    });
  };

  // activeWarehouseId and isLocationModalOpen are local states declared at top

  return {
    isEditMode, lines, activeTab, setActiveTab,
    isProductModalOpen, setIsProductModalOpen,
    isWarehouseModalOpen, setIsWarehouseModalOpen,
    isLocationModalOpen, setIsLocationModalOpen, activeWarehouseId,
    handleSubmit, setValue, watch, isSubmitting, isActionLoading, errors, handleFormError,
    products, costCenters, projects, purchaseTaxOptions, currencies, masterUnits,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, openWarehouseSearch, openLocationSearch, selectProduct, selectWarehouse, selectLocation, handleVendorSelect, onSubmit, handleDelete,
    handleVoid, control, reset, formMethods, user,
    onClose: handleCloseAttempt,
    blocker,
    readOnly: effectiveReadOnly,
    isLoading: isMasterDataLoading || isPRLoading // Only data loading, excluding isActionLoading to prevent UI overlap
  };
};
