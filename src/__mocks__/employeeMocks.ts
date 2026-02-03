/**
 * @file employeeMocks.ts
 * @description Mock data for Employees
 */

import type { IEmployee } from '@/interfaces/IEmployee';

export const mockEmployees: IEmployee[] = [
  {
    id: 1,
    employee_code: 'EMP0001',
    employee_firstname_th: 'สมชาย',
    employee_lastname_th: 'ใจดี',
    email: 'somchai.jai@ymd.co.th',
    phone: '081-111-1111',
    is_active: true,
    position: {
      position_name: 'IT Manager',
    },
    department: {
      department_name: 'Information Technology',
    },
    branch: {
      branch_name: 'สำนักงานใหญ่',
    },
  },
  {
    id: 2,
    employee_code: 'EMP0002',
    employee_firstname_th: 'สมหญิง',
    employee_lastname_th: 'รักงาน',
    email: 'somying.rak@ymd.co.th',
    phone: '082-222-2222',
    is_active: true,
    position: {
      position_name: 'Procurement Officer',
    },
    department: {
      department_name: 'Procurement',
    },
    branch: {
      branch_name: 'สำนักงานใหญ่',
    },
  },
  {
    id: 3,
    employee_code: 'EMP0003',
    employee_firstname_th: 'วิชัย',
    employee_lastname_th: 'มากมี',
    email: 'wichai.mak@ymd.co.th',
    phone: '083-333-3333',
    is_active: false,
    position: {
      position_name: 'Sales Manager',
    },
    department: {
      department_name: 'Sales',
    },
    branch: {
      branch_name: 'สาขาเชียงใหม่',
    },
  },
];
