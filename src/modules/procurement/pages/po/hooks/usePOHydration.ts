import { useCallback } from 'react';
import type { UseFormReturn, UseFieldArrayReplace } from 'react-hook-form';
import type { POFormData, IHydrationVQHeader, IHydrationVQLine } from '@/modules/procurement/schemas/po-schemas';
import type { PRLine } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { logger } from '@/shared/utils';
import { extractLinesArray } from '@/shared/utils/apiUtils';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import type { PRHeader } from '@/modules/procurement/types/pr-types';

interface UsePOHydrationProps {
    setValue: UseFormReturn<POFormData>['setValue'];
    getValues: UseFormReturn<POFormData>['getValues'];
    replace: UseFieldArrayReplace<POFormData, 'po_lines'>;
    trigger: UseFormReturn<POFormData>['trigger'];
    toast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const usePOHydration = ({
    setValue,
    replace,
    trigger,
    toast
}: UsePOHydrationProps) => {
    
    const cleanD = (d: string | Date | null | undefined) => (typeof d === 'string' && d.includes('T')) ? d.split('T')[0] : d as string;

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
        
        // 🚨 Reset key header fields before hydration
        setValue('vendor_id', undefined as unknown as number);
        setValue('vendor_name', undefined);
        setValue('is_multicurrency', true);
        setValue('currency_code', 'THB');
        setValue('qc_no', undefined);
        setValue('approval_no', undefined);

        try {
            // 1. Fetch Source Data
            const fullPR = await PRService.getDetail(prId, { signal });
            let fullWinningVQ: IHydrationVQHeader | undefined;
            let fetchedVQLines: IHydrationVQLine[] = [];

            // 1.1 Find Winning VQ ID if missing (Already handled by passing winningVqId from source selector)
            const resolvedWinningVqId = winningVqId;

            // 1.2 Fetch Full VQ Detail & Lines
            const targetVqId = resolvedWinningVqId || (fullPR as PRHeader).winning_vq_id;
            if (targetVqId) {
                try {
                    const [vqResp, vqLinesResp] = await Promise.all([
                        VQService.getById(Number(targetVqId), { signal }),
                        VQService.getLines(Number(targetVqId), { signal }).catch(() => [])
                    ]);
                    
                    // Safe unwrapping for detail
                    const vqData = (vqResp as unknown as Record<string, unknown>)?.data || vqResp;
                    fullWinningVQ = Array.isArray(vqData) ? vqData[0] : vqData;
                    
                    // Safe unwrapping for lines
                    const vqLinesData = (vqLinesResp as unknown as Record<string, unknown>)?.data || vqLinesResp;
                    fetchedVQLines = Array.isArray(vqLinesData) ? vqLinesData : [];
                } catch (e) { logger.error('[usePOHydration] VQ fetch failed', e); }
            }

            // 2. Map Document References
            const fullPRTyped = fullPR as unknown as Record<string, unknown>;
            const finalQcNo = qcNo || (fullPRTyped.qc_no as string) || ((fullPR as PRHeader).qcHeaders?.[0]?.qc_no);
            const finalAvNo = approvalNo || (fullPRTyped.av_no as string) || (fullPRTyped.approval_no as string);
            
            setValue('pr_id', Number(fullPR.pr_id));
            setValue('pr_no', fullPR.pr_no);
            setValue('qc_id', (Number(qcId || fullPR.qc_id) || undefined) as unknown as number);
            setValue('rfq_id', (Number(fullPR.rfq_id) || undefined) as unknown as number);
            setValue('winning_vq_id', (Number(targetVqId) || undefined) as unknown as number);
            if (finalQcNo) setValue('qc_no', finalQcNo);
            if (finalAvNo) setValue('approval_no', finalAvNo);

            // 3. Map Vendor & Terms
            const finalVendorId = Number(vendorId || fullWinningVQ?.vendor_id || fullPR.preferred_vendor_id);
            if (finalVendorId) {
                setValue('vendor_id', finalVendorId);
                let vendorName = fullWinningVQ?.vendor?.vendor_name || fullWinningVQ?.vendor_name || fullPR.vendor_name || '';
                if (!vendorName) {
                    const vDetail = await VendorService.getById(finalVendorId).catch(() => null);
                    if (vDetail) vendorName = vDetail.vendor_name;
                }
                setValue('vendor_name', vendorName);
            }

            setValue('payment_term_days', Number(fullWinningVQ?.payment_term_days ?? fullPR.payment_term_days ?? 30));
            setValue('branch_id', Number(fullPR.branch_id || undefined) as number);
            
            const vqRaw = fullWinningVQ as unknown as Record<string, unknown>;
            const deliveryDate = vqRaw?.delivery_date as string || fullPR.delivery_date || fullPR.need_by_date;
            if (deliveryDate) setValue('delivery_date', cleanD(deliveryDate));

            // 4. Currency & Tax
            const taxCodeId = Number(fullWinningVQ?.tax_code_id || fullPR.pr_tax_code_id || (fullPR as unknown as Record<string, unknown>).tax_code_id);
            if (taxCodeId) setValue('tax_code_id', taxCodeId);

            const finalExRate = Number(fullWinningVQ?.exchange_rate || fullPR.pr_exchange_rate || 1);
            const resolvedCode = fullWinningVQ?.quote_currency_code || vqRaw?.currency as string || fullPR.pr_quote_currency_code || 'THB';
            
            const isForeign = resolvedCode !== 'THB' || finalExRate !== 1;
            // 🎯 USER REQUEST: Always expand/check Multicurrency
            setValue('is_multicurrency', true);

            setValue('currency_code', resolvedCode);
            setValue('exchange_rate', finalExRate);
            if (isForeign && (fullWinningVQ?.exchange_rate_date || fullPR.pr_exchange_rate_date)) {
                setValue('exchange_rate_date', cleanD(fullWinningVQ?.exchange_rate_date || fullPR.pr_exchange_rate_date));
            }

            // 6. Map Line Items
            const prLines = extractLinesArray<PRLine>(fullPR);
            const actualVQLines = fetchedVQLines.length > 0 ? fetchedVQLines : (fullWinningVQ ? extractLinesArray<IHydrationVQLine>(fullWinningVQ) : []);
            const isQCSource = type === 'QC' && actualVQLines.length > 0;
            const sourceLines = isQCSource ? actualVQLines : prLines;

            if (sourceLines.length > 0) {
                const mappedLines = await Promise.all(sourceLines.map(async (source, index) => {
                    let vqL: IHydrationVQLine | undefined;
                    let prL: PRLine | undefined;

                    if (isQCSource) {
                        vqL = source as IHydrationVQLine;
                        prL = prLines.find(p => Number(p.pr_line_id) === Number(vqL?.pr_line_id));
                    } else {
                        prL = source as PRLine;
                    }

                    // 🚀 CRITICAL: Robust Item Code Detection
                    const vqLTyped = vqL as unknown as Record<string, unknown>;
                    const prLTyped = prL as unknown as Record<string, unknown>;
                    
                    const price = Number(vqL?.unit_price || prL?.unit_price || 0);
                    const qty = Number(vqL?.qty || prL?.qty || 1);
                    const discExpr = String(vqL?.discount_expression || '0');
                    
                    const finalItemCode = vqL?.item_code || (vqLTyped?.item as Record<string, unknown>)?.item_code as string || prL?.item_code || (prLTyped?.item as Record<string, unknown>)?.item_code as string || '';

                    return {
                        line_no: index + 1,
                        item_id: Number(vqL?.item_id || prL?.item_id || 0),
                        id: Number(vqL?.item_id || prL?.item_id || index + 1),
                        item_code: finalItemCode,
                        code: finalItemCode, // Added for UI compatibility
                        item_name: vqL?.item_name || (vqLTyped?.item as Record<string, unknown>)?.item_name as string || prL?.item_name || (prLTyped?.item as Record<string, unknown>)?.item_name as string || '',
                        description: vqL?.remark || prL?.description || prL?.item_name || '',
                        pr_line_id: Number(vqL?.pr_line_id || prL?.pr_line_id || 0),
                        status: 'OPEN',
                        qty,
                        qty_ordered: qty,
                        uom_id: Number(vqL?.uom_id || prL?.uom_id || 0),
                        unit_price: price,
                        discount_expression: discExpr,
                        discount_amount: parseDiscountAmount(discExpr, qty * price),
                        tax_code_id: vqL?.tax_code_id || prL?.tax_code_id || taxCodeId,
                        required_receipt_type: 'FULL',
                        receipt_type: 'GOODS',
                        line_total: Number((() => {
                            if (vqL && 'net_amount' in vqL && Number(vqL.net_amount) > 0) return Number(vqL.net_amount);
                            const d = parseDiscountAmount(discExpr, qty * price);
                            return qty * price - d;
                        })().toFixed(2))
                    };
                }));

                replace(mappedLines as POFormData['po_lines']);

                // 🎯 7. Header Discount (🚀 EXHAUSTIVE SEARCH)
                const vqFinalRaw = (fullWinningVQ as unknown as Record<string, unknown>) || {};
                const prFinalRaw = (fullPR as unknown as Record<string, unknown>) || {};
                
                let headerDiscExpr = String(
                    fullWinningVQ?.discount_expression || 
                    vqFinalRaw?.discount_expression || 
                    vqFinalRaw?.discount_expr || 
                    vqFinalRaw?.header_discount_expression || 
                    vqFinalRaw?.discount || 
                    (vqFinalRaw?.header as unknown as Record<string, unknown>)?.discount_expression ||
                    prFinalRaw?.discount_expression ||
                    ''
                );

                const headerDiscAmount = Number(
                    fullWinningVQ?.base_discount_amount || 
                    vqFinalRaw?.base_discount_amount || 
                    vqFinalRaw?.discount_amount || 
                    vqFinalRaw?.header_discount_amount ||
                    prFinalRaw?.base_discount_amount ||
                    0
                );

                if (!headerDiscExpr || headerDiscExpr === '0' || headerDiscExpr === 'null' || headerDiscExpr === 'undefined') {
                    if (headerDiscAmount > 0) {
                        headerDiscExpr = headerDiscAmount.toString();
                    } else {
                        headerDiscExpr = '0';
                    }
                }

                setValue('discount_expression', headerDiscExpr, { 
                    shouldDirty: true, 
                    shouldValidate: true 
                });
                
                // @ts-expect-error - Internal calc field
                setValue('base_discount_amount', headerDiscAmount, { shouldDirty: true });

                setTimeout(() => {
                    trigger('discount_expression');
                    trigger();
                }, 200);
            }

            toast(`ดึงข้อมูลจาก ${fullPR.pr_no} เรียบร้อยแล้ว`, 'success');
        } catch (e) {
            if (e instanceof Error && e.name !== 'AbortError') {
                logger.error('[usePOHydration] Error:', e);
                toast('ไม่สามารถดึงข้อมูลต้นทางได้', 'error');
            }
        }
    }, [setValue, replace, trigger, toast]);

    return { hydrateFromSource };
};
