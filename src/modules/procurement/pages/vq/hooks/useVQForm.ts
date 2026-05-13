import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type FieldErrors, type FieldError } from 'react-hook-form';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationHeaderSchema, type QuotationFormData, type QuotationLineFormData } from '@/modules/procurement/schemas/vq-schemas';
import { VQService, type VQCreateData } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { RFQHeader, RFQLine, RFQVendor } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils';
import { MasterDataService } from '@/modules/master-data';
const formatDateForInputHelper = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { VQListItem, VQStatus, QuotationLine, QuotationHeader, VQPendingQueueItem } from '@/modules/procurement/types/vq-types';
import { useVQMasterData } from './useVQMasterData';
import { calculatePricingSummary, parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import { extractLinesArray } from '@/shared/utils/apiUtils';

import type { VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';

export interface ExtendedRFQHeader extends RFQHeader {
    vendor_id?: number | null;
    vendor_name?: string | null;
    isMulticurrency?: boolean;
    payment_terms?: string | null;
    payment_term_days?: number | null;
    created_by_name?: string | null;
    import_type?: string; 
    lines?: import('@/modules/procurement/types').RFQLine[];
    rfqLines?: import('@/modules/procurement/types').RFQLine[];
}

export interface AvailableVendor extends Partial<VendorMaster> {
    vendor_id: number;
    hasVQ: boolean;
    rfq_vendor_id?: number;
    rfqVendorId?: number;
}

const createEmptyLine = (): QuotationLineFormData => ({
  quotation_line_id: 0,
  item_id: undefined, 
  item_code: '',
  item_name: '',
  qty: 1,
  unit_price: 0,
  discount_expression: '',
  discount_amount: 0,
  net_amount: 0,
  uom_id: 0,
  uom_name: '',
  no_quote: false,
  reference_price: 0,
  status: 'OPEN',
  remark: '',
  pr_line_id: 0,
  rfq_line_id: 0,
  pr_approval_line_id: 0
});

interface RawVQLine {
    item_id?: number | string | null;
    item_code?: string | null;
    item_name?: string | null;
    // 💧 @Agent_View_Hydrator: CamelCase and nested fallbacks for hydration
    itemCode?: string | null;
    itemName?: string | null;
    product_code?: string | null;
    product_name?: string | null;
    item?: { item_code?: string | null; item_name?: string | null };
    product?: { product_code?: string | null; product_name?: string | null };
    description?: string | null;
    qty?: number | string | null;
    unit_price?: number | string | null;
    discount_expression?: string | null;
    discount_raw?: string | null;
    discount_amount?: number | string | null;
    net_amount?: number | string | null;
    rfq_vendor_id?: number | string | null;
    rfqVendorId?: number | string | null;
    rfq_no?: string | null;
    uom_id?: number | string | null;
    uom_name?: string | null;
    uom?: string | null;
    no_quote?: boolean | string | number | null;
    reference_price?: number | string | null;
    est_unit_price?: number | string | null;
    status?: string | null;
    remark?: string | null;
    pr_line_id?: number | string | null;
    rfq_line_id?: number | string | null;
    pr_approval_line_id?: number | string | null;
    approval_line_id?: number | string | null;
    av_line_id?: number | string | null;
    line_no?: number | string | null;
}

interface RawVQResponse extends Omit<Partial<QuotationHeader>, 'vq_lines' | 'lines'> {
    vq_lines?: RawVQLine[];
    vqLines?: RawVQLine[]; // 💧 @Agent_View_Hydrator: CamelCase support
    lines?: RawVQLine[];
    items?: RawVQLine[];
    created_by?: number;
    created_by_name?: string;
    av_id?: number | string | null;
    approval_id?: number | string | null;
    approvalId?: number | string | null;
    rfq_vendor_id?: number | null;
    rfqVendorId?: number | string | null;
    is_multicurrency?: boolean | null;
    isMulticurrency?: boolean;
    payment_terms?: string | null;
    created_by_user?: {
        employee?: { employee_fullname?: string };
        name?: string;
    } | null;
    user?: { name?: string; username?: string } | null;
}

// ============================================================================
// DATA UNWRAPPING & EXTRACTION UTILITIES
// ============================================================================
// (Migrated to @/shared/utils/apiUtils)

export const useVQForm = (
  isOpen: boolean, 
  onClose: () => void, 
  initialRFQ?: ExtendedRFQHeader | null, 
  onSuccess?: () => void,
  vqId?: number | null,
  isViewMode?: boolean
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const showAlert = useCallback((message: string) => toast(message, 'error'), [toast]);
  const { confirm } = useConfirmation();
  const { purchaseTaxOptions, currencyOptions, isLoading: isMasterLoading } = useVQMasterData();

  const [availableVendors, setAvailableVendors] = useState<AvailableVendor[]>([]);
  const hasInitialized = useRef(false);
  const rfqAbortControllerRef = useRef<AbortController | null>(null);

  const formMethods = useForm<QuotationFormData>({
    resolver: zodResolver(QuotationHeaderSchema) as Resolver<QuotationFormData>,
    defaultValues: {
      quotation_date: new Date().toISOString(),
      status: 'DRAFT',
      vq_lines: [],
      currency: 'THB',
      exchange_rate: 1,
      exchange_rate_date: formatDateForInputHelper(new Date()),
      tax_code_id: 0,
      discount_expression: '0',
      created_by_name: user?.employee?.employee_fullname || user?.username || ''
    }
  });

  const { control, reset, handleSubmit, setValue, getValues, trigger, formState: { isDirty } } = formMethods;

  // 🛡️ Unsaved Changes Guard
  const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
    isDirty: isDirty && !isViewMode,
    enabled: isOpen,
    onSafeClose: onClose || (() => {})
  });

  const { fields, append, remove, replace, insert } = useFieldArray({
    control,
    name: 'vq_lines'
  });

  const watchTargetCurrency = useWatch({ control, name: 'target_currency' });
  const watchCurrency = useWatch({ control, name: 'currency' });
  const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });

  // 💱 Auto-toggle Multicurrency based on Currency Selection
  useEffect(() => {
    // 🛡️ @Agent_Guard: Skip auto-toggle if viewing existing record (respect saved DB state)
    if (isViewMode || !watchCurrency || !watchTargetCurrency) return;
    
    // It is multicurrency if the two currencies are different
    const different = String(watchCurrency).toUpperCase() !== String(watchTargetCurrency).toUpperCase();
    
    // 🛡️ ONLY auto-toggle if it's currently false (don't accidentally collapse if user manually opened it)
    if (different && !isMulticurrency) {
        setValue('isMulticurrency', true);
    }
  }, [watchCurrency, watchTargetCurrency, setValue, isViewMode, isMulticurrency, getValues]);

  // 💱 Auto-calculate Exchange Rate when currencies change
  useEffect(() => {
    if (!watchCurrency || !watchTargetCurrency) return;
    
    if (watchCurrency === watchTargetCurrency) {
      setValue('exchange_rate', 1, { shouldDirty: false });
      return;
    }

    const { isDirty } = formMethods.getFieldState('exchange_rate');
    if (!isDirty) {
      const sourceObj = currencyOptions.find(c => c.value === watchCurrency)?.original;
      const targetObj = currencyOptions.find(c => c.value === watchTargetCurrency)?.original;

      const fromRate = Number(sourceObj?.exchange_rate) || 1;
      const toRate = Number(targetObj?.exchange_rate) || 1;

      const calculatedRate = fromRate / toRate;

      if (!isNaN(calculatedRate)) {
        setValue('exchange_rate', Number(calculatedRate.toFixed(4)), { shouldValidate: true, shouldDirty: false });
      }
    }
  }, [currencyOptions, watchCurrency, watchTargetCurrency, setValue, formMethods]);

  useEffect(() => {
    const { isDirty } = formMethods.getFieldState('isMulticurrency');
    if (!isDirty) return; // 💧 Guard: Only reset values if the user explicitly interacted with the toggle
    
    if (!isMulticurrency) {
      if (getValues('currency') !== 'THB' || getValues('exchange_rate') !== 1) {
        setValue('currency', 'THB', { shouldDirty: false });
        setValue('exchange_rate', 1, { shouldDirty: false });
        setValue('target_currency', 'THB', { shouldDirty: false });
        setValue('exchange_rate_date', '', { shouldDirty: false });
      }
    }
  }, [isMulticurrency, setValue, getValues, formMethods]);

  // If currency is THB, exchange rate MUST be 1
  useEffect(() => {
    if (watchCurrency === 'THB' && getValues('exchange_rate') !== 1) {
      setValue('exchange_rate', 1, { shouldDirty: false });
    }
  }, [watchCurrency, setValue, getValues]);

  const handleSelectRFQVendor = useCallback(async (vendorId: number, manualRfqVendorId?: number) => {
    try {
      const vendorDetails = await VendorService.getById(vendorId);
      setValue('vendor_id', vendorId, { shouldValidate: true });
      
      // 🎯 Lookup and set rfq_vendor_id from availableVendors list
      // 🔄 FIX: If manualRfqVendorId is provided (e.g., during init/auto-select), use it directly
      if (manualRfqVendorId) {
          setValue('rfq_vendor_id', manualRfqVendorId, { shouldValidate: true });
          logger.debug('🎯 [useVQForm] Manual Vendor select VQ-RFQLINK (Injected):', { vendor_id: vendorId, rfq_vendor_id: manualRfqVendorId });
      } else {
          const listVendor = availableVendors.find(v => Number(v.vendor_id) === Number(vendorId));
          if (listVendor) {
              const rfqVendorId = Number(listVendor.rfq_vendor_id || listVendor.rfqVendorId || listVendor.id) || undefined;
              logger.debug('🎯 [useVQForm] Manual Vendor select VQ-RFQLINK (State Lookup):', { vendor_id: vendorId, rfq_vendor_id: rfqVendorId });
              setValue('rfq_vendor_id', rfqVendorId, { shouldValidate: true });
          }
      }

      setValue('vendor_code', vendorDetails?.vendor_code || '', { shouldValidate: true });
      setValue('vendor_name', vendorDetails?.vendor_name || '', { shouldValidate: true });
      const contacts = vendorDetails?.contacts || vendorDetails?.vendorContacts || [];
      const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];
      const addressContact = vendorDetails?.addresses?.find((a) => a.contact_person)?.contact_person;
      setValue('contact_person', primaryContact?.contact_name || addressContact || '', { shouldValidate: true });
      setValue('contact_phone', vendorDetails?.phone || '', { shouldValidate: true });
      setValue('contact_email', vendorDetails?.email || '', { shouldValidate: true });
      setValue('payment_term_days', Number(vendorDetails?.payment_term_days ?? 0), { shouldValidate: true });
      setValue('payment_terms', `${vendorDetails?.payment_term_days ?? 0} วัน`, { shouldValidate: true });
      setValue('lead_time_days', Number(vendorDetails?.lead_time_days ?? 0), { shouldValidate: true });



    } catch (err) {

      logger.error('[useVQForm] Failed to fetch vendor details:', err);
      toast('ไม่สามารถดึงข้อมูลรายละเอียดผู้ขายได้', 'error');
    }
  }, [setValue, toast, availableVendors]);


  const [vqStatus, setVqStatus] = useState<VQStatus | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dbTotals, setDbTotals] = useState<{
    subtotal: number;
    billDiscount: number;
    preTax: number;
    taxAmount: number;
    grandTotal: number;
    totalLineDiscount: number;
    totalGross: number;
    taxRate: number;
  } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) {
        rfqAbortControllerRef.current?.abort();
        rfqAbortControllerRef.current = null;
        hasInitialized.current = false;
        return;
    }

    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      if (vqId) {
        setIsDataLoading(true);
        // --- VIEW / EDIT MODE: Fetch Existing VQ and Master Items ---
        Promise.all([
            VQService.getById(vqId),
            MasterDataService.getItems().catch(() => []),
            VQService.getLines(vqId).catch(() => [])
        ]).then(async ([response, itemsRes, fetchedLines]) => {
            const masterItems = Array.isArray(itemsRes) ? itemsRes : [];
            
            // @Agent_Payload_Parser - Data Normalization (Unwrap Array/Object) 
            const res = response as unknown as { data?: RawVQResponse | RawVQResponse[] };
            const unwrappedResponse = res.data ?? response;
            const data = (Array.isArray(unwrappedResponse) ? unwrappedResponse[0] : unwrappedResponse) as RawVQResponse;
            logger.debug("[useVQForm] VQ Data Loaded for ID", vqId);
            
            if (!data) {
                logger.warn("VQ Data Not Found for ID:", vqId);
                setIsDataLoading(false);
                return;
            }

            setVqStatus(data.status || null);

            // 💧 Hydration Load Fallbacks: Fetch RFQ and Vendor detail for missing properties backfill
            let apiLines: RFQLine[] = [];
            if (data.rfq_id || data.vendor_id) {
                try {
                    const [rfqDetailRes, vendorDetailRes] = await Promise.all([
                        data.rfq_id ? RFQService.getById(data.rfq_id) : Promise.resolve(null),
                        data.vendor_id ? VendorService.getById(data.vendor_id) : Promise.resolve(null)
                    ]);
                    const rfqDetailResData = rfqDetailRes as unknown as { data?: ExtendedRFQHeader };
                    const vendorDetailResData = vendorDetailRes as unknown as { data?: VendorMaster };
                    const rfqDetail = (rfqDetailResData?.data ?? rfqDetailRes) as ExtendedRFQHeader | null;
                    const vendorDetail = (vendorDetailResData?.data ?? vendorDetailRes) as VendorMaster | null;
                    
                    // 3. Extract VQ Lines from various possible keys
                    const vqLinesFromHeader = data.vqLines || data.vq_lines || data.lines || data.items || [];
                    const vqRawLines = vqLinesFromHeader.length > 0 ? vqLinesFromHeader : (fetchedLines || []);
                    const vqHasNoLines = !Array.isArray(vqRawLines) || vqRawLines.length === 0;

                    // 4. Hydration Logic: Prefer saved VQ lines, fallback to RFQ lines ONLY if VQ is empty/pending
                    // status 'PENDING' usually means it's a new draft from RFQ that hasn't been saved with its own lines yet.
                    if (rfqDetail && (vqHasNoLines || data.status === 'PENDING')) {
                        apiLines = (rfqDetail.lines && rfqDetail.lines.length > 0) ? rfqDetail.lines : (rfqDetail.rfqLines || []);
                    }
                    
                    // 1. Backfill from RFQ
                    if (rfqDetail) {
                        data.payment_terms = data.payment_terms || rfqDetail.payment_terms || rfqDetail.payment_term_hint || (rfqDetail.payment_term_days ? `${rfqDetail.payment_term_days} วัน` : '');
                        data.payment_term_days = data.payment_term_days || rfqDetail.payment_term_days || 0;
                        data.lead_time_days = data.lead_time_days || rfqDetail.payment_term_days || 0; 
                        data.created_by_name = data.created_by_name || rfqDetail.created_by_name || rfqDetail.requested_by || '';
                        data.currency = data.currency || rfqDetail.rfq_base_currency_code || '';
                        data.target_currency = data.target_currency || rfqDetail.rfq_quote_currency_code || '';
                    }

                    // 2. Backfill from Vendor Master
                    if (vendorDetail) {
                        const primaryContact = vendorDetail.contacts?.find((c) => c.is_primary) || vendorDetail.contacts?.[0];
                        const addressContact = vendorDetail.addresses?.find((a) => a.contact_person)?.contact_person;
                        
                        data.contact_person = data.contact_person || primaryContact?.contact_name || addressContact || '';
                        const v = vendorDetail as unknown as Record<string, unknown>;
                        data.contact_phone = data.contact_phone || primaryContact?.phone || primaryContact?.mobile || vendorDetail.phone || '';
                        data.contact_email = data.contact_email || primaryContact?.email || vendorDetail.email || '';
                        data.payment_terms = data.payment_terms || (v.payment_terms as string) || (vendorDetail.payment_term_days ? `${vendorDetail.payment_term_days} วัน` : '');
                        if (!data.payment_term_days && vendorDetail.payment_term_days) {
                            data.payment_term_days = vendorDetail.payment_term_days;
                        }
                    }
                } catch (err) {
                    logger.error('[useVQForm] Failed to fetch backfill details:', err);
                }
            }

            // @Agent_Payload_Parser - Line Mapping (Prioritize linesToMap > apiLines)
            const vqLinesFromHeader = data.vqLines || data.vq_lines || data.lines || data.items || [];
            const rawLines = vqLinesFromHeader.length > 0 ? vqLinesFromHeader : (fetchedLines || []);
            const linesToMap = Array.isArray(rawLines) ? rawLines : [];
            const finalLinesSource = linesToMap.length > 0 ? linesToMap : apiLines;
            
            const mappedLines: QuotationLineFormData[] = finalLinesSource.map((l: RawVQLine) => {
                const matchedItem = masterItems.find((i) => Number(i.item_id) === Number(l.item_id));
                return {
                    ...createEmptyLine(),
                    line_no: Number(l.line_no) || 0,
                    item_id: Number(l.item_id) || 0,
                    // 💧 @Agent_View_Hydrator: Multi-fallback for item details in View Mode
                    item_code: String(l.item_code || l.itemCode || l.product_code || matchedItem?.item_code || l.item?.item_code || l.product?.product_code || ''),
                    item_name: String(l.item_name || l.itemName || l.product_name || matchedItem?.item_name || l.item?.item_name || l.product?.product_name || l.description || ''),
                    qty: Number(l.qty) || 0,
                    unit_price: Number(l.unit_price) || 0,
                    discount_expression: String(l.discount_expression || l.discount_raw || '0'),
                    discount_amount: Number(l.discount_amount) || 0,
                    net_amount: Number(l.net_amount) || 0,
                    uom_id: Number(l.uom_id) || 0,
                    uom_name: String(l.uom_name || l.uom || ''),
                    no_quote: Boolean(l.no_quote),
                    reference_price: Number(l.reference_price || l.est_unit_price) || 0,
                    status: String(l.status || 'OPEN'),
                    remark: String(l.remark || ''),
                    pr_line_id: Number(l.pr_line_id) || 0,
                    rfq_line_id: Number(l.rfq_line_id) || 0,
                    pr_approval_line_id: Number(l.pr_approval_line_id || l.approval_line_id || l.av_line_id) || 0
                };
            });



            // @Agent_Summary_Syncer - Sync DB Totals to UI
            const totalGrossVal = mappedLines.reduce((sum, l) => sum + (Number(l.qty) * Number(l.unit_price)), 0);
            const totalLineDiscountVal = mappedLines.reduce((sum, l) => sum + (Number(l.discount_amount) || 0), 0);
            
            setDbTotals({
                subtotal: (Number(data.base_total_amount) || 0) + (Number(data.base_discount_amount) || 0) - (Number(data.base_tax_amount) || 0),
                billDiscount: Number(data.base_discount_amount) || 0,
                preTax: (Number(data.base_total_amount) || 0) - (Number(data.base_tax_amount) || 0),
                taxAmount: Number(data.base_tax_amount) || 0,
                grandTotal: Number(data.base_total_amount) || 0,
                totalLineDiscount: totalLineDiscountVal,
                totalGross: totalGrossVal,
                taxRate: Number(data.tax_rate) ? Math.round(Number(data.tax_rate) * 100 * 100) / 100 : 0
            });

            const rawHydratedData = {
                vq_no: data.vq_no || '',
                quotation_no: data.quotation_no || '',
                quotation_date: data.quotation_date || new Date().toISOString(),
                vendor_id: Number(data.vendor_id || 0),
                vendor_code: data.vendor?.vendor_code || data.vendor_code || '',
                vendor_name: data.vendor_name || data.vendor?.vendor_name || '',
                contact_person: data.contact_person || (data.vendor as unknown as Record<string, unknown>)?.contact_person as string || '',
                contact_phone: data.contact_phone || (data.vendor as unknown as Record<string, unknown>)?.contact_phone as string || '',
                contact_email: data.contact_email || (data.vendor as unknown as Record<string, unknown>)?.contact_email as string || '',
                // 💱 @Agent_Currency_Prioritizer: Prefer explicit VQ fields (base/quote) over generic join fields
                currency: data.base_currency_code || data.currency || 'THB',
                isMulticurrency: true, // Force visible for Detail/Edit as requested
                exchange_rate_date: data.exchange_rate_date || '',
                target_currency: data.quote_currency_code || data.target_currency || 'THB',
                exchange_rate: Number(data.exchange_rate) || 1,
                payment_term_days: data.payment_term_days || 0,
                lead_time_days: data.lead_time_days || 0,
                // 💧 Map to view inputs inside VQFormHeader
                delivery_days: Number(data.lead_time_days) || 0,
                payment_terms: data.payment_terms || (data.payment_term_days ? `${data.payment_term_days} วัน` : ''),
                valid_until: data.quotation_expiry_date || '', 
                qc_id: Number(data.qc_id || 0),
                rfq_id: Number(data.rfq_id || 0),
                pr_approval_id: (() => {
                    const raw = data.pr_approval_id || data.av_id || data.approval_id || 0;
                    const num = Number(raw);
                    return Number.isFinite(num) && num > 0 ? num : 0;
                })(),
                rfq_vendor_id: Number(data.rfq_vendor_id || data.rfqVendorId || 0),
                rfq_no: data.rfq_no || '',
                discount_expression: String(data.discount_expression || '0'),
                tax_code_id: Number(data.tax_code_id || 0),
                status: data.status || 'DRAFT',
                created_by: data.created_by ? Number(data.created_by) : undefined,
                created_by_name: data.created_by_name || data.created_by_user?.employee?.employee_fullname || data.created_by_user?.name || data.user?.name || data.user?.username || '',
                vq_lines: []
            };

            // 📅 @Agent_Date_Standardizer: Hydrate dates correctly for HTML inputs
            const hydratedData = {
                ...rawHydratedData,
                quotation_date: formatDateForInputHelper(rawHydratedData.quotation_date),
                valid_until: formatDateForInputHelper(rawHydratedData.valid_until),
                exchange_rate_date: formatDateForInputHelper(rawHydratedData.exchange_rate_date)
            };

            reset(hydratedData);

            if (mappedLines.length > 0) {
                replace(mappedLines);
            }

            if (hydratedData.vendor_id && !hydratedData.vendor_name) {
                VendorService.getById(hydratedData.vendor_id).then(v => {
                    if (v) {
                        setValue('vendor_code', v.vendor_code, { shouldDirty: false });
                        setValue('vendor_name', v.vendor_name, { shouldDirty: false });
                    }
                });
            }
            if (hydratedData.rfq_id && !hydratedData.rfq_no) {
                RFQService.getById(hydratedData.rfq_id).then(r => {
                    if (r) setValue('rfq_no', r.rfq_no, { shouldDirty: false });
                });
            }

            setIsDataLoading(false);
        }).catch(err => {
            logger.error('[useVQForm] Failed to fetch VQ detail:', err);
            logger.error("💥 [useVQForm] CRASH IN LOAD PROMISE:", err);
            setIsDataLoading(false);
        });
      } else if (initialRFQ) {
        // --- CREATE MODE: Auto-fill from RFQ ---
        setIsDataLoading(true);
        Promise.all([
            RFQService.getById(initialRFQ.rfq_id),
            MasterDataService.getItems().catch(() => []),
            VQService.getVQsByRfqNo(initialRFQ.rfq_no || '').catch(() => ({ data: [] }))
        ]).then(async ([rawRFQ, itemsRes, existingVQsRes]) => {
            const fullRFQ = rawRFQ;
            const rfqRes = fullRFQ as unknown as Record<string, unknown>;
            logger.debug('🎯 [useVQForm] RFQ Hydration Payload:', {
                rfq_id: fullRFQ?.rfq_id,
                pr_approval_id: fullRFQ?.pr_approval_id,
                av_id: rfqRes?.av_id,
                approval_id: rfqRes?.approval_id,
                pr_id: fullRFQ?.pr_id
            });
            const masterItems = Array.isArray(itemsRes) ? itemsRes : [];
            const ev = existingVQsRes as unknown as { data?: Array<{ status: string; vendor_id: number }> };
            const existingVendorIds = (ev?.data || [])
                .filter((v) => v.status !== 'CANCELLED')
                .map((v) => Number(v.vendor_id));
            
            // 🎯 Fallback Array Scanning
            const apiLines = extractLinesArray<RFQLine>(fullRFQ);
            
            let mappedLines: QuotationLineFormData[] = [];
            
            if (apiLines.length > 0) {
                mappedLines = apiLines.map((line: RFQLine) => {
                    const matchedItem = masterItems.find((i) => Number(i.item_id) === Number(line.item_id));
                    return {
                        ...createEmptyLine(),
                        item_id: Number(line.item_id) || 0,
                        item_code: String(line.item_code || line.itemCode || line.product_code || matchedItem?.item_code || line.item?.item_code || line.product?.product_code || ''),
                        item_name: String(line.item_name || line.itemName || line.product_name || line.item?.item_name || line.product?.product_name || line.description || ''),
                        qty: Number(line.qty) || 1,
                        uom_id: Number(line.uom_id) || 0,
                        uom_name: String(line.uom || ''),
                        unit_price: 0,
                        discount_amount: 0,
                        net_amount: 0,
                        no_quote: false,
                        reference_price: Number(line.est_unit_price) || 0,
                        pr_line_id: Number(line.pr_line_id) || 0,
                        rfq_line_id: Number(line.rfq_line_id) || 0,
                        pr_approval_line_id: (() => {
                            const l = line as unknown as Record<string, unknown>;
                            const raw = l.pr_approval_line_id || l.approval_line_id || l.av_line_id || 0;
                            const num = Number(raw);
                            return Number.isFinite(num) ? num : 0;
                        })(),
                        status: 'OPEN',
                        remark: String(line.description || '')
                    };
                });
            }

            // Find specific vendor if initialRFQ passed vendor_id
            const allVendors = (fullRFQ.rfqVendors || fullRFQ.vendors || []) as Array<RFQVendor & { vendor_name?: string; vendor_code?: string; rfqVendorId?: number; id?: number }>;
            
            // Map vendors with hasVQ flag
            const mappedVendors: AvailableVendor[] = allVendors.map((v) => {
                const vqVendor = { ...v } as unknown as Record<string, unknown>;
                delete vqVendor.status; // Omit status to avoid RFQVendorStatus vs VendorStatus conflict
                return {
                    ...vqVendor,
                    vendor_id: Number(v.vendor_id),
                    vendor_code: v.vendor_code || '',
                    vendor_name: v.vendor_name || '',
                    hasVQ: existingVendorIds.includes(Number(v.vendor_id))
                } as AvailableVendor;
            });
            setAvailableVendors(mappedVendors);

            let selectedVendor = mappedVendors.find((v) => v.vendor_id === initialRFQ.vendor_id);
            if (!selectedVendor && mappedVendors.length > 0) {
                 selectedVendor = mappedVendors[0];
            }

            const rfqData = {
                quotation_no: '',
                quotation_date: formatDateForInputHelper(new Date()),
                vendor_id: Number(initialRFQ.vendor_id || selectedVendor?.vendor_id) || 0, 
                vendor_code: selectedVendor?.vendor_code || '',
                vendor_name: selectedVendor?.vendor_name || initialRFQ.vendor_name || '',
                contact_person: '', 
                contact_phone: '',
                contact_email: '',
                currency: fullRFQ.rfq_base_currency_code || 'THB',
                isMulticurrency: true,
                exchange_rate_date: formatDateForInputHelper(fullRFQ.rfq_exchange_rate_date) || formatDateForInputHelper(new Date()),
                target_currency: fullRFQ.rfq_quote_currency_code || 'THB',
                exchange_rate: Number(fullRFQ.rfq_exchange_rate) || 1,
                vq_lines: mappedLines,
                qc_id: 0,
                pr_id: fullRFQ.pr_id ? Number(fullRFQ.pr_id) : (initialRFQ.pr_id ? Number(initialRFQ.pr_id) : null),
                rfq_id: Number(fullRFQ.rfq_id || initialRFQ.rfq_id) || 0,
                pr_approval_id: (() => {
                    // 💧 Multi-scan for Approval ID across common backend naming variants
                    const r = fullRFQ as unknown as Record<string, unknown>;
                    const raw = initialRFQ.pr_approval_id || 
                               fullRFQ.pr_approval_id || 
                               r.av_id || 
                               r.approval_id || 
                               r.approvalId ||
                               (fullRFQ.pr as unknown as Record<string, unknown>)?.pr_approval_id;
                    const num = Number(raw);
                    return Number.isFinite(num) && num > 0 ? num : undefined;
                })(),
                rfq_vendor_id: Number(initialRFQ.rfq_vendor_id || selectedVendor?.rfq_vendor_id || (selectedVendor as unknown as Record<string, unknown>)?.rfqVendorId || (selectedVendor as unknown as Record<string, unknown>)?.id) || undefined,
                rfq_no: fullRFQ.rfq_no || '',
                remark: fullRFQ.remarks || '',
                valid_until: formatDateForInputHelper(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                discount_expression: '0',
                tax_code_id: 0,
                status: 'DRAFT' as VQStatus,
                created_by_name: user?.employee?.employee_fullname || user?.username || ''
            };


            reset(rfqData as QuotationFormData);

            // 🔄 FETCH FULL VENDOR DETAILS for accurate code and name
            if (initialRFQ.vendor_id) {
                await handleSelectRFQVendor(Number(initialRFQ.vendor_id), Number(initialRFQ.rfq_vendor_id || (initialRFQ as unknown as Record<string, unknown>).id));
            }

            setIsDataLoading(false);
        }).catch((err) => {
            logger.error('[useVQForm] Failed to fetch RFQ details for initial load:', err);
            setIsDataLoading(false);
        });
      } else {
        // --- BLANK CREATE MODE ---
        reset({
          vq_no: '',
          quotation_no: '',
          quotation_date: formatDateForInputHelper(new Date()),
          currency: 'THB',
          isMulticurrency: true,
          exchange_rate_date: formatDateForInputHelper(new Date()),
          target_currency: 'THB',
          exchange_rate: 1,
          vq_lines: [],
          payment_term_days: 0,
          lead_time_days: 0,
          remark: '',
          tax_code_id: 0,
          vendor_id: 0,
          rfq_id: 0,
          valid_until: formatDateForInputHelper(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          discount_expression: '0',
          status: 'DRAFT',
          created_by_name: user?.employee?.employee_fullname || user?.username || ''
        });
        replace([]);
        setDbTotals(null);
      }
    }
  }, [isOpen, initialRFQ, vqId, reset, getValues, replace, setValue, user, handleSelectRFQVendor]);


  // Calculations
  // Optimized Watchers (React Compiler Friendly)
  const watchedLines = useWatch({ control, name: 'vq_lines' });
  const watchedGlobalDiscount = useWatch({ control, name: 'discount_expression' });
  const watchTaxCodeId = useWatch({ control, name: 'tax_code_id' });

  const calculatedTotals = useMemo(() => {
    const lines = watchedLines || [];
    const globalDiscountExpr = watchedGlobalDiscount || '0';

    // 1. Map to PricingItem with line-level discounts
    const items = lines.map(line => {
      if (line.no_quote) return { qty: 0, unit_price: 0, discount: 0 };
      const qty = Number(line.qty) || 0;
      const price = Number(line.unit_price) || 0;
      const discount = parseDiscountAmount(line.discount_expression ?? '0', qty * price);
      return {
        qty,
        unit_price: price,
        discount
      };
    });

    // 2. Sum line-level totals
    const totalGross = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
    const totalLineDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);

    // 3. Subtotal (Net before Global Discount)
    const subtotal = Math.max(0, totalGross - totalLineDiscount);

    // 4. Calculate Global Discount Amount
    const billDiscount = parseDiscountAmount(globalDiscountExpr, subtotal);

    // 5. Find Tax Rate
    const taxOption = purchaseTaxOptions.find(o => Number(o.value || 0) === Number(watchTaxCodeId || 0));
    const taxRatePercent = taxOption ? (Number(taxOption.original?.tax_rate) || 0) : 0;

    // 🎯 Detect if the tax code is Inclusive (IN) or Exclusive (EX)
    const taxCodeStr = String(taxOption?.original?.tax_code || taxOption?.label || '').toUpperCase();
    const isInclusive = taxCodeStr.includes('IN') || taxCodeStr.includes('INCLUSIVE');

    // 6. Use pricing.utils core engine for totals (Raw floats, consistency with PO)
    const summary = calculatePricingSummary(items, taxRatePercent, isInclusive, billDiscount);

    return {
      subtotal: summary.subtotal,
      totalGross,
      billDiscount, 
      preTax: summary.beforeTax,
      taxAmount: summary.taxAmount,
      grandTotal: summary.totalAmount,
      totalLineDiscount,
      taxRate: taxRatePercent
    };
  }, [watchedLines, watchedGlobalDiscount, watchTaxCodeId, purchaseTaxOptions]);


  const { formState: { dirtyFields } } = formMethods;
  
  const totals = useMemo(() => {
      const hasEdit = !!dirtyFields.vq_lines || !!dirtyFields.discount_expression || !!dirtyFields.tax_code_id;
      
      const isCalculatedEmpty = (Number(calculatedTotals.subtotal) || 0) === 0;
      const isDbPopulated = dbTotals && (Number(dbTotals.subtotal) || 0) > 0;

      // 🛡️ @Agent_Totals_Synchronizer: Use dbTotals if calculated fails or no user edit
      const useDb = (isDbPopulated && isCalculatedEmpty) || (dbTotals && !hasEdit);
      return useDb ? dbTotals : calculatedTotals;
  }, [dbTotals, dirtyFields, calculatedTotals]);
  
  // Error handler (The PR DNA: Recursive first error message extractor)
  /**
   * 🍞 @Agent_Toast_Synchronizer: Improved Error Handling with anti-spam toasts
   */
  const handleFormError = (errors: FieldErrors<QuotationFormData>) => {
    logger.error('Form Validation Errors:', errors);
    
    const extractErrorMessages = (errs: FieldErrors<QuotationFormData>): string[] => {
      let messages: string[] = [];
      Object.values(errs).forEach((error) => {
        if (!error) return;
        
        const fieldError = error as FieldError;
        if (fieldError.message && typeof fieldError.message === 'string') {
          let msg = fieldError.message;
          const lowerMsg = msg.toLowerCase();
          if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('received nan')) {
            msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
          }
          messages.push(msg);
        } else if (typeof error === 'object') {
          messages = messages.concat(extractErrorMessages(error as FieldErrors<QuotationFormData>));
        }
      });
      return Array.from(new Set(messages));
    };

    const errorMessages = extractErrorMessages(errors);
    
    if (errorMessages.length > 0) {
      const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1' },
        React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
        React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
          errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
        )
      );
      toast(React.createElement(ErrorToastUI), 'error');
    } else {
      toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
    }
  };

  // 🧹 @Agent_Payload_Purifier: Strict Sanitization
  const sanitizeLine = (line: QuotationLineFormData, index: number) => {
    const qty = Number(line.qty) || 0;
    const price = Number(line.unit_price) || 0;
    
    // Whitelist-only mapping to satisfy strict backend DTO validation
    const result: Record<string, unknown> = {
      line_no: index + 1,
      item_id: Number(line.item_id) || 0,
      qty: qty,
      unit_price: price,
      uom_id: Number(line.uom_id) || 0,
      discount_expression: line.discount_expression || '0',
      status: "OPEN", 
    };

    // Optional but strictly named IDs
    if (line.pr_line_id) result.pr_line_id = Number(line.pr_line_id);
    if (line.pr_approval_line_id) result.approval_line_id = Number(line.pr_approval_line_id);

    return result;
  };


  const sanitizePayload = (data: QuotationFormData): VQCreateData => {
    const payload: VQCreateData = {
      // 🛡️ @Agent_Ultimate_Purifier: STRICT DTO MAPPING (Header)
      ...(vqId ? { vq_no: data.vq_no } : {}), // Omit vq_no if creating to satisfy backend
      discount_expression: String(data.discount_expression || '0'), // 🎯 Keep original expression (e.g. "15%")
      quotation_no: data.quotation_no && data.quotation_no.trim() !== '' ? data.quotation_no : '-', 
      quotation_date: data.quotation_date ? new Date(data.quotation_date).toISOString() : new Date().toISOString(),
      quotation_expiry_date: data.valid_until ? new Date(data.valid_until).toISOString() : undefined,
      vendor_id: Number(data.vendor_id),
      rfq_vendor_id: Number(data.rfq_vendor_id) || undefined,
      pr_id: Number(data.pr_id) || undefined,
      rfq_id: Number(data.rfq_id) || undefined,
      pr_approval_id: Number(data.pr_approval_id) || undefined,
      lead_time_days: Number(data.lead_time_days || data.delivery_days) || 0,
      payment_term_days: Number(data.payment_term_days || (data.payment_terms ? String(data.payment_terms).replace(/\D/g, '') : 0)) || 0,
      base_currency_code: String(data.currency || "THB"),
      quote_currency_code: data.target_currency || String(data.currency || "THB"),
      exchange_rate: Number(data.exchange_rate) || 1,
      exchange_rate_date: data.exchange_rate_date ? new Date(data.exchange_rate_date).toISOString() : new Date().toISOString(),
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      // 👤 Contact Information (Removed contact_person due to backend constraints)
      contact_phone: data.contact_phone && data.contact_phone.trim() !== '' ? data.contact_phone : undefined,
      contact_email: data.contact_email && data.contact_email.trim() !== '' ? data.contact_email : undefined,

      
      // 👤 @Agent_Auth_Injector
      created_by: vqId ? (getValues('created_by') ? Number(getValues('created_by')) : undefined) : (user?.id ? Number(user.id) : undefined), 

      // 🛡️ @Agent_Ultimate_Purifier: STRICT DTO MAPPING (Lines)
      vq_lines: data.vq_lines
        .filter(l => (l.item_id && Number(l.item_id) > 0)) 
        .map((l, idx) => sanitizeLine(l, idx) as unknown as QuotationLine)
    };

    return payload;

  };

  // Handlers
  const handleSave = handleSubmit(async (data: QuotationFormData) => {
    if (isViewMode) return;
    
    // 📢 @Agent_Safe_Logger: Shallow clone for safe logging
    logger.debug('Attempting to save VQ with data:', { ...data, vq_lines: data.vq_lines.length });

    try {
      if (!data.vendor_id) {
          showAlert('กรุณาเลือกรหัสผู้ขาย');
          return;
      }


      const validLines = data.vq_lines.filter(l => (l.item_id && Number(l.item_id) > 0) || (l.item_code && l.item_code.trim() !== ""));
      if (validLines.length === 0) {
          showAlert('ต้องมีรายการสินค้าอย่างน้อย 1 รายการ');
          return;
      }

      // 🚨 REFERENTIAL INTEGRITY GUARD: Check for mandatory IDs before sending
      if (!data.rfq_vendor_id && !vqId) {
          logger.error('💥 [useVQForm] MISSING MANDATORY ID: rfq_vendor_id', { data });
          showAlert('ไม่พบ ID ผู้ขายใน RFQ (rfq_vendor_id) กรุณาติดต่อผู้ช่วยสอนเพื่อตรวจสอบข้อมูลต้นทาง');
          return;
      }
      if (!data.pr_approval_id && !vqId) {
          logger.warn('⚠️ [useVQForm] MISSING OPTIONAL-BUT-STRICT ID: pr_approval_id', { data });
          // If the backend strictly requires it (400), we should warn. 
          // But some RFQs might not have a PR. If it's mandatory, showAlert.
      }
      
      // 🧼 Sanitize Payload before sending
      const payload = sanitizePayload(data);
      
      if (vqId) {
        await VQService.update(vqId, payload as Partial<VQListItem>);
        
        onClose();
        toast(`แก้ไขใบเสนอราคาสำเร็จ`, 'success', 'บันทึกสำเร็จ');
      } else {
        await VQService.create(payload);
        
        onClose();
        toast(`บันทึกข้อมูลใบเสนอราคาสำเร็จ`, 'success', 'บันทึกสำเร็จ');
      }
      
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error: unknown) {
      // 🛡️ @Agent_Submission_Guard
      logger.error('Save VQ failed:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง';
      if (error instanceof Error && error.message.includes('circular')) {
          errorMessage = 'พบข้อผิดพลาดของข้อมูล (Circular Reference). กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ';
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
          const apiError = error as { response: { data: { message?: string } } };
          if (apiError.response?.data?.message) {
              errorMessage = apiError.response.data.message;
          }
      }

      toast(errorMessage, 'error');
    }
  }, handleFormError);

  const updateLineCalculation = (index: number) => {
    const qty = Number(getValues(`vq_lines.${index}.qty`)) || 0;
    const price = Number(getValues(`vq_lines.${index}.unit_price`)) || 0;
    const expr = getValues(`vq_lines.${index}.discount_expression`);
    const noQuote = getValues(`vq_lines.${index}.no_quote`);

    if (noQuote) {
      setValue(`vq_lines.${index}.discount_amount`, 0);
      setValue(`vq_lines.${index}.net_amount`, 0);
      return;
    }

    const base = qty * price;
    const discount = Number(parseDiscountAmount(expr, base)) || 0;
    const net = Math.max(0, base - discount);

    setValue(`vq_lines.${index}.discount_amount`, Number(discount.toFixed(2)) || 0);
    setValue(`vq_lines.${index}.net_amount`, Number(net.toFixed(2)) || 0);
  };



  const handleSelectRFQ = async (rfq: RFQHeader) => {
    // 🛑 Abort previous request if still in flight
    if (rfqAbortControllerRef.current) {
        rfqAbortControllerRef.current.abort();
    }
    rfqAbortControllerRef.current = new AbortController();
    const signal = rfqAbortControllerRef.current.signal;

    toast('กำลังดึงข้อมูลใบขอราคาสินค้า...', 'info');
    try {
      // 1. Clear Stale Vendor Data immediately
      handleClearVendor();

      // 2. Fetch concurrently using Promise.all
      const [rawRFQ, itemsRes, rfqVendorsRes, existingVQsRes] = await Promise.all([
        RFQService.getById(rfq.rfq_id, { signal }),
        MasterDataService.getItems(undefined, undefined, { signal }).catch(() => []),
        VQService.getModalWaitingForRFQVendor(rfq.rfq_id, { signal }).catch(() => ({ data: [] })),
        VQService.getVQsByRfqNo(rfq.rfq_no || '', { signal }).catch(() => ({ data: [] }))
      ]);

      const fullRFQ = rawRFQ;
      const masterItems = Array.isArray(itemsRes) ? itemsRes : [];

      const existingVendorIds = (existingVQsRes?.data || [])
          .filter((v) => v.status !== 'CANCELLED')
          .map((v) => Number(v.vendor_id));
      const allVendors = rfqVendorsRes?.data || rfqVendorsRes || [];

      // 1. Filter out only SENT/RESPONDED vendors (Exclude PENDING)
      const sentVendors = allVendors.filter((v: { status?: string }) => 
        !v.status || ['SENT', 'RESPONDED', 'DECLINED', 'NO_RESPONSE', 'RECORDED'].includes(v.status)
      );

      if (sentVendors.length === 0) {
        toast('RFQ นี้ยังไม่มีรายชื่อผู้ขายที่ส่งข้อมูลแล้ว', 'warning');
        setValue('rfq_id', 0, { shouldValidate: true });
        setValue('rfq_no', '', { shouldValidate: true });
        return false;
      }

      // 🔄 FETCH FULL VENDOR DETAILS for accurate code and name
      const vendorsWithDetails = await Promise.all(
          sentVendors.map(async (v) => {
              const vendor = v as VQPendingQueueItem;
              try {
                  const details = await VendorService.getById(vendor.vendor_id, { signal });
                  return { ...details, ...vendor }; 
              } catch {
                  return vendor; 
              }
          })
      );

      // 3. Map Vendors with all junction ID variants normalized
      const mappedVendors: AvailableVendor[] = vendorsWithDetails.map((v) => {
          const vqVendor = { ...v } as unknown as Record<string, unknown>;
          delete vqVendor.status;
          return {
              ...vqVendor,
              vendor_id: Number(v.vendor_id),
              rfq_vendor_id: Number(v.rfq_vendor_id || vqVendor.rfqVendorId || vqVendor.id),
              hasVQ: existingVendorIds.includes(Number(v.vendor_id)),
          } as AvailableVendor;
      });

      setAvailableVendors(mappedVendors);

      // 5. Normal processing (setting RFQ lines)
      const apiLines: RFQLine[] = extractLinesArray<RFQLine>(fullRFQ);

      const mappedLines: QuotationLineFormData[] = apiLines.map((line: RFQLine) => {
          const matchedItem = masterItems.find((i) => Number(i.item_id) === Number(line.item_id));
          return {
              ...createEmptyLine(),
              item_id: Number(line.item_id) || 0,
              item_code: String(line.item_code || line.itemCode || line.product_code || matchedItem?.item_code || line.item?.item_code || line.product?.product_code || ''),
          item_name: String(line.item_name || line.itemName || line.product_name || line.item?.item_name || line.product?.product_name || line.description || ''),
          qty: Number(line.qty) || 1,
          uom_id: Number(line.uom_id) || 0,
          uom_name: String(line.uom || ''), 
          unit_price: 0,
          discount_expression: '',
          discount_amount: 0,
          net_amount: 0,
          no_quote: false,
          reference_price: Number(line.est_unit_price) || 0,
          pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : 0,
          rfq_line_id: line.rfq_line_id ? Number(line.rfq_line_id) : 0,
          pr_approval_line_id: (() => {
              const l = line as unknown as Record<string, unknown>;
              const raw = l.pr_approval_line_id || l.approval_line_id || l.av_line_id || 0;
              const num = Number(raw);
              return Number.isFinite(num) ? num : 0;
          })(),
          status: 'OPEN',
          remark: String(line.description || '')
          };
      });

      // Update Header Fields
      setValue('rfq_id', Number(fullRFQ.rfq_id), { shouldValidate: true });
      setValue('rfq_no', fullRFQ.rfq_no || '', { shouldValidate: true });
      setValue('pr_id', fullRFQ.pr_id ? Number(fullRFQ.pr_id) : 0, { shouldValidate: true });
      setValue('pr_approval_id', (() => {
          const r = fullRFQ as unknown as Record<string, unknown>;
          const raw = fullRFQ.pr_approval_id || r.av_id || r.approval_id || r.approvalId || (fullRFQ.pr as unknown as Record<string, unknown>)?.pr_approval_id;
          const num = Number(raw);
          return Number.isFinite(num) && num > 0 ? num : undefined;
      })(), { shouldValidate: true });
      setValue('qc_id', 0, { shouldValidate: true });
      
      setValue('currency', fullRFQ.rfq_base_currency_code || 'THB', { shouldValidate: true });
      setValue('isMulticurrency', Boolean(fullRFQ.rfq_base_currency_code && fullRFQ.rfq_base_currency_code !== 'THB'), { shouldValidate: true });
      setValue('exchange_rate', Number(fullRFQ.rfq_exchange_rate) || 1, { shouldValidate: true });
      setValue('exchange_rate_date', formatDateForInputHelper(fullRFQ.rfq_exchange_rate_date) || formatDateForInputHelper(new Date()), { shouldValidate: true });
      setValue('target_currency', fullRFQ.rfq_quote_currency_code || '', { shouldValidate: true });
      setValue('remark', fullRFQ.remarks || '', { shouldValidate: true });
      setValue('payment_terms', fullRFQ.payment_term_hint || '', { shouldValidate: true });
      
      const parsedDays = fullRFQ.payment_term_hint ? Number(fullRFQ.payment_term_hint.replace(/\D/g, '')) : 0;
      setValue('payment_term_days', parsedDays || 0, { shouldValidate: true });

      // Inject lines
      replace(mappedLines.length > 0 ? mappedLines : []);

      // 6. Auto-Fill Vendor Logic if exactly 1
      const unvqd = mappedVendors.filter((v) => !v.hasVQ);
      if (unvqd.length === 1) {
          const singleVendor = unvqd[0];
          await handleSelectRFQVendor(singleVendor.vendor_id, singleVendor.rfq_vendor_id);
      }

      setTimeout(() => trigger('vq_lines'), 0);
      return fullRFQ.rfq_no;
    } catch (error: unknown) {
       logger.error('[useVQForm] Failed to fill from RFQ:', error);
       throw error;
    }
  };

  const handleClearRFQ = async () => {
    const isConfirmed = await confirm({
        title: 'ยืนยันการล้างค่า',
        description: 'ต้องการล้างการเชื่อมโยงกับ RFQ และรายการสินค้าใช่หรือไม่?',
        confirmText: 'ล้างค่า',
        cancelText: 'ยกเลิก',
        variant: 'danger'
    });

    if (isConfirmed) {
        // 1. Clear RFQ
        setValue('qc_id', 0, { shouldValidate: true });
        setValue('rfq_id', 0, { shouldValidate: true });
        setValue('rfq_no', '', { shouldValidate: true });
        
        // Clear local RFQ vendors state
        setAvailableVendors([]);

        // 2. Clear Vendor Info (Deep Clean)
        handleClearVendor();

        // 3. Clear Line Items
        replace([]);
    }
  };

  const handleClearVendor = () => {
    setValue('vendor_id', 0, { shouldValidate: true });
    setValue('vendor_code', '', { shouldValidate: true });
    setValue('vendor_name', '', { shouldValidate: true });
    setValue('contact_person', '', { shouldValidate: true });
    setValue('contact_phone', '', { shouldValidate: true });
    setValue('contact_email', '', { shouldValidate: true });
    setValue('payment_terms', '', { shouldValidate: true });
    setValue('payment_term_days', 0, { shouldValidate: true });
  };

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
        if (rfqAbortControllerRef.current) {
            rfqAbortControllerRef.current.abort();
        }
    };
  }, []);

  return {
    formMethods,
    fields,
    append,
    remove,
    insert,
    totals,
    handleSave,
    updateLineCalculation,
    handleSelectRFQ,
    handleClearRFQ,
    handleClearVendor,
    availableVendors,
    setAvailableVendors,
    handleSelectRFQVendor,
    vatRate: totals.taxRate,
    createEmptyLine,
    purchaseTaxOptions,
    currencyOptions,
    isMasterLoading,
    vqStatus,
    isDataLoading,
    handleFormError,
    onClose: handleCloseAttempt,
    blocker
  };
};
