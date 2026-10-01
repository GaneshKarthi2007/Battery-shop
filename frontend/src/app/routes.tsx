import { createBrowserRouter, Outlet } from "react-router";
import { Login } from "./pages/Login";
import { RoleBasedLayout } from "./layouts/RoleBasedLayout";
import { IndexRedirect } from "./pages/IndexRedirect";
import { BatterySales } from "./pages/BatterySales";
import { BatteryExchange } from "./pages/BatteryExchange";
import { ServiceManagement } from "./pages/ServiceManagement";
import { Inventory } from "./pages/Inventory";
import { Reports } from "./pages/Reports";
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

import { ManagerDashboard } from "./pages/ManagerDashboard";

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
            path: "manager",
            element: (
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            ),
          },
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
              <ProtectedRoute allowedRoles={["admin"]}>
                <Reports />
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
