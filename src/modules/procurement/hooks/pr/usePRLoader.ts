/**
 * @file usePRLoader.ts
 * @description P3-FIX: Extracted from usePRForm.ts — responsible for initial form population:
 *   - Edit mode:  fetch PR details via PRService.getDetail(id)
 *   - Create mode: generate a new document number via PRService.generateNextDocumentNo()
 *
 * This hook fires only when the modal transitions from closed → open, then calls
 * the provided `onLoaded(formData)` callback so usePRForm can reset its RHF state.
 */
import { useEffect, useRef } from 'react';
import type { UseFormReset } from 'react-hook-form';
import { PRService } from '@/modules/procurement/services/pr.service';
import { logger } from '@/shared/utils/logger';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import type { PRLine } from '@/modules/procurement/types/pr-types';
import type { PRFormData } from '@/modules/procurement/types/pr-types';
import type { UserProfile } from '@/core/auth/auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers (collocated — only used here)
// ─────────────────────────────────────────────────────────────────────────────

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const getNextWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

const MIN_LINES = 1;

interface ExtendedLineLocal {
  item_id: string;
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  uom: string;
  uom_id: string;
  est_unit_price: number;
  est_amount: number;
  needed_date: string;
  preferred_vendor_id?: string;
  remark?: string;
  warehouse_id?: string;
  location?: string;
  discount: number;
  line_discount_raw: string;
  _standard_cost?: number;
  _item_vendor_id?: string;
}

const createEmptyLine = (): ExtendedLineLocal => ({
  item_id: '', item_code: '', item_name: '', description: '',
  qty: 0, uom: '', uom_id: '',
  est_unit_price: 0, est_amount: 0,
  needed_date: getTodayDate(),
  preferred_vendor_id: undefined, remark: '',
  warehouse_id: '', location: '', discount: 0, line_discount_raw: '',
});

export const getDefaultFormValues = (user: UserProfile | null): PRFormData => ({
  preparer_name: user?.employee?.employee_fullname || user?.username || '',
  requester_name: user?.employee?.employee_fullname || user?.username || '',
  pr_no: '',
  pr_date: getTodayDate(),
  need_by_date: '',
  cost_center_id: '',
  project_id: undefined,
  purpose: '',
  pr_base_currency_code: 'THB',
  pr_quote_currency_code: '',
  lines: Array(5).fill(null).map(() => createEmptyLine()),
  total_amount: 0,
  is_on_hold: 'N',
  delivery_date: getNextWeekDate(),
  credit_days: 30,
  vendor_quote_no: '',
  shipping_method: '',
  remark: '',
  isMulticurrency: false,
  pr_exchange_rate: 1,
  pr_exchange_rate_date: new Date().toISOString().split('T')[0],
  cancelflag: 'N',
  status: 'DRAFT',
  pr_discount_raw: '',
  pr_tax_code_id: '',
  pr_tax_rate: 7,
  requester_user_id: String(user?.id || '1'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Hook Props & Return
// ─────────────────────────────────────────────────────────────────────────────

interface UsePRLoaderProps {
  isOpen: boolean;
  id: string | undefined;
  user: UserProfile | null;
  reset: UseFormReset<PRFormData>;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Fires once each time the modal opens.
 * Calls `reset()` on the parent form after data is loaded.
 * Manages its own open-tracking ref to avoid duplicate loads.
 */
export const usePRLoader = ({
  isOpen,
  id,
  user,
  reset,
  setIsLoading,
}: UsePRLoaderProps): void => {
  const loadedIdRef = useRef<string | null>(null);
  const loadedForCreateRef = useRef(false);

  useEffect(() => {
    // 1. Reset guards when closed
    if (!isOpen) {
      loadedIdRef.current = null;
      loadedForCreateRef.current = false;
      return;
    }

    // 2. Prevent duplicate fetches for the same session
    if (id) {
      if (loadedIdRef.current === id) return;
      loadedIdRef.current = id;
    } else {
      if (loadedForCreateRef.current) return;
      loadedForCreateRef.current = true;
    }

    // 3. Immediately invoke async fetch
    // (The async microtask queue naturally defers `reset()` until RHF is ready)
    let isMounted = true;

    const loadData = async () => {
      if (id) {
        // ── Edit mode: fetch existing PR ────────────────────────────────────
        try {
          setIsLoading(true);
          logger.info(`[usePRLoader] Fetching Detail for ID: ${id}`);
          const pr = await PRService.getDetail(id);
          
          if (!isMounted) return; // Prevent state update if unmounted

          if (pr) {
            logger.info(`[usePRLoader] Fetched PR Payload:`, pr);
            const mappedLines: ExtendedLineLocal[] = (pr.lines || []).map((line: PRLine & { product_code?: string; product_name?: string; item?: { item_code?: string; item_name?: string } }) => {
              const gross = (line.qty || 0) * (line.est_unit_price || 0);
              return {
                item_id: line.item_id || '',
                item_code: line.item_code || line.product_code || line.item?.item_code || '',
                item_name: line.item_name || line.product_name || line.description || line.item?.item_name || '',
                description: line.description || line.product_name || line.item_name || '',
                qty: line.qty,
                uom: line.uom,
                uom_id: line.uom_id,
                est_unit_price: line.est_unit_price,
                est_amount: line.est_amount,
                needed_date: line.needed_date,
                preferred_vendor_id: line.preferred_vendor_id,
                remark: line.remark,
                warehouse_id: pr.warehouse_id || '1',
                location: line.location || '',
                discount: parseDiscountAmount(line.line_discount_raw, gross),
                line_discount_raw: line.line_discount_raw || '',
              };
            });

            while (mappedLines.length < MIN_LINES) {
              mappedLines.push(createEmptyLine());
            }

            const formData: PRFormData = {
              ...pr,
              pr_no: pr.pr_no || 'DRAFT-TEMP',
              ...(pr.project_id !== undefined && { project_id: pr.project_id || undefined }),
              preparer_name: pr.requester_name,
              requester_name: pr.requester_name,
              pr_base_currency_code: pr.pr_base_currency_code || 'THB',
              pr_quote_currency_code: pr.pr_quote_currency_code || '',
              isMulticurrency: (pr.pr_base_currency_code || 'THB') !== 'THB',
              pr_exchange_rate: pr.pr_exchange_rate || 1,
              lines: mappedLines,
              is_on_hold: pr.status === 'DRAFT' ? 'Y' : 'N',
              pr_tax_code_id: pr.pr_tax_code_id || '1',
              pr_discount_raw: pr.pr_discount_raw || '',
              remark: pr.remark || '',
              shipping_method: pr.shipping_method || '',
            };

            logger.info(`[usePRLoader] Calling reset() with:`, formData);
            reset(formData);
          }
        } catch (error) {
          logger.error('[usePRLoader] Failed to fetch PR details:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        // ── Create mode: generate next PR number ────────────────────────────
        try {
          const nextPRNo = await PRService.generateNextDocumentNo();
          if (isMounted) {
            reset({ ...getDefaultFormValues(user), pr_no: nextPRNo.document_no });
          }
        } catch (err) {
          logger.error('[usePRLoader] Failed to generate PR No — using fallback:', err);
          if (isMounted) {
            reset({ ...getDefaultFormValues(user), pr_no: 'DRAFT-TEMP' });
          }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      // Also reset tracking ref if unmounted so Strict Mode remount can fetch again
      if (id) {
        loadedIdRef.current = null;
      } else {
        loadedForCreateRef.current = false;
      }
    };
  }, [isOpen, id, reset, user, setIsLoading]);
};
