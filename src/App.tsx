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
import PRListPage from './pages/procurement/PRListPage';

// Roles Pages
import RolesDashboard from './pages/roles/RolesDashboard';

// IT Governance Pages
import ITGCDashboard from './pages/it-governance/ITGCDashboard';

// Master Data Pages
import VendorList from './pages/master-data/VendorList';
import VendorForm from './pages/master-data/VendorForm';

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

        {/* Roles - Implemented */}
        <Route path="roles/dashboard" element={<RolesDashboard />} />

        {/* IT Governance - Implemented */}
        <Route path="it-governance/dashboard" element={<ITGCDashboard />} />

        {/* Master Data - Implemented */}
        <Route path="master-data" element={<VendorList />} />
        <Route path="master-data/vendor" element={<VendorForm />} />

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