import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@core/api/api';
import { PricingService, type PricingCalculateResponse } from '../pricing.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/api.types';

// Mock API and UOMConversionService
vi.mock('@core/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@inventory/services/uom-conversion.service', () => ({
  UOMConversionService: {
    getByItemId: vi.fn(),
  },
}));

describe('PricingService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('calculatePrice Validation', () => {
    it('should return null when required fields are missing', async () => {
      const result = await PricingService.calculatePrice({
        itemId: '',
        qty: 10,
        customerId: 1,
        branchId: 1
      });
      expect(result).toBeNull();
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should return null when quantity is less than or equal to 0', async () => {
      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 0,
        customerId: 1,
        branchId: 1
      });
      expect(result).toBeNull();
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('UOM Conversion and Resolution', () => {
    it('should use itemUomId directly if provided', async () => {
      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 100,
        total: 500,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        itemUomId: 55 // Direct override
      });

      expect(UOMConversionService.getByItemId).not.toHaveBeenCalled();
      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 55 })
      }));
      expect(result).not.toBeNull();
    });

    it('should resolve global uomId matching from_unit_id', async () => {
      vi.mocked(UOMConversionService.getByItemId).mockResolvedValue({
        items: [
          { conversion_id: 123, from_unit_id: 10, to_unit_id: 1, conversion_factor: 12 }
        ] as unknown as UOMConversionListItem[],
        total: 1
      } as unknown as ListResponse<UOMConversionListItem>);

      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 150,
        total: 750,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        uomId: 10
      });

      expect(UOMConversionService.getByItemId).toHaveBeenCalledWith(101);
      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 123 })
      }));
      expect(result?.unitPrice).toBe(150);
    });

    it('should resolve global uomId matching conversion_id', async () => {
      vi.mocked(UOMConversionService.getByItemId).mockResolvedValue({
        items: [
          { conversion_id: 123, from_unit_id: 10, to_unit_id: 1, conversion_factor: 12 }
        ] as unknown as UOMConversionListItem[],
        total: 1
      } as unknown as ListResponse<UOMConversionListItem>);

      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 150,
        total: 750,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        uomId: 123
      });

      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 123 })
      }));
      expect(result).not.toBeNull();
    });

    it('should resolve global uomId matching to_unit_id with factor 1', async () => {
      vi.mocked(UOMConversionService.getByItemId).mockResolvedValue({
        items: [
          { conversion_id: 124, from_unit_id: 10, to_unit_id: 2, conversion_factor: 1 }
        ] as unknown as UOMConversionListItem[],
        total: 1
      } as unknown as ListResponse<UOMConversionListItem>);

      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 150,
        total: 750,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        uomId: 2
      });

      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 124 })
      }));
      expect(result).not.toBeNull();
    });

    it('should fallback to global uomId when no match is found in conversions', async () => {
      vi.mocked(UOMConversionService.getByItemId).mockResolvedValue({
        items: [] as unknown as UOMConversionListItem[],
        total: 0
      } as unknown as ListResponse<UOMConversionListItem>);

      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 150,
        total: 750,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        uomId: 99
      });

      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 99 })
      }));
      expect(result).not.toBeNull();
    });

    it('should fallback to global uomId when lookup throws error', async () => {
      vi.mocked(UOMConversionService.getByItemId).mockRejectedValue(new Error('Network error'));

      vi.mocked(api.get).mockResolvedValue({
        itemId: '101',
        qty: 5,
        unitPrice: 150,
        total: 750,
        source: 1,
        sourceName: 'PRICE_LIST',
        priority: 1
      } as unknown as PricingCalculateResponse);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1,
        uomId: 99
      });

      expect(api.get).toHaveBeenCalledWith('/pricing-engine/calculate', expect.objectContaining({
        params: expect.objectContaining({ uomId: 99 })
      }));
      expect(result).not.toBeNull();
    });
  });

  describe('Error and Cancellation Handling', () => {
    it('should return null and handle general API errors gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Bad Request'));

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1
      });

      expect(result).toBeNull();
    });

    it('should return null silently on CanceledError', async () => {
      const canceledError = new Error('Canceled');
      canceledError.name = 'CanceledError';
      vi.mocked(api.get).mockRejectedValue(canceledError);

      const result = await PricingService.calculatePrice({
        itemId: 101,
        qty: 5,
        customerId: 1,
        branchId: 1
      });

      expect(result).toBeNull();
    });
  });
});
