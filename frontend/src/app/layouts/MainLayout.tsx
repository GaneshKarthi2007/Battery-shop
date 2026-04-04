import { useState, useRef, useEffect } from "react";
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
  Menu,
  X,
  Zap,
  ClipboardList,
  History,
  Settings as SettingsIcon,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin"] },
  { name: "My Jobs", path: "/assigned-jobs", icon: Wrench, roles: ["staff"] },
  { name: "Available Tasks", path: "/available-jobs", icon: ClipboardList, roles: ["staff"] },
  { name: "Job History", path: "/completed-jobs", icon: History, roles: ["staff"] },
  { name: "Battery Sales", path: "/sales", icon: ShoppingCart, roles: ["admin"] },
  { name: "Battery Exchange", path: "/exchange", icon: RefreshCcw, roles: ["admin"] },
  { name: "Service Management", path: "/service", icon: Wrench, roles: ["admin"] },
  { name: "Inventory", path: "/inventory", icon: Package, roles: ["admin"] },
  { name: "Reports & Billing", path: "/reports", icon: FileText, roles: ["admin"] },
  { name: "Settings", path: "/settings", icon: SettingsIcon },
];

const navGroups = [
  { title: "Overview", items: ["Dashboard"], roles: ["admin"] },
  { title: "Tasks", items: ["My Jobs", "Available Tasks", "Job History"], roles: ["staff"] },
  { title: "Management", items: ["Battery Sales", "Battery Exchange", "Service Management", "Inventory", "Reports & Billing"], roles: ["admin"] },
  { title: "System", items: ["Settings"] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Swipe gesture handling for bottom nav
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Swipe paths dynamically configured based on role visibility
  const swipePaths = user?.role === "admin"
    ? ["/", "/sales", "/service"]
    : ["/assigned-jobs", "/available-jobs", "/completed-jobs"];

  const isSwipeablePath = swipePaths.includes(location.pathname);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    if ((isSidebarOpen && window.innerWidth < 768) || !isSwipeablePath || isCheckoutPage) return;

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;

      const currentIndex = swipePaths.indexOf(location.pathname);

      if (isLeftSwipe && currentIndex < swipePaths.length - 1) {
        navigate(swipePaths[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        navigate(swipePaths[currentIndex - 1]);
      }
    }
  };

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const roleUnreadCount = notifications.filter(n => n.role === user?.role && !n.isRead).length;
  const isCheckoutPage = location.pathname === "/checkout" || location.pathname === "/upi-payment";

  // Toggle Sidebar Wrapper
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Reusable Nav Link Component
  const NavLink = ({ item, index }: { item: NavItem; index: number }) => {
    const Icon = item.icon;
    const active = isActivePath(item.path);

    return (
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        onClick={() => {
          navigate(item.path);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all relative group ${
          active ? "bg-blue-600/5 dark:bg-blue-500/[0.08] text-blue-700 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-all duration-300 ${active ? "bg-white dark:bg-blue-900/40 shadow-sm text-blue-600 ring-1 ring-blue-100 dark:ring-blue-800" : "text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className={`text-sm font-bold tracking-tight ${active ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>{item.name}</span>
        </div>

        {active && (
          <motion.div
            layoutId="navIndicator"
            className="absolute left-0 w-1 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          />
        )}

        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${active ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-50 -translate-x-2 group-hover:opacity-40 group-hover:scale-100 group-hover:translate-x-0"}`} />
      </motion.button>
    );
  };

  return (
    <div
      className="flex min-h-screen bg-[#f8f9fc] dark:bg-[#05050a] transition-colors duration-500"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sidebar System */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Mobile/Tablet Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar Aside */}
            <motion.aside
              initial={{ x: -288, width: 0, opacity: 0.5 }}
              animate={{ x: 0, width: 288, opacity: 1 }}
              exit={{ x: -288, width: 0, opacity: 0.5 }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className={`fixed lg:sticky top-0 h-screen inset-y-0 left-0 bg-white dark:bg-[#0D1B2A] border-r border-gray-100 dark:border-[#2E3B55] z-50 flex flex-col shadow-2xl lg:shadow-none print:hidden overflow-hidden`}
            >
              {/* Inner fixed-width container prevents content squishing during animation */}
              <div className="w-72 flex flex-col h-screen overflow-hidden">
                {/* Sidebar Header */}
                <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-50 dark:border-[#2E3B55]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">PowerCell <span className="text-blue-600">Pro</span></h1>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Sidebar Links */}
              <div className="flex-1 overflow-y-auto p-4 py-6 space-y-8 custom-scrollbar">
                {navGroups
                  .filter(group => !group.roles || group.roles.includes(user?.role || ""))
                  .map((group, gIdx) => (
                    <div key={group.title} className="space-y-2">
                      <h3 className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.25em] mb-4">
                        {group.title}
                      </h3>
                      <div className="space-y-1">
                        {navItems
                          .filter(item => group.items.includes(item.name))
                          .map((item, iIdx) => (
                            <NavLink key={item.path} item={item} index={gIdx * 5 + iIdx} />
                          ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sidebar User Card */}
              <div className="p-4 border-t border-gray-100 dark:border-[#2E3B55] bg-gray-50/50 dark:bg-white/[0.01]">
                <div
                  className="p-4 bg-white dark:bg-[#15161E] border border-gray-100 dark:border-[#2E3B55] rounded-2xl shadow-sm group cursor-pointer hover:shadow-md hover:border-blue-100 dark:hover:border-blue-500/20 transition-all active:scale-[0.98]"
                  onClick={() => navigate('/profile')}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 transition-transform group-hover:scale-105">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#15161E] rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate uppercase tracking-tighter">
                        {user?.name || 'Power User'}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">
                        {user?.role || 'Guest'}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-blue-500 dark:text-gray-700 dark:group-hover:text-blue-400 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Dynamic Responsive Header */}
        {!isCheckoutPage && (
          <header
            className="h-16 bg-white/80 dark:bg-[#0D1B2A]/70 backdrop-blur-2xl border-b border-gray-200 dark:border-[#2E3B55] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between print:hidden"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-all active:scale-95"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3 ml-2 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-gray-900 dark:text-gray-100 text-lg sm:block uppercase tracking-tighter">PowerCell <span className="text-blue-600">Pro</span></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {roleUnreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#05050a]">
                      {roleUnreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Centered Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 transition-all duration-500">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Global Bottom Navigation (Conditional) */}
        {!isCheckoutPage && (
          <div className="print:hidden lg:hidden">
            <BottomNav onMenuClick={toggleSidebar} />
          </div>
        )}
      </div>
    </div>
  );
}
