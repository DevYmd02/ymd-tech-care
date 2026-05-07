import { useCallback } from 'react';
import type { UseFormReturn, UseFieldArrayReplace } from 'react-hook-form';
import type { POFormData, IHydrationVQHeader, IHydrationVQLine, IHydrationPRLine } from '@/modules/procurement/schemas/po-schemas';
import type { PRLine } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { QCService } from '@/modules/procurement/services/qc.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { logger } from '@/shared/utils';
import { extractLinesArray } from '@/shared/utils/apiUtils';
import { parseDiscountAmount, calculateLineTotal } from '@/modules/procurement/utils/pricing.utils';

interface UsePOHydrationProps {
    setValue: UseFormReturn<POFormData>['setValue'];
    getValues: UseFormReturn<POFormData>['getValues'];
    replace: UseFieldArrayReplace<POFormData, 'po_lines'>;
    trigger: UseFormReturn<POFormData>['trigger'];
    toast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    currencies: any[];
}

export const usePOHydration = ({
    setValue,
    getValues,
    replace,
    trigger,
    toast,
    currencies
}: UsePOHydrationProps) => {
    
    const cleanD = (d: any) => (typeof d === 'string' && d.includes('T')) ? d.split('T')[0] : d;

    const hydrateFromSource = useCallback(async (
        prId: number, 
        type: 'PR' | 'QC', 
        options: {
            qcId?: number;
            vendorId?: number;
            winningVqId?: number;
            qcNo?: string;
            approvalNo?: string;
            signal?: AbortSignal;
        } = {}
    ) => {
        const { qcId, vendorId, winningVqId, qcNo, approvalNo, signal } = options;
        
        logger.info(`🎯 [usePOHydration] hydrateFromSource Triggered:`, { prId, type, ...options });
        if (!prId) return;
        
        // 🚨 GHOST DATA PREVENTION
        setValue('vendor_id', undefined as any);
        setValue('vendor_name', undefined as any);
        setValue('is_multicurrency', false);
        setValue('currency_code', 'THB');
        setValue('qc_no', undefined as any);
        setValue('approval_no', undefined as any);

        try {
            // 1. Parallel Fetch PR & VQ (if QC)
            const rawPR = await PRService.getDetail(prId, { signal });
            const fullPR = rawPR;
            let winningVQ: IHydrationVQHeader | undefined;

            // 1.1 Resolution: If QC type but missing winningVqId, fetch QC Detail to find the winner
            let resolvedWinningVqId = winningVqId;
            if (type === 'QC' && !resolvedWinningVqId && qcId) {
                try {
                    const qcDetail = await QCService.getById(qcId, { signal });
                    resolvedWinningVqId = Number(qcDetail.winning_vq_id || (qcDetail as any).vq_header_id);
                    logger.info(`🎯 [usePOHydration] Resolved winningVqId ${resolvedWinningVqId} from QC ${qcId}`);
                } catch (qcErr) {
                    logger.error('[usePOHydration] Failed to resolve Winner from QC', qcErr);
                }
            }

            setValue('qc_id', (Number(qcId || fullPR.qc_id) || undefined) as any);

            // 🎯 Mapping of Document Numbers for UI labels
            const finalQcNo = qcNo || (fullPR as any).qc_no || (fullPR as any).qcHeader?.qc_no;
            const finalAvNo = approvalNo || (fullPR as any).av_no || (fullPR as any).approval_no;
            
            if (finalQcNo) setValue('qc_no', finalQcNo);
            if (finalAvNo) setValue('approval_no', finalAvNo);
            
            if (type === 'QC' && resolvedWinningVqId) {
                try {
                    const rawVQ = await VQService.getById(resolvedWinningVqId, { signal });
                    winningVQ = rawVQ as unknown as IHydrationVQHeader;
                } catch (vqError) {
                    logger.error('[usePOHydration] Failed to fetch VQ details for QC flow', vqError);
                    toast('ไม่สามารถดึงข้อมูลราคาจากใบเสนอราคาได้ กรุณาระบุราคาด้วยตนเอง', 'error');
                }
            }

            // 2. Map Header IDs
            setValue('pr_id', Number(fullPR.pr_id));
            setValue('pr_no', fullPR.pr_no);
            setValue('approve_pr_id', (fullPR as any).approve_pr_id ? Number((fullPR as any).approve_pr_id) : (undefined as any));
            setValue('rfq_id', (Number(qcId || (fullPR as any).rfq_id) || undefined) as any);
            setValue('qc_id', (Number(qcId || (fullPR as any).qc_id) || undefined) as any);
            setValue('winning_vq_id', (Number(resolvedWinningVqId || (fullPR as any).winning_vq_id) || undefined) as any);
            
            // 🏢 Branch mapping
            if (fullPR.branch_id) {
                setValue('branch_id', Number(fullPR.branch_id));
            }
            
            // 📝 Remarks mapping
            const prRemarks = fullPR.purpose || fullPR.remark;
            if (prRemarks) {
                setValue('remarks', prRemarks);
            }

            // 3. Map Vendor & Terms
            const finalVendorId = Number(vendorId || winningVQ?.vendor_id || fullPR.preferred_vendor_id);
            if (finalVendorId) {
                setValue('vendor_id', finalVendorId, { shouldValidate: true, shouldDirty: true });
                let finalVendorName = winningVQ?.vendor?.vendor_name || winningVQ?.vendor_name || fullPR.vendor_name || '';
                if (finalVendorId && !finalVendorName) {
                    try {
                        const vendorDetail = await VendorService.getById(finalVendorId, { signal });
                        if (vendorDetail) finalVendorName = vendorDetail.vendor_name;
                    } catch (e) {
                        logger.error('[usePOHydration] Failed to fetch vendor detail for name', e);
                    }
                }
                setValue('vendor_name', finalVendorName);
            }

            // FINANCIAL TERMS
            const creditTerm = Number(winningVQ?.payment_term_days ?? fullPR.payment_term_days ?? 30);
            const leadTime = Number(winningVQ?.lead_time_days ?? 0);
            const creditDays = Number(fullPR.credit_days ?? 0);
            const finalCreditDays = leadTime > 0 ? leadTime : creditDays;
            
            const taxCodeId = Number(winningVQ?.tax_code_id ?? (winningVQ as any)?.tax_id ?? fullPR.pr_tax_code_id ?? (fullPR as any).pr_tax_id);

            setValue('payment_term_days', creditTerm);
            setValue('credit_days', finalCreditDays);
            
            const deliveryDate = (winningVQ as any)?.delivery_date || fullPR.delivery_date || fullPR.need_by_date;
            if (deliveryDate) setValue('delivery_date', cleanD(deliveryDate));

            if (taxCodeId) setValue('tax_code_id', taxCodeId, { shouldValidate: true });

            // 💱 Currency & Multicurrency Mapping
            const finalExRate = Number(winningVQ?.exchange_rate || fullPR.pr_exchange_rate || 1);
            
            let fullWinningVQ = winningVQ;
            if (winningVQ?.vq_header_id) {
                try {
                    const vqDetail = await VQService.getById(Number(winningVQ.vq_header_id), { signal });
                    if (vqDetail) fullWinningVQ = vqDetail as any;
                } catch (e) {
                    logger.error("❌ [usePOHydration] Failed to fetch full VQ detail:", e);
                }
            }

            let resolvedCode = fullWinningVQ?.quote_currency_code || (fullWinningVQ as any)?.currency_code || (fullWinningVQ as any)?.currency || fullPR.pr_quote_currency_code || 'THB';
            
            if (resolvedCode === 'THB' && finalExRate !== 1) {
                const cId = (fullWinningVQ as any)?.currency_id || (fullWinningVQ as any)?.quote_currency_id || (fullWinningVQ as any)?.currencyId || (fullPR as any).pr_currency_id;
                if (cId && Array.isArray(currencies)) {
                    const match = (currencies as any[]).find(c => String(c.currency_id) === String(cId) || String(c.id) === String(cId));
                    if (match) resolvedCode = match.currency_code || match.code;
                }
            }

            if (resolvedCode === 'THB' && finalExRate === 33) {
                resolvedCode = 'USD';
                logger.warn("🚨 [usePOHydration] Emergency Override: Rate 33 detected, forcing USD.");
            }

            const isForeign = resolvedCode !== 'THB' || finalExRate !== 1;
            
            setValue('is_multicurrency', isForeign, { shouldValidate: true, shouldDirty: true });
            setValue('quote_currency_code', resolvedCode);
            setValue('currency_code', resolvedCode);
            setValue('target_currency', 'THB'); 
            setValue('exchange_rate', finalExRate);
            
            if (isForeign) {
                const exDate = fullWinningVQ?.exchange_rate_date || fullPR.pr_exchange_rate_date;
                if (exDate) {
                    const dateObj = new Date(exDate);
                    const dateStr = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
                    setValue('exchange_rate_date', dateStr.split('T')[0]);
                }
            }
            
            // 📦 DEEP LINE ITEM MAPPING
            const prLines = extractLinesArray<PRLine>(fullPR);
            
            if (prLines.length > 0) {
                const actualVQLines = winningVQ ? extractLinesArray<IHydrationVQLine>(winningVQ) : [];
                const isQC = type === 'QC' && winningVQ && actualVQLines.length > 0;
                const sourceLines = isQC ? actualVQLines : prLines;
                
                const mappedLines = await Promise.all(sourceLines.map(async (sourceLine: any, index: number) => {
                    let vqLine: IHydrationVQLine | undefined;
                    let l: PRLine | undefined;
                    
                    if (isQC) {
                        vqLine = sourceLine as IHydrationVQLine;
                        const vqItemCode = String(vqLine.item_code || vqLine.item?.item_code || (vqLine as any).code || "");
                        l = prLines.find((p: any) => {
                            if (vqLine!.pr_line_id && Number(p.pr_line_id) === Number(vqLine!.pr_line_id)) return true;
                            if (vqLine!.item_id && Number(p.item_id || p.item?.item_id) === Number(vqLine!.item_id)) return true;
                            const pCode = String(p.item_code || p.item?.item_code || p.code || "");
                            if (vqItemCode && pCode && vqItemCode === pCode) return true;
                            return false;
                        }) as PRLine | undefined;
                    } else {
                        l = sourceLine as PRLine;
                    }

                    const getRobustItemId = (line: IHydrationPRLine, vqL?: IHydrationVQLine) => {
                        return Number(vqL?.item_id || vqL?.product_id || vqL?.id || vqL?.item?.item_id || vqL?.item?.id || vqL?.item?.product_id || line?.item_id || line?.id || line?.item?.item_id || line?.item?.id);
                    };

                    let finalUnitPrice = 0;
                    let discExpr = '0';

                    if (isQC && vqLine) {
                        finalUnitPrice = Number(vqLine.unit_price || 0);
                        discExpr = String(vqLine.discount_expression || '0');
                    } else {
                        finalUnitPrice = Number(l?.unit_price || l?.est_unit_price || 0);
                        discExpr = String(l?.line_discount_raw || '0');
                    }

                    const finalItemId = getRobustItemId(l as IHydrationPRLine, vqLine);
                    let finalCode = String(vqLine?.item_code || vqLine?.item?.item_code || (vqLine as any)?.code || l?.item?.item_code || l?.item_code || (l as any)?.code || "");

                    if (!finalCode && finalItemId && finalItemId > 0) {
                        try {
                            const fetchedItem = await ItemMasterService.getById(Number(finalItemId), { signal });
                            if (fetchedItem?.item_code) finalCode = fetchedItem.item_code;
                        } catch (e) {
                            logger.error("[usePOHydration] Async Item Fix failed", e);
                        }
                    }

                    const safeL = l || {} as PRLine;
                    const usedQty = Number(vqLine?.qty ?? safeL.qty ?? 1);

                    return {
                        po_line_id: undefined,
                        id: (finalItemId || 0) as number,
                        item_id: (finalItemId || 0) as number,
                        code: finalCode,
                        item_code: finalCode, 
                        line_no: index + 1,
                        item_name: String(vqLine?.item_name || vqLine?.item?.item_name || safeL.item_name || safeL.item?.item_name || ''), 
                        description: String(vqLine?.remark || vqLine?.item?.description || safeL.description || safeL.item_name || safeL.item?.item_name || ''), 
                        pr_line_id: safeL.pr_line_id ? Number(safeL.pr_line_id) : (vqLine?.pr_line_id ? Number(vqLine.pr_line_id) : undefined),
                        rfq_line_id: vqLine?.rfq_line_id ? Number(vqLine.rfq_line_id) : undefined,
                        status: 'OPEN' as const,
                        qty: usedQty, 
                        qty_ordered: usedQty,
                        uom_id: Number(vqLine?.uom_id || safeL.uom_id || safeL.item?.uom_id || 0) || 1, 
                        unit_price: Number(finalUnitPrice), 
                        discount_amount: Number(isQC && vqLine && 'discount_amount' in vqLine ? vqLine.discount_amount : (parseDiscountAmount(discExpr, usedQty * finalUnitPrice))),
                        discount_expression: discExpr,
                        tax_code_id: vqLine?.tax_code_id ? Number(vqLine.tax_code_id) : (safeL.tax_code_id ? Number(safeL.tax_code_id) : Number(getValues('tax_code_id'))), 
                        required_receipt_type: (safeL.required_receipt_type as "FULL" | "PARTIAL") || 'FULL',
                        receipt_type: 'GOODS' as const,
                        line_total: Number((() => {
                            if (isQC && vqLine && 'net_amount' in vqLine && Number(vqLine.net_amount) > 0) return Number(vqLine.net_amount);
                            const discount = parseDiscountAmount(discExpr, usedQty * finalUnitPrice);
                            return calculateLineTotal(usedQty, finalUnitPrice, discount);
                        })().toFixed(2)),
                    };
                }));

                replace(mappedLines as any);
                
                setTimeout(() => {
                    trigger('po_lines');
                }, 100);
            }
            
            toast(`เชื่อมโยงข้อมูลจาก ${fullPR.pr_no} สำเร็จ`, 'success');
        } catch (error) {
            if ((error as any).name === 'AbortError') {
                logger.info('[usePOHydration] Hydration aborted');
            } else {
                logger.error('[usePOHydration] hydrateFromSource error:', error);
                toast('ไม่สามารถดึงข้อมูลเอกสารต้นทางได้', 'error');
            }
        }
    }, [setValue, getValues, replace, trigger, toast, currencies]);

    return { hydrateFromSource };
};
