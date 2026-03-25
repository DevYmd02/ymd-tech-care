import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';


import { AVFormSchema } from '../../../schemas/av.schema';
import type { AVFormData, AVLineFormData } from '../../../schemas/av.schema';
import { AVService } from '../../../services/av.service';
import { usePRMasterData } from '@/modules/procurement/pages/pr/hooks/usePRMasterData';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { logger } from '@/shared/utils/logger';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { extractErrorMessage } from '@/core/api/api';


export interface UseAVFormProps {
  id?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: any;
}

export const useAVForm = ({ id, isOpen, onClose, onSuccess, approvalItem }: UseAVFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<number | undefined>(id);

  // Sync state if id prop changes
  useEffect(() => {
    setActiveId(id);
  }, [id]);
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  
  // Custom Hooks for Master Data (reusing PR master data to map names to IDs if needed)
  const { 
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    warehouses,
    masterItems,
    masterUnits,
    isLoading: isMasterDataLoading,
  } = usePRMasterData();



  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIsOpenRef = useRef(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const formMethods = useForm<AVFormData>({
    resolver: zodResolver(AVFormSchema) as unknown as any,
    mode: 'onBlur',
  });
  
  const { handleSubmit, setValue, reset, control } = formMethods;

  // Field Array for Lines
  const { fields: lines } = useFieldArray({
    control,
    name: 'lines'
  });

  const handleFormError = useCallback((fieldErrors: FieldErrors<AVFormData>) => {
    console.error("[useAVForm] Validation Errors:", fieldErrors);
    const errorMessages: string[] = [];
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
    const uniqueErrors = Array.from(new Set(errorMessages));
    if (uniqueErrors.length > 0) {
      toast(uniqueErrors.map(msg => `• ${msg}`).join('\n'), 'error', 'ตรวจสอบข้อมูลไม่ผ่าน');
    }
  }, [toast]);

  const loadPRData = useCallback(async (prId: number, itemArg?: any) => {
    setIsSubmitting(true);
    try {
      const pr = await AVService.getPRById(prId);
      if (pr) {
        setActiveId(prId); // 🌟 Update activeId on load
        logger.info('[useAVForm] Fetched PR Data Stringified:', JSON.stringify(pr));

        const source = (pr as any).header || pr;

        const uniqueWhIds = Array.from(new Set((pr.lines || []).map((l: any) => l.warehouse_id).filter(Boolean)));
        
        const locationMaps = await Promise.all(
          uniqueWhIds.map(async (whId) => {
            try {
              const res = await LocationService.getAll({ warehouse_id: Number(whId) });
              return { whId: Number(whId), items: res?.items || [] };
            } catch (err) {
              logger.error(`[useAVForm] Failed to fetch locations for warehouse ${whId}:`, err);
              return { whId: Number(whId), items: [] };
            }
          })
        );

        const locationLookup: Record<number, string> = {};
        locationMaps.forEach(map => {
          map.items.forEach((item: any) => {
            locationLookup[item.location_id] = item.code || item.name_th;
          });
        });

        if ((masterItems || []).length > 0) {
          logger.info('[useAVForm] masterItems details:', {
            length: (masterItems || []).length,
            firstItemStringified: JSON.stringify(masterItems[0])
          });
        }

        const mappedLines: AVLineFormData[] = (pr.lines || []).map((line: any) => {
          const matchedItem = (masterItems || []).find((i: any) => String(i.item_id) === String(line.item_id));
          const matchedUnit = (masterUnits || []).find((u: any) => String(u.uom_id || u.unit_id) === String(line.uom_id));

          const lineWhId = line.warehouse_id || source.warehouse_id || 1;
          const matchedWh = (warehouses || []).find((w: any) => String(w.value) === String(lineWhId));
          const locName = locationLookup[Number(line.location)] || line.location_name || line.location || '';

          const isLineApproved = String(line.status || '').trim().toUpperCase() === 'APPROVED';
          const rem = isLineApproved ? 0 : (line.remaining_qty !== undefined ? Number(line.remaining_qty) : Number(line.qty));

          return {
            ...line,
            item_code: matchedItem?.item_code || line.item_code || '',
            item_name: matchedItem?.item_name || line.item_name || line.description || '',
            description: line.description || line.item_name || matchedItem?.item_name || '',
            uom: matchedUnit?.uom_name || matchedUnit?.unit_name || line.uom || '',
            remaining_qty: rem,
            is_approved: (() => {
                const isNew = !itemArg || !itemArg.approval_id || itemArg.status === 'PENDING';
                if (isNew) return rem > 0;
                return (line.approved_qty !== null && line.approved_qty !== undefined) ? Number(line.approved_qty) > 0 : true;
            })(),
            approved_qty: (() => {
                const isNew = !itemArg || !itemArg.approval_id || itemArg.status === 'PENDING';
                if (isNew) return Number(rem) || 0;
                return (line.approved_qty !== null && line.approved_qty !== undefined) ? Number(line.approved_qty) : (Number(rem) || 0);
            })(),
            requested_qty: Number(line.qty) || 0,
            remark: line.remark || '',
            warehouse_code: matchedWh?.original?.warehouse_code || '',
            location_name: locName,
            line_discount_raw: line.line_discount_raw || '',
            discount: (() => {
                const gross = (Number(line.qty) || 0) * (Number(line.est_unit_price) || 0);
                const raw = line.line_discount_raw || '';
                if (!raw) return Number(line.line_discount_amount) || 0;
                if (raw.endsWith('%')) {
                    const pct = parseFloat(raw.replace('%', ''));
                    return isNaN(pct) ? 0 : gross * (pct / 100);
                }
                return parseFloat(raw) || 0;
            })(),
          };
        });

        let vendorName = source.vendor_name || source.suggested_vendor || '';
        let vendorId = source.preferred_vendor_id ?? source.vendor_id;
        const vendorCodeFallback = source.vendor_quote_no || '';

        if (!vendorName) {
          try {
            const vendorListRes = await VendorService.getList();
            const vendorItems = vendorListRes.items || [];
            if (vendorId) {
              const matched = vendorItems.find((v: any) => Number(v.vendor_id || v.id) === Number(vendorId));
              if (matched?.vendor_name) vendorName = matched.vendor_name;
            }
            if (!vendorName && vendorCodeFallback) {
              const codeTrim = vendorCodeFallback.trim().toLowerCase();
              const matched = vendorItems.find((v: any) => 
                 v.vendor_code && v.vendor_code.trim().toLowerCase() === codeTrim
              );
              if (matched) {
                 vendorName = matched.vendor_name;
                 vendorId = matched.vendor_id; 
              }
            }
          } catch (err) {
            logger.error('[useAVForm] Vendor lookup failed:', err);
          }
        }

        reset({
          ...source,
          approval_id: itemArg?.approval_id || itemArg?.id || undefined,
          av_no: itemArg?.av_no || itemArg?.approval_no || '',
          hasOtherAVs: !!itemArg?.hasOtherAVs,
          lines: mappedLines,
          pr_no: source.pr_no || '',
          need_by_date: source.need_by_date || '',
          pr_date: source.pr_date || '',
          isMulticurrency: !!source.isMulticurrency,
          cost_center_id: (() => {
            const val = source.cost_center_id ?? source.department_id;
            return val ? Number(val) : undefined;
          })(),
          purpose: (source.purpose || source.remark || '').trim(),
          preferred_vendor_id: vendorId ? Number(vendorId) : undefined,
          vendor_name: vendorName,
          preparer_name: source.preparer_name || source.requester_name || source.employee_name || '',
          requester_name: source.requester_name || source.employee_name || '',
          is_on_hold: source.status === 'DRAFT' ? 'Y' : 'N',
          shipping_method: source.shipping_method || '',
          pr_tax_code_id: source.pr_tax_code_id ? Number(source.pr_tax_code_id) : undefined,
          pr_tax_rate: (() => {
            if (source.pr_tax_rate != null) return Number(source.pr_tax_rate);
            const matchedTax = purchaseTaxOptions.find(t => String(t.value) === String(source.pr_tax_code_id));
            return Number(matchedTax?.original?.tax_rate || 0);
          })(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch AV details:', error);
      showAlert('ดึงข้อมูลผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, masterItems, masterUnits, warehouses, showAlert, purchaseTaxOptions]);

  useEffect(() => {
    if (isOpen && id && !isMasterDataLoading && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      const timer = setTimeout(() => {
        loadPRData(id, approvalItem);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      prevIsOpenRef.current = false;
    }
  }, [isOpen, id, isMasterDataLoading, loadPRData, approvalItem]);

  const updateLine = useCallback((index: number, field: keyof AVLineFormData, value: any) => {
    const path = `lines.${index}.${field}` as Path<AVFormData>;
    setValue(path, value as FieldPathValue<AVFormData, typeof path>);
    
    // Auto reset approved_qty to 0 if unchecked
    if (field === 'is_approved' && value === false) {
      setValue(`lines.${index}.approved_qty` as any, 0);
    }
  }, [setValue]);

  const handleApprove = handleSubmit(() => {
    const data = formMethods.getValues();
    const hasApprovedItems = data.lines.some(line => line.is_approved);
    if (!hasApprovedItems) {
      toast('กรุณาเลือกรายการที่ต้องการอนุมัติอย่างน้อย 1 รายการ', 'error');
      return;
    }
    setIsConfirmModalOpen(true);
  }, handleFormError);

  const handleConfirmApprove = async () => {
    if (!activeId) return;
    const data = formMethods.getValues();

    const apiPayload = {
      approval_date: new Date().toISOString().split('T')[0],
      need_by_date: data.need_by_date ? new Date(data.need_by_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: (() => {
          const isAllApproved = data.lines.every(l => l.is_approved && Number(l.approved_qty) === Number(l.requested_qty));
          return isAllApproved ? 'APPROVED' : 'PARTIAL';
      })() as any,
      remarks: data.purpose || data.remark || "Approved",
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || "Admin",
      pr_id: Number(activeId),
      base_currency_code: (data as any).pr_base_currency_code || (data as any).currency_code || "THB",
      base_currency_id: Number((data as any).pr_base_currency_id || (data as any).currency_id || 1),
      quote_currency_code: (data as any).currency_code || (data as any).pr_base_currency_code || "THB",
      quote_currency_id: Number((data as any).currency_id || 1),
      exchange_rate: Number((data as any).pr_exchange_rate) || 1,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      tax_code_id: Number(data.pr_tax_code_id) || 1,
      discount_expression: "0",
      pr_approval_lines: data.lines.filter(l => l.is_approved).map(line => ({
         approved_qty: Number(line.approved_qty),
         remarks: line.remark || "ok",
         pr_line_id: Number((line as any).id || (line as any).pr_line_id || 1),
         approval_date: new Date().toISOString().split('T')[0]
      }))
    };

    setIsSubmitting(true);
    try {
      await AVService.approvePR(apiPayload);
      toast('อนุมัติรายการสำเร็จ', 'success');
      onSuccess?.();
      onClose();
      queryClient.invalidateQueries({ queryKey: ['prs'] });
    } catch (error) {
      logger.error('[useAVForm] handleConfirmApprove error:', error);
      toast(extractErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleRejectInit = () => {
    const reason = formMethods.getValues('reject_reason' as any);
    if (!reason?.trim()) {
      toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
      formMethods.setError('reject_reason' as any, { type: 'required', message: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' });
      formMethods.setFocus('reject_reason' as any);
      return;
    }
    setIsConfirmRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    const reason = formMethods.getValues('reject_reason' as any);
    if (!activeId) return;
    const data = formMethods.getValues();

    const apiPayload = {
      approval_date: new Date().toISOString().split('T')[0],
      need_by_date: data.need_by_date ? new Date(data.need_by_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: "REJECTED" as const,
      remarks: reason || "Rejected",
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || "Admin",
      pr_id: Number(activeId),
      base_currency_code: (data as any).pr_base_currency_code || (data as any).currency_code || "THB",
      base_currency_id: Number((data as any).pr_base_currency_id || (data as any).currency_id || 1),
      quote_currency_code: (data as any).currency_code || (data as any).pr_base_currency_code || "THB",
      quote_currency_id: Number((data as any).currency_id || 1),
      exchange_rate: Number((data as any).pr_exchange_rate) || 1,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      tax_code_id: Number(data.pr_tax_code_id) || 1,
      discount_expression: "0",
      pr_approval_lines: data.lines.map(line => ({
         approved_qty: 0,
         remarks: line.remark || "ok",
         pr_line_id: Number((line as any).id || (line as any).pr_line_id || 1),
         approval_date: new Date().toISOString().split('T')[0]
      }))
    };

    setIsRejecting(true);
    try {
      await AVService.rejectPR(apiPayload);
      toast('ไม่อนุมัติรายการสำเร็จ', 'success');
      onSuccess?.();
      onClose();
      queryClient.invalidateQueries({ queryKey: ['prs'] });
    } catch (error) {
      toast(extractErrorMessage(error), 'error');
    } finally {
      setIsRejecting(false);
      setIsConfirmRejectOpen(false);
    }
  };

  return {
    isSubmitting,
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    updateLine,
    handleApprove,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleConfirmApprove,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    handleRejectInit,
    handleConfirmReject,
    isRejecting,
    formMethods,
    lines,
    handleFormError,
    loadPRData,
    activeId,
  };
};
