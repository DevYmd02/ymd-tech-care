import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { PRFormData, PRLineFormData, CreatePRPayload } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { fetchExchangeRate } from '../services/mockExchangeRateService';
import { MasterDataService } from '@/core/api/master-data.service';
import type { ItemListItem, CostCenter, Project } from '@/modules/master-data/types/master-data-types';
import type { VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';


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
  discount?: number;
}

const createEmptyLine = (): ExtendedLine => ({
  item_id: '', item_code: '', item_name: '', item_description: '', quantity: 0, uom: '', uom_id: undefined,
  est_unit_price: 0, est_amount: 0, needed_date: getTodayDate(), preferred_vendor_id: undefined, remark: '',
  warehouse: '', location: '', discount: 0,
});

const getInitialLines = () => Array(PR_CONFIG.INITIAL_LINES).fill(null).map(() => createEmptyLine());

const getDefaultFormValues = (): PRFormData => ({
  pr_no: '', request_date: getTodayDate(), required_date: '', requester_name: 'นางสาว กรรลิกา สารมาท',
  cost_center_id: '', project_id: undefined, purpose: '', currency_id: '', lines: [], total_amount: 0,
  is_on_hold: 'N',
  delivery_date: '', credit_days: 30, vendor_quote_no: '', shipping_method: '', remarks: '',
  is_multicurrency: false, exchange_rate: 1, rate_date: new Date().toISOString().split('T')[0],
  currency_type_id: '',
  cancelflag: 'N',
  status: 'DRAFT',
});

export const usePRForm = (isOpen: boolean, onClose: () => void, id?: string, onSuccess?: () => void) => {
  const isEditMode = !!id;
  const prevIsOpenRef = useRef(false);
  const queryClient = useQueryClient();
  const { confirm } = useConfirmation();
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [lines, setLines] = useState<ExtendedLine[]>(getInitialLines);
  const [activeTab, setActiveTab] = useState('detail');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatRate, setVatRate] = useState(7);
  const [remarks, setRemarks] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [vendorQuoteNo, setVendorQuoteNo] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [requesterName] = useState('นางสาว กรรลิกา สารมาท');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const prevCurrencyId = useRef<string>(getDefaultFormValues().currency_id);
  const prevCurrencyTypeId = useRef<string | undefined>(getDefaultFormValues().currency_type_id);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Detailed schema to match PRFormData exactly and avoid 'any'
  const PRLineSchema = z.object({
    item_id: z.string(),
    item_code: z.string(),
    item_name: z.string(),
    item_description: z.string().optional(),
    quantity: z.number(),
    uom: z.string(),
    uom_id: z.union([z.string(), z.number()]).optional(),
    est_unit_price: z.number(),
    est_amount: z.number(),
    needed_date: z.string(),
    preferred_vendor_id: z.string().optional(),
    remark: z.string().optional(),
  });

  const PRFormSchema = z.object({
    pr_no: z.string(),
    request_date: z.string(),
    required_date: z.string(),
    requester_name: z.string().optional(),
    cost_center_id: z.string().min(1, 'Please select cost center'),
    project_id: z.string().optional(),
    purpose: z.string().min(1, 'Please enter purpose'),
    currency_id: z.string(),
    is_multicurrency: z.boolean(),
    exchange_rate: z.number(),
    rate_date: z.string().optional(),
    currency_type_id: z.string().optional(),
    exchange_round: z.number().optional(),
    allow_adjust: z.number().optional(),
    preferred_vendor_id: z.string().optional(),
    vendor_name: z.string().optional(),
    delivery_date: z.string().optional(),
    credit_days: z.number().optional(),
    vendor_quote_no: z.string().optional(),
    shipping_method: z.string().optional(),
    remarks: z.string().optional(),
    lines: z.array(PRLineSchema),
    is_on_hold: z.union([z.boolean(), z.string()]),
    cancelflag: z.enum(['Y', 'N']).optional(),
    status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
    total_amount: z.number(),
  });

  const { register, handleSubmit, setValue, reset, watch, setFocus, control, getFieldState, formState: { isSubmitting } } = useForm<PRFormData>({
    defaultValues: getDefaultFormValues(),
    resolver: zodResolver(PRFormSchema)
  });

  const [products, setProducts] = useState<ItemListItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [items, cc, prj] = await Promise.all([
          MasterDataService.getItems(),
          MasterDataService.getCostCenters(),
          MasterDataService.getProjects()
        ]);
        setProducts(items);
        setCostCenters(cc);
        setProjects(prj);
      } catch (error) {
        console.error('Failed to fetch master data:', error);
      }
    };
    fetchMasterData();
  }, []);

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
                shipping_method: pr.shipping_method,
                remarks: pr.remarks,
                preferred_vendor_id: pr.preferred_vendor_id,
                vendor_name: pr.vendor_name,
                cancelflag: pr.cancelflag || 'N',
                status: pr.status
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
                discount: 0
              }));

              // Ensure at least 5 lines for UI consistency
              const initialLines = [...mappedLines];
              while (initialLines.length < PR_CONFIG.MIN_LINES) {
                initialLines.push(createEmptyLine());
              }

              setLines(initialLines);
              setRemarks(pr.remarks || '');
              setDeliveryDate(pr.delivery_date || getNextWeekDate());
              setVendorQuoteNo(pr.vendor_quote_no || '');
              setShippingMethod(pr.shipping_method || '');
              
              reset(formData);
            }
          } catch (error) {
            console.error('Failed to fetch PR details:', error);
          } finally {
            setIsActionLoading(false);
          }
        } else {
          // New PR Mode
          setLines(getInitialLines());
          setDiscountPercent(0);
          setVatRate(7);
          setRemarks('');
          setDeliveryDate(getNextWeekDate());
          setValue('credit_days', 30);
          setVendorQuoteNo('');
          setShippingMethod('');
          setActiveTab('detail');
          const nextPRNo = await PRService.generateNextDocumentNo();
          reset({ ...getDefaultFormValues(), pr_no: nextPRNo });
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
          console.error('Failed to fetch exchange rate:', error);
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
      // Create a shallow copy of the line to avoid mutation
      const line = { ...newLines[index] };
      
      if (field === 'quantity' || field === 'est_unit_price' || field === 'est_amount' || field === 'discount') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value; 
        // We know 'field' corresponds to a number property, but TypeScript needs help.
        // We can cast 'line' to a type that has these specific keys as number-writable.
        (line as { [key in typeof field]: number })[field] = isNaN(numValue) ? 0 : numValue;
      } else {
        // Safe cast to Record to allow assignment of string/number/undefined
        (line as Record<string, string | number | undefined>)[field] = value;
      }
      
      // Auto-calculate amount
      if (field === 'quantity' || field === 'est_unit_price' || field === 'discount') {
        const disc = line.discount || 0;
        line.est_amount = (line.quantity * line.est_unit_price) - disc;
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

  const subtotal = lines.reduce((sum, line) => sum + (line.est_amount || 0), 0);
  const discountAmount = subtotal * (discountPercent / 100);
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

  const createPRMutation = useMutation({
    mutationFn: async (payload: CreatePRPayload) => {
        const newPR = await PRService.create(payload);
        if (!newPR?.pr_id) throw new Error("ไม่สามารถสร้างเอกสารได้");
        return { newPR };
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prs'] });
    }
  });

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
               price: line.est_unit_price, needed_date: line.needed_date, remark: line.remark
            })),
            delivery_date: deliveryDate,
            credit_days: data.credit_days || 30, // Use data directly
            payment_term_days: data.credit_days || 30,
            vendor_quote_no: vendorQuoteNo,
            shipping_method: shippingMethod,
            preferred_vendor_id: data.preferred_vendor_id,
            vendor_name: data.vendor_name,
            requester_user_id: 1, branch_id: 1, warehouse_id: 1       
        };
        if (isEditMode && id) {
            await PRService.update(id, payload);
            await confirm({ title: 'แก้ไขสำเร็จ', description: 'แก้ไขเอกสารเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
            onSuccess?.(); onClose();
        } else {
            const { newPR } = await createPRMutation.mutateAsync(payload);
            const displayNo = newPR.pr_no.startsWith('DRAFT-TEMP') ? 'รอรันเลข (NEW)' : newPR.pr_no;
            await confirm({
                title: 'บันทึกแบบร่างสำเร็จ!',
                description: `เลขที่เอกสาร: ${displayNo}\nสถานะ: แบบร่าง (Draft)`,
                confirmText: 'ตกลง', hideCancel: true, variant: 'success'
            });
            onSuccess?.(); onClose();
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
        await confirm({ title: 'เกิดข้อผิดพลาด', description: errorMessage, confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
    } finally {
        setIsActionLoading(false);
    }
  }, [remarks, requesterName, deliveryDate, vendorQuoteNo, shippingMethod, isEditMode, id, confirm, onSuccess, onClose, createPRMutation]); // Removed creditDays dependency

  const onSubmit = useCallback(async (data: PRFormData) => {
    if (!data.required_date) { showAlert('กรุณาระบุวันที่ต้องการใช้'); return; }
    if (!data.requester_name) { showAlert('กรุณาระบุชื่อผู้ขอซื้อ'); return; }
    if (!data.cost_center_id) { showAlert('กรุณาเลือกศูนย์ต้นทุน'); return; }
    if (!data.purpose) { showAlert('กรุณาระบุวัตถุประสงค์'); return; }
    if (!shippingMethod) { showAlert('กรุณาเลือกประเภทการขนส่ง'); return; }
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
  }, [shippingMethod, lines, isEditMode, confirm, handleSaveData]);

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
      const success = await PRService.delete(id);
      if (success) {
        await confirm({ title: 'ลบสำเร็จ', description: 'เอกสารถูกลบเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
        onSuccess?.(); onClose();
      }
    } catch (error) {
       console.error(error);
    } finally { setIsActionLoading(false); }
  }, [id, confirm, onSuccess, onClose, watch]);

  const handleApprove = useCallback(async () => {
    if (!id) return;
    const isConfirmed = await confirm({ title: 'ยืนยันการอนุมัติ', description: 'คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?', confirmText: 'อนุมัติ', cancelText: 'ยกเลิก', variant: 'success' });
    if (!isConfirmed) return;
    setIsActionLoading(true);
    try {
      const success = await PRService.approve(id);
      if (success) {
        await confirm({ title: 'อนุมัติสำเร็จ', description: 'เอกสารได้รับการอนุมัติเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success' });
        onSuccess?.(); onClose();
      }
    } catch (error) { console.error(error); } finally { setIsActionLoading(false); }
  }, [id, confirm, onSuccess, onClose]);

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
      const response = await PRService.cancel(id);
      if (response.success) {
        await confirm({
            title: 'ยกเลิกสำเร็จ',
            description: 'เอกสารได้รับการยกเลิกเรียบร้อยแล้ว',
            confirmText: 'ตกลง',
            hideCancel: true,
            variant: 'success'
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.message);
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
  }, [id, confirm, onSuccess, onClose]);

  return {
    isEditMode, lines, activeTab, setActiveTab, discountPercent, setDiscountPercent,
    vatRate, setVatRate, remarks, setRemarks, deliveryDate, setDeliveryDate,
    vendorQuoteNo, setVendorQuoteNo, shippingMethod, setShippingMethod,
    requesterName, isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    register, handleSubmit, setValue, watch, invokeSetFocus: setFocus, isSubmitting, isActionLoading,
    alertState, setAlertState, products, costCenters, projects,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, subtotal, discountAmount, afterDiscount,
    vatAmount, grandTotal, handleVendorSelect, onSubmit, handleDelete, handleApprove,
    handleVoid,
    control, reset
  };
};
