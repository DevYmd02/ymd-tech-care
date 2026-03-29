/**
 * @file company-info.types.ts
 * @description Type definitions for Company Information
 */

export interface CompanyInfo {
  company_id: number;
  company_code: string;
  tax_id: string;
  registration_number: string;
  
  // Names
  name_th: string;
  name_en: string;
  
  // Address
  address_th: string;
  address_en: string;
  province: string;
  zip_code: string;
  
  // Contact
  phone: string;
  email: string;
  website: string;
  
  // Assets
  logo_url?: string;
}

export type CompanyInfoFormData = Omit<CompanyInfo, 'company_id'>;
