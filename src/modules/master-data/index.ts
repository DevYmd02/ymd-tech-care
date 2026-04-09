
// -- Company & Org Structure --
export * from './company/services/employee-side.service';
// Note: org-department.service is imported directly (not re-exported to avoid DepartmentService name conflict)
export * from './company/services/org-section.service';
export * from './company/services/org-job.service';
export * from './company/services/org-position.service';
export * from './company/services/employee-group.service';
export * from './company/services/employee.service';
export * from './company/services/sales-org.service';
export * from './company/services/org-branch.service';
export * from './accounting/services/cost-center.service'; // Moved here for logical grouping

// -- HR --
export * from './employee/services/employee.service';

// -- Projects --
export * from './project/services/project.service';

// -- General Facade --
export * from './services/master-data.service';

// -- Types (Re-export if needed, but usually types have their own barrel) --
