import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { PRFormData, PRLineFormData, CreatePRPayload } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { fetchExchangeRate } from '@/modules/master-data/currency/services/mockExchangeRateService';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import { logger } from '@/shared/utils/logger';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import type { VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { usePRMasterData } from './usePRMasterData';
import { usePRActions } from './usePRActions';
import { PRFormSchema } from '@/modules/procurement/types/pr-schemas';
import { useQueryClient } from '@tanstack/react-query';
import type { FieldErrors } from 'react-hook-form';


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

export interface ExtendedLine extends PRLineFormData {
  warehouse?: string;
  location?: string;
  // discount and discount_input are now in PRLineFormData
}

const createEmptyLine = (): ExtendedLine => ({
  item_id: '', item_code: '', item_name: '', item_description: '', quantity: 0, uom: '', uom_id: undefined,
  est_unit_price: 0, est_amount: 0, needed_date: getTodayDate(), preferred_vendor_id: undefined, remark: '',
  warehouse: '', location: '', discount: 0, discount_input: '',
});

const getInitialLines = () => Array(PR_CONFIG.INITIAL_LINES).fill(null).map(() => createEmptyLine());

const getDefaultFormValues = (): PRFormData => ({
  pr_no: '', request_date: getTodayDate(), required_date: '', requester_name: 'นางสาว กรรลิกา สารมาท',
  cost_center_id: '', project_id: undefined, purpose: '', currency_id: '', lines: [], total_amount: 0,
  is_on_hold: 'N',
  delivery_date: getNextWeekDate(), credit_days: 30, vendor_quote_no: '', shipping_method: '', remarks: '',
  is_multicurrency: false, exchange_rate: 1, rate_date: new Date().toISOString().split('T')[0],
  currency_type_id: '',
  cancelflag: 'N',
  status: 'DRAFT',
  discount_input: '',
  tax_rate: 7, // Default safe value, will be updated by effect
});

export const usePRForm = (isOpen: boolean, onClose: () => void, id?: string, onSuccess?: () => void) => {
  const isEditMode = !!id;
  const { user } = useAuth();
  const prevIsOpenRef = useRef(false);
  const { confirm } = useConfirmation();
  const queryClient = useQueryClient();
  
  // Custom Hooks
  const { products, costCenters, projects } = usePRMasterData();
  const { createPRMutation, updatePR, deletePR, approvePR, cancelPR } = usePRActions();
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  // Sync loading state if needed, or just use the hook's state. 
  // For now, let's keep local isActionLoading and sync it or replace usages gradually.
  // Actually, let's just use local state for now to avoid breaking existing logic that sets it, 
  // and we'll eventually replace it.
  
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [lines, setLines] = useState<ExtendedLine[]>(getInitialLines);
  const [activeTab, setActiveTab] = useState('detail');
  const [globalDiscountInput, setGlobalDiscountInput] = useState('');
  const [vatRate, setVatRate] = useState<number>(7);
  const [remarks, setRemarks] = useState('');
  
  // Removed local states - now managed by useForm
  // const [deliveryDate, setDeliveryDate] = useState(...);
  // const [vendorQuoteNo, setVendorQuoteNo] = useState('');
  // const [shippingMethod, setShippingMethod] = useState('');
  const [requesterName] = useState('นางสาว กรรลิกา สารมาท');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const prevCurrencyId = useRef<string>(getDefaultFormValues().currency_id);
  const prevCurrencyTypeId = useRef<string | undefined>(getDefaultFormValues().currency_type_id);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');



  const { register, handleSubmit, setValue, reset, watch, setFocus, control, getFieldState, formState: { isSubmitting, errors } } = useForm<PRFormData>({
    defaultValues: getDefaultFormValues(),
    resolver: zodResolver(PRFormSchema),
    mode: 'onBlur',
  });

  // onError handler: scroll to first invalid field + show alert
  const handleFormError = useCallback((fieldErrors: FieldErrors<PRFormData>) => {
    const firstKey = Object.keys(fieldErrors)[0] as keyof PRFormData | undefined;
    if (firstKey) {
      const msg = fieldErrors[firstKey]?.message;
      if (msg && typeof msg === 'string') {
        showAlert(msg);
      }
      // Attempt to focus the first errored field
      try {
        setFocus(firstKey);
      } catch {
        // setFocus may not support all field types (e.g. select), silently ignore
      }
    }
  }, [setFocus]);

  // Master Data is now handled by usePRMasterData hook
  // const [products, setProducts] = useState<ItemListItem[]>([]);
  // const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  // const [projects, setProjects] = useState<Project[]>([]);

  // Fetch Default Tax Rate on Mount
  useEffect(() => {
    const fetchTax = async () => {
      try {
        const rate = await TaxService.getDefaultTaxRate();
        setVatRate(rate);
      } catch (error) {
        logger.error('Failed to fetch default tax rate', error);
      }
    };
    if (!id) { // Only fetch default for new PRs, Edit mode uses saved rate (or default if missing)
      fetchTax(); 
    }
  }, [id]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(async () => {
        if (id) {
          // Fetch PR for Edit Mode
          try {
            setIsActionLoading(true);
            const pr = await PRService.getById(id);
            if (pr) {
              // Map PRHeader to PRFormData
              const formData: PRFormData = {
                pr_no: pr.pr_no,
                request_date: pr.request_date,
                required_date: pr.required_date,
                requester_name: pr.requester_name,
                cost_center_id: pr.cost_center_id,
                project_id: pr.project_id,
                purpose: pr.purpose,
                currency_id: pr.currency_code || 'THB',
                is_multicurrency: pr.currency_code !== 'THB',
                exchange_rate: 1, // Default or fetch if needed
                lines: (pr.lines || []).map(line => ({
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
                  remark: line.remark
                })), 
                is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N', // map if needed
                total_amount: pr.total_amount,
                delivery_date: pr.delivery_date,
                credit_days: pr.credit_days || 30,
                vendor_quote_no: pr.vendor_quote_no,
                shipping_method: pr.shipping_method || '',
                remarks: pr.remarks,
                preferred_vendor_id: pr.preferred_vendor_id,
                vendor_name: pr.vendor_name,
                cancelflag: pr.cancelflag || 'N',
                status: pr.status,
                tax_rate: pr.tax_rate ?? 7
              };

              // Map PRLine to ExtendedLine
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
                warehouse: '', // not in PRLine but in ExtendedLine
                location: '',
                discount: 0,
                discount_input: ''
              }));

              // Ensure at least 5 lines for UI consistency
              const initialLines = [...mappedLines];
              while (initialLines.length < PR_CONFIG.MIN_LINES) {
                initialLines.push(createEmptyLine());
              }

              setLines(initialLines);
              setRemarks(pr.remarks || '');
              
              reset(formData);
            }
          } catch (error) {
            console.error('Failed to fetch PR details:', error);
            logger.error('Failed to fetch PR details:', error);
          } finally {
            setIsActionLoading(false);
          }
        } else {
          // New PR Mode
          setLines(getInitialLines());
          setGlobalDiscountInput('');
          // setVatRate(7); // Removed: Handled by useEffect
          setRemarks('');
          setValue('credit_days', 30);
          setActiveTab('detail');
          const nextPRNo = await PRService.generateNextDocumentNo();
          reset({ ...getDefaultFormValues(), pr_no: nextPRNo });
          // Ensure form also has the latest vatRate if it was fetched before reset
          // But reset might overwrite it with default 7. 
          // Note: useEffect for tax runs on mount (or id change). 
          // If we reset here, we should ensure we don't lose the fetched rate if it already arrived.
          // For simplicity, let's allow reset to 7, and the useEffect execution order or a separate setVatRate will handle it.
          // Better: set value after reset.
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset, id, setValue]);

  // Currency Pair (Source -> Target) Sync Logic
  const sourceCurrencyId = watch('currency_id');
  const targetCurrencyId = watch('currency_type_id'); // Using this as Target Currency
  
  useEffect(() => {
    if (!sourceCurrencyId) return;

    // Logic: If Source === Target (e.g. THB -> THB), Rate = 1
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
      // AUTO-DEFAULT: If Source changed to foreign and Target is empty/same-as-prev-source, 
      // default Target to 'THB'
      if (isSourceChanged && (targetCurrencyId === prevCurrencyId.current || !targetCurrencyId)) {
        setValue('currency_type_id', 'THB');
      }

      const { isDirty } = getFieldState('exchange_rate');
      
      // Fetch if:
      // 1. Source/Target changed
      // 2. OR field is NOT dirty
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

  const addLine = useCallback(() => setLines(prev => [...prev, createEmptyLine()]), []);
  
  const removeLine = useCallback((index: number) => {
    setLines(prev => {
      if (prev.length <= PR_CONFIG.MIN_LINES) {
        // Warning side-effect should theoretically be handled outside or via a state, 
        // but for now we'll keep it simple. 
        // Note: showAlert depends on setAlertState which is stable from useState
        showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);
  
  const clearLine = useCallback((index: number) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = createEmptyLine();
      return newLines;
    });
  }, []);
  
  const updateLine = useCallback((index: number, field: keyof ExtendedLine, value: string | number) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = { ...newLines[index] };
      
      // Handle Discount Input (String)
      if (field === 'discount_input') {
          const input = String(value);
          line.discount_input = input;

          // Parse Logic
          const price = line.est_unit_price || 0;
          const qty = line.quantity || 0;
          const totalBeforeDiscount = price * qty;
          
          let discountAmount = 0;

          if (input.trim().endsWith('%')) {
              const percent = parseFloat(input.replace('%', ''));
              if (!isNaN(percent)) {
                  discountAmount = totalBeforeDiscount * (percent / 100);
              }
          } else {
              discountAmount = parseFloat(input);
          }

          if (isNaN(discountAmount)) discountAmount = 0;

          // Validation: Cap at Total Amount (Should not be negative total)
          if (discountAmount > totalBeforeDiscount) {
              discountAmount = totalBeforeDiscount; 
              // Optional: You could revert input or show error, but capping is safer for now
          }

          line.discount = discountAmount;
          line.est_amount = totalBeforeDiscount - discountAmount;
      } 
      // Handle Numeric Fields
      else if (field === 'quantity' || field === 'est_unit_price') {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          const safeValue = isNaN(numValue) ? 0 : numValue;
          
          if (field === 'quantity') {
              line.quantity = safeValue;
          } else {
              line.est_unit_price = safeValue;
          }

          // Recalculate based on existing discount input
          const qty = line.quantity || 0;
          const price = line.est_unit_price || 0;
          const totalBeforeDiscount = qty * price;
          
          // Re-evaluate discount based on input type
          let discountAmount = 0;
          const input = line.discount_input || '';
          
          if (input.trim().endsWith('%')) {
              const percent = parseFloat(input.replace('%', ''));
              if (!isNaN(percent)) {
                  discountAmount = totalBeforeDiscount * (percent / 100);
              }
          } else {
              // Fixed amount remains fixed, but if it exceeds total, we cap it
             const fixed = parseFloat(input);
             if (!isNaN(fixed)) discountAmount = fixed;
          }
          
          // Validation Cap
          if (discountAmount > totalBeforeDiscount) {
              discountAmount = totalBeforeDiscount;
          }

          line.discount = discountAmount;
          line.est_amount = totalBeforeDiscount - discountAmount;

      } else {
          // Handle other fields explicitly to avoid 'any'
          if (field === 'item_code' || field === 'item_name' || field === 'item_description' || 
              field === 'uom' || field === 'warehouse' || field === 'location' || 
              field === 'remark' || field === 'needed_date' || field === 'preferred_vendor_id' || 
              field === 'item_id') {
               line[field] = String(value);
          } else if (field === 'uom_id') {
               line[field] = value;
          } else if (field === 'est_amount' || field === 'discount') {
               line[field] = typeof value === 'string' ? parseFloat(value) : value;
          }
      }
      
      newLines[index] = line;
      return newLines;
    });
  }, []);

  const handleClearLines = useCallback(async () => {
    const isConfirmed = await confirm({
        title: 'ยืนยันการล้างรายการ',
        description: 'คุณต้องการล้างรายการสินค้าทั้งหมดใช่หรือไม่?',
        confirmText: 'ล้างรายการ',
        cancelText: 'ยกเลิก',
        variant: 'danger'
    });
    if (isConfirmed) {
        setLines(getInitialLines());
    }
  }, [confirm]);


  const openProductSearch = useCallback((index: number) => {
    setActiveRowIndex(index);
    setSearchTerm('');
    setIsProductModalOpen(true);
  }, []);
  
  const selectProduct = useCallback((product: ItemListItem) => {
    if (activeRowIndex !== null) {
      setLines(prev => {
        const firstEmptyIndex = prev.findIndex(l => !l.item_id);
        const targetIndex = (firstEmptyIndex !== -1 && firstEmptyIndex < activeRowIndex) 
          ? firstEmptyIndex 
          : activeRowIndex;
        const newLines = [...prev];
        newLines[targetIndex] = {
          ...newLines[targetIndex],
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
        return newLines;
      });
    }
    setIsProductModalOpen(false);
  }, [activeRowIndex]);

  // ...
  // Calculate Totals
  const subtotal = lines.reduce((sum, line) => sum + (line.est_amount || 0), 0);
  const totalGross = lines.reduce((sum, line) => sum + (line.quantity * line.est_unit_price), 0);
  const totalLineDiscount = lines.reduce((sum, line) => sum + (line.discount || 0), 0);
  
  // PR uses global discount % logic, which differs from PO's per-line discount.
  // We keep the existing logic here but acknowledgment this difference.
  
  // Calculate Global Discount
  let discountAmount = 0;
  if (globalDiscountInput.trim().endsWith('%')) {
      const percent = parseFloat(globalDiscountInput.replace('%', ''));
      if (!isNaN(percent)) {
          discountAmount = subtotal * (percent / 100);
      }
  } else {
      const fixed = parseFloat(globalDiscountInput);
      if (!isNaN(fixed)) discountAmount = fixed;
  }
  
  // Validate Global Discount (Cap at Subtotal)
  if (discountAmount > subtotal) {
      discountAmount = subtotal;
  }

  const afterDiscount = subtotal - discountAmount;
  const vatAmount = afterDiscount * (vatRate / 100);
  const grandTotal = afterDiscount + vatAmount;

  const handleVendorSelect = useCallback((vendor: VendorMaster | null) => {
    if (vendor) {
      setValue("preferred_vendor_id", vendor.vendor_id);
      setValue("vendor_name", vendor.vendor_name);
      setValue("credit_days", vendor.payment_term_days !== undefined ? vendor.payment_term_days : 30);
    } else {
      setValue("preferred_vendor_id", undefined);
      setValue("vendor_name", '');
      setValue("credit_days", 30);
    }
  }, [setValue]);

  // defined in usePRActions

  const handleSaveData = useCallback(async (data: PRFormData, activeLines: ExtendedLine[]) => {
    setIsActionLoading(true);
    try {
        const payload: CreatePRPayload = { 
            pr_date: data.request_date,
            remark: remarks || data.purpose,
            department_id: data.cost_center_id,
            project_id: data.project_id,
            requester_name: requesterName,
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
            warehouse_id: 1,
            tax_rate: vatRate       
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
  }, [remarks, requesterName, isEditMode, id, confirm, onSuccess, onClose, createPRMutation, updatePR, user, vatRate, queryClient]);

  const onSubmit = useCallback(async (data: PRFormData) => {
    if (!data.required_date) { showAlert('กรุณาระบุวันที่ต้องการใช้'); return; }
    if (!data.requester_name) { showAlert('กรุณาระบุชื่อผู้ขอซื้อ'); return; }
    if (!data.cost_center_id) { showAlert('กรุณาเลือกศูนย์ต้นทุน'); return; }
    if (!data.purpose) { showAlert('กรุณาระบุวัตถุประสงค์'); return; }
    if (!data.shipping_method) { showAlert('กรุณาเลือกประเภทการขนส่ง'); return; }
    const activeLines = lines.filter(l => l.item_code);
    if (activeLines.length === 0) { showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'); return; }
    const isConfirmed = await confirm({
        title: isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยันการบันทึก',
        description: isEditMode ? 'คุณต้องการบันทึกการแก้ไขเอกสารใบขอซื้อใช่หรือไม่?' : 'คุณต้องการบันทึกเอกสารใบขอซื้อใช่หรือไม่?',
        confirmText: isEditMode ? 'ยืนยันการแก้ไข' : 'ยืนยัน',
        cancelText: 'ยกเลิก',
        variant: 'info'
    });
    if (!isConfirmed) return;
    await handleSaveData(data, activeLines);
  }, [lines, isEditMode, confirm, handleSaveData]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    
    // Safety check: Only DRAFT can be deleted
    const currentStatus = watch('status');
    if (currentStatus && currentStatus !== 'DRAFT') {
       await confirm({ 
           title: 'ไม่สามารถลบได้', 
           description: 'ขออภัย เฉพาะเอกสารสถานะ "แบบร่าง" เท่านั้นที่สามารถลบได้ หากต้องการยกเลิกกรุณาใช้ปุ่ม "Void" แทน', 
           confirmText: 'ตกลง', 
           hideCancel: true, 
           variant: 'warning' 
       });
       return;
    }

    const isConfirmed = await confirm({
        title: 'ยืนยันการลบ', description: 'คุณต้องการลบเอกสารนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
        confirmText: 'ลบเอกสาร', cancelText: 'ยกเลิก', variant: 'danger'
    });
    if (!isConfirmed) return;
    setIsActionLoading(true);
    try {
      const success = await deletePR(id);
      if (success) {
        await confirm({ title: 'ลบสำเร็จ', description: 'เอกสารถูกลบเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
        onSuccess?.(); onClose();
      }
    } catch (error) {
       logger.error('Delete PR failed:', error);
    } finally { setIsActionLoading(false); }
  }, [id, confirm, onSuccess, onClose, watch, deletePR]);

  const handleApprove = useCallback(async () => {
    if (!id) return;
    const isConfirmed = await confirm({ title: 'ยืนยันการอนุมัติ', description: 'คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?', confirmText: 'อนุมัติ', cancelText: 'ยกเลิก', variant: 'success' });
    if (!isConfirmed) return;
    setIsActionLoading(true);
    try {
      const success = await approvePR(id);
      if (success) {
        await confirm({ title: 'อนุมัติสำเร็จ', description: 'เอกสารได้รับการอนุมัติเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
        onSuccess?.(); onClose();
      }
    } catch (error) { logger.error('Approve PR failed:', error); } finally { setIsActionLoading(false); }
  }, [id, confirm, onSuccess, onClose, approvePR]);

  const handleVoid = useCallback(async () => {
    if (!id) return;
    const isConfirmed = await confirm({
        title: 'ยืนยันการยกเลิกเอกสาร',
        description: 'คุณต้องการยกเลิกเอกสารใบขอซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
        confirmText: 'ยกเลิกเอกสาร',
        cancelText: 'ย้อนกลับ',
        variant: 'danger'
    });
    
    if (!isConfirmed) return;
    
    setIsActionLoading(true);
    try {
      const success = await cancelPR(id);
      if (success) {
        await confirm({
            title: 'ยกเลิกสำเร็จ',
            description: 'เอกสารได้รับการยกเลิกเรียบร้อยแล้ว',
            confirmText: 'ตกลง',
            hideCancel: true,
            variant: 'success'
        });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกเอกสาร';
       await confirm({
           title: 'เกิดข้อผิดพลาด',
           description: errorMessage,
           confirmText: 'ตกลง',
           hideCancel: true,
           variant: 'danger'
       });
    } finally {
      setIsActionLoading(false);
    }
  }, [id, confirm, onSuccess, onClose, cancelPR]);

  return {
    isEditMode, lines, activeTab, setActiveTab, 
    vatRate, setVatRate, remarks, setRemarks, 
    requesterName, isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    register, handleSubmit, setValue, watch, invokeSetFocus: setFocus, isSubmitting, isActionLoading, errors, handleFormError,
    alertState, setAlertState, products, costCenters, projects,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, subtotal, discountAmount, afterDiscount,
    vatAmount, grandTotal, handleVendorSelect, onSubmit, handleDelete, handleApprove,
    handleVoid, totalGross, totalLineDiscount,
    control, reset,
    globalDiscountInput, setGlobalDiscountInput
  };
};
