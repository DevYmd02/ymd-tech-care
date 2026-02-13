import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import type { PRFormData, PRLineFormData, CreatePRPayload, VendorSelection } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { fetchExchangeRate } from '@/modules/master-data/currency/services/mockExchangeRateService';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import { logger } from '@/shared/utils/logger';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { usePRMasterData } from './usePRMasterData';
import { usePRActions } from './usePRActions';
import { PRFormSchema } from '@/modules/procurement/types/pr-schemas';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';



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

export type ExtendedLine = PRLineFormData;

const createEmptyLine = (): ExtendedLine => ({
  item_id: '', item_code: '', item_name: '', item_description: '', quantity: 0, uom: '', uom_id: undefined,
  est_unit_price: 0, est_amount: 0, needed_date: getTodayDate(), preferred_vendor_id: undefined, remark: '',
  warehouse: '', location: '', discount: 0, discount_input: '',
});

const getInitialLines = () => Array(PR_CONFIG.INITIAL_LINES).fill(null).map(() => createEmptyLine());

const getDefaultFormValues = (): PRFormData => ({
  pr_no: '', request_date: getTodayDate(), required_date: '', requester_name: 'นางสาว กรรลิกา สารมาท',
  cost_center_id: '', project_id: undefined, purpose: '', currency_id: '', lines: getInitialLines(), total_amount: 0,
  is_on_hold: 'N',
  delivery_date: getNextWeekDate(), credit_days: 30, vendor_quote_no: '', shipping_method: '', remarks: '',
  is_multicurrency: false, exchange_rate: 1, rate_date: new Date().toISOString().split('T')[0],
  currency_type_id: '',
  cancelflag: 'N',
  status: 'DRAFT',
  discount_input: '',
  tax_rate: 7, 
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
    isLoading: isMasterDataLoading,
    searchProducts,
    isSearchingProducts 
  } = usePRMasterData();
  const { createPRMutation, updatePR, deletePR, approvePR, cancelPR } = usePRActions();
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [activeTab, setActiveTab] = useState('detail');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const prevCurrencyId = useRef<string>(getDefaultFormValues().currency_id);
  const prevCurrencyTypeId = useRef<string | undefined>(getDefaultFormValues().currency_type_id);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formMethods = useForm<PRFormData>({
    defaultValues: getDefaultFormValues(),
    resolver: zodResolver(PRFormSchema),
    mode: 'onBlur',
  });
  
  const { handleSubmit, setValue, reset, watch, setFocus, control, getFieldState, formState: { isSubmitting, errors } } = formMethods;

  // Field Array for Lines
  const { fields: lines, append, remove, update: updateFieldArray } = useFieldArray({
    control,
    name: 'lines'
  });

  // Error handler
  const handleFormError = useCallback((fieldErrors: FieldErrors<PRFormData>) => {
    const firstKey = Object.keys(fieldErrors)[0] as keyof PRFormData | undefined;
    if (firstKey) {
      const msg = fieldErrors[firstKey]?.message;
      if (msg && typeof msg === 'string') {
        showAlert(msg);
      }
      try {
        setFocus(firstKey);
      } catch { /* ignore */ }
    }
  }, [setFocus]);

  // Fetch Default Tax Rate on Mount
  useEffect(() => {
    if (id) return;
    const fetchTax = async () => {
      try {
        const rate = await TaxService.getDefaultTaxRate();
        setValue('tax_rate', rate);
      } catch (error) {
        logger.error('Failed to fetch default tax rate', error);
      }
    };
    fetchTax();
  }, [id, setValue]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(async () => {
        if (id) {
          try {
            setIsActionLoading(true);
            const pr = await PRService.getById(id);
            if (pr) {
              const mappedLines: ExtendedLine[] = (pr.lines || []).map(line => ({
                item_id: line.item_id,
                item_code: line.item_code,
                item_name: line.item_name,
                item_description: line.item_description,
                quantity: line.quantity,
                uom: line.uom,
                est_unit_price: line.est_unit_price,
                est_amount: line.est_amount,
                needed_date: line.needed_date,
                preferred_vendor_id: line.preferred_vendor_id,
                remark: line.remark,
                warehouse: '', 
                location: '',
                discount: 0,
                discount_input: ''
              }));

              while (mappedLines.length < PR_CONFIG.MIN_LINES) {
                mappedLines.push(createEmptyLine());
              }

              const formData: PRFormData = {
                ...pr,
                currency_id: pr.currency_code || 'THB',
                is_multicurrency: pr.currency_code !== 'THB',
                exchange_rate: 1,
                lines: mappedLines,
                is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N',
                tax_rate: pr.tax_rate ?? 7,
                discount_input: '', // PRHeader doesn't have this, default to empty
                remarks: pr.remarks || '',
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
          reset({ ...getDefaultFormValues(), pr_no: nextPRNo });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset, id]);

  // Currency Sync
  const sourceCurrencyId = watch('currency_id');
  const targetCurrencyId = watch('currency_type_id'); 
  
  useEffect(() => {
    if (!sourceCurrencyId) return;
    if (sourceCurrencyId === targetCurrencyId) {
      setValue('exchange_rate', 1, { shouldDirty: false });
      setValue('is_multicurrency', sourceCurrencyId !== 'THB');
      prevCurrencyId.current = sourceCurrencyId;
      prevCurrencyTypeId.current = targetCurrencyId;
      return;
    }
    const isSourceChanged = prevCurrencyId.current !== sourceCurrencyId;
    const isTargetChanged = prevCurrencyTypeId.current !== targetCurrencyId;
    const fetchRate = async () => {
      if (isSourceChanged && (targetCurrencyId === prevCurrencyId.current || !targetCurrencyId)) {
        setValue('currency_type_id', 'THB');
      }
      const { isDirty } = getFieldState('exchange_rate');
      if (isSourceChanged || isTargetChanged || !isDirty) {
        try {
          const finalTarget = (isSourceChanged && !targetCurrencyId) ? 'THB' : targetCurrencyId;
          const rate = await fetchExchangeRate(sourceCurrencyId, finalTarget);
          setValue('exchange_rate', rate, { shouldValidate: true, shouldDirty: false });
          setValue('is_multicurrency', sourceCurrencyId !== 'THB' || finalTarget !== 'THB');
        } catch (error) {
          logger.error('Failed to fetch exchange rate:', error);
        }
      }
    };
    fetchRate();
    prevCurrencyId.current = sourceCurrencyId;
    prevCurrencyTypeId.current = targetCurrencyId;
  }, [sourceCurrencyId, targetCurrencyId, setValue, getFieldState]);

  const showAlert = (message: string) => setAlertState({ show: true, message });

  const addLine = useCallback(() => append(createEmptyLine()), [append]);
  
  const removeLine = useCallback((index: number) => {
    if (lines.length <= PR_CONFIG.MIN_LINES) {
      showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
      return;
    }
    remove(index);
  }, [lines, remove]);
  
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
    
    if (field === 'discount_input') {
      const input = String(value || '');
      const totalBeforeDiscount = (line.est_unit_price || 0) * (line.quantity || 0);
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
    } else if (field === 'quantity' || field === 'est_unit_price') {
      const quantity = field === 'quantity' ? (parseFloat(String(value || 0)) || 0) : (line.quantity || 0);
      const unitPrice = field === 'est_unit_price' ? (parseFloat(String(value || 0)) || 0) : (line.est_unit_price || 0);
      
      const totalBeforeDiscount = quantity * unitPrice;
      let discAmount = 0;
      const input = line.discount_input || '';
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
        warehouse: product.warehouse || '', 
        location: product.location || '', 
        uom: product.unit_name || '',
        uom_id: product.unit_id,
        est_unit_price: product.standard_cost || 0,
        quantity: 1,
        est_amount: (product.standard_cost || 0) * 1,
      };
      updateFieldArray(targetIndex, line);
    }
    setIsProductModalOpen(false);
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const selectedVendorId = watch('preferred_vendor_id');

  useEffect(() => {
     if (isProductModalOpen) searchProducts(debouncedSearchTerm, selectedVendorId);
  }, [debouncedSearchTerm, selectedVendorId, isProductModalOpen, searchProducts]);

  useEffect(() => {
     if (isMasterDataLoading || !user?.employee?.branch_id || warehouses.length === 0) return;
     const branchWarehouse = warehouses.find(w => w.branch_id === String(user.employee.branch_id));
     if (branchWarehouse) setValue('warehouse_id', Number(branchWarehouse.warehouse_id) || 1);
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
        const activeLines = (data.lines || []).filter(l => l.item_code);
        const payload: CreatePRPayload = { 
            pr_date: data.request_date,
            remark: data.remarks || data.purpose,
            department_id: data.cost_center_id,
            project_id: data.project_id,
            requester_name: data.requester_name,
            required_date: data.required_date,
            items: activeLines.map(line => ({
               item_id: line.item_id, item_code: line.item_code, item_name: line.item_name,
               qty: line.quantity, uom: line.uom, uom_id: line.uom_id,
               price: line.est_unit_price, needed_date: line.needed_date, remark: line.remark, discount: line.discount
            })),
            delivery_date: data.delivery_date,
            credit_days: data.credit_days || 30,
            payment_term_days: data.credit_days || 30,
            vendor_quote_no: data.vendor_quote_no,
            shipping_method: data.shipping_method,
            preferred_vendor_id: data.preferred_vendor_id,
            vendor_name: data.vendor_name,
            requester_user_id: user?.id || 1, 
            branch_id: user?.employee?.branch_id || 1, 
            warehouse_id: data.warehouse_id || 1,
            tax_rate: data.tax_rate       
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
    if (!data.required_date) { showAlert('กรุณาระบุวันที่ต้องการใช้'); return; }
    if (!data.requester_name) { showAlert('กรุณาระบุชื่อผู้ขอซื้อ'); return; }
    if (!data.cost_center_id) { showAlert('กรุณาเลือกศูนย์ต้นทุน'); return; }
    if (!data.purpose) { showAlert('กรุณาระบุวัตถุประสงค์'); return; }
    if (!data.shipping_method) { showAlert('กรุณาเลือกประเภทการขนส่ง'); return; }
    const activeLines = (data.lines || []).filter(l => l.item_code);
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
    handleSubmit, setValue, watch, isSubmitting, isActionLoading, errors, handleFormError,
    alertState, setAlertState, products, costCenters, projects, isSearchingProducts,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, handleVendorSelect, onSubmit, handleDelete, handleApprove,
    handleVoid, control, reset, formMethods
  };
};
