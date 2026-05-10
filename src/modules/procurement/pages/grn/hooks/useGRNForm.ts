import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { logger } from '@utils';
import { extractErrorMessage } from '@/core/api/api';
import { GRNService } from '../../../services/grn.service';
import { POAService } from '@/modules/procurement/services';
import { GRNFormSchema, type GRNFormValues } from '../schemas/grn.schemas';
import { useWarehouses, useDepartments, useCurrencies, useEmployees } from '@master-data/hooks/useMasterData';
import type { CreateGRNPayload } from '../../../types/grn-types';
import type { POLine } from '../../../types/po-types';
import { calculateLineTotal } from '@/modules/procurement/utils/pricing.utils';
import type { Resolver } from 'react-hook-form';

interface UseGRNFormProps {
    isOpen: boolean;
    initialPOId?: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export function useGRNForm({ isOpen, initialPOId, onClose, onSuccess }: UseGRNFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Master Data Hooks ────────────────────────────────────────────────────
    const { data: warehouseResponse } = useWarehouses(isOpen);
    const warehouses = useMemo(() => warehouseResponse?.items || [], [warehouseResponse]);

    const { data: departmentResponse } = useDepartments(isOpen);
    const departments = useMemo(() => departmentResponse || [], [departmentResponse]);

    const { data: currencyResponse } = useCurrencies(isOpen);
    const currencies = useMemo(() => currencyResponse || [], [currencyResponse]);

    const { data: employeeResponse } = useEmployees(isOpen);
    const employees = useMemo(() => employeeResponse || [], [employeeResponse]);

    // ── Form Setup ───────────────────────────────────────────────────────────
    const methods = useForm<GRNFormValues>({
        resolver: zodResolver(GRNFormSchema) as Resolver<GRNFormValues>,
        defaultValues: {
            grn_no: 'GRN2024-xxx',
            received_date: new Date().toISOString().split('T')[0],
            status: 'Draft',
            isMulticurrency: false,
            items: [],
        },
    });

    const { control, reset, setValue } = methods;
    const { fields, replace, remove, append } = useFieldArray({
        control,
        name: 'items',
    });

    // ── Watched Values ──────────────────────────────────────────────────────
    const po_id = useWatch({ control, name: 'po_id' });
    const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });
    const items = useWatch({ control, name: 'items' }) || [];

    // ── Fetch PO Details ────────────────────────────────────────────────────
    const { data: poDetail, isFetching: isFetchingPO } = useQuery({
        queryKey: ['po-for-grn', po_id],
        queryFn: () => POAService.getById(po_id!),
        enabled: isOpen && !!po_id,
    });

    // ── Sync Form with PO Detail ────────────────────────────────────────────
    useEffect(() => {
        if (poDetail) {
            // Populate items from PO (Using Remaining Qty)
            if (poDetail.po_lines) {
                const poItems = poDetail.po_lines.map((line: POLine) => {
                    const qtyToReceive = line.remaining_qty ?? ((line.qty || 0) - (line.qty_received || 0));
                    return {
                        po_line_id: line.po_line_id || 0,
                        item_id: line.item_id,
                        item_code: line.item_code || '',
                        item_name: line.item_name || '',
                        qty_ordered: line.qty || 0,
                        qty_received: Number(qtyToReceive) || 0,
                        accepted_qty: Number(qtyToReceive) || 0,
                        rejected_qty: 0,
                        uom_id: String(line.uom_id || ''),
                        uom_name: line.uom_name || 'PCS',
                        unit_price: line.unit_price || 0,
                        line_total: calculateLineTotal(Number(qtyToReceive) || 0, line.unit_price || 0),
                        qc_status: 'PASS',
                        lot_id: '',
                        lot_code: '',
                        remark: ''
                    };
                });
                replace(poItems);
            }

            // Financial Defaults
            const poCurrencyCode = poDetail.quote_currency_code || poDetail.currency_code || 'THB';
            if (poCurrencyCode !== 'THB') {
                setValue('isMulticurrency', true);
                setValue('curr_type_code', poCurrencyCode);
                setValue('exchange_rate', poDetail.exchange_rate || 1);
                setValue('rate_date', (poDetail as unknown as Record<string, unknown>).exchange_rate_date as string || new Date().toISOString().split('T')[0]);
                
                const matchedCurr = currencies.find(c => (c.currency_code || (c as unknown as Record<string, unknown>).code) === poCurrencyCode);
                if (matchedCurr) setValue('curr_id', String(matchedCurr.currency_id || matchedCurr.id));
            } else {
                setValue('isMulticurrency', false);
                setValue('curr_type_code', 'THB');
                setValue('exchange_rate', 1);
                const thb = currencies.find(c => (c.currency_code || (c as unknown as Record<string, unknown>).code) === 'THB');
                if (thb) setValue('curr_id', String(thb.currency_id || thb.id));
            }

            // Defaults for Header
            if (poDetail.ship_to_warehouse_id) {
                setValue('warehouse_id', poDetail.ship_to_warehouse_id);
            }
        }
    }, [poDetail, replace, setValue, currencies]);

    // ── Initial PO ID Support ───────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && initialPOId) {
            setValue('po_id', initialPOId);
        }
    }, [isOpen, initialPOId, setValue]);

    // ── Reset Form on Open ──────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !initialPOId) {
            reset({
                grn_no: 'GRN2024-xxx',
                received_date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                isMulticurrency: false,
                items: [],
            });
        }
    }, [isOpen, initialPOId, reset]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const onFormSubmit = async (data: GRNFormValues) => {
        setIsSubmitting(true);
        try {
            const payload: CreateGRNPayload = {
                po_id: data.po_id,
                received_date: data.received_date,
                warehouse_id: data.warehouse_id,
                received_by: data.received_by,
                status: data.status,
                emp_dept_id: data.emp_dept_id,
                job_id: data.job_id,
                remark: data.remark,
                curr_id: data.isMulticurrency ? data.curr_id : undefined,
                curr_type_id: data.isMulticurrency ? data.curr_type_id : undefined,
                curr_type_code: data.isMulticurrency ? data.curr_type_code : 'THB',
                items: data.items.map(i => ({
                    po_line_id: i.po_line_id,
                    item_id: i.item_id,
                    qty_received: i.qty_received,
                    accepted_qty: i.accepted_qty,
                    rejected_qty: i.rejected_qty,
                    uom_id: i.uom_id,
                    lot_id: i.lot_id,
                    remark: i.remark
                }))
            };

            await GRNService.create(payload);
            toast('บันทึกใบรับสินค้าเรียบร้อยแล้ว', 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            logger.error('[useGRNForm] Submit error:', error);
            toast(extractErrorMessage(error), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        methods,
        fields,
        isSubmitting,
        isFetchingPO,
        warehouses,
        departments,
        currencies,
        employees,
        poDetail,
        isMulticurrency,
        items,
        onFormSubmit,
        append,
        remove,
    };
}
