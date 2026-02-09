import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { PRFormData, PRLineFormData, CreatePRPayload } from '@/modules/procurement/types/pr-types';
import { MasterDataService } from '@/core/api/master-data.service';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { ItemListItem, CostCenter, Project } from '@/modules/master-data/types/master-data-types';
import type { VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

const PR_CONFIG = {
  MIN_LINES: 5,
  INITIAL_LINES: 5,
} as const;

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

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
  cost_center_id: '', project_id: undefined, purpose: '', currency_id: 'THB', lines: [], total_amount: 0,
  delivery_date: '', credit_days: 30, vendor_quote_no: '', shipping_method: 'รถยนต์', remarks: '',
  is_multicurrency: false, exchange_rate: 1, rate_date: new Date().toISOString().split('T')[0],
  currency_type_id: '',
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
  const [creditDays, setCreditDays] = useState(30);
  const [vendorQuoteNo, setVendorQuoteNo] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [requesterName] = useState('นางสาว กรรลิกา สารมาท');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, setValue, reset, watch, setFocus, formState: { isSubmitting } } = useForm<PRFormData>({
    defaultValues: getDefaultFormValues()
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
        if (!id) {
          setLines(getInitialLines());
          setDiscountPercent(0);
          setVatRate(7);
          setRemarks('');
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          setDeliveryDate(nextWeek.toISOString().split('T')[0]);
          setCreditDays(30);
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
  }, [isOpen, reset, id]);

  // Currency Sync Logic
  const currencyId = watch('currency_id');
  useEffect(() => {
    if (currencyId === 'THB') {
        setValue('is_multicurrency', false);
        setValue('exchange_rate', 1);
    } else {
        setValue('is_multicurrency', true);
        // Keep existing rate or could fetch default here
    }
  }, [currencyId, setValue]);

  const showAlert = (message: string) => setAlertState({ show: true, message });

  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);
  
  const removeLine = (index: number) => {
    if (lines.length <= PR_CONFIG.MIN_LINES) {
      showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearLine = (index: number) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = createEmptyLine();
      return newLines;
    });
  };
  
  const updateLine = (index: number, field: keyof ExtendedLine, value: string | number) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = { ...newLines[index] };
      if (field === 'quantity' || field === 'est_unit_price' || field === 'est_amount' || field === 'discount') {
        (line as Record<string, unknown>)[field] = value as number;
      } else {
        (line as Record<string, unknown>)[field] = value as string;
      }
      if (field === 'quantity' || field === 'est_unit_price' || field === 'discount') {
        const disc = line.discount || 0;
        line.est_amount = (line.quantity * line.est_unit_price) - disc;
      }
      newLines[index] = line;
      return newLines;
    });
  };

  const handleClearLines = () => {
    if (window.confirm("คุณต้องการล้างรายการสินค้าทั้งหมดใช่หรือไม่?")) {
        setLines(getInitialLines());
    }
  };

  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setSearchTerm('');
    setIsProductModalOpen(true);
  };
  
  const selectProduct = (product: ItemListItem) => {
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
  };

  const subtotal = lines.reduce((sum, line) => sum + (line.est_amount || 0), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = afterDiscount * (vatRate / 100);
  const grandTotal = afterDiscount + vatAmount;

  const handleVendorSelect = (vendor: VendorMaster | null) => {
    if (vendor) {
      setValue("preferred_vendor_id", vendor.vendor_id);
      setValue("vendor_name", vendor.vendor_name);
      setCreditDays(vendor.payment_term_days !== undefined ? vendor.payment_term_days : 30);
    } else {
      setValue("preferred_vendor_id", undefined);
      setValue("vendor_name", '');
      setCreditDays(30);
    }
  };

  const createPRMutation = useMutation({
    mutationFn: async (payload: CreatePRPayload) => {
        const newPR = await PRService.create(payload);
        if (!newPR?.pr_id) throw new Error("ไม่สามารถสร้างเอกสารได้");
        const submitResult = await PRService.submit(newPR.pr_id);
        return { newPR, submitResult };
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prs'] });
    }
  });

  const onSubmit = async (data: PRFormData) => {
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
  };

  const handleSaveData = async (data: PRFormData, activeLines: ExtendedLine[]) => {
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
            credit_days: creditDays,
            payment_term_days: creditDays,
            vendor_quote_no: vendorQuoteNo,
            shipping_method: shippingMethod,
            preferred_vendor_id: data.preferred_vendor_id,
            vendor_name: data.vendor_name,
            requester_user_id: 1, branch_id: 1, warehouse_id: 1       
        };
        const { newPR, submitResult } = await createPRMutation.mutateAsync(payload);
        if (submitResult.success) {
            await confirm({
                title: 'บันทึกสำเร็จ!',
                description: `เลขที่เอกสาร: ${newPR.pr_no}\nสถานะ: รออนุมัติ (In Approval)`,
                confirmText: 'ตกลง', hideCancel: true, variant: 'success'
            });
            onSuccess?.(); onClose();
        } else {
            await confirm({
                title: 'บันทึกสำเร็จแต่ส่งอนุมัติไม่ผ่าน',
                description: submitResult.message,
                confirmText: 'ตกลง', hideCancel: true, variant: 'warning'
            });
            onSuccess?.(); onClose();
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
        await confirm({ title: 'เกิดข้อผิดพลาด', description: errorMessage, confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
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
  };

  const handleApprove = async () => {
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
  };

  return {
    isEditMode, lines, activeTab, setActiveTab, discountPercent, setDiscountPercent,
    vatRate, setVatRate, remarks, setRemarks, deliveryDate, setDeliveryDate,
    creditDays, vendorQuoteNo, setVendorQuoteNo, shippingMethod, setShippingMethod,
    requesterName, isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    register, handleSubmit, setValue, watch, invokeSetFocus: setFocus, isSubmitting, isActionLoading,
    alertState, setAlertState, products, costCenters, projects,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, subtotal, discountAmount, afterDiscount,
    vatAmount, grandTotal, handleVendorSelect, onSubmit, handleDelete, handleApprove
  };
};
