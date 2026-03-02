import { useState, useMemo } from 'react';
import type { RFQLine, VQListItem } from '@/modules/procurement/types';

export interface MatrixVendorCell {
  unit_price: number;
  total_price: number;
  is_no_quote: boolean;
  is_winner: boolean;
}

export interface MatrixRow {
  item_code: string;
  description: string;
  qty: number;
  unit: string;
  vendors: Record<string, MatrixVendorCell>; // vq_id is the key
}

export interface VendorTotal {
  vq_id: string;
  vendor_name: string;
  grand_total: number;
  winning_total: number;
  is_all_won: boolean;
}

export function useQCMatrix(rfqLines: RFQLine[], selectedVQs: VQListItem[]) {
  // winningMap: { [item_code]: vq_id }
  const [winningMap, setWinningMap] = useState<Record<string, string>>({});

  const matrixData = useMemo(() => {
    return rfqLines.map(rfqLine => {
      const row: MatrixRow = {
        item_code: rfqLine.item_code,
        description: rfqLine.item_name,
        qty: rfqLine.required_qty,
        unit: rfqLine.uom,
        vendors: {}
      };

      selectedVQs.forEach(vq => {
        const vqLine = vq.lines?.find(l => l.item_code === rfqLine.item_code);
        row.vendors[vq.quotation_id] = {
          unit_price: vqLine?.unit_price || 0,
          total_price: vqLine?.net_amount || 0,
          is_no_quote: !!vqLine?.no_quote || (!vqLine),
          is_winner: winningMap[rfqLine.item_code] === vq.quotation_id
        };
      });

      return row;
    });
  }, [rfqLines, selectedVQs, winningMap]);

  const vendorTotals = useMemo(() => {
    return selectedVQs.map(vq => {
      let grand_total = 0;
      let winning_total = 0;
      let won_items_count = 0;
      let total_biddable_items = 0;

      rfqLines.forEach(rfqLine => {
        const vqLine = vq.lines?.find(l => l.item_code === rfqLine.item_code);
        if (vqLine && !vqLine.no_quote) {
           total_biddable_items++;
           grand_total += vqLine.net_amount || 0;
           if (winningMap[rfqLine.item_code] === vq.quotation_id) {
             winning_total += vqLine.net_amount || 0;
             won_items_count++;
           }
        }
      });

      return {
        vq_id: vq.quotation_id,
        vendor_name: vq.vendor_name || 'Unknown',
        grand_total,
        winning_total,
        is_all_won: total_biddable_items > 0 && won_items_count === total_biddable_items
      };
    });
  }, [rfqLines, selectedVQs, winningMap]);

  const selectWinner = (item_code: string, vq_id: string) => {
    setWinningMap(prev => {
        const currentWinner = prev[item_code];
        const newMap = { ...prev };
        if (currentWinner === vq_id) {
            delete newMap[item_code]; // Toggle off
        } else {
            newMap[item_code] = vq_id;
        }
        return newMap;
    });
  };

  const selectAllForVendor = (vq_id: string) => {
    setWinningMap(prev => {
        const newWinningMap = { ...prev };
        let anyChanged = false;

        const vq = selectedVQs.find(v => v.quotation_id === vq_id);
        if (!vq) return prev;

        rfqLines.forEach(rfqLine => {
          const vqLine = vq.lines?.find(l => l.item_code === rfqLine.item_code);
          if (vqLine && !vqLine.no_quote) {
            if (newWinningMap[rfqLine.item_code] !== vq_id) {
               newWinningMap[rfqLine.item_code] = vq_id;
               anyChanged = true;
            }
          }
        });

        // Toggle all off if all were already selected
        if (!anyChanged) {
            rfqLines.forEach(rfqLine => {
                 if (newWinningMap[rfqLine.item_code] === vq_id) {
                     delete newWinningMap[rfqLine.item_code];
                 }
            });
        }

        return newWinningMap;
    });
  };

  return {
    matrixData,
    vendorTotals,
    winningMap,
    selectWinner,
    selectAllForVendor
  };
}
