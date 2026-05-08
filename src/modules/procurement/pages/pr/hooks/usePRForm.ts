import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue, Resolver, SubmitHandler } from 'react-hook-form';
import {
  PRFormSchema,
  getPRDefaultFormValues,
  createEmptyPRLine,
  getInitialLines
} from '@/modules/procurement/schemas/pr-schemas';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { VendorSelection, CreatePRPayload } from '@/modules/procurement/types/pr-types';
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
import { usePRCalculations } from './usePRCalculations';
import { usePRHydration } from './usePRHydration';

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
}

export const usePRForm = ({ id, isOpen, onClose, onSuccess }: UsePRFormProps) => {
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
  const { handleSubmit, setValue, reset, watch, control, getFieldState, formState: { isSubmitting, errors } } = formMethods;


  // 🎯 FIX: Sync requester_name from Auth User if it's currently empty (New PR)
  useEffect(() => {
    const currentRequester = watch('requester_name');
    if (user && !currentRequester && !id) {
      const name = user?.employee?.employee_fullname || user?.username || '';
      if (name) {
        setValue('requester_name', name, { shouldValidate: true });
        setValue('requester_user_id', Number(user.id));
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
      setValue('pr_quote_currency_code', 'THB');
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
        setValue('pr_base_currency_code', 'THB');
        setValue('pr_quote_currency_code', 'THB');
        setValue('pr_exchange_rate', 1);
      }
    }
  }, [isMulticurrency, setValue, formMethods]);
  
  // ====================================================================================
  // CALCULATION ENGINE (REACTIVE SYNC)
  // ====================================================================================
  
  const watchedLinesForCalc = useWatch({ control, name: 'lines' }) as PRLineFormData[] | undefined;
  const watchedDiscountRaw = useWatch({ control, name: 'pr_discount_raw' });
  const watchedTaxRate = useWatch({ control, name: 'pr_tax_rate' });
  const watchedTaxId = useWatch({ control, name: 'pr_tax_code_id' });

  const {
      subtotal,
      globalDiscountAmount,
      vatAmount,
      grandTotal
  } = usePRCalculations({
      lines: watchedLinesForCalc || [],
      vatRate: watchedTaxRate || 0,
      globalDiscountInput: watchedDiscountRaw || ''
  });

  useEffect(() => {
    // STRICT TAX GUARDRAIL: VAT is strictly 0 unless a tax code is selected
    const isActiveTax = watchedTaxId && String(watchedTaxId) !== '';
    const finalVatAmount = isActiveTax ? vatAmount : 0;
    const finalGrandTotal = subtotal - globalDiscountAmount + finalVatAmount;

    // Inject calculated values back into the form state securely
    setValue('pr_sub_total', Number(subtotal.toFixed(2)), { shouldDirty: true, shouldValidate: true });
    setValue('pr_discount_amount', Number(globalDiscountAmount.toFixed(2)), { shouldDirty: true, shouldValidate: true });
    setValue('pr_tax_amount', Number(finalVatAmount.toFixed(2)), { shouldDirty: true, shouldValidate: true });
    setValue('total_amount', Number(finalGrandTotal.toFixed(2)), { shouldDirty: true, shouldValidate: true });
  }, [subtotal, globalDiscountAmount, vatAmount, grandTotal, setValue, watchedLinesForCalc, watchedTaxRate, watchedTaxId]);

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
    
    if (field === 'line_discount_raw') {
      const input = String(value || '');
      const totalBeforeDiscount = (line.est_unit_price || 0) * (line.qty || 0);
      let discAmount = 0;
      if (input.trim().endsWith('%')) {
        const percent = parseFloat(input.replace('%', ''));
        if (!isNaN(percent)) discAmount = totalBeforeDiscount * (percent / 100);
      } else {
        discAmount = parseFloat(input) || 0;
      }
      const finalDiscount = discAmount > totalBeforeDiscount ? totalBeforeDiscount : discAmount;
      
      const discountPath = `lines.${index}.discount` as Path<PRFormData>;
      const amountPath = `lines.${index}.est_amount` as Path<PRFormData>;
      
      setValue(discountPath, finalDiscount as FieldPathValue<PRFormData, typeof discountPath>);
      setValue(amountPath, (totalBeforeDiscount - finalDiscount) as FieldPathValue<PRFormData, typeof amountPath>);
    } else if (field === 'qty' || field === 'est_unit_price') {
      const qty = field === 'qty' ? (parseFloat(String(value || 0)) || 0) : (line.qty || 0);
      const unitPrice = field === 'est_unit_price' ? (parseFloat(String(value || 0)) || 0) : (line.est_unit_price || 0);
      
      const totalBeforeDiscount = qty * unitPrice;
      let discAmount = 0;
      const input = line.line_discount_raw || '';
      if (input.trim().endsWith('%')) {
        const percent = parseFloat(input.replace('%', ''));
        if (!isNaN(percent)) discAmount = totalBeforeDiscount * (percent / 100);
      } else {
        discAmount = parseFloat(input) || 0;
      }
      const finalDiscount = discAmount > totalBeforeDiscount ? totalBeforeDiscount : discAmount;
      
      const discountPath = `lines.${index}.discount` as Path<PRFormData>;
      const amountPath = `lines.${index}.est_amount` as Path<PRFormData>;
      
      setValue(discountPath, finalDiscount as FieldPathValue<PRFormData, typeof discountPath>);
      setValue(amountPath, (totalBeforeDiscount - finalDiscount) as FieldPathValue<PRFormData, typeof amountPath>);

      // W-04: Price variance warning when user edits est_unit_price
      if (field === 'est_unit_price') {
        const stdCost = line._standard_cost;
        if (stdCost && stdCost > 0 && unitPrice > 0) {
          const variance = Math.abs(unitPrice - stdCost) / stdCost;
          if (variance > 0.15) {
            toast(`⚠️ ราคาเบี่ยงเบน ${(variance * 100).toFixed(0)}% จาก Standard Cost (${stdCost.toLocaleString()})`, 'warning');
          }
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
          uom: product.uom_name || product.unit_name || 'ชิ้น',
          uom_id: Number(product.uom_id || product.unit_id || 1),
          // Store valid units for this product so select list filters intelligently (Trap 2 fix)
          _base_uom_name: product.uom_name || product.unit_name || '',
          _base_uom_id: Number(product.uom_id || product.unit_id || 1),
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
       if (branchWarehouse) setValue('warehouse_id', Number(branchWarehouse.value));
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
        // Smart Clean-up: Only filter out rows that are 100% empty.
        // A row with item_id filled but qty=0 is kept so backend validation can surface the error.
        const activeLines = (data.lines || []).filter((line: PRLineFormData) => {
          const isItemIdEmpty = !line.item_id || line.item_id === 0;
          const isItemCodeEmpty = !line.item_code || line.item_code.trim() === '';
          const isQtyZero = !line.qty || Number(line.qty) === 0;
          const isPriceZero = !line.est_unit_price || Number(line.est_unit_price) === 0;
          const isDescriptionEmpty = !line.description || line.description.trim() === '';
          
          // Row is 100% empty if ALL key fields are empty/zero — skip it
          const isCompletelyEmpty = isItemIdEmpty && isItemCodeEmpty && isQtyZero && isPriceZero && isDescriptionEmpty;
          
          return !isCompletelyEmpty;
        });

        // Vendor-Item Mismatch Check: Warn before saving if items don't match header vendor
        const headerVendorId = data.preferred_vendor_id;
        if (headerVendorId) {
          const mismatchedLines = activeLines.filter((l: PRLineFormData) => {
            const itemVendor = l._item_vendor_id;
            return itemVendor && itemVendor !== headerVendorId;
          });
          if (mismatchedLines.length > 0) {
            const shouldContinue = await confirm({
              title: 'ตรวจพบสินค้าไม่ตรง Vendor',
              description: `ตรวจพบสินค้า ${mismatchedLines.length} รายการที่ไม่ได้ผูกกับผู้ขายเจ้านี้ คุณยังต้องการดำเนินการต่อหรือไม่?`,
              confirmText: 'ยืนยัน',
              cancelText: 'กลับไปแก้ไข',
              variant: 'warning'
            });
            if (!shouldContinue) {
              setIsActionLoading(false);
              return;
            }
          }
        }
        
        const isOnHold = data.is_on_hold === 'Y' || data.is_on_hold === true;
        const targetStatus = isOnHold ? 'DRAFT' : 'PENDING';

        // ═══════════════════════════════════════════════════════════════════════
        // 🔧 POSTMAN-SYNCED GOLDEN PAYLOAD — Mirrors production DB structure
        // ═══════════════════════════════════════════════════════════════════════
        // Aligned with the real Postman JSON response from production database.
        //
        // FORBIDDEN (400 "should not exist" / previously rejected):
        //   ✗ department_id  ✗ purpose  ✗ pr_sub_total  ✗ total_amount
        //   ✗ isMulticurrency  ✗ preparer_name  ✗ requester_name
        //   ✗ vendor_name  ✗ delivery_date  ✗ is_on_hold  ✗ cancelflag
        //   ✗ pr_discount_amount  ✗ pr_tax_amount  ✗ pr_tax_rate
        //   ✗ cost_center_id  ✗ warehouse_id (header)  ✗ preferred_vendor_id
        // ═══════════════════════════════════════════════════════════════════════

        // ─── VALID LINES: Filter to only lines with a real item_id & qty > 0 ─
        const validLines = activeLines
          .filter((line: PRLineFormData) => line.item_id && line.item_id !== 0 && Number(line.qty) > 0);

        // ─── DIAGNOSTIC: Log raw data from RHF before any mapping
        logger.debug('🧪 [usePRForm] RAW RHF DATA:', {
          vendor_quote_no: data.vendor_quote_no,
          preferred_vendor_id: data.preferred_vendor_id,
          cost_center_id: data.cost_center_id,
          purpose: data.purpose
        });

        // ═══════════════════════════════════════════════════════════════════════
        // POSTMAN-SYNCED PAYLOAD — Every key matches the Postman golden response
        // ═══════════════════════════════════════════════════════════════════════
        const payload: CreatePRPayload = {
          // ── HEADER (Aligned with Postman) ──
          pr_date: data.pr_date,
          need_by_date: data.need_by_date,
          branch_id: Number(data.branch_id || 1),
          requester_user_id: Number(data.requester_user_id || 2),
          project_id: data.project_id ? Number(data.project_id) : 0,
          
          // 🎯 PRO-TIP FIX: Map cost_center_id & preferred_vendor_id with explicit casting
          cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : undefined,
          preferred_vendor_id: data.preferred_vendor_id ? Number(data.preferred_vendor_id) : undefined,
          
          pr_base_currency_code: data.pr_base_currency_code || 'THB',
          pr_quote_currency_code: data.pr_quote_currency_code || 'THB', // MUST BE THB, NOT USD
          pr_exchange_rate: Number(Number(data.pr_exchange_rate || 1).toFixed(4)), // Enforce max 4 decimal places

          pr_exchange_rate_date: data.pr_exchange_rate_date || data.pr_date,
          pr_discount_raw: String(data.pr_discount_raw || '0'),
          payment_term_days: data.payment_term_days != null ? Number(data.payment_term_days) : undefined,
          credit_days: data.credit_days != null ? Number(data.credit_days) : undefined,
          vendor_quote_no: data.vendor_quote_no || '',
          shipping_method: data.shipping_method || '',
          // 🎯 FIX 1: Save purpose/remark directly without infinite accumulator concatenation bug
          remark: data.purpose || data.remark || '',
          // 🎯 FIX 2: Explicitly inject the requester_name for backend processing
          requester_name: data.requester_name || "",
          pr_tax_code_id: data.pr_tax_code_id ? Number(data.pr_tax_code_id) : null,
          version: Number(data.version) || 1,
          
          delivery_date: data.delivery_date || data.need_by_date || data.pr_date,

          // ── STATUS (Postman: always "PENDING" or "DRAFT") ──
          status: targetStatus,

          // ── LINES (Sanitized — Postman-aligned keys only) ──
          lines: validLines.map((line: PRLineFormData, index: number) => ({
            pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : undefined,
            line_no: index + 1,
            item_id: Number(line.item_id),
            description: line.item_name || line.description || "No Description",
            warehouse_id: Number(line.warehouse_id || 1),
            location: line.location || "", 
            qty: Number(line.qty),
            est_unit_price: Number(line.est_unit_price),
            uom_id: Number(line.uom_id),
            required_receipt_type: line.required_receipt_type || "FULL",
            line_discount_raw: String(line.line_discount_raw || '0'),
            remark: line.remark || "",
          })),
        };

        // ─── DIAGNOSTIC: Log payload after mapping but before stripping
        logger.debug('🧪 [usePRForm] MAPPED PAYLOAD (Before Strip):', {
          vendor_quote_no: payload.vendor_quote_no,
          // preferred_vendor_id: payload.preferred_vendor_id,
          cost_center_id: payload.cost_center_id,
        });

        // ═══════════════════════════════════════════════════════════════════════
        // 🚀 WHITELIST-ONLY PAYLOAD RECONSTRUCTION (FINAL WIRE-READY)
        // ═══════════════════════════════════════════════════════════════════════
        // Instead of 'delete' logic which is prone to accidental stripping,
        // we rebuild the object with ONLY what the backend explicitly expects.
        // ═══════════════════════════════════════════════════════════════════════
        const wirePayload: CreatePRPayload = {
          // ── HEADER ──
          ...(payload.pr_no && { pr_no: payload.pr_no }),
          pr_date: payload.pr_date,
          need_by_date: payload.need_by_date,
          requester_user_id: payload.requester_user_id,
          branch_id: payload.branch_id,
          project_id: payload.project_id,
          cost_center_id: payload.cost_center_id,
          preferred_vendor_id: payload.preferred_vendor_id,
          pr_tax_code_id: payload.pr_tax_code_id,
          remark: payload.remark,
          status: payload.status,
          // 🎯 FIX: Send version only when updating an existing document
          ...(isEditMode && { version: payload.version }),
          
          // ── CURRENCY & TERMS ──
          pr_base_currency_code: payload.pr_base_currency_code,
          pr_quote_currency_code: payload.pr_quote_currency_code,
          pr_exchange_rate: payload.pr_exchange_rate,
          pr_exchange_rate_date: payload.pr_exchange_rate_date,
          pr_discount_raw: payload.pr_discount_raw,
          payment_term_days: payload.payment_term_days,
          vendor_quote_no: payload.vendor_quote_no,
          shipping_method: payload.shipping_method,
          
          // ── RE-ADDED FIELDS (As per Frontend Requirement) ──
          credit_days: payload.credit_days,
          delivery_date: payload.delivery_date,
          requester_name: payload.requester_name,
          
          // ── LINES (Whitelist-only Re-mapping) ──
          lines: payload.lines.map((line, index: number) => ({
            pr_line_id: line.pr_line_id,
            line_no: index + 1,
            item_id: line.item_id,
            description: line.remark ? `${line.description} (หมายเหตุ: ${line.remark})` : line.description,
            warehouse_id: line.warehouse_id,
            location: line.location,
            location_id: line.location ? Number(line.location) : undefined, // Safe placeholder for future Backend validation release
            qty: Number(Number(line.qty || 0).toFixed(4)),
            est_unit_price: Number(Number(line.est_unit_price || 0).toFixed(4)),
            uom_id: line.uom_id,
            required_receipt_type: line.required_receipt_type,
            line_discount_raw: line.line_discount_raw,
          })),
        };

        // Use the wirePayload for the actual transmission
        const finalPayload = wirePayload;

        // ─── DIAGNOSTIC: Print Postman-synced payload before send ────────────
        logger.debug('🔧 [usePRForm] POSTMAN-SYNCED PAYLOAD (wire-ready):', JSON.stringify(payload, null, 2));
        logger.info('📦 [usePRForm] Outgoing Payload to PRService', {
          field_count: Object.keys(payload).length,
          fields_sent: Object.keys(payload),
          pr_no: payload.pr_no || '(not sent — auto-gen)',
          requester_user_id: `${payload.requester_user_id} (${typeof payload.requester_user_id})`,
          branch_id: `${payload.branch_id} (${typeof payload.branch_id})`,
          pr_tax_code_id: `${payload.pr_tax_code_id} (${typeof payload.pr_tax_code_id})`,
          pr_base_currency_code: payload.pr_base_currency_code,
          pr_quote_currency_code: payload.pr_quote_currency_code,
          pr_exchange_rate: `${payload.pr_exchange_rate} (${typeof payload.pr_exchange_rate})`,
          payment_term_days: `${payload.payment_term_days} (${typeof payload.payment_term_days})`,
          credit_days: `${payload.credit_days} (${typeof payload.credit_days})`,
          project_id: `${payload.project_id} (${typeof payload.project_id})`,
          pr_discount_raw: payload.pr_discount_raw,
          line_count: payload.lines.length,
          lines_detail: payload.lines.map((l, idx: number) => ({
            line_index: idx + 1,
            item_id: `${l.item_id} (${typeof l.item_id})`,
            qty: `${l.qty} (${typeof l.qty})`,
            est_unit_price: `${l.est_unit_price} (${typeof l.est_unit_price})`,
            uom_id: `${l.uom_id} (${typeof l.uom_id})`,
            line_discount_raw: l.line_discount_raw,
          })),
        });
        // ─────────────────────────────────────────────────────────────────────
        
        if (isEditMode && id) {
            await updatePR(id, finalPayload);
            
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
            const { newPR } = await createPRMutation.mutateAsync(finalPayload);
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
    isLoading: isMasterDataLoading || isPRLoading // Only data loading, excluding isActionLoading to prevent UI overlap
  };
};
