/**
 * @file company-info.mock.ts
 * @description Mock data for Company Information
 */

import { type CompanyInfo } from '../types/company-info.types';

export const mockCompanyInfo: CompanyInfo = {
  company_id: 1,
  company_code: 'YMD001',
  tax_id: '0105558000000',
  registration_number: '0105558000000',
  name_th: 'บริษัท ยังมีดี เทคแคร์ จำกัด',
  name_en: 'YoungMeeDee Tech Care Co., Ltd.',
  address_th: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย',
  address_en: '123 Sukhumvit Road, Khlong Toei, Khlong Toei',
  province: 'กรุงเทพมหานคร',
  zip_code: '10110',
  phone: '02-123-4567',
  email: 'info@ymdtechcare.com',
  website: 'www.ymdtechcare.com',
  logo_url: '/assets/images/logo-placeholder.png', // Assuming this exists or will be handled
};
