/**
 * @file App.tsx
 * @description Main application component with routing configuration
 * @purpose Defines all routes for the ERP system
 * @refactored Uses placeholderRoutes from centralized routes.ts config
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { placeholderRoutes } from './config/routes';

// ====================================================================================
// PAGE IMPORTS - Actual implemented pages
// ====================================================================================

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Procurement Pages
import ProcurementDashboard from './pages/procurement/ProcurementDashboard';
import PRListPage from './pages/procurement/pr/PRListPage';
import RFQListPage from './pages/procurement/rfq/RFQListPage';
import QTListPage from './pages/procurement/qt/QTListPage';
import QCListPage from './pages/procurement/qc/QCListPage';
import POListPage from './pages/procurement/po/POListPage';
import { 
    GoodsReceiptNoteListPage, 
    PurchaseReturnListPage 
} from './pages/procurement/ProcurementComingSoon';

// Roles Pages
import RolesDashboard from './pages/roles/RolesDashboard';

// IT Governance Pages
import ITGCDashboard from './pages/it-governance/ITGCDashboard';

// Master Data Pages - Import from module index files
import {
    MasterDataDashboard,
    VendorForm,
    VendorDashboard,
    VendorList,
    BranchForm,
    WarehouseForm,
    ProductCategoryForm,
    ItemTypeForm,
    UnitForm,
    ItemMasterForm,
    UOMConversionForm,
    ItemBarcodeForm
} from './pages/master-data';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

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
    <Routes>
      {/* Standalone Route - Login (No Sidebar/Header) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Main Layout Routes - With Sidebar & Header */}
      <Route path="/" element={<MainLayout />}>
        {/* Redirect root to admin (or login if we had logic) */}
        <Route index element={<Navigate to="/admin" replace />} />

        {/* ==================== IMPLEMENTED ROUTES ==================== */}

        {/* Admin Dashboard */}
        <Route path="admin" element={<AdminDashboard />} />

        {/* Procurement - Implemented */}
        <Route path="procurement/dashboard" element={<ProcurementDashboard />} />
        <Route path="procurement/pr" element={<PRListPage />} />
        <Route path="procurement/rfq" element={<RFQListPage />} />
        
        {/* Procurement - Coming Soon */}
        <Route path="procurement/qt" element={<QTListPage />} />
        <Route path="procurement/qc" element={<QCListPage />} />
        <Route path="procurement/po" element={<POListPage />} />
        <Route path="procurement/grn" element={<GoodsReceiptNoteListPage />} />
        <Route path="procurement/prt" element={<PurchaseReturnListPage />} />

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

        {/* ==================== PLACEHOLDER ROUTES ==================== */}
        {/* These routes render a "Coming Soon" placeholder */}

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
  );
}

export default App;