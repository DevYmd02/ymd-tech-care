import { useState, useMemo, useCallback } from 'react';
import type { RFQLine, VQListItem, QuotationLine } from '@/modules/procurement/types';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';

export interface MatrixVendorCell {
  unit_price: number;
  total_price: number;
  is_no_quote: boolean;
  is_winner: boolean;
}

export interface MatrixRow {
  item_id: string; // The linking key (item_code)
  code: string;
  description: string;
  qty: number;
  unit: string;
  vendors: Record<number, MatrixVendorCell>; // vq_id is the key
}

export interface VendorTotal {
  vq_id: number;
  vendor_name: string;
  grand_total: number;
  winning_total: number;
  is_all_won: boolean;
}

export function useQCMatrix(
  rfqLines: RFQLine[], 
  selectedVQs: VQListItem[],
  productMappings: Record<string, ProductLookup> = {}
) {
  // winningMap: { [item_code]: vq_id }
  const [winningMap, setWinningMap] = useState<Record<string, number>>({});

  // Phase 2: Matrix Transformation Engine
  const matrixData = useMemo((): MatrixRow[] => {
    return rfqLines.map(rfqLine => {
      const mappedProduct = productMappings[rfqLine.item_code];
      const row: MatrixRow = {
        item_id: mappedProduct?.item_code || rfqLine.item_code, // Using code as linking ID
        code: mappedProduct?.item_code || rfqLine.item_code,
        description: mappedProduct?.item_name || rfqLine.item_name,
        qty: rfqLine.qty,
        unit: mappedProduct?.unit || rfqLine.uom,
        vendors: {}
      };

      selectedVQs.forEach(vq => {
        const vqLine = vq.vq_lines?.find(l => l.item_code === rfqLine.item_code);
        row.vendors[(vq.quotation_id || vq.vq_header_id) as number] = {
          unit_price: vqLine?.unit_price || 0,
          total_price: vqLine?.net_amount || 0,
          is_no_quote: !!vqLine?.no_quote || (!vqLine),
          is_winner: rfqLine.item_code ? winningMap[rfqLine.item_code] === (vq.quotation_id || vq.vq_header_id) : false
        };
      });

      return row;
    });
  }, [rfqLines, selectedVQs, winningMap, productMappings]);

  // Phase 3: State Management & Interactivity
  const handleSelectWinner = useCallback((item_id: string, vq_id: number) => {
    setWinningMap(prev => {
        const currentWinner = prev[item_id];
        const newMap = { ...prev };
        if (currentWinner === vq_id) {
            delete newMap[item_id]; // Toggle off
        } else {
            newMap[item_id] = vq_id; // Overwrites any existing winner for this item (Radio behavior)
        }
        return newMap;
    });
  }, []);

  const handleSelectAllForVendor = useCallback((vq_id: number) => {
    setWinningMap(prev => {
        const newWinningMap = { ...prev };
        let anyChanged = false;

        const vq = selectedVQs.find(v => (v.quotation_id || v.vq_header_id) === vq_id);
        if (!vq) return prev;

        rfqLines.forEach(rfqLine => {
          const vqLine = vq.vq_lines?.find(l => l.item_code === rfqLine.item_code);
          // Rule: mark as winner UNLESS the item has is_no_quote === true
          if (vqLine && !vqLine.no_quote) {
            if (newWinningMap[rfqLine.item_code] !== vq_id) {
               newWinningMap[rfqLine.item_code] = vq_id;
               anyChanged = true;
            }
          }
        });

        // Toggle all off if all were already selected for this vendor
        if (!anyChanged) {
            rfqLines.forEach(rfqLine => {
                 if (newWinningMap[rfqLine.item_code] === vq_id) {
                     delete newWinningMap[rfqLine.item_code];
                 }
            });
        }

        return newWinningMap;
    });
  }, [rfqLines, selectedVQs]);

  // Phase 4: Real-time Calculators
  const getVendorGrandTotal = useCallback((vq_id: number) => {
    const vq = selectedVQs.find(v => (v.quotation_id || v.vq_header_id) === vq_id);
    if (!vq) return 0;
    return rfqLines.reduce((sum, rfqLine) => {
       const vqLine = vq.vq_lines?.find(l => l.item_code === rfqLine.item_code);
       if (vqLine && !vqLine.no_quote) {
          return sum + (vqLine.net_amount || 0);
       }
       return sum;
    }, 0);
  }, [rfqLines, selectedVQs]);

  const getWinningTotal = useCallback(() => {
    let total = 0;
    rfqLines.forEach(rfqLine => {
        const vq_id = rfqLine.item_code ? winningMap[rfqLine.item_code] : undefined;
        if (vq_id) {
            const vq = selectedVQs.find(v => (v.quotation_id || v.vq_header_id) === vq_id);
            const vqLine = vq?.vq_lines?.find((l: QuotationLine) => l.item_code === rfqLine.item_code);
            if (vqLine && !vqLine.no_quote) {
                total += (vqLine.net_amount || 0);
            }
        }
    });
    return total;
  }, [rfqLines, selectedVQs, winningMap]);

  // Combined Vendor Totals for UI rendering
  const vendorTotals = useMemo(() => {
    return selectedVQs.map(vq => {
      let winning_total = 0;
      let won_items_count = 0;
      let total_biddable_items = 0;

      rfqLines.forEach(rfqLine => {
        const vqLine = vq.vq_lines?.find(l => l.item_code === rfqLine.item_code);
        if (vqLine && !vqLine.no_quote) {
           total_biddable_items++;
           if (winningMap[rfqLine.item_code] === (vq.quotation_id || vq.vq_header_id)) {
             winning_total += vqLine.net_amount || 0;
             won_items_count++;
           }
        }
      });

      return {
        vq_id: (vq.quotation_id || vq.vq_header_id) as number,
        vendor_name: vq.vendor_name || 'Unknown',
        grand_total: vq.vq_header_id || vq.quotation_id ? getVendorGrandTotal((vq.vq_header_id || vq.quotation_id) as number) : 0,
        winning_total,
        is_all_won: total_biddable_items > 0 && won_items_count === total_biddable_items
      };
    });
  }, [rfqLines, selectedVQs, winningMap, getVendorGrandTotal]);

  return {
    matrixData,
    vendorTotals,
    winningMap,
    handleSelectWinner,
    handleSelectAllForVendor,
    getVendorGrandTotal,
    getWinningTotal
  };
}
