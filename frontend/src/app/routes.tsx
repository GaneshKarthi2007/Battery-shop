import { createBrowserRouter, Outlet, useNavigation, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { BatterySales } from "./pages/BatterySales";
import { BatteryExchange } from "./pages/BatteryExchange";
import { ServiceManagement } from "./pages/ServiceManagement";
import { Inventory } from "./pages/Inventory";
import { Reports } from "./pages/Reports";
import { Profile } from "./pages/Profile";
import { BatteryLoader } from "./components/ui/BatteryLoader";
import { Checkout } from "./pages/Checkout";
import BatteryInvoice from "./pages/BatteryInvoice";
import { ServiceDetails } from "./pages/ServiceDetails";
import { NewService } from "./pages/NewService";
import { ErrorPage } from "./pages/ErrorPage";
import { UPIPayment } from "./pages/UPIPayment";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load sync
    const handleLoad = () => setIsLoading(false);

    if (document.readyState === "complete") {
      setIsLoading(false);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  useEffect(() => {
    // Route change sync
    setIsLoading(true);
    // We keep a small delay to ensure the "zap" animation is at least partially seen
    // but we can reduce it if the content loads faster. 
    // For React Router, this is mostly a visual feedback for the user.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isRouterLoading = navigation.state === "loading" || navigation.state === "submitting";
  const showLoader = isLoading || isRouterLoading;

  return (
    <AuthProvider>
      <NotificationProvider>
        {showLoader && <BatteryLoader />}
        <Outlet />
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
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, Component: Dashboard },
          { path: "sales", Component: BatterySales },
          {
            path: "exchange",
            element: (
              <ProtectedRoute allowedRoles={["admin"]}>
                <BatteryExchange />
              </ProtectedRoute>
            ),
          },
          { path: "service", Component: ServiceManagement },
          { path: "services/new", Component: NewService },
          { path: "service/:id", Component: ServiceDetails },
          {
            path: "inventory",
            element: (
              <ProtectedRoute allowedRoles={["admin"]}>
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
          { path: "profile", element: <Profile /> },
          { path: "checkout", Component: Checkout },
          { path: "invoice", Component: BatteryInvoice },
          { path: "upi-payment", Component: UPIPayment },
        ],
      },
    ],
  },
]);
