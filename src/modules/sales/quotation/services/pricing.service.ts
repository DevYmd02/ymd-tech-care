/**
 * @file pricing.service.ts
 * @description Serves as a client to the Backend Pricing Engine.
 * Retrieves dynamically calculated price considering IC Option Priority, Price List, and Price Level.
 */

import api from '@core/api/api';
import { logger } from '@utils';

export interface PricingCalculateParams {
    itemId: string | number;
    qty: number;
    customerId: string | number;
    branchId: string | number;
}

export interface PricingCalculateResponse {
    itemId: string;
    qty: number;
    unitPrice: number;
    total: number;
    source: number;
    sourceName: string; // e.g. "PRICE_LIST", "PRICE_LEVEL", "MANUAL"
    priority: number;
}

export const PricingService = {
    /**
     * Hit the Unified Backend Pricing Engine.
     */
    async calculatePrice(params: PricingCalculateParams): Promise<PricingCalculateResponse | null> {
        if (!params.itemId || !params.customerId || !params.branchId || params.qty <= 0) {
            return null;
        }

        try {
            const response = await api.get<PricingCalculateResponse>('/pricing-engine/calculate', {
                params: {
                    itemId: params.itemId,
                    qty: params.qty,
                    customerId: params.customerId,
                    branchId: params.branchId,
                }
            });

            logger.info(`[PricingService] ✅ Calculated Price: ${response.unitPrice} from ${response.sourceName}`);
            return response;

        } catch (err) {
            logger.warn('[PricingService] ⚠️ Calculation Failed or Not Found:', err);
            return null;
        }
    }
};
