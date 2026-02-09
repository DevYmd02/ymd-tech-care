export interface IEmployeeAddress {
  address_type: string;
  address: string;
  district: string;
  province: string;
  postal_code: string;
  country: string;
  contact_person: string;
}

export interface IEmployeeCreateRequest {
  branch_id: number;
  employee_code: string;
  employee_title_th: string;
  employee_title_en: string;
  employee_firstname_th: string;
  employee_lastname_th: string;
  employee_firstname_en: string;
  employee_lastname_en: string;
  employee_fullname?: string;
  employee_startdate: string;
  employee_resigndate?: string | null;
  employee_status: string;
  phone: string;
  email: string;
  remark?: string;
  tax_id: string;
  emp_type: boolean | string; // JSON showed 'false', assuming boolean. If it could be enum, keeping loose for now or strict boolean.
  position_id: number;
  department_id: number;
  is_active: boolean;
  manager_employee_id?: number | null;
  addresses: IEmployeeAddress[];
}

export interface IEmployeeResponse extends IEmployeeCreateRequest {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface IEmployee {
  id: number;
  employee_code: string;
  employee_firstname_th: string;
  employee_lastname_th: string;
  email: string;
  phone: string;
  is_active: boolean;
  position?: {
    position_name: string;
  };
  department?: {
    department_name: string;
  };
  branch?: {
    branch_name: string;
  };
}
