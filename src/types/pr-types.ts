/**
 * @file pr-types.ts
 * @description Types สำหรับ Purchase Requisition Module
 * @usage import { PRItem, PRFormValues, PRListItem, PRDetail } from '@/types/pr-types';
 */

// ====================================================================================
// PR ITEM
// ====================================================================================

/** รายการสินค้าใน PR */
export interface PRItem {
  item_code: string;
  item_name: string;
  warehouse: string;
  location: string;
  unit: string;
  qty: number | null;
  price: number | null;
  discount: number | null;
}

// ====================================================================================
// PR LIST & DETAIL
// ====================================================================================

/** รายการ PR สำหรับแสดงใน list */
export interface PRListItem {
  id: number;
  doc_no: string;
  date: string;
  requester: string;
  department: string;
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  totalAmount: number;
}

/** รายละเอียด PR ฉบับเต็ม */
export interface PRDetail {
  id: number;
  doc_no: string;
  doc_date: string;
  vendor_code: string;
  vendor_name: string;
  items: PRItem[];
  totalAmount: number;
  status: string;
}

export interface PRFormValues {
  doc_no: string;
  doc_date: string;
  vendor_code: string;
  vendor_name: string;
  contact_name: string;
  due_days: number;
  is_hold: boolean;
  remarks: string;
  vat_rate: number;
  discount_amount: number;
  items: PRItem[];

  // PRInfoBar fields
  delivery_date: string;
  credit_days: number;
  vendor_quote_no: string;
  shipping_method: string;
  requester_name: string;
}