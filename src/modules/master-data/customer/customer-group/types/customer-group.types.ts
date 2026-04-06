/**
 * @file customer-group.types.ts
 * @description Types for Customer Group Master Data
 */

export interface CustomerGroup {
  customer_group_id: string | number;
  customer_group_code: string;
  customer_group_name: string;
  customer_group_nameeng?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerGroupFormData {
  customer_group_code: string;
  customer_group_name: string;
  customer_group_nameeng: string;
  is_active: boolean;
}

export const initialCustomerGroupFormData: CustomerGroupFormData = {
  customer_group_code: '',
  customer_group_name: '',
  customer_group_nameeng: '',
  is_active: true,
};
