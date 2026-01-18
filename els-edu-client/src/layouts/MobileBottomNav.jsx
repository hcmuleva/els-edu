import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Building2,
  FileText,
  User,
  School,
  BarChart3,
  MoreHorizontal,
  X,
  Database,
} from "lucide-react";
import { useRoleNavigation } from "../hooks/useRoleNavigation";
import { cn } from "../lib/utils";
import { createPortal } from "react-dom";

const MobileBottomNav = () => {
  const location = useLocation();
  const { canAccess, getManageRoute } = useRoleNavigation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setActiveTab(location.pathname);
    setShowMoreMenu(false); // Close menu on navigation
  }, [location.pathname]);

  // Define all possible nav items
  const allNavItems = [
    {
      id: "dashboard",
      label: "Home",
      icon: LayoutDashboard,
      path: "/",
      show: canAccess("dashboard"),
    },
    {
      id: "classroom",
      label: "Classroom",
      icon: School,
      path: "/classroom",
      show: true, // Visible to everyone
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
      show: canAccess("analytics"),
    },
    {
      id: "browse-courses",
      label: "Browse",
      icon: BookOpen,
      path: "/browse-courses",
      show: canAccess("browse-courses"),
    },
    {
      id: "my-subscriptions",
      label: "Learning",
      icon: GraduationCap,
      path: "/my-subscriptions",
      show: canAccess("my-subscriptions"),
    },
    {
      id: "my-studio",
      label: "Studio",
      icon: BookOpen,
      path: "/my-contents",
      show: canAccess("my-studio"),
    },
    {
      id: "mongo-studio",
      label: "DB Studio",
      icon: Database,
      path: "/mongo-studio",
      show: canAccess("mongo-studio"),
    },
    {
      id: "manage",
      label: "Manage",
      icon: Settings,
      path: getManageRoute(),
      show: canAccess("manage"),
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      path: "/users",
      show: canAccess("users"),
    },
    {
      id: "all-orgs",
      label: "Orgs",
      icon: Building2,
      path: "/admin/orgs",
      show: canAccess("all-orgs"),
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: FileText,
      path: "/invoices",
      show: canAccess("invoices"),
    },
    // Adding Profile explicitly as requested/implied
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
      show: true, // Always show profile
    },
  ];

  // Filter visible items
  const navItems = allNavItems.filter((item) => item.show);

  // Logic for slicing items
  const MAX_VISIBLE = 5;
  const showMoreButton = navItems.length > 6; // If > 6, we show 5 + More = 6 slots

  const visibleItems = showMoreButton
    ? navItems.slice(0, MAX_VISIBLE)
    : navItems;
  const hiddenItems = showMoreButton ? navItems.slice(MAX_VISIBLE) : [];

  return (
    <>
      {/* More Menu Drawer */}
      {showMoreMenu &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
              onClick={() => setShowMoreMenu(false)}
            />
            {/* Drawer */}
            <div className="absolute bottom-28 left-4 right-4 bg-white rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="font-bold text-gray-900 text-lg">
                  More Options
                </h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {hiddenItems.map((item) => {
                  const isActive =
                    activeTab === item.path ||
                    (item.path !== "/" && activeTab.startsWith(item.path));

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      <item.icon size={24} />
                      <span className="text-xs font-bold text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg lg:hidden h-24 pb-safe">
        <div className="flex justify-around items-center h-full px-2">
          {visibleItems.map((item) => {
            const isActive =
              activeTab === item.path ||
              (item.path !== "/" && activeTab.startsWith(item.path));

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full group min-w-0"
              >
                <div
                  className={cn(
                    "absolute transition-all duration-300 ease-spring flex items-center justify-center",
                    isActive
                      ? "-translate-y-6 bg-primary text-primary-foreground shadow-lg shadow-primary/30 rounded-full p-3"
                      : "-translate-y-1 text-muted-foreground p-1",
                  )}
                >
                  <item.icon size={22} />
                </div>

                <span
                  className={cn(
                    "absolute text-[10px] uppercase tracking-wider font-bold transition-all duration-300 truncate max-w-full px-1",
                    isActive
                      ? "opacity-100 bottom-3 text-primary scale-110"
                      : "opacity-60 bottom-3 text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          {showMoreButton && (
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="relative flex flex-col items-center justify-center flex-1 h-full group min-w-0"
            >
              <div
                className={cn(
                  "absolute transition-all duration-300 ease-spring flex items-center justify-center",
                  showMoreMenu
                    ? "-translate-y-6 bg-gray-900 text-white shadow-lg rounded-full p-3"
                    : "-translate-y-1 text-muted-foreground p-1",
                )}
              >
                <MoreHorizontal size={22} />
              </div>

              <span
                className={cn(
                  "absolute text-[10px] uppercase tracking-wider font-bold transition-all duration-300 truncate max-w-full px-1",
                  showMoreMenu
                    ? "opacity-100 bottom-3 text-gray-900 scale-110"
                    : "opacity-60 bottom-3 text-muted-foreground",
                )}
              >
                More
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
