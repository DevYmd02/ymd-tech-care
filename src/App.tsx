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
import { Toaster } from 'react-hot-toast';

import { placeholderRoutes, ROUTES } from '@/core/config/routes';
import { AuthProvider, useAuth } from '@/core/auth/contexts/AuthContext';
import { MasterDataProvider } from '@/core/providers/MasterDataProvider';
import { ProtectedRoute } from '@/core/auth/components/ProtectedRoute';
import { PublicRoute } from '@/core/auth/components/PublicRoute';
import { PlaceholderPage } from '@ui';
import { ToastProvider } from '@ui';

// ====================================================================================
// PAGE IMPORTS - Lazy Loaded
// ====================================================================================

// Admin Pages
const AdminDashboard = React.lazy(() => import('@/modules/admin/pages/AdminDashboard'));
const EmployeePage = React.lazy(() => import('@/modules/admin/pages/employees/EmployeePage').then(module => ({ default: module.EmployeePage })));

// Procurement Pages
const ProcurementDashboard = React.lazy(() => import('@/modules/procurement/pages/dashboard/ProcurementDashboard'));
const PRListPage = React.lazy(() => import('@/modules/procurement/pages/pr/PRListPage'));
const AVListPage = React.lazy(() => import('@/modules/procurement/pages/av/AVListPage'));
const RFQListPage = React.lazy(() => import('@/modules/procurement/pages/rfq/RFQListPage'));
const VQListPage = React.lazy(() => import('@/modules/procurement/pages/vq/VQListPage'));
const QCListPage = React.lazy(() => import('@/modules/procurement/pages/qc/QCListPage'));
const POListPage = React.lazy(() => import('@/modules/procurement/pages/po/POListPage'));
const POAListPage = React.lazy(() => import('@/modules/procurement/pages/poa/POAListPage'));
const GRNListPage = React.lazy(() => import('@/modules/procurement/pages/grn/GRNListPage'));
const PRTListPage = React.lazy(() => import('@/modules/procurement/pages/prt/PRTListPage'));
const VEListPage = React.lazy(() => import('@/modules/procurement/pages/ve/VendorEvaluationListPage'));

// Roles Pages
const RolesDashboard = React.lazy(() => import('@/modules/admin/pages/roles/RolesDashboard'));

// IT Governance Pages
const ITGCDashboard = React.lazy(() => import('@/modules/governance/pages/ITGCDashboard'));

// Master Data Pages
const MasterDataDashboard = React.lazy(() => import('@/modules/master-data/pages/MasterDataDashboard'));
// Vendor Pages (from master-data)
// const VendorDashboard = React.lazy(() => import('@/modules/master-data/vendor/pages/VendorDashboard'));
const VendorList = React.lazy(() => import('@/modules/master-data/vendor/pages/VendorList'));
const VendorTypeList = React.lazy(() => import('@/modules/master-data/vendor/pages/vendor-type/VendorTypeList'));
const VendorGroupList = React.lazy(() => import('@/modules/master-data/vendor/pages/vendor-group/VendorGroupList'));
// Company Pages (from master-data)
const BranchList = React.lazy(() => import('@/modules/master-data/company/pages/branch/BranchList'));
const EmployeeSideList = React.lazy(() => import('@/modules/master-data/company/pages/employee-side/EmployeeSideList'));
const EmployeeDeptList = React.lazy(() => import('@/modules/master-data/company/pages/employee-dept/EmployeeDeptList'));
const JobList = React.lazy(() => import('@/modules/master-data/company/pages/job/JobList'));
const EmployeeList = React.lazy(() => import('@/modules/master-data/company/pages/employee/EmployeeList'));
const EmployeeGroupList = React.lazy(() => import('@/modules/master-data/company/pages/employee-group/EmployeeGroupList'));
const PositionList = React.lazy(() => import('@/modules/master-data/company/pages/position/PositionList'));
const CompanyDashboard = React.lazy(() => import('@/modules/master-data/company/pages/CompanyDashboard'));
const CompanyInfoPage = React.lazy(() => import('@/modules/master-data/company/pages/CompanyInfoPage'));
// Sales Pages (from master-data)
const SalesAreaList = React.lazy(() => import('@/modules/master-data/sales/pages/area/SalesAreaList'));
const SalesChannelList = React.lazy(() => import('@/modules/master-data/sales/pages/channel/SalesChannelList'));
const SalesTargetList = React.lazy(() => import('@/modules/master-data/sales/pages/target/SalesTargetList'));
const PriceListList = React.lazy(() => import('@/modules/master-data/sales/pages/price-list/PriceListList'));
const PriceLevelList = React.lazy(() => import('@/modules/master-data/sales/pages/price-level/PriceLevelList'));
const ICOptionList = React.lazy(() => import('@/modules/master-data/sales/pages/ic-option/ICOptionList'));
const StandardCostList = React.lazy(() => import('@/modules/master-data/sales/pages/standard-cost/StandardCostList'));
const WarehouseList = React.lazy(() => import('@/modules/master-data/inventory/pages/warehouse/WarehouseList'));
const ProductCategoryList = React.lazy(() => import('@/modules/master-data/inventory/pages/category/ProductCategoryList'));
const ItemTypeList = React.lazy(() => import('@/modules/master-data/inventory/pages/item-type/ItemTypeList'));
const UnitList = React.lazy(() => import('@/modules/master-data/inventory/pages/unit/UnitList'));
const ItemMasterList = React.lazy(() => import('@/modules/master-data/inventory/pages/item-master/ItemMasterList'));
const UOMConversionList = React.lazy(() => import('@/modules/master-data/inventory/pages/uom-conversion/UOMConversionList'));
const ItemBarcodeList = React.lazy(() => import('@/modules/master-data/inventory/pages/item-barcode/ItemBarcodeList'));
// New Inventory Master Pages (11 new pages)
const ItemGroupList = React.lazy(() => import('@/modules/master-data/inventory/pages/item-group/ItemGroupList'));
const BrandList = React.lazy(() => import('@/modules/master-data/inventory/pages/brand/BrandList'));
const PatternList = React.lazy(() => import('@/modules/master-data/inventory/pages/pattern/PatternList'));
const DesignList = React.lazy(() => import('@/modules/master-data/inventory/pages/design/DesignList'));
const GradeList = React.lazy(() => import('@/modules/master-data/inventory/pages/grade/GradeList'));
const ModelList = React.lazy(() => import('@/modules/master-data/inventory/pages/model/ModelList'));
const SizeList = React.lazy(() => import('@/modules/master-data/inventory/pages/size/SizeList'));
const ColorList = React.lazy(() => import('@/modules/master-data/inventory/pages/color/ColorList'));
const LocationList = React.lazy(() => import('@/modules/master-data/inventory/pages/location/LocationList'));
const ShelfList = React.lazy(() => import('@/modules/master-data/inventory/pages/shelf/ShelfList'));
const LotNoList = React.lazy(() => import('@/modules/master-data/inventory/pages/lot-no/LotNoList'));
const ICDocumentLinkList = React.lazy(() => import('@/modules/master-data/inventory/pages/ic-document-link/ICDocumentLinkList'));
// Currency Pages
const CurrencyCodeList = React.lazy(() => import('@/modules/master-data/currency/pages/code/CurrencyCodeList'));
const ExchangeRateTypeList = React.lazy(() => import('@/modules/master-data/currency/pages/type/ExchangeRateTypeList'));
const ExchangeRateList = React.lazy(() => import('@/modules/master-data/currency/pages/rate/ExchangeRateList'));

// Tax Pages
const TaxCodeList = React.lazy(() => import('@/modules/master-data/tax/pages/code/TaxCodeList'));
const TaxGroupList = React.lazy(() => import('@/modules/master-data/tax/pages/group/TaxGroupList'));

// Customer Pages
const CustomerList = React.lazy(() => import('@customer/customer-master/CustomerListPage'));
const BusinessTypeList = React.lazy(() => import('@customer/business-type/BusinessTypeList'));
const CustomerTypeList = React.lazy(() => import('@customer/customer-type/CustomerTypeList'));
const CustomerGroupList = React.lazy(() => import('@customer/customer-group/CustomerGroupList'));
const BillingGroupList = React.lazy(() => import('@customer/billing-group/BillingGroupList'));

// Sales Module Pages
const InquiryListPage = React.lazy(() => import('@sales/inquiry/InquiryListPage'));
const EstimateListPage = React.lazy(() => import('@sales/estimate/EstimateListPage'));
const QuotationListPage = React.lazy(() => import('@sales/quotation/QuotationListPage'));
const QuotationApproveListPage = React.lazy(() => import('@sales/quotation-approve/QuotationApproveListPage'));
const ReservationListPage = React.lazy(() => import('@sales/reservation/ReservationListPage'));
const SalesOrderListPage = React.lazy(() => import('@sales/sales-order/SalesOrderListPage'));
const SalesOrderApproveListPage = React.lazy(() => import('@sales/sales-order-approval/SalesOrderApproveListPage'));
const DeliveryListPage = React.lazy(() => import('@sales/delivery/DeliveryListPage'));
const SalesDashboard = React.lazy(() => import('@sales/dashboard/SalesDashboard'));

// Auth Pages (from modules)
const LoginPage = React.lazy(() => import('@/modules/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/modules/auth/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/modules/auth/pages/ForgotPasswordPage'));

// Common Pages
const ComingSoon = React.lazy(() => import('@/shared/pages/ComingSoon'));



// ====================================================================================
// MAIN APP COMPONENT
// ====================================================================================



function AppContent() {
  const { isLoading } = useAuth();

  // Root-level loading guard (Perfection Point #3)
  if (isLoading) {
    return <GlobalLoading message="Initializing Application..." />;
  }

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1f2937', // gray-800
            color: '#f3f4f6',      // gray-100
            border: '1px solid #374151', // gray-700
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
      <ToastProvider>
        <Routes>
          {/* Auth Routes - Public */}
          <Route path={ROUTES.AUTH.LOGIN} element={
            <PublicRoute>
              <React.Suspense fallback={<GlobalLoading message="Loading Login..." />}>
                <LoginPage />
              </React.Suspense>
            </PublicRoute>
          } />
          
          <Route path={ROUTES.AUTH.REGISTER} element={
            <PublicRoute>
              <React.Suspense fallback={<GlobalLoading message="Loading Register..." />}>
                <RegisterPage />
              </React.Suspense>
            </PublicRoute>
          } />

          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={
            <PublicRoute>
              <React.Suspense fallback={<GlobalLoading message="Loading..." />}>
                <ForgotPasswordPage />
              </React.Suspense>
            </PublicRoute>
          } />

          {/* Legacy Redirects */}
          <Route path="/login" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
          <Route path="/register" element={<Navigate to={ROUTES.AUTH.REGISTER} replace />} />
          <Route path="/forgot-password" element={<Navigate to={ROUTES.AUTH.FORGOT_PASSWORD} replace />} />
          <Route path="/master-data/section" element={<Navigate to={ROUTES.MASTER_DATA.EMPLOYEE_DEPT} replace />} />


          {/* Main Layout Routes - Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
                <React.Suspense fallback={<GlobalLoading />}>
                  <MainLayout />
                </React.Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }>
            {/* Redirect root to admin dashboard */}
            <Route index element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />

            {/* Admin Modules - Nested for path consistency */}
            <Route path="admin">
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<EmployeePage />} />
              <Route path="roles" element={<RolesDashboard />} />
            </Route>

            {/* Procurement Modules */}
            <Route path="procurement">
              <Route path="dashboard" element={<ProcurementDashboard />} />
              <Route path="pr" element={<PRListPage />} />
              <Route path="av" element={<AVListPage />} />
              <Route path="rfq" element={<RFQListPage />} />
              <Route path="vq" element={<VQListPage />} />
              <Route path="qc" element={<QCListPage />} />
              <Route path="po" element={<POListPage />} />
              <Route path="poa" element={<POAListPage />} />
              <Route path="grn" element={<GRNListPage />} />
              <Route path="prt" element={<PRTListPage />} />
              <Route path="ve" element={<VEListPage />} />
            </Route>

            {/* Other Inner Routes ... */}

            {/* Roles - Implemented */}
            <Route path="roles/dashboard" element={<RolesDashboard />} />

            {/* IT Governance - Implemented */}
            <Route path="it-governance/dashboard" element={<ITGCDashboard />} />

            {/* Master Data - Implemented */}
            <Route path="master-data" element={<MasterDataDashboard />} />
            {/* <Route path="master-data/vendor" element={<VendorDashboard />} /> */}
            <Route path="master-data/vendor" element={<VendorList />} />
            {/* <Route path="master-data/vendor/list" element={<VendorList />} /> */}

            <Route path={ROUTES.MASTER_DATA.BRANCH} element={<BranchList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE_SIDE} element={<EmployeeSideList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE_DEPT} element={<EmployeeDeptList />} />
            <Route path="master-data/job" element={<JobList />} />
            <Route path="master-data/employee" element={<EmployeeList />} />
            <Route path="master-data/employee-group" element={<EmployeeGroupList />} />
            <Route path="master-data/position" element={<PositionList />} />
            <Route path="master-data/company" element={<CompanyDashboard />} />
            <Route path="master-data/company-info" element={<CompanyInfoPage />} />
            <Route path="master-data/general-settings" element={<PlaceholderPage title="กำหนดตั้งค่าทั่วไป" />} />
            <Route path="master-data/standard-cost" element={<StandardCostList />} />
            <Route path="master-data/price-level" element={<PriceLevelList />} />
            <Route path="master-data/price-list" element={<PriceListList />} />
            <Route path={ROUTES.MASTER_DATA.IC_OPTION} element={<ICOptionList />} />
            <Route path={ROUTES.MASTER_DATA.IC_DOCUMENT_LINK} element={<ICDocumentLinkList />} />

            {/* Sales Master Data */}
            <Route path="master-data/sales-area" element={<SalesAreaList />} />
            <Route path="master-data/sales-channel" element={<SalesChannelList />} />
            <Route path="master-data/sales-target" element={<SalesTargetList />} />
            <Route path="master-data/vendor-type" element={<VendorTypeList />} />
            <Route path="master-data/vendor-group" element={<VendorGroupList />} />
            <Route path="master-data/warehouse" element={<WarehouseList />} />
            <Route path="master-data/product-category" element={<ProductCategoryList />} />
            <Route path="master-data/item-type" element={<ItemTypeList />} />
            <Route path="master-data/unit" element={<UnitList />} />

            <Route path="master-data/item" element={<ItemMasterList />} />
            <Route path="master-data/uom-conversion" element={<UOMConversionList />} />
            <Route path="master-data/item-barcode" element={<ItemBarcodeList />} />
            {/* New Inventory Master Routes */}
            <Route path="master-data/item-group" element={<ItemGroupList />} />
            <Route path="master-data/brand" element={<BrandList />} />
            <Route path="master-data/pattern" element={<PatternList />} />
            <Route path="master-data/design" element={<DesignList />} />
            <Route path="master-data/grade" element={<GradeList />} />
            <Route path="master-data/model" element={<ModelList />} />
            <Route path="master-data/size" element={<SizeList />} />
            <Route path="master-data/color" element={<ColorList />} />
            <Route path="master-data/location" element={<LocationList />} />
            <Route path="master-data/shelf" element={<ShelfList />} />
            <Route path="master-data/lot-no" element={<LotNoList />} />
            <Route path="master-data/currency/code" element={<CurrencyCodeList />} />
            <Route path="master-data/currency/type" element={<ExchangeRateTypeList />} />
            <Route path="master-data/currency/rate" element={<ExchangeRateList />} />
            
            {/* Tax Master Data */}
            <Route path="master-data/tax/code" element={<TaxCodeList />} />
            <Route path="master-data/tax/group" element={<TaxGroupList />} />

            {/* Customer Master Data */}
            <Route path="master-data/customer" element={<CustomerList />} />
            <Route path="master-data/customer-business-type" element={<BusinessTypeList />} />
            <Route path="master-data/customer-type" element={<CustomerTypeList />} />
            <Route path="master-data/customer-group" element={<CustomerGroupList />} />
            <Route path="master-data/customer-billing-group" element={<BillingGroupList />} />

            {/* Generic Coming Soon for Work in Progress */}
            <Route path="/coming-soon" element={<ComingSoon />} />

            {/* ==================== IMPLEMENTED MODULES ==================== */}
            
            {/* Sales Module */}
            <Route path="sales/dashboard" element={<SalesDashboard />} />
            <Route path="sales/inquiry" element={<InquiryListPage />} />
            <Route path="sales/estimate" element={<EstimateListPage />} />
            <Route path="sales/quotation" element={<QuotationListPage />} />
            <Route path="sales/quotation-approval" element={<QuotationApproveListPage />} />
            <Route path="sales/reservation" element={<ReservationListPage />} />
            <Route path="sales/order" element={<SalesOrderListPage />} />
            <Route path="sales/order-approval" element={<SalesOrderApproveListPage />} />
            <Route path="sales/delivery" element={<DeliveryListPage />} />

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
      </ToastProvider>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <MasterDataProvider>
        <AppContent />
      </MasterDataProvider>
    </AuthProvider>
  );
}

export default App;