/**
 * @file pricing.service.ts
 * @description Serves as a client to the Backend Pricing Engine.
 * Retrieves dynamically calculated price considering IC Option Priority, Price List, and Price Level.
 */

import api from '@core/api/api';
import { logger } from '@utils';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';

export interface PricingCalculateParams {
    itemId: string | number;
    qty: number;
    customerId: string | number;
    branchId: string | number;
    uomId?: string | number;      // global UOM ID
    itemUomId?: string | number;  // unit conversion ID (optional direct override)
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
    async calculatePrice(params: PricingCalculateParams, signal?: AbortSignal): Promise<PricingCalculateResponse | null> {
        logger.info('[PricingService] calculatePrice called with params:', params);
        if (!params.itemId || !params.customerId || !params.branchId || params.qty <= 0) {
            logger.warn('[PricingService] Missing required fields or invalid quantity:', {
                itemId: params.itemId,
                customerId: params.customerId,
                branchId: params.branchId,
                qty: params.qty
            });
            return null;
        }

        try {
            let finalUomId: string | number | undefined = params.itemUomId;

            if (!finalUomId && params.uomId) {
                try {
                    const uomConversionsResponse = await UOMConversionService.getByItemId(Number(params.itemId));
                    logger.info('[PricingService] uomConversionsResponse:', uomConversionsResponse);
                    const convs = uomConversionsResponse?.items || [];
                    const matchedConv = 
                        convs.find(c => Number(c.from_unit_id) === Number(params.uomId)) ||
                        convs.find(c => Number(c.conversion_id) === Number(params.uomId)) ||
                        convs.find(c => Number(c.to_unit_id) === Number(params.uomId) && Number(c.conversion_factor) === 1);

                    if (matchedConv) {
                        finalUomId = matchedConv.conversion_id;
                        logger.info('[PricingService] Resolved global uomId to conversion_id:', {
                            globalUomId: params.uomId,
                            conversionId: finalUomId
                        });
                    } else {
                        // Fallback to global uomId if no conversion found
                        finalUomId = params.uomId;
                        logger.info('[PricingService] No matching conversion found, falling back to global uomId:', finalUomId);
                    }
                } catch (err) {
                    logger.warn('[PricingService] Error looking up UOM conversions:', err);
                    finalUomId = params.uomId;
                }
            }

            logger.info('[PricingService] Requesting /pricing-engine/calculate with parameters:', {
                itemId: params.itemId,
                qty: params.qty,
                customerId: params.customerId,
                branchId: params.branchId,
                uomId: finalUomId,
            });

            const response = await api.get<PricingCalculateResponse>('/pricing-engine/calculate', {
                params: {
                    itemId: params.itemId,
                    qty: params.qty,
                    customerId: params.customerId,
                    branchId: params.branchId,
                    uomId: finalUomId,
                },
                signal
            });

            logger.info('[PricingService] Received response from pricing engine:', response);
            logger.info(`[PricingService] ✅ Calculated Price: ${response.unitPrice} from ${response.sourceName} (uomId passed: ${finalUomId})`);
            return response;

        } catch (err) {
            // Handle cancellation silently
            if (err instanceof Error && err.name === 'CanceledError') {
                return null;
            }
            logger.error('[PricingService] ⚠️ Calculation Failed or Not Found. Error details:', err);
            logger.warn('[PricingService] ⚠️ Calculation Failed or Not Found:', err);
            return null;
        }
    }
};
