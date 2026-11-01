import { createBrowserRouter, Outlet } from "react-router";
import { Login } from "./pages/Login";
import { RoleBasedLayout } from "./layouts/RoleBasedLayout";
import { IndexRedirect } from "./pages/IndexRedirect";
import { BatterySales } from "./pages/BatterySales";
import { BatteryExchange } from "./pages/BatteryExchange";
import { ServiceManagement } from "./pages/ServiceManagement";
import { Inventory } from "./pages/Inventory";
import { ReportsHome } from "./pages/ReportsHome";
import { SalesReportPage } from "./pages/reports/SalesReportPage";
import { GstReportPage } from "./pages/reports/GstReportPage";
import { DailyReportPage } from "./pages/reports/DailyReportPage";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { Checkout } from "./pages/Checkout";
import BatteryInvoice from "./pages/BatteryInvoice";
import { ServiceDetails } from "./pages/ServiceDetails";
import { NewService } from "./pages/NewService";
import { AssignedJobs } from "./pages/AssignedJobs";
import { AvailableJobs } from "./pages/AvailableJobs";
import { CompletedJobs } from "./pages/CompletedJobs";
import { DeveloperSettings } from "./pages/DeveloperSettings";
import { UserManagement } from "./pages/UserManagement";
import { ErrorPage } from "./pages/ErrorPage";
import { UPIPayment } from "./pages/UPIPayment";
import { GpsCamera } from "./pages/GpsCamera";
import { GpsPhotoDashboard } from "./pages/GpsPhotoDashboard";
import { NotFound } from "./pages/NotFound";
import { WarrantyManagement } from "./pages/WarrantyManagement";
import { CustomerHistory } from "./pages/CustomerHistory";
import { Notifications } from "./pages/Notifications";
import { NotificationManagement } from "./pages/NotificationManagement";

import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MotionConfig transition={{ duration: 0 }}>
          <Outlet />
        </MotionConfig>
      </NotificationProvider>
    </AuthProvider>
  );
}

import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/login",
        Component: Login,
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <RoleBasedLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, Component: IndexRedirect },
          {
            path: "sales",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <BatterySales />
              </ProtectedRoute>
            ),
          },
          {
            path: "exchange",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <BatteryExchange />
              </ProtectedRoute>
            ),
          },
          {
            path: "service",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <ServiceManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "services/new",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <NewService />
              </ProtectedRoute>
            ),
          },
          { path: "service/:id", Component: ServiceDetails },
          {
            path: "assigned-jobs",
            element: (
              <ProtectedRoute allowedRoles={["staff"]}>
                <AssignedJobs />
              </ProtectedRoute>
            ),
          },
          {
            path: "available-jobs",
            element: (
              <ProtectedRoute allowedRoles={["staff"]}>
                <AvailableJobs />
              </ProtectedRoute>
            ),
          },
          {
            path: "completed-jobs",
            element: (
              <ProtectedRoute allowedRoles={["staff"]}>
                <CompletedJobs />
              </ProtectedRoute>
            ),
          },
          {
            path: "inventory",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <Inventory />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <ReportsHome />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/all",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SalesReportPage
                  reportType="All"
                  title="All Transactions Report"
                  description="Combined view of bills, exchanges, services & quotations"
                />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/sales",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SalesReportPage
                  reportType="Sale"
                  title="Bills / Sales Report"
                  description="Battery sale invoices with GST breakdown"
                />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/exchanges",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SalesReportPage
                  reportType="Exchange"
                  title="Battery Exchange Report"
                  description="Old-battery exchange records with transaction values"
                />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/services",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SalesReportPage
                  reportType="Service"
                  title="Service Job Report"
                  description="All service orders with charges and complaint types"
                />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/quotations",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SalesReportPage
                  reportType="Quotation"
                  title="Quotations Report"
                  description="All pending and converted quotation records"
                />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/gst",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <GstReportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports/daily",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <DailyReportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "warranty",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <WarrantyManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "customers",
            element: (
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <CustomerHistory />
              </ProtectedRoute>
            ),
          },
          { path: "settings", Component: Settings },
          {
            path: "users",
            element: (
              <ProtectedRoute allowedRoles={["admin", "developer"]}>
                <UserManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "developer",
            element: (
              <ProtectedRoute allowedRoles={["developer"]}>
                <DeveloperSettings />
              </ProtectedRoute>
            ),
          },
          {
            path: "developer/users",
            element: (
              <ProtectedRoute allowedRoles={["admin", "developer"]}>
                <UserManagement />
              </ProtectedRoute>
            ),
          },
          { path: "profile", element: <Profile /> },
          { path: "notifications", element: <Notifications /> },
          {
            path: "notification-management",
            element: (
              <ProtectedRoute allowedRoles={["admin", "developer"]}>
                <NotificationManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "notifications/manage",
            element: (
              <ProtectedRoute allowedRoles={["admin", "developer"]}>
                <NotificationManagement />
              </ProtectedRoute>
            ),
          },
          { path: "checkout", Component: Checkout },
          { path: "invoice", Component: BatteryInvoice },
          { path: "upi-payment", Component: UPIPayment },
          { path: "gps-camera", Component: GpsCamera },
          { path: "gps-photos", Component: GpsPhotoDashboard },
          { path: "*", Component: NotFound },
        ],
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
