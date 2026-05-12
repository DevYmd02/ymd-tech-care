/**
 * @file pr-hydration.ts
 * @description Centralized hydration logic for Purchase Requisition data
 */

import type { PRHeader } from '../types';
import type { VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';
import { masterDataCache } from '@/shared/utils/master-data-cache';

export interface VendorMap {
  [key: string]: {
    vendor_code: string;
    vendor_name: string;
  };
}

/**
 * Creates a vendor lookup map from a vendor list response
 */
export function createVendorMap(vendors: VendorListItem[]): VendorMap {
  const map: VendorMap = {};
  vendors.forEach((v) => {
    const id = v.vendor_id || v.id;
    if (id) {
      map[String(id)] = {
        vendor_code: v.vendor_code || '',
        vendor_name: v.vendor_name || '',
      };
    }
  });
  return map;
}

/**
 * Hydrates a single PR header with master data (vendor, branch, requester)
 */
export function hydratePRHeader<T extends PRHeader>(
  item: T,
  vendorMap?: VendorMap
): T {
  const vId = item.preferred_vendor_id || item.vendor_id;
  const vendorFromMap = vId ? vendorMap?.[String(vId)] : undefined;

  const vendorCode = vendorFromMap?.vendor_code || item.vendor_quote_no || '';
  const vendorName = vendorFromMap?.vendor_name || item.vendor_name || '';

  // Hydrate requester name if missing
  const requesterName = item.requester_name || 
                        masterDataCache.getEmployeeName(item.requester_user_id) || 
                        '';

  return {
    ...item,
    vendor_code: vendorCode,
    vendor_name: vendorName,
    branch_name: (item.branch_name || masterDataCache.getBranchName(item.branch_id) || '') as string,
    requester_name: requesterName as string,
  };
}

/**
 * Hydrates an array of PR headers
 */
export function hydratePRList<T extends PRHeader>(
  items: T[],
  vendorMap?: VendorMap
): T[] {
  return items.map((item) => hydratePRHeader(item, vendorMap));
}
