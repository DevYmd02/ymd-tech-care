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
import type { UserProfile } from '@/modules/auth/services/auth.service';
import { usePRMasterData } from './usePRMasterData';
import { usePRActions } from './usePRActions';
import { PRFormSchema } from '@/modules/procurement/types/pr-schemas';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';



const PR_CONFIG = {
  MIN_LINES: 5,
  INITIAL_LINES: 5,
} as const;

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const getNextWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

// Standardized on string for all IDs

export type ExtendedLine = PRLineFormData;

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
  is_multicurrency: false,
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
    isLoading: isMasterDataLoading,
    searchProducts,
    isSearchingProducts 
  } = usePRMasterData();


  const { createPRMutation, updatePR, deletePR, approvePR, cancelPR } = usePRActions();
  
  const { toast } = useToast();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
       const defaultTax = purchaseTaxOptions.find(t => t.original?.tax_code === 'VAT-IN-7') || 
                          purchaseTaxOptions.find(t => t.original?.tax_rate === 7) ||
                          purchaseTaxOptions[0];
       
       if (defaultTax) {
         setValue('pr_tax_code_id', defaultTax.value);
         setValue('pr_tax_rate', defaultTax.original?.tax_rate || 0);
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
      const defaultTax = purchaseTaxOptions.find(t => t.original?.tax_code === 'VAT-IN-7') || 
                         purchaseTaxOptions.find(t => t.original?.tax_rate === 7) ||
                         purchaseTaxOptions[0];
      
      if (defaultTax) {
        setValue('pr_tax_code_id', defaultTax.value);
        setValue('pr_tax_rate', defaultTax.original?.tax_rate || 0);
      }
    }
  }, [id, purchaseTaxOptions, setValue, formMethods]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(async () => {
        if (id) {
          try {
            setIsActionLoading(true);
            setIsActionLoading(true);
            const pr = await PRService.getDetail(id);
            if (pr) {
              const mappedLines: ExtendedLine[] = (pr.lines || []).map((line: PRLine) => ({
                item_id: line.item_id,
                item_code: line.item_code,
                item_name: line.item_name,
                description: line.description || line.item_name,
                qty: line.qty,
                uom: line.uom,
                uom_id: line.uom_id,
                est_unit_price: line.est_unit_price,
                est_amount: line.est_amount,
                needed_date: line.needed_date,
                preferred_vendor_id: line.preferred_vendor_id,
                remark: line.remark,
                warehouse_id: pr.warehouse_id || '1', 
                location: '',
                discount: 0,
                line_discount_raw: ''
              }));

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
                is_multicurrency: (pr.pr_base_currency_code || 'THB') !== 'THB',
                pr_exchange_rate: pr.pr_exchange_rate || 1,
                lines: mappedLines,
                is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N',
                pr_tax_code_id: pr.pr_tax_code_id || '1',
                pr_discount_raw: pr.pr_discount_raw || '',
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
          const nextPRNo = await PRService.generateNextDocumentNo();
          reset({ ...getDefaultFormValues(user), pr_no: nextPRNo.document_no });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset, id, user]);

  // Currency Sync
  const sourceCurrencyCode = watch('pr_base_currency_code');
  const targetCurrencyCode = watch('pr_quote_currency_code'); 
  
  useEffect(() => {
    if (!sourceCurrencyCode) return;
    if (sourceCurrencyCode === targetCurrencyCode) {
      setValue('pr_exchange_rate', 1, { shouldDirty: false });
      setValue('is_multicurrency', String(sourceCurrencyCode) !== 'THB');
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
          setValue('is_multicurrency', String(sourceCurrencyCode) !== 'THB' || String(finalTarget) !== 'THB');
        } catch (error) {
          logger.error('Failed to fetch exchange rate:', error);
        }
      }
    };
    fetchRate();
    prevCurrencyId.current = sourceCurrencyCode;
    prevCurrencyTypeId.current = targetCurrencyCode;
  }, [sourceCurrencyCode, targetCurrencyCode, setValue, getFieldState]);


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
    }
  }, [setValue, watch]);

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
  
  const selectProduct = (product: ItemListItem) => {
    if (activeRowIndex !== null) {
      const currentLines = watch('lines');
      const targetIndex = activeRowIndex;
        const line = {
          ...currentLines[targetIndex],
          item_id: product.item_id,
          item_code: product.item_code,
          item_name: product.item_name,
          warehouse_id: '1', // Default since ItemListItem only has 'warehouse' string name
          location: product.location || '', 
          uom: product.unit_name || '',
          uom_id: product.unit_id || '1',
          est_unit_price: product.standard_cost || 0,
          qty: 1,
          est_amount: (product.standard_cost || 0) * 1,
        };
      updateFieldArray(targetIndex, line);
    }
    setIsProductModalOpen(false);
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const selectedVendorId = watch('preferred_vendor_id');

  useEffect(() => {
    if (isProductModalOpen) {
      // If showAllItems is true, we pass undefined to bypass the vendor filter in the backend mock
      searchProducts(debouncedSearchTerm, showAllItems ? undefined : selectedVendorId);
    }
  }, [debouncedSearchTerm, selectedVendorId, isProductModalOpen, searchProducts, showAllItems]);

   useEffect(() => {
      if (isMasterDataLoading || !user?.employee?.branch_id || warehouses.length === 0) return;
       const branchWarehouse = warehouses.find(w => String(w.original?.branch_id) === String(user.employee.branch_id));
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
        const activeLines = (data.lines || []).filter(l => l.item_id && l.item_code);
        
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
            pr_discount_raw: data.pr_discount_raw || '0'
        };
        
        if (isEditMode && id) {
            await updatePR(id, payload);
            await confirm({ title: 'แก้ไขสำเร็จ', description: 'แก้ไขเอกสารเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
            onSuccess?.(); onClose();
            queryClient.invalidateQueries({ queryKey: ['prs'] });
        } else {
            const { newPR } = await createPRMutation.mutateAsync(payload);
            const displayNo = newPR.pr_no.startsWith('DRAFT-TEMP') ? 'รอรันเลข (NEW)' : newPR.pr_no;
            await confirm({
                title: 'บันทึกแบบร่างสำเร็จ!',
                description: `เลขที่เอกสาร: ${displayNo}\nสถานะ: แบบร่าง (Draft)`,
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
    const activeLines = (data.lines || []).filter(l => l.item_id && l.item_code);
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

  const handleApprove = async () => {
    if (!id) return;
    const isConfirmed = await confirm({ title: 'ยืนยันการอนุมัติ', description: 'คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?', confirmText: 'อนุมัติ', cancelText: 'ข้าม', variant: 'success' });
    if (isConfirmed) {
      setIsActionLoading(true);
      try {
        if (await approvePR(id)) {
          await confirm({ title: 'อนุมัติสำเร็จ', description: 'เอกสารได้รับการอนุมัติเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
          onSuccess?.(); onClose();
        }
      } finally { setIsActionLoading(false); }
    }
  };

  const handleVoid = async () => {
    if (!id) return;
    const isConfirmed = await confirm({ title: 'ยืนยันการยกเลิกเอกสาร', description: 'คุณต้องการยกเลิกเอกสารใบขอซื้อนี้ใช่หรือไม่?', confirmText: 'ยกเลิกเอกสาร', cancelText: 'ย้อนกลับ', variant: 'danger' });
    if (isConfirmed) {
      setIsActionLoading(true);
      try {
        if (await cancelPR(id)) {
          await confirm({ title: 'ยกเลิกสำเร็จ', description: 'เอกสารได้รับการยกเลิกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
          onSuccess?.(); onClose();
        }
      } finally { setIsActionLoading(false); }
    }
  };

  return {
    isEditMode, lines, activeTab, setActiveTab,
    isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    showAllItems, setShowAllItems,
    handleSubmit, setValue, watch, isSubmitting, isActionLoading, errors, handleFormError,
    products, costCenters, projects, purchaseTaxOptions, isSearchingProducts,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, handleVendorSelect, onSubmit, handleDelete, handleApprove,
    handleVoid, control, reset, formMethods, user
  };
};
