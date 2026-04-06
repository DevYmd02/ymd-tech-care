/**
 * @file customer-type.types.ts
 * @description Types for Customer Type Master Data
 */

export interface CustomerType {
  customer_type_id: string; // UUID
  customer_type_code: string;
  customer_type_name: string; // TH
  customer_type_nameeng: string; // EN
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerTypeFormData {
  customer_type_code: string;
  customer_type_name: string;
  customer_type_nameeng: string;
  is_active: boolean;
}

export const initialCustomerTypeFormData: CustomerTypeFormData = {
  customer_type_code: '',
  customer_type_name: '',
  customer_type_nameeng: '',
  is_active: true,
};
