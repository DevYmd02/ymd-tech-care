/**
 * @file billing-group.types.ts
 * @description Types for Customer Billing Group Master Data
 */

export interface CustomerBillingGroup {
  bill_group_id: string | number;
  bill_group_code: string;
  bill_group_name: string;
  bill_group_nameeng?: string;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BillingGroupFormData {
  bill_group_code: string;
  bill_group_name: string;
  bill_group_nameeng: string;
  remark: string;
  is_active: boolean;
}

export const initialBillingGroupFormData: BillingGroupFormData = {
  bill_group_code: '',
  bill_group_name: '',
  bill_group_nameeng: '',
  remark: '',
  is_active: true,
};
