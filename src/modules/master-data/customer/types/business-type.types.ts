/**
 * @file business-type.types.ts
 * @description Types for Customer Business Type Master Data
 */

export interface CustomerBusinessType {
  business_type_id: string | number;
  business_type_code: string;
  business_type_name: string;
  business_type_nameeng?: string;
  remark?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessTypeFormData {
  business_type_code: string;
  business_type_name: string;
  business_type_nameeng: string;
  remark: string;
  is_active: boolean;
}

export const initialBusinessTypeFormData: BusinessTypeFormData = {
  business_type_code: '',
  business_type_name: '',
  business_type_nameeng: '',
  remark: '',
  is_active: true,
};
