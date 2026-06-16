/**
 * @file App.tsx
 * @description Main application component with routing configuration
 * @purpose Defines all routes for the ERP system
 * @refactored Uses React.lazy for code splitting and placeholderRoutes from centralized routes.ts config
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/shared/components/system/ErrorBoundary';
import { GlobalLoading } from '@/shared/components/system/GlobalLoading';
import { Toaster } from 'react-hot-toast';

import { placeholderRoutes, ROUTES } from '@/core/config/routes';
import { AuthProvider, useAuth } from '@/core/auth/contexts/AuthContext';
import { PermissionProvider } from '@/core/auth/contexts/PermissionContext';
import { MasterDataProvider } from '@/core/providers/MasterDataProvider';
import { ProtectedRoute } from '@/core/auth/components/ProtectedRoute';
import { PublicRoute } from '@/core/auth/components/PublicRoute';
import { PlaceholderPage } from '@ui';
import { ToastProvider } from '@ui';

// ====================================================================================
// PAGE IMPORTS - Lazy Loaded
// ====================================================================================

// Main Layout - Lazy Loaded to prevent bundle bloat (admin dashboard code in login page)
const MainLayout = React.lazy(() => import('@/shared/layouts/MainLayout'));

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
const PrintPRPage = React.lazy(() => import('@/modules/procurement/pages/pr/PrintPRPage'));
const PrintPOPage = React.lazy(() => import('@/modules/procurement/pages/po/PrintPOPage'));
const PrintRFQPage = React.lazy(() => import('@/modules/procurement/pages/rfq/PrintRFQPage'));
const PrintAVPage = React.lazy(() => import('@/modules/procurement/pages/av/PrintAVPage'));
const PrintQCPage = React.lazy(() => import('@/modules/procurement/pages/qc/PrintQCPage'));
const PrintPOAPage = React.lazy(() => import('@/modules/procurement/pages/poa/PrintPOAPage'));
const PrintDesignerPage = React.lazy(() => import('@/modules/procurement/pages/designer/PrintDesignerPage'));

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
const ICOptionList = React.lazy(() => import('@/modules/master-data/company/pages/ic-option/ICOptionList'));
const StandardCostList = React.lazy(() => import('@/modules/master-data/sales/pages/standard-cost/StandardCostList'));
const WarehouseList = React.lazy(() => import('@/modules/master-data/inventory/pages/warehouse/WarehouseList'));
const ProductCategoryList = React.lazy(() => import('@/modules/master-data/inventory/pages/category/ProductCategoryList'));
const ItemTypeList = React.lazy(() => import('@/modules/master-data/inventory/pages/item-type/ItemTypeList'));
const UOMList = React.lazy(() => import('@/modules/master-data/inventory/pages/uom/UOMList'));
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

// Inventory Transaction Pages
const RequisitionListPage = React.lazy(() => import('@/modules/Inventory/requisition/RequisitionListPage'));
const RequisitionApprovalListPage = React.lazy(() => import('@/modules/Inventory/requisition-approval/RequisitionApprovalListPage'));
const IssueListPage = React.lazy(() => import('@/modules/Inventory/issue/IssueListPage'));
const ReturnListPage = React.lazy(() => import('@/modules/Inventory/return-issue/ReturnListPage'));
const TransferListPage = React.lazy(() => import('@/modules/Inventory/transfer-requisition/TransferListPage'));
const TransferApprovalListPage = React.lazy(() => import('@/modules/Inventory/transfer-requisition-approval/TransferApprovalListPage'));
const TransferOutListPage = React.lazy(() => import('@/modules/Inventory/transfer-out/TransferOutListPage'));
const TransferInListPage = React.lazy(() => import('@/modules/Inventory/transfer-in/TransferInListPage'));
const InventoryDashboard = React.lazy(() => import('@/modules/Inventory/dashboard/InventoryDashboard'));
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

          {/* Print Preview Routes (A4 fullscreen) */}
          <Route path="/print">
            <Route path="pr/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading PR Print Preview..." />}>
                  <PrintPRPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
            <Route path="po/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading PO Print Preview..." />}>
                  <PrintPOPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
            <Route path="rfq/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading RFQ Print Preview..." />}>
                  <PrintRFQPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
            <Route path="av/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading AV Print Preview..." />}>
                  <PrintAVPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
            <Route path="qc/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading QC Print Preview..." />}>
                  <PrintQCPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
            <Route path="poa/:id" element={
              <ProtectedRoute>
                <React.Suspense fallback={<GlobalLoading message="Loading POA Print Preview..." />}>
                  <PrintPOAPage />
                </React.Suspense>
              </ProtectedRoute>
            } />
          </Route>

          {/* Main Layout Routes - Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <MasterDataProvider>
                <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
                  <React.Suspense fallback={<GlobalLoading />}>
                    <MainLayout />
                  </React.Suspense>
                </ErrorBoundary>
              </MasterDataProvider>
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
              <Route path="print-designer" element={<PrintDesignerPage />} />
            </Route>

            {/* Other Inner Routes ... */}

            {/* Roles - Implemented */}
            <Route path={ROUTES.ROLES.DASHBOARD} element={<RolesDashboard />} />

            {/* IT Governance - Implemented */}
            <Route path={ROUTES.IT_GOVERNANCE.DASHBOARD} element={<ITGCDashboard />} />

            {/* Master Data - Implemented */}
            <Route path={ROUTES.MASTER_DATA.DASHBOARD} element={<MasterDataDashboard />} />
            {/* <Route path="master-data/vendor" element={<VendorDashboard />} /> */}
            <Route path={ROUTES.MASTER_DATA.VENDOR} element={<VendorList />} />
            {/* <Route path="master-data/vendor/list" element={<VendorList />} /> */}

            <Route path={ROUTES.MASTER_DATA.BRANCH} element={<BranchList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE_SIDE} element={<EmployeeSideList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE_DEPT} element={<EmployeeDeptList />} />
            <Route path={ROUTES.MASTER_DATA.JOB} element={<JobList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE} element={<EmployeeList />} />
            <Route path={ROUTES.MASTER_DATA.EMPLOYEE_GROUP} element={<EmployeeGroupList />} />
            <Route path={ROUTES.MASTER_DATA.POSITION} element={<PositionList />} />
            <Route path={ROUTES.MASTER_DATA.COMPANY} element={<CompanyDashboard />} />
            <Route path={ROUTES.MASTER_DATA.COMPANY_INFO} element={<CompanyInfoPage />} />
            <Route path={ROUTES.MASTER_DATA.GENERAL_SETTINGS} element={<PlaceholderPage title="กำหนดตั้งค่าทั่วไป" />} />
            <Route path={ROUTES.MASTER_DATA.STANDARD_COST} element={<StandardCostList />} />
            <Route path={ROUTES.MASTER_DATA.PRICE_LEVEL} element={<PriceLevelList />} />
            <Route path={ROUTES.MASTER_DATA.PRICE_LIST} element={<PriceListList />} />
            <Route path={ROUTES.MASTER_DATA.IC_OPTION} element={<ICOptionList />} />

            {/* Sales Master Data */}
            <Route path={ROUTES.MASTER_DATA.SALES_AREA} element={<SalesAreaList />} />
            <Route path={ROUTES.MASTER_DATA.SALES_CHANNEL} element={<SalesChannelList />} />
            <Route path={ROUTES.MASTER_DATA.SALES_TARGET} element={<SalesTargetList />} />
            <Route path={ROUTES.MASTER_DATA.VENDOR_TYPE} element={<VendorTypeList />} />
            <Route path={ROUTES.MASTER_DATA.VENDOR_GROUP} element={<VendorGroupList />} />
            <Route path={ROUTES.MASTER_DATA.WAREHOUSE} element={<WarehouseList />} />
            <Route path={ROUTES.MASTER_DATA.PRODUCT_CATEGORY} element={<ProductCategoryList />} />
            <Route path={ROUTES.MASTER_DATA.ITEM_TYPE} element={<ItemTypeList />} />
            <Route path={ROUTES.MASTER_DATA.UOM} element={<UOMList />} />

            <Route path={ROUTES.MASTER_DATA.ITEM} element={<ItemMasterList />} />
            <Route path={ROUTES.MASTER_DATA.UOM_CONVERSION} element={<UOMConversionList />} />
            <Route path={ROUTES.MASTER_DATA.ITEM_BARCODE} element={<ItemBarcodeList />} />
            {/* New Inventory Master Routes */}
            <Route path={ROUTES.MASTER_DATA.ITEM_GROUP} element={<ItemGroupList />} />
            <Route path={ROUTES.MASTER_DATA.BRAND} element={<BrandList />} />
            <Route path={ROUTES.MASTER_DATA.PATTERN} element={<PatternList />} />
            <Route path={ROUTES.MASTER_DATA.DESIGN} element={<DesignList />} />
            <Route path={ROUTES.MASTER_DATA.GRADE} element={<GradeList />} />
            <Route path={ROUTES.MASTER_DATA.MODEL} element={<ModelList />} />
            <Route path={ROUTES.MASTER_DATA.SIZE} element={<SizeList />} />
            <Route path={ROUTES.MASTER_DATA.COLOR} element={<ColorList />} />
            <Route path={ROUTES.MASTER_DATA.LOCATION} element={<LocationList />} />
            <Route path={ROUTES.MASTER_DATA.SHELF} element={<ShelfList />} />
            <Route path={ROUTES.MASTER_DATA.LOT_NO} element={<LotNoList />} />
            <Route path={ROUTES.MASTER_DATA.CURRENCY_CODE} element={<CurrencyCodeList />} />
            <Route path={ROUTES.MASTER_DATA.CURRENCY_TYPE} element={<ExchangeRateTypeList />} />
            <Route path={ROUTES.MASTER_DATA.CURRENCY_RATE} element={<ExchangeRateList />} />
            
            {/* Tax Master Data */}
            <Route path={ROUTES.MASTER_DATA.TAX_CODE} element={<TaxCodeList />} />
            <Route path={ROUTES.MASTER_DATA.TAX_GROUP} element={<TaxGroupList />} />

            {/* Customer Master Data */}
            <Route path={ROUTES.MASTER_DATA.CUSTOMER} element={<CustomerList />} />
            <Route path={ROUTES.MASTER_DATA.CUSTOMER_BUSINESS_TYPE} element={<BusinessTypeList />} />
            <Route path={ROUTES.MASTER_DATA.CUSTOMER_TYPE} element={<CustomerTypeList />} />
            <Route path={ROUTES.MASTER_DATA.CUSTOMER_GROUP} element={<CustomerGroupList />} />
            <Route path={ROUTES.MASTER_DATA.CUSTOMER_BILLING_GROUP} element={<BillingGroupList />} />

            {/* Generic Coming Soon for Work in Progress */}
            <Route path="coming-soon" element={<ComingSoon />} />

            {/* ==================== IMPLEMENTED MODULES ==================== */}
            
            {/* Sales Module */}
            <Route path={ROUTES.SALES.DASHBOARD} element={<SalesDashboard />} />
            <Route path={ROUTES.SALES.INQUIRY} element={<InquiryListPage />} />
            <Route path={ROUTES.SALES.ESTIMATE} element={<EstimateListPage />} />
            <Route path={ROUTES.SALES.QUOTATION} element={<QuotationListPage />} />
            <Route path={ROUTES.SALES.QUOTATION_APPROVAL} element={<QuotationApproveListPage />} />
            <Route path={ROUTES.SALES.RESERVATION} element={<ReservationListPage />} />
            <Route path={ROUTES.SALES.ORDER} element={<SalesOrderListPage />} />
            <Route path={ROUTES.SALES.ORDER_APPROVAL} element={<SalesOrderApproveListPage />} />
            <Route path={ROUTES.SALES.DELIVERY} element={<DeliveryListPage />} />

            {/* ==================== INVENTORY MODULE ROUTES ==================== */}
            <Route path="inventory">
              <Route path="dashboard" element={<InventoryDashboard />} />
              <Route path="requisition" element={<RequisitionListPage />} />
              <Route path="requisition-approval" element={<RequisitionApprovalListPage />} />
              <Route path="issue" element={<IssueListPage />} />
              <Route path="return" element={<ReturnListPage />} />
              <Route path="transfer-requisition" element={<TransferListPage />} />
              <Route path="transfer-requisition-approval" element={<TransferApprovalListPage />} />
              <Route path="transfer-out" element={<TransferOutListPage />} />
              <Route path="transfer-in" element={<TransferInListPage />} />
            </Route>

            {/* ==================== PLACEHOLDER ROUTES ==================== */}
            
            {/* Procurement Placeholders */}
            {placeholderRoutes.procurement.map(({ path, title }) => (
              <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
            ))}

            {/* Inventory Placeholders (excluding implemented routes) */}
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
      <PermissionProvider>
        <AppContent />
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;