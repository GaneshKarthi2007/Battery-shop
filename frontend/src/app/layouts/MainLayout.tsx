import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Menu,
  ChevronRight,
  Users,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav } from "../components/ui/BottomNav";
import { useNotifications } from "../contexts/NotificationContext";

interface SubItem {
  name: string;
  path: string;
  roles?: string[];
}

interface MenuItem {
  name: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: string[];
  subItems?: SubItem[];
  isLogout?: boolean;
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Management: true,
    Configuration: false,
    "Task Management": false,
  });

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

  // Auto-expand group if current route is inside it
  useEffect(() => {
    const currentPath = location.pathname;
    setOpenGroups((prev) => {
      const updated = { ...prev };
      if (
        [
          "/sales",
          "/exchange",
          "/service",
          "/services/new",
          "/inventory",
          "/warranty",
          "/customers",
        ].some((p) => currentPath.startsWith(p))
      ) {
        updated["Management"] = true;
      }
      if (
        ["/users", "/settings", "/notification-management", "/profile"].some((p) =>
          currentPath.startsWith(p)
        )
      ) {
        updated["Configuration"] = true;
      }
      if (
        ["/assigned-jobs", "/available-jobs", "/completed-jobs"].some((p) =>
          currentPath.startsWith(p)
        )
      ) {
        updated["Task Management"] = true;
      }
      return updated;
    });
  }, [location.pathname]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Menu items configured to match reference sidebar
  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["admin", "manager"],
    },
    {
      name: "Task Management",
      icon: ClipboardList,
      roles: ["staff"],
      subItems: [
        { name: "My Jobs", path: "/assigned-jobs" },
        { name: "Available Tasks", path: "/available-jobs" },
        { name: "Job History", path: "/completed-jobs" },
      ],
    },
    {
      name: "Management",
      roles: ["admin", "manager"],
      subItems: [
        { name: "Battery Sales", path: "/sales", roles: ["admin", "manager"] },
        { name: "Battery Exchange", path: "/exchange", roles: ["admin", "manager"] },
        { name: "Service Management", path: "/service", roles: ["admin", "manager"] },
        { name: "New Service Request", path: "/services/new", roles: ["admin", "manager"] },
        { name: "Stock Inventory", path: "/inventory", roles: ["admin", "manager"] },
        { name: "Warranty Claims", path: "/warranty", roles: ["admin", "manager"] },
        { name: "Customer Management", path: "/customers", roles: ["admin", "manager"] },
      ],
    },
    {
      name: "Configuration",
      subItems: [
        { name: "User Management", path: "/users", roles: ["admin", "developer"] },
        { name: "Settings", path: "/settings" },
        { name: "Notification Control", path: "/notification-management", roles: ["admin", "developer"] },
        { name: "Profile", path: "/profile" },
      ],
    },
    {
      name: "Report Home",
      path: "/reports",
      icon: FileText,
      roles: ["admin", "manager"],
    },
    {
      name: "Logout",
      icon: LogOut,
      isLogout: true,
    },
  ];

  // Swipe gesture handling for bottom nav
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const swipePaths = (user?.role === "admin" || user?.role === "manager")
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

  const isNotificationPage = location.pathname === "/notifications";
  const isCheckoutPage = location.pathname === "/checkout";

  return (
    <div
      className="min-h-screen bg-[#F4F6F9] dark:bg-[#070A13] flex flex-col relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 1. Top Enterprise Blue Header Bar */}
      {!isCheckoutPage && (
        <header className="h-14 bg-[#1976D2] text-white sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-md print:hidden">
          {/* Left: Hamburger Menu + Software Title + Fiscal Year */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-95"
            >
              <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                SMR Battery Software
              </span>
              <span className="text-blue-100 font-medium text-xs sm:text-sm pl-2 border-l border-white/20">
                2026 – 2027
              </span>
            </div>
          </div>

          {/* Right: Active Users + Notifications Bell Only (Profile, Notification Settings, and Logout moved to Configuration/Sidebar) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Active Users Indicator */}
            <button
              onClick={() => {
                if (user?.role === "admin" || user?.role === "developer") {
                  navigate("/users");
                } else {
                  navigate("/settings");
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              title="Active Users"
            >
              <div className="relative flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#1976D2]" />
              </div>
              <span className="hidden sm:inline">Active users</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate("/notifications")}
              className={`relative p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors ${
                isNotificationPage ? "bg-white/20" : ""
              }`}
              title="Notifications"
            >
              <div className="relative">
                <Bell className="w-5 h-5 stroke-[2]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full ring-2 ring-[#1976D2]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </header>
      )}

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex min-w-0 relative">
        {/* Sidebar System */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Mobile/Tablet Backdrop */}
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Sidebar Aside */}
              <motion.aside
                key="sidebar"
                variants={{
                  hidden: {
                    x: "-100%",
                    transition: { duration: 0.18, ease: "easeIn" },
                  },
                  visible: {
                    x: 0,
                    transition: { type: "spring", stiffness: 300, damping: 30 },
                  },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed lg:sticky top-14 h-[calc(100vh-3.5rem)] inset-y-0 left-0 bg-white dark:bg-[#0D1B2A] border-r border-gray-200 dark:border-[#2E3B55] z-30 flex flex-col shadow-xl lg:shadow-none print:hidden overflow-hidden w-64 shrink-0"
              >
                <div className="w-64 flex flex-col h-full overflow-hidden">
                  {/* Clean Navigation Menu Items */}
                  <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {menuItems
                      .filter((item) => !item.roles || item.roles.includes(user?.role || ""))
                      .map((item, idx) => {
                        const Icon = item.icon;
                        const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                        const isExpanded = openGroups[item.name];
                        const isDirectActive = item.path ? location.pathname === item.path : false;
                        const isChildActive = hasSub && item.subItems?.some((sub) => location.pathname === sub.path);
                        const isActive = isDirectActive || isChildActive;

                        return (
                          <div key={`${item.name}-${idx}`} className="w-full">
                            {/* Main Item Row */}
                            <button
                              onClick={() => {
                                if (item.isLogout) {
                                  setShowLogoutConfirm(true);
                                } else if (hasSub) {
                                  toggleGroup(item.name);
                                } else if (item.path) {
                                  navigate(item.path);
                                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-[13.5px] transition-colors text-left ${
                                item.isLogout
                                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium"
                                  : isActive
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] text-[#1976D2] dark:text-blue-400 font-semibold"
                                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#151D2C]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {Icon && (
                                  <Icon
                                    className={`w-4 h-4 shrink-0 ${
                                      item.isLogout
                                        ? "text-red-500"
                                        : isActive
                                        ? "text-[#1976D2] dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400"
                                    }`}
                                  />
                                )}
                                <span className="truncate">{item.name}</span>
                              </div>

                              {/* Right Chevron for expandable categories */}
                              {hasSub && (
                                <div className="text-gray-400 dark:text-gray-500 shrink-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </div>
                              )}
                            </button>

                            {/* Expandable Submenu */}
                            {hasSub && isExpanded && (
                              <div className="bg-gray-50/70 dark:bg-[#0A121E]/60 border-y border-gray-100 dark:border-gray-800 py-1">
                                {item.subItems
                                  ?.filter((sub) => !sub.roles || sub.roles.includes(user?.role || ""))
                                  .map((sub) => {
                                    const isSubActive = location.pathname === sub.path;
                                    return (
                                      <button
                                        key={sub.name}
                                        onClick={() => {
                                          navigate(sub.path);
                                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                        }}
                                        className={`w-full text-left pl-9 pr-4 py-2 text-xs transition-colors flex items-center justify-between ${
                                          isSubActive
                                            ? "text-[#1976D2] dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/40"
                                        }`}
                                      >
                                        <span>{sub.name}</span>
                                        {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-[#1976D2]" />}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Sidebar User Info Card with Logout at Bottom */}
                  <div className="p-3 border-t border-gray-200 dark:border-[#2E3B55] bg-gray-50 dark:bg-white/[0.02] flex items-center justify-between">
                    <div
                      onClick={() => {
                        navigate("/profile");
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#1976D2] dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {user?.name ? user.name.charAt(0) : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {user?.name || "Power User"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                          {user?.role || "Staff"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Centered Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-4 pb-16 lg:pb-4 print:p-0 min-w-0">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Bottom Navigation on Mobile */}
      {!isCheckoutPage && user?.role !== "staff" && !isSidebarOpen && (
        <div className="print:hidden lg:hidden">
          <BottomNav onMenuClick={toggleSidebar} />
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 bg-black/60" />
          <div className="bg-white dark:bg-[#0D1B2A] border border-gray-250 dark:border-[#2E3B55] rounded-3xl p-7 max-w-sm w-full relative z-10 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sign Out?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate("/login");
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-xs"
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
