import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue, SubmitHandler } from 'react-hook-form';
import {
  PRFormSchema,
  getDefaultFormValues,
  createEmptyLine,
  getInitialLines
} from '@/modules/procurement/schemas/pr-schemas';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { CreatePRPayload, VendorSelection, PRLine } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { extractErrorMessage } from '@/core/api/api';
import { fetchExchangeRate } from '@/modules/master-data/currency/services/mockExchangeRateService';
import { logger } from '@/shared/utils/logger';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { usePRMasterData, type MappedOption } from './usePRMasterData';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { usePRActions } from './usePRActions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { usePRCalculations } from './usePRCalculations';

const PR_CONFIG = {
  MIN_LINES: 1,
  INITIAL_LINES: 5,
} as const;

export interface UsePRFormProps {
  id?: string;
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
    searchProducts,
    isSearchingProducts 
  } = usePRMasterData();


  const { 
    createPRMutation, updatePR, deletePR, 
    handleApprove: baseApprove, 
    cancelPR, 
    approvingId, isActionLoading, setIsActionLoading,
    handleReject: baseReject, 
    submitReject, closeRejectModal, isRejectReasonOpen, isRejecting 
  } = usePRActions();

  const handleApprove = useCallback(async () => {
    if (id) {
      const confirmed = await baseApprove(id);
      if (confirmed) {
        // 2. Close Modal
        onClose();
        onSuccess?.();
        
        // 3. Invalidate (Delay)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['prs'] });
          queryClient.invalidateQueries({ queryKey: ['pr', id] });
        }, 100);
      }
    }
  }, [id, baseApprove, onSuccess, onClose, queryClient]);

  const wrappedSubmitReject = useCallback(async () => {
    const success = await submitReject();
    if (success) {
      onClose();
      onSuccess?.();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['prs'] });
        if (id) queryClient.invalidateQueries({ queryKey: ['pr', id] });
      }, 100);
    }
  }, [submitReject, onClose, onSuccess, queryClient, id]);

  const handleReject = useCallback(() => {
    if (id) {
      baseReject(id);
    }
  }, [id, baseReject]);
  
  const isApproving = !!id && approvingId === id;

  const { toast } = useToast();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  
  const [activeTab, setActiveTab] = useState('detail');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const prevCurrencyId = useRef<string>(getDefaultFormValues(user).pr_base_currency_code);
  const prevCurrencyTypeId = useRef<string | undefined>(getDefaultFormValues(user).pr_quote_currency_code);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);

  const formMethods = useForm<PRFormData>({
    defaultValues: getDefaultFormValues(user),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(PRFormSchema) as any,
    mode: 'onBlur',
  });
  
  const { handleSubmit, setValue, reset, watch, setFocus, control, getFieldState, formState: { isSubmitting, errors } } = formMethods;

   // Effect: Set Default Tax Code (Safe Lookup)
   useEffect(() => {
     if (purchaseTaxOptions.length > 0 && !formMethods.getValues('pr_tax_code_id')) {
       // Find 'VAT-IN-7' safely by code, fallback to first purchase tax, or 7% default
       // Find 'VAT-IN-7' safely by code, fallback to first purchase tax, or 7% default
       const defaultTax = purchaseTaxOptions.find((t: MappedOption<TaxCode>) => t.original?.tax_code === 'VAT-IN-7') || 
                          purchaseTaxOptions.find((t: MappedOption<TaxCode>) => t.original?.tax_rate === 7) ||
                          purchaseTaxOptions[0];
       
       if (defaultTax) {
         setValue('pr_tax_code_id', defaultTax.value);
         setValue('pr_tax_rate', Number(defaultTax.original?.tax_rate || 0));
       }
     }
   }, [purchaseTaxOptions, setValue, formMethods]);

  // 🎯 FIX: Sync requester_name from Auth User if it's currently empty (New PR)
  useEffect(() => {
    const currentRequester = watch('requester_name');
    if (user && !currentRequester && !id) {
      const name = user?.employee?.employee_fullname || user?.username || '';
      if (name) {
        setValue('requester_name', name, { shouldValidate: true });
        setValue('requester_user_id', String(user.id));
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
    const errorMessages: string[] = [];

    // Recursive helper to extract all messages
    const extractMessages = (errs: object) => {
      Object.values(errs).forEach((val) => {
        if (!val) return;
        if (typeof val.message === 'string') {
          errorMessages.push(val.message);
        } else if (typeof val === 'object') {
          extractMessages(val);
        }
      });
    };

    extractMessages(fieldErrors);

    // Deduplicate and format
    const uniqueErrors = Array.from(new Set(errorMessages));
    
    if (uniqueErrors.length > 0) {
      const formattedMessage = uniqueErrors.map(msg => `• ${msg}`).join('\n');
      toast(formattedMessage, 'error', 'ตรวจสอบข้อมูลไม่ผ่าน');
      
      // Focus first error field for UX
      const firstKey = Object.keys(fieldErrors)[0] as Path<PRFormData>;
      if (firstKey) {
        try {
          setFocus(firstKey);
        } catch { /* ignore */ }
      }
    }
  }, [setFocus, toast]);

  // Fetch Default Tax Rate on Mount (Standardized on VAT 7% for Purchase)
  useEffect(() => {
    if (id || purchaseTaxOptions.length === 0) return;
    
    const currentTaxId = formMethods.getValues('pr_tax_code_id');
    if (!currentTaxId) {
      // Find 'VAT-IN-7' or fallback to 7% rate
      // Find 'VAT-IN-7' or fallback to 7% rate
      const defaultTax = purchaseTaxOptions.find((t: MappedOption<TaxCode>) => t.original?.tax_code === 'VAT-IN-7') || 
                         purchaseTaxOptions.find((t: MappedOption<TaxCode>) => t.original?.tax_rate === 7) ||
                         purchaseTaxOptions[0];
      
      if (defaultTax) {
        setValue('pr_tax_code_id', defaultTax.value);
        setValue('pr_tax_rate', Number(defaultTax.original?.tax_rate || 0));
      }
    }
  }, [id, purchaseTaxOptions, setValue, formMethods]);

  useEffect(() => {
    // Phase 1 & 2: Safe hydration ensures we only execute PR fetching and mapping WHEN master data is completely loaded
    if (isOpen && !isMasterDataLoading && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true; // Mark as executed for this opencycle so we don't re-fetch

      const timer = setTimeout(async () => {
        if (id) {
          try {
            setIsActionLoading(true);
            const pr = await PRService.getDetail(id);
            if (pr) {
              const mappedLines: PRLineFormData[] = (pr.lines || []).map((line: PRLine) => {
                // Phase 3: The Safe Hydration Loop - Active lookup against loaded master array
                const matchedItem = masterItems?.find(i => String(i.item_id) === String(line.item_id));
                const matchedUnit = masterUnits?.find(u => String(u.uom_id || u.unit_id) === String(line.uom_id));

                return {
                  item_id: line.item_id ? Number(line.item_id) : '',
                  item_code: matchedItem?.item_code || line.item_code || '',
                  item_name: matchedItem?.item_name || line.item_name || '',
                  description: line.description || line.item_name || matchedItem?.item_name || '',
                  qty: Number(line.qty) || 0,
                  uom: matchedUnit?.uom_name || matchedUnit?.unit_name || line.uom || '',
                  uom_id: line.uom_id ? Number(line.uom_id) : '',
                  est_unit_price: Number(line.est_unit_price) || 0,
                  est_amount: (Number(line.qty) || 0) * (Number(line.est_unit_price) || 0),
                  needed_date: line.needed_date,
                  preferred_vendor_id: line.preferred_vendor_id,
                  remark: line.remark,
                  warehouse_id: pr.warehouse_id || '1', 
                  location: line.location || '',
                  // Calculate discount amount from raw string (same logic as updateLine)
                  discount: (() => {
                    const gross = (Number(line.qty) || 0) * (Number(line.est_unit_price) || 0);
                    const raw = line.line_discount_raw || '';
                    if (!raw) return 0;
                    if (raw.endsWith('%')) {
                      const pct = parseFloat(raw.replace('%', ''));
                      return isNaN(pct) ? 0 : gross * (pct / 100);
                    }
                    return parseFloat(raw) || 0;
                  })(),
                  line_discount_raw: line.line_discount_raw || ''
                };
              });

              while (mappedLines.length < PR_CONFIG.MIN_LINES) {
                mappedLines.push(createEmptyLine());
              }

              const formData: PRFormData = {
                ...pr,
                pr_no: pr.pr_no || 'DRAFT-TEMP',
                
                // HEADER HYDRATION FIX: Use Numbers for IDs as requested for "Perfect Hydration"
                cost_center_id: pr.cost_center_id ? Number(pr.cost_center_id) : '',
                project_id: pr.project_id ? Number(pr.project_id) : '',
                purpose: pr.purpose || '',
                requester_user_id: pr.requester_user_id ? Number(pr.requester_user_id) : 1,
                
                preparer_name: pr.requester_name, 
                requester_name: pr.requester_name,
                pr_base_currency_code: pr.pr_base_currency_code || 'THB',
                pr_quote_currency_code: pr.pr_quote_currency_code || 'THB',
                isMulticurrency: (pr.pr_base_currency_code || 'THB') !== 'THB',
                pr_exchange_rate: pr.pr_exchange_rate || 1,
                lines: mappedLines,
                is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N',
                pr_tax_code_id: pr.pr_tax_code_id ? String(pr.pr_tax_code_id) : '',
                pr_tax_rate: (() => {
                  if (pr.pr_tax_rate != null) return Number(pr.pr_tax_rate);
                  const matchedTax = purchaseTaxOptions.find(t => String(t.value) === String(pr.pr_tax_code_id));
                  return Number(matchedTax?.original?.tax_rate || 0);
                })(),
                pr_discount_raw: pr.pr_discount_raw != null ? String(pr.pr_discount_raw) : '',
                remark: pr.remark || '',
                shipping_method: pr.shipping_method || '',
                vendor_quote_no: pr.vendor_quote_no || '',
              };

              reset(formData);
            }
          } catch (error) {
            logger.error('Failed to fetch PR details:', error);
          } finally {
            setIsActionLoading(false);
          }
        } else {
          try {
            const nextPRNo = await PRService.generateNextDocumentNo();
            reset({ ...getDefaultFormValues(user), pr_no: nextPRNo.document_no });
          } catch (err) {
            logger.error('[usePRForm] Failed to generate PR No:', err);
            // Fallback securely so the form doesn't crash
            reset({ ...getDefaultFormValues(user), pr_no: 'DRAFT-TEMP' });
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      prevIsOpenRef.current = false;
    }
  }, [isOpen, isMasterDataLoading, reset, id, user, setIsActionLoading, masterItems, masterUnits, purchaseTaxOptions]);

  // Currency Sync
  const sourceCurrencyCode = watch('pr_base_currency_code');
  const targetCurrencyCode = watch('pr_quote_currency_code'); 
  
  useEffect(() => {
    if (!sourceCurrencyCode) return;
    if (sourceCurrencyCode === targetCurrencyCode) {
      setValue('pr_exchange_rate', 1, { shouldDirty: false });
      // Removed auto-set of isMulticurrency to allow manual toggle control
      prevCurrencyId.current = sourceCurrencyCode;
      prevCurrencyTypeId.current = targetCurrencyCode;
      return;
    }
    const isSourceChanged = prevCurrencyId.current !== sourceCurrencyCode;
    const isTargetChanged = prevCurrencyTypeId.current !== targetCurrencyCode;
    const fetchRate = async () => {
      if (isSourceChanged && (targetCurrencyCode === prevCurrencyId.current || !targetCurrencyCode)) {
        setValue('pr_quote_currency_code', 'THB');
      }
      const { isDirty } = getFieldState('pr_exchange_rate');
      if (isSourceChanged || isTargetChanged || !isDirty) {
        try {
          const finalTarget = (isSourceChanged && !targetCurrencyCode) ? 'THB' : targetCurrencyCode;
          const rate = await fetchExchangeRate(sourceCurrencyCode, finalTarget);
          setValue('pr_exchange_rate', rate, { shouldValidate: true, shouldDirty: false });
          // Removed auto-set of isMulticurrency to allow manual toggle control
        } catch (error) {
          logger.error('Failed to fetch exchange rate:', error);
        }
      }
    };
    fetchRate();
    prevCurrencyId.current = sourceCurrencyCode;
    prevCurrencyTypeId.current = targetCurrencyCode;
  }, [sourceCurrencyCode, targetCurrencyCode, setValue, getFieldState]);

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
    // 📸 [CALC ENGINE TRIGGERED]: Mandatory debug log
    console.log("⚙️ [CALC ENGINE TRIGGERED]:", { 
        lines: watchedLinesForCalc, 
        subTotal: subtotal, 
        taxId: watchedTaxId,
        taxRate: watchedTaxRate, 
        grandTotal 
    });

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

  const addLine = useCallback(() => append(createEmptyLine()), [append]);
  
  const removeLine = useCallback((index: number) => {
    if (lines.length <= PR_CONFIG.MIN_LINES) {
      showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
      return;
    }
    remove(index);
  }, [lines, remove, showAlert]);
  
  const clearLine = useCallback((index: number) => {
    updateFieldArray(index, createEmptyLine());
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
    setSearchTerm('');
    setIsProductModalOpen(true);
  };
  
  const openWarehouseSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsWarehouseModalOpen(true);
  };

  const openLocationSearch = (index: number) => {
    const currentWarehouse = formMethods.getValues(`lines.${index}.warehouse_id` as Path<PRFormData>);
    if (!currentWarehouse) {
      showAlert('กรุณาเลือกคลังก่อนเลือกที่เก็บ');
      return;
    }
    setActiveRowIndex(index);
    setIsLocationModalOpen(true);
  };

  const selectWarehouse = (data: { warehouse_id: string; warehouse_name: string }) => {
    if (activeRowIndex !== null) {
      setValue(`lines.${activeRowIndex}.warehouse_id` as Path<PRFormData>, data.warehouse_id as FieldPathValue<PRFormData, Path<PRFormData>>);
      setValue(`lines.${activeRowIndex}.location` as Path<PRFormData>, '' as FieldPathValue<PRFormData, Path<PRFormData>>);
      setIsWarehouseModalOpen(false);
    }
  };

  const selectLocation = (data: { location_id: string; location_name: string }) => {
    if (activeRowIndex !== null) {
      setValue(`lines.${activeRowIndex}.location` as Path<PRFormData>, data.location_name as FieldPathValue<PRFormData, Path<PRFormData>>);
      setIsLocationModalOpen(false);
    }
  };
  
  const selectProduct = (product: ItemListItem) => {
    if (activeRowIndex !== null) {
      const currentLines = watch('lines');
      const targetIndex = activeRowIndex;

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
          warehouse_id: product.warehouse_id || product.warehouse || '1',
          location: product.location || 'A1',
          // 🎯 THE CRITICAL FIX: Bind the UOM Data using backend-provided keys
          uom: product.uom_name || product.unit_name || 'ชิ้น',
          uom_id: Number(product.uom_id || product.unit_id || 1),
          est_unit_price: unitPrice,
          qty: 1,
          est_amount: unitPrice * 1,
          // W-04: Store original standard cost for variance check
          _standard_cost: unitPrice,
          // Vendor-Item: Track item's preferred vendor for mismatch detection
          _item_vendor_id: product.preferred_vendor_id ? String(product.preferred_vendor_id) : undefined,
          required_receipt_type: "FULL",
          line_discount_raw: "0",
        };
      updateFieldArray(targetIndex, line);
    }
    setIsProductModalOpen(false);
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);  // V-01: Bumped from 300ms for scalability
  const selectedVendorId = watch('preferred_vendor_id');

  useEffect(() => {
    if (isProductModalOpen) {
      // If showAllItems is true, we pass undefined to bypass the vendor filter in the backend mock
      searchProducts(debouncedSearchTerm, showAllItems ? undefined : selectedVendorId);
    }
  }, [debouncedSearchTerm, selectedVendorId, isProductModalOpen, searchProducts, showAllItems]);

   useEffect(() => {
      if (isMasterDataLoading || !user?.employee?.branch_id || warehouses.length === 0) return;
       const branchWarehouse = warehouses.find((w: MappedOption<WarehouseListItem>) => String(w.original?.branch_id) === String(user.employee.branch_id));
       if (branchWarehouse) setValue('warehouse_id', branchWarehouse.value);
   }, [isMasterDataLoading, user?.employee?.branch_id, warehouses, setValue]);

   const handleVendorSelect = (vendor: VendorSelection | null) => {
     if (vendor) {
       setValue("preferred_vendor_id", vendor.vendor_id);
       setValue("vendor_name", vendor.vendor_name);
      setValue("credit_days", vendor.payment_term_days ?? 30);
    } else {
      setValue("preferred_vendor_id", undefined);
      setValue("vendor_name", '');
      setValue("credit_days", 30);
    }
  };

  const handleSaveData = async (data: PRFormData) => {
    setIsActionLoading(true);
    try {
        // Smart Clean-up: Only filter out rows that are 100% empty.
        // A row with item_id filled but qty=0 is kept so backend validation can surface the error.
        const activeLines = (data.lines || []).filter((line: PRLineFormData) => {
          const isItemIdEmpty = !line.item_id || String(line.item_id).trim() === '';
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
          .filter((line: PRLineFormData) => line.item_id && String(line.item_id).trim() !== '' && Number(line.qty) > 0);

        // ═══════════════════════════════════════════════════════════════════════
        // POSTMAN-SYNCED PAYLOAD — Every key matches the Postman golden response
        // ═══════════════════════════════════════════════════════════════════════
        const payload: CreatePRPayload = {
          // ── HEADER (Aligned with Postman) ──
          ...(data.pr_no && data.pr_no !== '(auto-generated)' && !data.pr_no.startsWith('DRAFT-TEMP') && { pr_no: data.pr_no }),
          pr_date: data.pr_date,
          need_by_date: data.need_by_date,
          branch_id: Number(data.branch_id || 1),
          requester_user_id: Number(data.requester_user_id || 2),
          project_id: data.project_id ? Number(data.project_id) : 1,
          pr_base_currency_code: data.pr_base_currency_code || 'THB',
          pr_quote_currency_code: data.pr_quote_currency_code || 'THB', // MUST BE THB, NOT USD
          pr_exchange_rate: Number(data.pr_exchange_rate || 1), // Exchange rate must be 1 for THB-to-THB
          pr_exchange_rate_date: data.pr_exchange_rate_date || data.pr_date,
          pr_discount_raw: String(data.pr_discount_raw || '0'),
          payment_term_days: Number(data.payment_term_days || 30),
          credit_days: Number(data.credit_days || 30),
          vendor_quote_no: data.vendor_quote_no || '',
          shipping_method: data.shipping_method || '',
          // 🎯 FIX 1: Map purpose to remark (Fallback to data.remark if purpose is empty)
          remark: data.purpose || data.remark || '',
          // 🎯 FIX 2: Explicitly inject the requester_name for backend processing
          requester_name: data.requester_name || "",
          pr_tax_code_id: Number(data.pr_tax_code_id || 2),
          
          delivery_date: data.delivery_date || data.need_by_date || data.pr_date,

          // ── STATUS (Postman: always "PENDING" or "DRAFT") ──
          status: targetStatus,

          // ── LINES (Sanitized — Postman-aligned keys only) ──
          lines: validLines.map((line: PRLineFormData, index: number) => ({
            line_no: index + 1,
            item_id: Number(line.item_id),
            description: line.item_name || line.description || "No Description",
            warehouse_id: Number(line.warehouse_id || 1),
            location: line.location || "A1", 
            qty: Number(line.qty),
            est_unit_price: Number(line.est_unit_price),
            uom_id: Number(line.uom_id),
            required_receipt_type: line.required_receipt_type || "FULL",
            line_discount_raw: String(line.line_discount_raw || '0'),
          })),
        };

        // ═══════════════════════════════════════════════════════════════════════
        // 🛡️ SAFETY NET — Strip any forbidden fields that could leak through
        // TypeScript type widening. LAST LINE OF DEFENSE before wire.
        // ═══════════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        // 🛡️ FORBIDDEN FIELDS — Fields the backend DTO rejects (400).
        // NOTE: 'requester_name' was REMOVED from this list intentionally.
        //       The backend accepts it and stores it in pr_header.requester_name.
        //       Without it, the List Page shows "ไม่ระบุ" for all new PRs.
        // ═══════════════════════════════════════════════════════════════════
        const FORBIDDEN_FIELDS = [
          'purpose', 'cost_center_id', 'department_id',
          'isMulticurrency', 'preparer_name',
          'vendor_name', 'is_on_hold',
          'cancelflag', 'total_amount', 'pr_sub_total',
          'pr_discount_amount', 'pr_tax_amount', 'pr_tax_rate',
          'warehouse_id', 'preferred_vendor_id',
        ] as const;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safePayload = payload as Record<string, any>;
        for (const field of FORBIDDEN_FIELDS) {
          if (field in safePayload) {
            logger.warn(`🚫 [usePRForm] STRIPPED forbidden field from payload: "${field}"`);
            delete safePayload[field];
          }
        }

        // Strip forbidden fields from each line item too
        const LINE_FORBIDDEN_FIELDS = [
          'line', 'item_code', 'item_name', 'uom', 'est_amount', 'discount',
          'needed_date', 'preferred_vendor_id', '_standard_cost', '_item_vendor_id',
          'location', 'warehouse_id', 'description', 'remark',
        ] as const;

        for (const line of payload.lines) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const safeLine = line as Record<string, any>;
          for (const field of LINE_FORBIDDEN_FIELDS) {
            if (field in safeLine) {
              logger.warn(`🚫 [usePRForm] STRIPPED forbidden line field: "${field}"`);
              delete safeLine[field];
            }
          }
        }

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
          lines_detail: payload.lines.map((l, idx) => ({
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
            await updatePR(id, payload);
            await confirm({
                title: 'แก้ไขสำเร็จ',
                description: isOnHold ? 'บันทึกเป็นแบบร่างแล้ว (On Hold)' : 'ส่งอนุมัติเรียบร้อยแล้ว',
                confirmText: 'ตกลง', variant: 'success'
            });
            onSuccess?.(); onClose();
            queryClient.invalidateQueries({ queryKey: ['prs'] });
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
    const isConfirmed = await confirm({
        title: isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยันการบันทึก',
        description: isEditMode ? 'คุณต้องการบันทึกการแก้ไขเอกสารใบขอซื้อใช่หรือไม่?' : 'คุณต้องการบันทึกเอกสารใบขอซื้อใช่หรือไม่?',
        confirmText: isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยัน', cancelText: 'ยกเลิก', variant: 'info'
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

  // Derive currently active warehouse dynamically
  const activeWarehouseId = activeRowIndex !== null 
    ? watch(`lines.${activeRowIndex}.warehouse_id` as Path<PRFormData>) as string || null 
    : null;

  return {
    isEditMode, lines, activeTab, setActiveTab,
    isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    isWarehouseModalOpen, setIsWarehouseModalOpen,
    isLocationModalOpen, setIsLocationModalOpen, activeWarehouseId,
    showAllItems, setShowAllItems,
    handleSubmit, setValue, watch, isSubmitting, isActionLoading, errors, handleFormError,
    products, costCenters, projects, purchaseTaxOptions, currencies, isSearchingProducts,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, openWarehouseSearch, openLocationSearch, selectProduct, selectWarehouse, selectLocation, handleVendorSelect, onSubmit, handleDelete, handleApprove,
    handleVoid, control, reset, formMethods, user, isApproving,
    // Reject Logic
    handleReject, submitReject: wrappedSubmitReject, closeRejectModal, isRejectReasonOpen, isRejecting
  };
};
