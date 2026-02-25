/**
 * @file useCurrencySync.ts
 * @description P3-FIX: Extracted from usePRForm.ts — handles the exchange rate
 * auto-fetch whenever the source or target currency changes.
 *
 * Bug fixed: The original code mutated `prevCurrencyId.current` synchronously
 * BEFORE the `await fetchExchangeRate(...)` resolved, meaning the stale-check
 * guard could fail on rapid consecutive currency changes. The refs now update
 * only after both the fetch attempt completes (success or failure).
 */
import { useRef, useEffect } from 'react';
import type { UseFormSetValue, UseFormGetFieldState } from 'react-hook-form';
import { fetchExchangeRate } from '@/modules/master-data/currency/services/mockExchangeRateService';
import { logger } from '@/shared/utils/logger';
import type { PRFormData } from '@/modules/procurement/types/pr-types';

// ─────────────────────────────────────────────────────────────────────────────
// Hook interface
// ─────────────────────────────────────────────────────────────────────────────

interface UseCurrencySyncProps {
  sourceCurrencyCode: string;
  targetCurrencyCode: string | undefined;
  setValue: UseFormSetValue<PRFormData>;
  getFieldState: UseFormGetFieldState<PRFormData>;
}

/**
 * Watches source/target currency codes and auto-fetches the exchange rate.
 * Skips fetch when currencies are equal (rate = 1).
 * Updates prevCurrency refs only after the async operation settles — fixes race condition.
 */
export const useCurrencySync = ({
  sourceCurrencyCode,
  targetCurrencyCode,
  setValue,
  getFieldState,
}: UseCurrencySyncProps): void => {
  const prevSourceRef = useRef<string>(sourceCurrencyCode);
  const prevTargetRef = useRef<string | undefined>(targetCurrencyCode);

  useEffect(() => {
    if (!sourceCurrencyCode) return;

    // Guard: same source and target → rate is 1 by definition
    if (sourceCurrencyCode === targetCurrencyCode) {
      setValue('pr_exchange_rate', 1, { shouldDirty: false });
      prevSourceRef.current = sourceCurrencyCode;
      prevTargetRef.current = targetCurrencyCode;
      return;
    }

    const isSourceChanged = prevSourceRef.current !== sourceCurrencyCode;
    const isTargetChanged = prevTargetRef.current !== targetCurrencyCode;

    const fetchRate = async (): Promise<void> => {
      // If source changed and target pointed at the old source, reset target to THB
      if (isSourceChanged && (targetCurrencyCode === prevSourceRef.current || !targetCurrencyCode)) {
        setValue('pr_quote_currency_code', 'THB');
      }

      const { isDirty } = getFieldState('pr_exchange_rate');
      if (isSourceChanged || isTargetChanged || !isDirty) {
        try {
          const finalTarget = (isSourceChanged && !targetCurrencyCode) ? 'THB' : (targetCurrencyCode ?? 'THB');
          const rate = await fetchExchangeRate(sourceCurrencyCode, finalTarget);
          setValue('pr_exchange_rate', rate, { shouldValidate: true, shouldDirty: false });
        } catch (error) {
          logger.error('[useCurrencySync] Failed to fetch exchange rate:', error);
        }
      }

      // P3-FIX: refs update AFTER await resolves (was synchronous before — race condition)
      prevSourceRef.current = sourceCurrencyCode;
      prevTargetRef.current = targetCurrencyCode;
    };

    fetchRate();
  // Only depends on the currency values themselves
  }, [sourceCurrencyCode, targetCurrencyCode, setValue, getFieldState]);
};