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
  Menu as MenuIcon,
} from "lucide-react";
import { useRoleNavigation } from "../hooks/useRoleNavigation";
import { cn } from "../lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { canAccess, getManageRoute } = useRoleNavigation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  useEffect(() => {
    setActiveTab(location.pathname);
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
      id: "browse-courses",
      label: "Browse",
      icon: BookOpen,
      path: "/browse-courses",
      show: canAccess("browse-courses"),
    },
    {
      id: "my-subscriptions",
      label: "My Learning",
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg lg:hidden h-24 pb-safe">
      <div className="flex justify-around items-center h-full px-2">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.path ||
            (item.path !== "/" && activeTab.startsWith(item.path));

          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full group"
            >
              <div
                className={cn(
                  "absolute transition-all duration-300 ease-spring",
                  isActive
                    ? "-translate-y-5 bg-primary text-primary-foreground shadow-lg shadow-primary/30 rounded-full p-3"
                    : "translate-y-0 text-muted-foreground p-2"
                )}
              >
                <item.icon size={isActive ? 20 : 22} />
              </div>

              <span
                className={cn(
                  "absolute bottom-2 text-[10px] font-bold transition-all duration-300 truncate max-w-full px-1",
                  isActive
                    ? "opacity-100 translate-y-0 text-primary"
                    : "opacity-0 translate-y-2"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
