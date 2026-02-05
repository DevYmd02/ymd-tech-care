/**
 * @file index.ts
 * @description Company Module - Public API exports
 * @module company
 */

// Services
export {
    DepartmentService,
    SectionService,
    JobService,
    EmployeeGroupService,
    PositionService,
    SalesZoneService,
    SalesChannelService,
    SalesTargetService,
    EmployeeService,
} from './services/company.service';

// Branch Pages
export { BranchForm, BranchFormModal, BranchList } from './pages/branch';

// Department Pages
export { DepartmentList, DepartmentFormModal } from './pages/department';

// Section Pages
export { SectionList, SectionFormModal } from './pages/section';

// Job Pages
export { JobList, JobFormModal } from './pages/job';

// Employee Side Pages
export { EmployeeSideList, EmployeeSideFormModal } from './pages/employee-side';
