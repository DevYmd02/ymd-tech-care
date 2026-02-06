/**
 * @file App.tsx
 * @description Main application component with routing configuration
 * @purpose Defines all routes for the ERP system
 * @refactored Uses React.lazy for code splitting and placeholderRoutes from centralized routes.ts config
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Main Layout - Lazy Loaded to prevent bundle bloat (admin dashboard code in login page)
const MainLayout = React.lazy(() => import('@/shared/layouts/MainLayout'));
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/shared/components/system/ErrorBoundary';
import { GlobalLoading } from '@/shared/components/system/GlobalLoading';

import { placeholderRoutes } from '@/core/config/routes';
import { AuthProvider } from '@/core/auth/contexts/AuthContext';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';

// ====================================================================================
// PAGE IMPORTS - Lazy Loaded
// ====================================================================================

// Admin Pages
const AdminDashboard = React.lazy(() => import('@/modules/admin/pages/AdminDashboard'));
const EmployeePage = React.lazy(() => import('@/modules/admin/pages/employees/EmployeePage').then(module => ({ default: module.EmployeePage })));

// Procurement Pages
const ProcurementDashboard = React.lazy(() => import('@/modules/procurement/pages/dashboard/ProcurementDashboard'));
const PRListPage = React.lazy(() => import('./modules/procurement/pages/pr/PRListPage'));
const RFQListPage = React.lazy(() => import('./modules/procurement/pages/rfq/RFQListPage'));
const QTListPage = React.lazy(() => import('./modules/procurement/pages/qt/QTListPage'));
const QCListPage = React.lazy(() => import('./modules/procurement/pages/qc/QCListPage'));
const POListPage = React.lazy(() => import('./modules/procurement/pages/po/POListPage'));
const GRNListPage = React.lazy(() => import('./modules/procurement/pages/grn/GRNListPage'));

const GoodsReceiptNoteListPage = React.lazy(() => import('@/modules/procurement/pages/ProcurementComingSoon').then(module => ({ default: module.GoodsReceiptNoteListPage })));
const PurchaseReturnListPage = React.lazy(() => import('@/modules/procurement/pages/ProcurementComingSoon').then(module => ({ default: module.PurchaseReturnListPage })));

// Roles Pages
const RolesDashboard = React.lazy(() => import('@/modules/admin/pages/roles/RolesDashboard'));

// IT Governance Pages
const ITGCDashboard = React.lazy(() => import('@/modules/governance/pages/ITGCDashboard'));

// Master Data Pages
const MasterDataDashboard = React.lazy(() => import('@/modules/master-data/pages/MasterDataDashboard'));
// Vendor Pages (from master-data)
const VendorDashboard = React.lazy(() => import('@/modules/master-data/vendor/pages/VendorDashboard'));
const VendorList = React.lazy(() => import('@/modules/master-data/vendor/pages/VendorList'));
const VendorTypeList = React.lazy(() => import('@/modules/master-data/vendor/pages/vendor-type/VendorTypeList'));
const VendorGroupList = React.lazy(() => import('@/modules/master-data/vendor/pages/vendor-group/VendorGroupList'));
// Company Pages (from master-data)
const BranchList = React.lazy(() => import('@/modules/master-data/company/pages/branch/BranchList'));
const EmployeeSideList = React.lazy(() => import('@/modules/master-data/company/pages/employee-side/EmployeeSideList'));
const SectionList = React.lazy(() => import('@/modules/master-data/company/pages/section/SectionList'));
const JobList = React.lazy(() => import('@/modules/master-data/company/pages/job/JobList'));
const EmployeeList = React.lazy(() => import('@/modules/master-data/company/pages/employee/EmployeeList'));
const EmployeeGroupList = React.lazy(() => import('@/modules/master-data/company/pages/employee-group/EmployeeGroupList'));
const PositionList = React.lazy(() => import('@/modules/master-data/company/pages/position/PositionList'));
// Sales Pages (from master-data)
const SalesAreaList = React.lazy(() => import('@/modules/master-data/sales/pages/area/SalesAreaList'));
const SalesChannelList = React.lazy(() => import('@/modules/master-data/sales/pages/channel/SalesChannelList'));
const SalesTargetList = React.lazy(() => import('@/modules/master-data/sales/pages/target/SalesTargetList'));
const WarehouseForm = React.lazy(() => import('@/modules/master-data/inventory/pages/warehouse/WarehouseForm'));
const ProductCategoryForm = React.lazy(() => import('@/modules/master-data/inventory/pages/category/ProductCategoryForm'));
const ItemTypeForm = React.lazy(() => import('@/modules/master-data/inventory/pages/item-type/ItemTypeForm'));
const UnitForm = React.lazy(() => import('@/modules/master-data/inventory/pages/unit/UnitForm'));
const ItemMasterForm = React.lazy(() => import('@/modules/master-data/inventory/pages/item-master/ItemMasterForm'));
const UOMConversionForm = React.lazy(() => import('@/modules/master-data/inventory/pages/uom-conversion/UOMConversionForm'));
const ItemBarcodeForm = React.lazy(() => import('@/modules/master-data/inventory/pages/item-barcode/ItemBarcodeForm'));

// Auth Pages (from modules)
const LoginPage = React.lazy(() => import('./modules/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./modules/auth/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./modules/auth/pages/ForgotPasswordPage'));

// Common Pages
const ComingSoon = React.lazy(() => import('./shared/pages/ComingSoon'));



// ====================================================================================
// MAIN APP COMPONENT
// ====================================================================================

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ... (Auth Routes) ... */}
        
        <Route path="/auth/login" element={
          <React.Suspense fallback={<GlobalLoading message="Loading Login..." />}>
            <LoginPage />
          </React.Suspense>
        } />
        
        <Route path="/auth/register" element={
          <React.Suspense fallback={<GlobalLoading message="Loading Register..." />}>
            <RegisterPage />
          </React.Suspense>
        } />

        <Route path="/auth/forgot-password" element={
          <React.Suspense fallback={<GlobalLoading message="Loading..." />}>
            <ForgotPasswordPage />
          </React.Suspense>
        } />

        {/* Legacy Redirects (Optional: to prevent broken links) */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />


        {/* Main Layout Routes - With Sidebar & Header */}
        <Route path="/" element={
           <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
             <React.Suspense fallback={<GlobalLoading />}>
                <MainLayout />
             </React.Suspense>
           </ErrorBoundary>
        }>
          {/* Redirect root to admin (or login if we had logic) */}
          <Route index element={<Navigate to="/admin" replace />} />

          {/* ==================== IMPLEMENTED ROUTES ==================== */}

          {/* Admin Dashboard */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/employees" element={<EmployeePage />} />
          <Route path="admin/roles" element={<RolesDashboard />} />

          {/* Procurement */}
          <Route path="procurement">
            <Route path="dashboard" element={<ProcurementDashboard />} />
            <Route path="pr" element={<PRListPage />} />
            <Route path="rfq" element={<RFQListPage />} />
            <Route path="qt" element={<QTListPage />} />
            <Route path="qc" element={<QCListPage />} />
            <Route path="po" element={<POListPage />} />
            <Route path="grn" element={<GRNListPage />} />
            <Route path="grn-coming-soon" element={<GoodsReceiptNoteListPage />} /> {/* Keep old GRN route as coming soon */}
            <Route path="prt" element={<PurchaseReturnListPage />} />
          </Route>

          {/* Roles - Implemented */}
          <Route path="roles/dashboard" element={<RolesDashboard />} />

          {/* IT Governance - Implemented */}
          <Route path="it-governance/dashboard" element={<ITGCDashboard />} />

          {/* Master Data - Implemented */}
          <Route path="master-data" element={<MasterDataDashboard />} />
          <Route path="master-data/vendor" element={<VendorDashboard />} />
          <Route path="master-data/vendor/list" element={<VendorList />} />

          <Route path="master-data/branch" element={<BranchList />} />
          <Route path="master-data/employee-side" element={<EmployeeSideList />} />
          <Route path="master-data/section" element={<SectionList />} />
          <Route path="master-data/job" element={<JobList />} />
          <Route path="master-data/employee" element={<EmployeeList />} />
          <Route path="master-data/employee-group" element={<EmployeeGroupList />} />
          <Route path="master-data/position" element={<PositionList />} />
          <Route path="master-data/employee-group" element={<EmployeeGroupList />} />
          <Route path="master-data/position" element={<PositionList />} />
          {/* Sales Master Data */}
          <Route path="master-data/sales-area" element={<SalesAreaList />} />
          <Route path="master-data/sales-channel" element={<SalesChannelList />} />
          <Route path="master-data/sales-target" element={<SalesTargetList />} />
          <Route path="master-data/vendor-type" element={<VendorTypeList />} />
          <Route path="master-data/vendor-group" element={<VendorGroupList />} />
          <Route path="master-data/warehouse" element={<WarehouseForm />} />
          <Route path="master-data/product-category" element={<ProductCategoryForm />} />
          <Route path="master-data/item-type" element={<ItemTypeForm />} />
          <Route path="master-data/unit" element={<UnitForm />} />
          <Route path="master-data/item" element={<ItemMasterForm />} />
          <Route path="master-data/uom-conversion" element={<UOMConversionForm />} />
          <Route path="master-data/item-barcode" element={<ItemBarcodeForm />} />
          
          {/* Generic Coming Soon for Work in Progress */}
          <Route path="/coming-soon" element={<ComingSoon />} />

          {/* ==================== PLACEHOLDER ROUTES ==================== */}
          
          {/* Procurement Placeholders */}
          {placeholderRoutes.procurement.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Inventory Placeholders */}
          {placeholderRoutes.inventory.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Roles Placeholders */}
          {placeholderRoutes.roles.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* IT Governance Placeholders */}
          {placeholderRoutes.itGovernance.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Audit Placeholders */}
          {placeholderRoutes.audit.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Sales Placeholders */}
          {placeholderRoutes.sales.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* MRP Placeholders */}
          {placeholderRoutes.mrp.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* AP Placeholders */}
          {placeholderRoutes.ap.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* AR Placeholders */}
          {placeholderRoutes.ar.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* GL Placeholders */}
          {placeholderRoutes.gl.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Cash & Bank Placeholders */}
          {placeholderRoutes.cash.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Budget Placeholders */}
          {placeholderRoutes.budget.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Fixed Assets Placeholders */}
          {placeholderRoutes.fa.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Tax Placeholders */}
          {placeholderRoutes.tax.map(({ path, title }: { path: string; title: string }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
