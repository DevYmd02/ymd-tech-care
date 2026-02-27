import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import type { PRFormData, PRLineFormData, CreatePRPayload, VendorSelection, PRLine } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { fetchExchangeRate } from '@/modules/master-data/currency/services/mockExchangeRateService';
import { logger } from '@/shared/utils/logger';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import type { UserProfile } from '@/core/auth/auth.service';
import { usePRMasterData, type MappedOption } from './usePRMasterData';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { usePRActions } from './usePRActions';
import { PRFormSchema } from '@/modules/procurement/schemas/pr-schemas';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';




const PR_CONFIG = {
  MIN_LINES: 1,
  INITIAL_LINES: 5,
} as const;

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const getNextWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

// Standardized on string for all IDs

export interface ExtendedLine extends PRLineFormData {
  _standard_cost?: number;  // W-04: Original standard cost from master data for variance check
  _item_vendor_id?: string;  // Vendor-Item: Track item's source vendor for mismatch detection
}

const createEmptyLine = (): ExtendedLine => ({
  item_id: '', 
  item_code: '', 
  item_name: '', 
  description: '', 
  qty: 0, 
  uom: '', 
  uom_id: '',
  est_unit_price: 0, 
  est_amount: 0, 
  needed_date: getTodayDate(), 
  preferred_vendor_id: undefined, 
  remark: '',
  warehouse_id: '', 
  location: '', 
  discount: 0, 
  line_discount_raw: '',
});

const getInitialLines = () => Array(PR_CONFIG.INITIAL_LINES).fill(null).map(() => createEmptyLine());

const getDefaultFormValues = (user: UserProfile | null): PRFormData => ({
  preparer_name: user?.employee?.employee_fullname || user?.username || '', // Decoupled: Read-only
  requester_name: user?.employee?.employee_fullname || user?.username || '', // Decoupled: Editable
  pr_no: '',
  pr_date: getTodayDate(),
  need_by_date: '',
  cost_center_id: '', // Empty string for unselected dropdown
  project_id: undefined,
  purpose: '',
  pr_base_currency_code: 'THB',
  pr_quote_currency_code: '',
  lines: getInitialLines(),
  total_amount: 0,
  is_on_hold: 'N',
  delivery_date: getNextWeekDate(),
  credit_days: 30,
  vendor_quote_no: '',
  shipping_method: '',
  remark: '',
  isMulticurrency: false,
  pr_exchange_rate: 1,
  pr_exchange_rate_date: new Date().toISOString().split('T')[0],
  cancelflag: 'N',
  status: 'DRAFT',
  pr_discount_raw: '',
  pr_tax_code_id: '', // Empty string for unselected dropdown
  pr_tax_rate: 7, // Default safe fallback
  requester_user_id: String(user?.id || '1'),
});

export const usePRForm = (isOpen: boolean, onClose: () => void, id?: string, onSuccess?: () => void) => {
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
    masterItems,
    masterUnits,
    isLoading: isMasterDataLoading,
    searchProducts,
    isSearchingProducts 
  } = usePRMasterData();


  const { 
    createPRMutation, updatePR, deletePR, handleApprove, cancelPR, 
    approvingId, isActionLoading, setIsActionLoading,
    handleReject, submitReject, closeRejectModal, isRejectReasonOpen, isRejecting 
  } = usePRActions();
  
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
    resolver: zodResolver(PRFormSchema),
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

  // Field Array for Lines
  const { fields: lines, append, remove, update: updateFieldArray } = useFieldArray({
    control,
    name: 'lines'
  });

  // Error handler
  const handleFormError = useCallback((fieldErrors: FieldErrors<PRFormData>) => {
    // Helper to find the first error message recursively
    interface FormErrorNode {
      message?: string;
      [key: string]: FormErrorNode | string | undefined | object | object[];
    }

    const getFirstErrorMessage = (error: FormErrorNode | undefined): string | undefined => {
      if (!error) return undefined;
      
      if (typeof error.message === 'string' && error.message) return error.message;
      
      for (const key in error) {
        if (key === 'ref' || key === 'type' || key === 'message') continue;
        const child = error[key];
        if (child && typeof child === 'object') {
            const msg = getFirstErrorMessage(child as FormErrorNode);
            if (msg) return msg;
        }
      }
      return undefined;
    };

    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey) {
      // Use type assertion to our safe interface for recursion
      const msg = getFirstErrorMessage(fieldErrors[firstKey as keyof PRFormData] as FormErrorNode);
      if (msg) {
        showAlert(msg);
      }
      try {
        setFocus(firstKey as Path<PRFormData>);
      } catch { /* ignore */ }
    }
  }, [setFocus, showAlert]);

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
              const mappedLines: ExtendedLine[] = (pr.lines || []).map((line: PRLine) => {
                // Phase 3: The Safe Hydration Loop - Active lookup against loaded master array
                const matchedItem = masterItems?.find(i => String(i.item_id) === String(line.item_id));
                const matchedUnit = masterUnits?.find(u => String(u.uom_id || u.unit_id) === String(line.uom_id));

                return {
                  item_id: line.item_id,
                  item_code: matchedItem?.item_code || line.item_code || '',
                  item_name: matchedItem?.item_name || line.item_name || '',
                  description: line.description || line.item_name || matchedItem?.item_name || '',
                  qty: Number(line.qty) || 0,
                  uom: matchedUnit?.uom_name || matchedUnit?.unit_name || line.uom || '',
                  uom_id: line.uom_id,
                  est_unit_price: Number(line.est_unit_price) || 0,
                  est_amount: Number(line.line_net_amount ?? line.est_amount) || 0,
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
                pr_no: pr.pr_no || 'DRAFT-TEMP', // Ensure string
                ...(pr.project_id !== undefined && { project_id: pr.project_id || undefined }),
                preparer_name: pr.requester_name, // If we don't have preparer_name from API yet
                requester_name: pr.requester_name,
                pr_base_currency_code: pr.pr_base_currency_code || 'THB',
                pr_quote_currency_code: pr.pr_quote_currency_code || '',
                isMulticurrency: (pr.pr_base_currency_code || 'THB') !== 'THB',
                pr_exchange_rate: pr.pr_exchange_rate || 1,
                lines: mappedLines,
                is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N',
                pr_tax_code_id: pr.pr_tax_code_id ? String(pr.pr_tax_code_id) : '',
                pr_tax_rate: pr.pr_tax_rate != null ? Number(pr.pr_tax_rate) : undefined,
                pr_discount_raw: pr.pr_discount_raw != null ? String(pr.pr_discount_raw) : '',
                remark: pr.remark || '',
                shipping_method: pr.shipping_method || '',
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
  }, [isOpen, isMasterDataLoading, reset, id, user, setIsActionLoading, masterItems, masterUnits]);

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
  
  const updateLine = useCallback((index: number, field: keyof ExtendedLine, value: string | number | undefined) => {
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
        const stdCost = (line as ExtendedLine)._standard_cost;
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

        // W-01: Determine correct UoM — prioritize purchasing unit over base unit
        const usePurchasingUnit = !!product.purchasing_unit_name;
        const unitName = usePurchasingUnit
          ? product.purchasing_unit_name!
          : (product.unit_name || '');
        const unitId = usePurchasingUnit
          ? (product.purchasing_unit_id || product.unit_id || '')
          : (product.unit_id || '');

        // W-01: Apply conversion factor to standard cost when using purchasing unit
        const baseCost = product.standard_cost || 0;
        const conversionFactor = product.purchasing_conversion_factor || 1;
        const unitPrice = usePurchasingUnit && conversionFactor > 1
          ? baseCost * conversionFactor
          : baseCost;

        const line: ExtendedLine = {
          ...currentLines[targetIndex],
          item_id: product.item_id,
          item_code: product.item_code,
          item_name: product.item_name,
          // W-01: Map warehouse from master data instead of hardcoded '1'
          warehouse_id: product.warehouse_id || product.warehouse || '',
          location: product.location || '',
          uom: unitName,
          uom_id: unitId,
          est_unit_price: unitPrice,
          qty: 1,
          est_amount: unitPrice * 1,
          // W-04: Store original standard cost for variance check
          _standard_cost: unitPrice,
          // Vendor-Item: Track item's preferred vendor for mismatch detection
          _item_vendor_id: product.preferred_vendor_id || undefined,
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
        // Smart Clean-up: Only filter out rows that are 100% empty
        // If a row has partial data (like qty > 0 but no item_id), keep it so validation can catch it
        const activeLines = (data.lines || []).filter(line => {
          const isItemIdEmpty = !line.item_id || line.item_id === '';
          const isItemCodeEmpty = !line.item_code || line.item_code === '';
          const isQtyZero = !line.qty || Number(line.qty) === 0;
          const isPriceZero = !line.est_unit_price || Number(line.est_unit_price) === 0;
          const isDescriptionEmpty = !line.description || line.description.trim() === '';
          
          // Row is 100% empty if all key fields are empty/zero
          const isCompletelyEmpty = isItemIdEmpty && isItemCodeEmpty && isQtyZero && isPriceZero && isDescriptionEmpty;
          
          return !isCompletelyEmpty;
        });

        // Vendor-Item Mismatch Check: Warn before saving if items don't match header vendor
        const headerVendorId = data.preferred_vendor_id;
        if (headerVendorId) {
          const mismatchedLines = activeLines.filter(l => {
            const itemVendor = (l as ExtendedLine)._item_vendor_id;
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
        
        // Type guard handled by Zod validation - cost_center_id will be number after validation
        const payload: CreatePRPayload = {
            pr_date: data.pr_date,
            remark: data.remark || data.purpose,
            cost_center_id: data.cost_center_id,
            project_id: data.project_id || undefined,
            requester_name: data.requester_name,
            need_by_date: data.need_by_date,
            items: activeLines.map(line => ({
                item_id: line.item_id, 
                item_code: line.item_code, 
                item_name: line.item_name || '',
                description: line.item_name, 
                qty: Number(line.qty) || 0, 
                uom: line.uom || '', 
                uom_id: line.uom_id || '1',
                est_unit_price: Number(line.est_unit_price) || 0, 
                needed_date: line.needed_date || data.need_by_date, 
                remark: line.remark || '', 
                line_discount_raw: line.line_discount_raw || '',
               warehouse_id: line.warehouse_id || data.warehouse_id || '1',
               location: line.location || '',
               required_receipt_type: 'FULL' // Postman default
            })),
            delivery_date: data.delivery_date,
            credit_days: Number(data.credit_days) || 30,
            payment_term_days: Number(data.payment_term_days) || Number(data.credit_days) || 30,
            vendor_quote_no: data.vendor_quote_no,
            shipping_method: data.shipping_method,
            preferred_vendor_id: data.preferred_vendor_id,
            vendor_name: data.vendor_name,
            requester_user_id: String(user?.id || '1'), 
            branch_id: String(user?.employee?.branch_id || '1'), 
            warehouse_id: data.warehouse_id || '1',
            pr_tax_code_id: data.pr_tax_code_id || '1',
            pr_exchange_rate_date: data.pr_exchange_rate_date || data.pr_date,
            pr_base_currency_code: data.pr_base_currency_code || 'THB',
            pr_quote_currency_code: data.pr_quote_currency_code || 'THB',
            pr_exchange_rate: Number(data.pr_exchange_rate) || 1,
            pr_discount_raw: data.pr_discount_raw || '0',
            
            // Winspeed-Style ON HOLD Logic (Agent 2 Fix)
            is_on_hold: isOnHold ? 'Y' : 'N',
            on_hold: !!isOnHold, // Alias to ensure backend compatibility
            status: targetStatus
        };
        
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
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
        await confirm({ title: 'เกิดข้อผิดพลาด', description: errorMessage, confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
    } finally {
        setIsActionLoading(false);
    }
  };

  const onSubmit = async (data: PRFormData) => {
    if (!data.need_by_date) { showAlert('กรุณาระบุวันที่ต้องการใช้'); return; }
    if (!data.requester_name) { showAlert('กรุณาระบุชื่อผู้ขอซื้อ'); return; }
    if (!data.cost_center_id) { showAlert('กรุณาเลือกศูนย์ต้นทุน'); return; }
    if (!data.purpose) { showAlert('กรุณาระบุวัตถุประสงค์'); return; }
    
    // Smart Clean-up: Identical logic to handleSaveData to ensure consistency
    const activeLines = (data.lines || []).filter(line => {
      const isItemIdEmpty = !line.item_id || line.item_id === '';
      const isItemCodeEmpty = !line.item_code || line.item_code === '';
      const isQtyZero = !line.qty || Number(line.qty) === 0;
      const isPriceZero = !line.est_unit_price || Number(line.est_unit_price) === 0;
      const isDescriptionEmpty = !line.description || line.description?.trim() === '';
      
      const isCompletelyEmpty = isItemIdEmpty && isItemCodeEmpty && isQtyZero && isPriceZero && isDescriptionEmpty;
      return !isCompletelyEmpty;
    });

    if (activeLines.length === 0) { showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'); return; }
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

  const onApproveClick = useCallback(async () => {
    if (!id) return;
    handleApprove(id, { 
        onSuccess: () => {
             onSuccess?.(); 
             onClose(); 
        } 
    });
  }, [id, handleApprove, onSuccess, onClose]);

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
    products, costCenters, projects, purchaseTaxOptions, isSearchingProducts,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, openWarehouseSearch, openLocationSearch, selectProduct, selectWarehouse, selectLocation, handleVendorSelect, onSubmit, handleDelete, handleApprove: onApproveClick,
    handleVoid, control, reset, formMethods, user, isApproving,
    // Reject Logic
    handleReject, submitReject, closeRejectModal, isRejectReasonOpen, isRejecting
  };
};