import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { logger } from '@/shared/utils';
import type { PRLine } from '@/modules/procurement/types/pr-types';
import type { ItemListItem, UOMListItem, WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import type { VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { MappedOption } from './usePRMasterData';

// Helper to sanitize ISO strings to YYYY-MM-DD
const sanitizeDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr.split('T')[0];
  return dateStr;
};

interface UsePRHydrationProps {
  id?: number;
  isOpen: boolean;
  isMasterDataLoading: boolean;
  warehouses: MappedOption<WarehouseListItem>[];
  masterItems: ItemListItem[];
  masterUnits: UOMListItem[];
  onDataLoaded: (data: Partial<PRFormData>) => void;
}

/**
 * usePRHydration — Specialized hook to handle PR data loading & mapping.
 * Optimized with TanStack Query for reliability and caching.
 */
export const usePRHydration = ({ 
  id, 
  isOpen, 
  isMasterDataLoading, 
  warehouses, 
  masterItems, 
  masterUnits, 
  onDataLoaded 
}: UsePRHydrationProps) => {

  const { data: hydratedData, isLoading, isError } = useQuery({
    queryKey: ['pr-hydration', id],
    queryFn: async ({ signal }) => {
      if (!id) return null;
      
      logger.info(`[usePRHydration] Fetching data for PR ID: ${id}`);
      const pr = await PRService.getDetail(id, { signal });
      
      if (!pr) return null;

      // 1. Fetch locations for warehouses used in lines
      const uniqueWhIds = Array.from(new Set((pr.lines || []).map(l => l.warehouse_id).filter(Boolean)));
      const locationMaps = await Promise.all(
        uniqueWhIds.map(async (whId) => {
          try {
            const res = await LocationService.getAll({ warehouse_id: Number(whId) }, { signal });
            return { whId: Number(whId), items: res?.items || [] };
          } catch (err) {
            logger.error(`[usePRHydration] Failed to fetch locations for warehouse ${whId}:`, err);
            return { whId: Number(whId), items: [] };
          }
        })
      );

      const locationLookup: Record<number, string> = {};
      locationMaps.forEach(map => {
        map.items?.forEach(item => {
          locationLookup[item.location_id] = item.code || item.name_th;
        });
      });

      // 2. Map Lines
      const mappedLines: PRLineFormData[] = (pr.lines || []).map((line: PRLine) => {
        const matchedItem = masterItems?.find(i => String(i.item_id) === String(line.item_id));
        const matchedUnit = masterUnits?.find(u => String(u.uom_id || u.uom_id) === String(line.uom_id));
        const lineWhId = line.warehouse_id || pr.warehouse_id || 1;
        const matchedWh = warehouses.find(w => String(w.value) === String(lineWhId));
        const locName = locationLookup[Number(line.location)] || line.location_name || line.location || '';

        return {
          pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : undefined,
          item_id: line.item_id ? Number(line.item_id) : undefined,
          item_code: matchedItem?.item_code || line.item_code || '',
          item_name: matchedItem?.item_name || line.item_name || '',
          description: line.description || line.item_name || matchedItem?.item_name || '',
          qty: Number(line.qty) || 0,
          uom: matchedUnit?.uom_name || matchedUnit?.uom_name || line.uom || '',
          uom_id: line.uom_id ? Number(line.uom_id) : undefined,
          est_unit_price: Number(line.est_unit_price) || 0,
          est_amount: (Number(line.qty) || 0) * (Number(line.est_unit_price) || 0),
          needed_date: sanitizeDate(line.needed_date),
          preferred_vendor_id: line.preferred_vendor_id ? Number(line.preferred_vendor_id) : undefined,
          remark: line.remark || '',
          warehouse_id: Number(lineWhId), 
          warehouse_code: matchedWh?.original?.warehouse_code || '',
          location: line.location || '',
          _base_uom_name: matchedItem?.uom_name || matchedItem?.uom_name || '',
          _base_uom_id: matchedItem?.uom_id || matchedItem?.uom_id ? Number(matchedItem.uom_id || matchedItem.uom_id) : undefined,
          _purchasing_uom_name: matchedItem?.purchasing_unit_name || '',
          _purchasing_uom_id: matchedItem?.purchasing_unit_id ? Number(matchedItem.purchasing_unit_id) : undefined,
          location_name: locName, 
          discount: (() => {
            const gross = (Number(line.qty) || 0) * (Number(line.est_unit_price) || 0);
            const raw = line.line_discount_raw || '';
            if (!raw) return 0;
            if (raw.endsWith('%')) {
              const pct = parseFloat(raw.replace('%', ''));
              return isNaN(pct) ? 0 : gross * (pct / 100);
            }
            return parseFloat(raw) || 0;
          })(),
          line_discount_raw: line.line_discount_raw || ''
        };
      });

      // 3. Handle Vendor Fallback
      let vendorName = pr.vendor_name || pr.suggested_vendor || '';
      const vendorId = pr.preferred_vendor_id ?? pr.vendor_id;
      
      if (!vendorName && vendorId) {
        try {
          const vendorListRes = await VendorService.getList({ signal });
          const vendorItems = vendorListRes.items || [];
          const matched = vendorItems.find((v: VendorListItem) => Number(v.vendor_id || v.id) === Number(vendorId));
          if (matched?.vendor_name) vendorName = matched.vendor_name;
        } catch (err) {
          logger.error('[usePRHydration] Vendor lookup failed:', err);
        }
      }

      // 4. Final Form Data
      return {
        ...pr,
        version: pr.version ?? 1,
        pr_no: pr.pr_no || 'DRAFT-TEMP',
        cost_center_id: pr.cost_center_id ?? pr.department_id ? Number(pr.cost_center_id ?? pr.department_id) : undefined,
        project_id: pr.project_id ? Number(pr.project_id) : undefined,
        purpose: (pr.purpose || pr.remark || '').trim(),
        pr_date: sanitizeDate(pr.pr_date),
        need_by_date: sanitizeDate(pr.need_by_date),
        preferred_vendor_id: vendorId ? Number(vendorId) : undefined,
        vendor_name: vendorName,
        requester_user_id: pr.requester_user_id ? Number(pr.requester_user_id) : 1,
        preparer_name: pr.requester_name || pr.employee_name || '',
        requester_name: pr.requester_name || pr.employee_name || '',
        pr_base_currency_code: pr.pr_base_currency_code || 'THB',
        pr_quote_currency_code: pr.pr_quote_currency_code || 'THB',
        isMulticurrency: (pr.pr_base_currency_code || 'THB') !== 'THB',
        pr_exchange_rate: pr.pr_exchange_rate || 1,
        pr_exchange_rate_date: sanitizeDate(pr.pr_exchange_rate_date || pr.pr_date || ''),
        lines: mappedLines,
        pr_tax_code_id: pr.pr_tax_code_id ? Number(pr.pr_tax_code_id) : undefined,
        delivery_date: sanitizeDate(pr.delivery_date || pr.need_by_date || pr.pr_date || ''),
        total_amount: Number(pr.total_amount || 0),
      } as Partial<PRFormData>;
    },
    enabled: isOpen && !!id && !isMasterDataLoading && warehouses.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Sync with form via onDataLoaded callback when query completes
  useEffect(() => {
    if (hydratedData) {
      onDataLoaded(hydratedData);
    }
  }, [hydratedData, onDataLoaded]);

  return { isLoading, isError };
};
