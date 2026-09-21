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
  ClipboardList,
  History,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  LogOut,
  Sliders,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav } from "../components/ui/BottomNav";
import { useNotifications } from "../contexts/NotificationContext";

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
  { name: "Warranty Claims", path: "/warranty", icon: ShieldCheck, roles: ["admin"] },
  { name: "Customer Profiles", path: "/customers", icon: Users, roles: ["admin"] },
  { name: "Reports & Billing", path: "/reports", icon: FileText, roles: ["admin"] },
  { name: "Notification Control", path: "/notification-management", icon: Sliders },
  { name: "Settings", path: "/settings", icon: SettingsIcon },
];

const navGroups = [
  { title: "Overview", items: ["Dashboard"], roles: ["admin"] },
  { title: "Tasks", items: ["My Jobs", "Available Tasks", "Job History"], roles: ["staff"] },
  { title: "Management", items: ["Battery Sales", "Battery Exchange", "Service Management", "Inventory", "Warranty Claims", "Customer Profiles", "Reports & Billing"], roles: ["admin"] },
  { title: "System", items: ["Notification Control", "Settings"] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Auto-close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Swipe gesture handling for bottom nav
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { unreadCount } = useNotifications();

  const isNotificationPage = location.pathname === '/notifications';
  const isNotificationManagePage = location.pathname === '/notification-management';
  const isCheckoutPage = location.pathname === '/checkout';

  return (
    <div
      className="min-h-screen bg-[#F4F6F9] dark:bg-[#070A13] flex flex-col lg:flex-row relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sidebar System */}
      {isSidebarOpen && (
        <>
          {/* Mobile/Tablet Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Aside */}
          <aside
            className="fixed lg:sticky top-0 h-screen inset-y-0 left-0 bg-white dark:bg-[#0D1B2A] border-r border-gray-100 dark:border-[#2E3B55] z-50 flex flex-col rounded-r-3xl shadow-2xl lg:shadow-none print:hidden overflow-hidden"
          >
            <div className="w-72 flex flex-col h-screen overflow-hidden rounded-r-3xl">
              {/* Sidebar Header */}
              <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-50 dark:border-[#2E3B55]">
                <div 
                  onClick={() => {
                    navigate("/");
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-90"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center bg-black">
                    <img src="/smr.jpeg" alt="SMR Battery Shop Logo" className="w-full h-full object-cover" />
                  </div>
                  <h1 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter text-base">SMR <span className="text-green-500">BATTERY</span></h1>
                </div>
              </div>

              {/* Sidebar Links */}
              <div className="flex-1 overflow-y-auto p-4 py-6 space-y-8 custom-scrollbar">
                {navGroups
                  .filter(group => !group.roles || group.roles.includes(user?.role || ""))
                  .map((group) => (
                    <div key={group.title} className="space-y-2">
                      <h3 className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.25em] mb-4">
                        {group.title}
                      </h3>
                      <div className="space-y-1">
                        {navItems
                          .filter(item => group.items.includes(item.name))
                          .map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  navigate(item.path);
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold ${
                                  isActive
                                    ? "bg-blue-600 text-white font-black"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#25334D] hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                                  <span>{item.name}</span>
                                </div>
                                {isActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sidebar User Card */}
              <div className="p-4 border-t border-gray-100 dark:border-[#2E3B55] bg-gray-50/50 dark:bg-white/[0.01]">
                <div
                  className="p-4 bg-white dark:bg-[#15161E] border border-gray-100 dark:border-[#2E3B55] rounded-2xl shadow-sm group cursor-pointer hover:shadow-md hover:border-blue-100 dark:hover:border-blue-500/20"
                  onClick={() => {
                    navigate('/profile');
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLogoutConfirm(true);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:text-gray-700 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Dynamic Responsive Header */}
        {!isCheckoutPage && (
          <header
            className="h-16 bg-white/80 dark:bg-[#0D1B2A]/70 border-b border-gray-200 dark:border-[#2E3B55] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between print:hidden"
          >
            <div className="flex items-center gap-3">
              {user?.role !== "staff" && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <div 
                onClick={() => navigate("/")}
                className={`flex items-center gap-3 cursor-pointer hover:opacity-90 ${user?.role === "staff" ? "" : "ml-2 lg:hidden"}`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center bg-black">
                  <img src="/smr.jpeg" alt="SMR Battery Shop Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-gray-900 dark:text-gray-100 text-base sm:block uppercase tracking-tighter">SMR <span className="text-green-500">BATTERY</span></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell Button -> Directly Navigates to /notifications Page */}
              <div className="relative flex items-center">
                <button
                  onClick={() => navigate('/notifications')}
                  className={`relative p-2 rounded-xl group ${
                    isNotificationPage ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title="Notifications Page"
                >
                  <div className="relative">
                    <Bell
                      className={`w-6 h-6 ${
                        isNotificationPage || isNotificationManagePage
                          ? "fill-black text-black"
                          : "text-gray-900 dark:text-white stroke-[2]"
                      }`}
                    />

                    {/* Unread badge counter */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#0D1B2A]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </button>

                {/* Notification Management Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/notification-management');
                  }}
                  className={`-ml-2.5 -mt-3.5 z-10 p-1 rounded-full border shadow-xs ${
                    isNotificationManagePage
                      ? "bg-black text-white border-black ring-2 ring-black/20"
                      : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                  title="Notification Control & Settings"
                >
                  <Sliders className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              {user?.role === "staff" && (
                <>
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                    title="Profile"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </header>
        )}

        {/* Dynamic Centered Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 print:p-0">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Global Bottom Navigation */}
        {!isCheckoutPage && user?.role !== "staff" && !isSidebarOpen && (
          <div className="print:hidden lg:hidden">
            <BottomNav onMenuClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setShowLogoutConfirm(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            className="bg-white dark:bg-[#0D1B2A] border border-gray-250 dark:border-[#2E3B55] rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100 dark:border-red-900/30">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
              Sign Out?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">
              Are you sure you want to sign out of your account?
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-[#161D30] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate("/login");
                }}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
