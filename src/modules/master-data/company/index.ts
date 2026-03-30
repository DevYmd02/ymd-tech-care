/**
 * @file index.ts
 * @description Company Module - Public API exports
 * @module company
 */

// Services
export { EmployeeSideService as DepartmentService, EmployeeSideService } from './services/employee-side.service';
export { EmployeeDeptService as SectionService, EmployeeDeptService } from './services/employee-dept.service';
export { JobService } from './services/job.service';
export { EmployeeGroupService } from './services/employee-group.service';
export { PositionService } from './services/position.service';
export { OrgEmployeeService } from './services/employee.service';
export { CompanyInfoService } from './services/company-info.service';

// Re-exports for backward compatibility or future use
export { SalesZoneService, SalesChannelService, SalesTargetService } from './services/sales-org.service';

// Dashboard
export { default as CompanyDashboard } from './pages/CompanyDashboard';
export { default as CompanyInfoPage } from './pages/CompanyInfoPage';

// Branch Pages
export { BranchForm, BranchFormModal, BranchList } from './pages/branch';

// Employee Side Pages (formerly Department)
export { EmployeeSideList as DepartmentList, EmployeeSideFormModal as DepartmentFormModal, EmployeeSideList, EmployeeSideFormModal } from './pages/employee-side';

// Employee Dept Pages (formerly Section)
export { EmployeeDeptList as SectionList, EmployeeDeptFormModal as SectionFormModal, EmployeeDeptList, EmployeeDeptFormModal } from './pages/employee-dept';

// Job Pages
export { JobList, JobFormModal } from './pages/job';

// Removed redundant exports

// Employee Group Pages
export { default as EmployeeGroupList } from './pages/employee-group/EmployeeGroupList';
export { EmployeeGroupFormModal } from './pages/employee-group/EmployeeGroupFormModal';

// Position Pages
export { default as PositionList } from './pages/position/PositionList';
export { PositionFormModal } from './pages/position/PositionFormModal';


