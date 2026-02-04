/**
 * @file App.tsx
 * @description Main application component with routing configuration
 * @purpose Defines all routes for the ERP system
 * @refactored Uses React.lazy for code splitting and placeholderRoutes from centralized routes.ts config
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Main Layout - Lazy Loaded to prevent bundle bloat (admin dashboard code in login page)
const MainLayout = React.lazy(() => import('./layouts/MainLayout'));
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@system/ErrorBoundary';
import { GlobalLoading } from '@system/GlobalLoading';

import { placeholderRoutes } from './config/routes';
import { AuthProvider } from './contexts/AuthContext';

// ====================================================================================
// PAGE IMPORTS - Lazy Loaded
// ====================================================================================

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const EmployeePage = React.lazy(() => import('./pages/admin/employees/EmployeePage').then(module => ({ default: module.EmployeePage })));

// Procurement Pages
const ProcurementDashboard = React.lazy(() => import('./pages/procurement/ProcurementDashboard'));
const PRListPage = React.lazy(() => import('./pages/procurement/pr/PRListPage'));
const RFQListPage = React.lazy(() => import('./pages/procurement/rfq/RFQListPage'));
const QTListPage = React.lazy(() => import('./pages/procurement/qt/QTListPage'));
const QCListPage = React.lazy(() => import('./pages/procurement/qc/QCListPage'));
const POListPage = React.lazy(() => import('./pages/procurement/po/POListPage'));
const GRNListPage = React.lazy(() => import('./pages/procurement/grn/GRNListPage'));

const GoodsReceiptNoteListPage = React.lazy(() => import('./pages/procurement/ProcurementComingSoon').then(module => ({ default: module.GoodsReceiptNoteListPage })));
const PurchaseReturnListPage = React.lazy(() => import('./pages/procurement/ProcurementComingSoon').then(module => ({ default: module.PurchaseReturnListPage })));

// Roles Pages
const RolesDashboard = React.lazy(() => import('./pages/roles/RolesDashboard'));

// IT Governance Pages
const ITGCDashboard = React.lazy(() => import('./pages/it-governance/ITGCDashboard'));

// Master Data Pages
const MasterDataDashboard = React.lazy(() => import('./pages/master-data/MasterDataDashboard'));
const VendorForm = React.lazy(() => import('./pages/master-data/vendor/VendorForm'));
const VendorDashboard = React.lazy(() => import('./pages/master-data/vendor/VendorDashboard'));
const VendorList = React.lazy(() => import('./pages/master-data/vendor/VendorList'));
const BranchForm = React.lazy(() => import('./pages/master-data/branch/BranchForm'));
const WarehouseForm = React.lazy(() => import('./pages/master-data/warehouse/WarehouseForm'));
const ProductCategoryForm = React.lazy(() => import('./pages/master-data/product-category/ProductCategoryForm'));
const ItemTypeForm = React.lazy(() => import('./pages/master-data/item-type/ItemTypeForm'));
const UnitForm = React.lazy(() => import('./pages/master-data/unit/UnitForm'));
const ItemMasterForm = React.lazy(() => import('./pages/master-data/item-master/ItemMasterForm'));
const UOMConversionForm = React.lazy(() => import('./pages/master-data/uom-conversion/UOMConversionForm'));
const ItemBarcodeForm = React.lazy(() => import('./pages/master-data/item-barcode/ItemBarcodeForm'));

// Auth Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Common Pages
const ComingSoon = React.lazy(() => import('./pages/common/ComingSoon'));

// ====================================================================================
// PLACEHOLDER COMPONENT - For routes not yet implemented
// ====================================================================================

/**
 * PlaceholderPage - Displays a "Coming Soon" message for unimplemented pages
 * @param title - The name of the page to display
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">Coming Soon</p>
      </div>
    </div>
  );
}

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
          <Route path="master-data/vendor/form" element={<VendorForm />} />
          <Route path="master-data/branch" element={<BranchForm />} />
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
          {placeholderRoutes.itGovernance.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Audit Placeholders */}
          {placeholderRoutes.audit.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Sales Placeholders */}
          {placeholderRoutes.sales.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* MRP Placeholders */}
          {placeholderRoutes.mrp.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* AP Placeholders */}
          {placeholderRoutes.ap.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* AR Placeholders */}
          {placeholderRoutes.ar.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* GL Placeholders */}
          {placeholderRoutes.gl.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Cash & Bank Placeholders */}
          {placeholderRoutes.cash.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Budget Placeholders */}
          {placeholderRoutes.budget.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Fixed Assets Placeholders */}
          {placeholderRoutes.fa.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}

          {/* Tax Placeholders */}
          {placeholderRoutes.tax.map(({ path, title }) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;