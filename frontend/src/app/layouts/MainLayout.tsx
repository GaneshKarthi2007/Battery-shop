import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  RefreshCcw,
  Wrench,
  Package,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav } from "../components/ui/BottomNav";
import { useNotifications } from "../contexts/NotificationContext";
import { NotificationDropdown } from "../components/ui/NotificationDropdown";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Battery Sales", path: "/sales", icon: ShoppingCart },
  { name: "Battery Exchange", path: "/exchange", icon: RefreshCcw, roles: ["admin"] },
  { name: "Service Management", path: "/service", icon: Wrench },
  { name: "Inventory", path: "/inventory", icon: Package, roles: ["admin"] },
  { name: "Reports & Billing", path: "/reports", icon: FileText, roles: ["admin"] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Filter notifications based on user role for the badge
  const roleUnreadCount = notifications.filter(n => n.role === user?.role && !n.isRead).length;

  const isCheckoutPage = location.pathname === "/checkout" || location.pathname === "/upi-payment";

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Mobile/Tablet Header with Hamburger – hidden on checkout */}
      {!isCheckoutPage && (
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 px-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">PowerCell Pro</span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {roleUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {roleUnreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                      <p className="text-[10px] mt-1 uppercase font-bold text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                        {user?.role}
                      </p>
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className="block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile
                      </button>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out print:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">PowerCell Pro</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button
            onClick={() => {
              navigate('/profile');
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!isCheckoutPage && (
        <div className="print:hidden">
          <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
      )}
    </div>
  );
}
