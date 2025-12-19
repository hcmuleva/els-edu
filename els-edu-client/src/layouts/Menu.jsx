import {
  Menu,
  usePermissions,
  useGetIdentity,
  useNotify,
  useAuthProvider,
  useSidebarState,
} from "react-admin";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  ChevronDown,
  LogOut,
  User,
  ChevronRight,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronUp,
  FileText,
  Building2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Portal Dropdown Component to avoid clipping
const PortalDropdown = ({
  trigger,
  children,
  align = "right",
  width = "w-56",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calculate position: bottom-right of trigger
      // If align is right, we align the right edge of dropdown with right edge of trigger
      // But since trigger is small, we usually want it to pop "up" and "right" or "up" and "left" depending on space.
      // For sidebar at bottom: pop UP.

      // Simple logic: auto-detect if we are too low
      const isBottomHalf = rect.top > window.innerHeight / 2;

      setCoords({
        top: isBottomHalf ? "auto" : rect.top,
        bottom: isBottomHalf ? window.innerHeight - rect.top : "auto",
        left: rect.right + 10, // Always pop to the right of the sidebar
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        // We need to check if click is inside the portal content, but that's hard to ref since it's in a portal.
        // A simple hack is to use a scrim or check specific class.
        // For now, let's rely on a backdrop overlay.
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="cursor-pointer h-full w-full"
      >
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] isolate"
            style={{ zIndex: 9999 }}
          >
            <div
              className="absolute inset-0 bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            <div
              className={cn(
                "absolute bg-popover text-popover-foreground rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95",
                width
              )}
              style={{
                top: coords.top === "auto" ? "auto" : `${coords.top}px`,
                bottom:
                  coords.bottom === "auto" ? "auto" : `${coords.bottom - 10}px`,
                left: `${coords.left}px`,
              }}
            >
              <div className="p-1 space-y-1">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// Dropdown Item
const DropdownItem = ({
  icon: Icon,
  label,
  onClick,
  className,
  variant = "default",
}) => (
  <div
    onClick={(e) => {
      e.stopPropagation();
      if (onClick) onClick();
    }}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
      variant === "destructive"
        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
        : "text-foreground/80 hover:text-foreground hover:bg-muted",
      className
    )}
  >
    {Icon && <Icon size={16} />}
    <span>{label}</span>
  </div>
);

const CustomMenuItem = ({
  to,
  primaryText,
  leftIcon,
  isOpen,
  className,
  ...props
}) => {
  const location = useLocation();
  const isSelected = location?.pathname === to;

  return (
    <Menu.Item
      to={to}
      primaryText={isOpen ? primaryText : null}
      leftIcon={
        <div
          className={cn(
            "transition-colors duration-200 flex items-center justify-center",
            isSelected
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          )}
        >
          {leftIcon}
        </div>
      }
      className={cn(
        "transition-all duration-200 border border-transparent group overflow-hidden whitespace-nowrap",
        "hover:bg-primary/5",
        isSelected && "bg-primary/10 border-primary/10 shadow-sm",
        // Expanded: margins, padding, height auto
        isOpen && "mx-3 px-3 my-1 rounded-xl min-h-[44px]",
        // Collapsed: fixed square 40px (w-10), centered, no padding
        !isOpen &&
          "mx-auto w-10 h-10 my-1 rounded-xl p-0 flex justify-center items-center",
        className
      )}
      sx={{
        minHeight: isOpen ? "44px" : "40px", // Match height class
        color: "inherit",
        justifyContent: isOpen ? "flex-start" : "center",
        padding: isOpen ? undefined : "0px", // Explicitly remove all padding
        "& .MuiListItemIcon-root": {
          minWidth: "auto",
          marginRight: isOpen ? "12px" : "0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: isOpen ? "auto" : "100%", // Full width in collapsed item to center icon
        },
        "& .MuiTypography-root": {
          fontFamily: "inherit",
          fontSize: "0.9rem",
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? "var(--primary)" : "inherit",
          display: isOpen ? "block" : "none",
        },
        "&.Mui-selected": {
          backgroundColor: "transparent",
        },
        "&.Mui-selected:hover": {
          backgroundColor: "transparent",
        },
      }}
      {...props}
    />
  );
};

// SubMenu Component
const SubMenu = ({ label, icon: Icon, children, isOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Auto-expand if a child is active
  useEffect(() => {
    if (isOpen) {
      // Check if any child path matches current location
      // This is a simple heuristic; ideally children props would be inspected or a matchPath used
      // For now, we rely on manual toggle or user state, but let's default to closed unless we want auto-open
    }
  }, [location.pathname, isOpen]);

  if (!isOpen) {
    // Collapsed state: Portal Dropdown
    return (
      <div className="mx-auto w-10 h-10 my-1 flex justify-center">
        <PortalDropdown
          width="w-48"
          trigger={
            <div
              className="w-full h-full flex items-center justify-center rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title={label}
            >
              <Icon size={20} />
            </div>
          }
        >
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            {label}
          </div>
          {children}
        </PortalDropdown>
      </div>
    );
  }

  // Expanded state: Accordion
  return (
    <div className="mx-3 my-1">
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors group",
          "hover:bg-primary/5 text-muted-foreground hover:text-primary"
        )}
      >
        <div className="min-w-[32px] flex justify-center mr-2">
          <Icon size={20} />
        </div>
        <span className="flex-1 text-[0.9rem] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
        )}
      >
        <div className="pl-2 border-l-2 border-border/50 ml-4 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, isOpen }) => {
  if (!isOpen) {
    return (
      <div className="my-1 border-t border-border/50 w-6 mx-auto opacity-50" />
    );
  }
  return (
    <div className="px-6 mt-6 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 whitespace-nowrap overflow-hidden">
      {title}
    </div>
  );
};

const AppMenu = (props) => {
  const { permissions } = usePermissions();
  const { data: identity, isLoading } = useGetIdentity();
  const notify = useNotify();
  const authProvider = useAuthProvider();
  const [open, setOpen] = useSidebarState();

  const isTeacherOrAdmin = ["TEACHER", "ADMIN", "SUPERADMIN"].includes(
    permissions
  );

  if (isLoading) return null;

  // Parse assigned_roles from JSON field
  // assigned_roles can be: JSON string, array of strings, or array of objects
  const parseAssignedRoles = (assignedRoles) => {
    if (!assignedRoles) return [];

    try {
      // If it's a string, parse it
      let parsed =
        typeof assignedRoles === "string"
          ? JSON.parse(assignedRoles)
          : assignedRoles;

      // If it's an array
      if (Array.isArray(parsed)) {
        // If array contains objects with 'role' property
        if (
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          parsed[0].role
        ) {
          return parsed.map((r) => r.role);
        }
        // If array contains strings directly
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          return parsed;
        }
      }

      return [];
    } catch (e) {
      console.error("Error parsing assigned_roles:", e);
      return [];
    }
  };

  // Get roles from assigned_roles JSON field
  const assignedRolesArray = parseAssignedRoles(identity?.assigned_roles);

  // Combine with current permissions
  const availableRoles = [...assignedRolesArray];
  if (permissions && !availableRoles.includes(permissions)) {
    availableRoles.push(permissions);
  }

  // Also include user_role if it exists and is not already in the list
  if (identity?.user_role && !availableRoles.includes(identity.user_role)) {
    availableRoles.push(identity.user_role);
  }
  console.log("identity", identity);
  const uniqueRoles = [...new Set(availableRoles)];

  const handleRoleSwitch = async (newRole) => {
    if (newRole === permissions) return;
    try {
      await authProvider.switchRole(newRole);
      notify("Role switched successfully. Reloading...", { type: "success" });
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error(error);
      notify(error.message || "Error switching role", { type: "error" });
    }
  };

  const handleLogout = async () => {
    try {
      await authProvider.logout();
      // No notification needed - redirect happens immediately
    } catch (error) {
      notify("Error logging out", { type: "error" });
    }
  };

  const toggleSidebar = () => setOpen(!open);

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-card/50 backdrop-blur-xl border-r border-border transition-all duration-300 relative",
        open ? "w-64" : "w-20"
      )}
    >
      {/* Branding Header */}
      <div
        className={cn(
          "h-16 flex items-center mb-2 transition-all duration-300 shrink-0 overflow-hidden",
          open ? "px-6 justify-start" : "justify-center px-0"
        )}
      >
        {/* Branding */}
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            open ? "gap-3" : "gap-0"
          )}
        >
          {/* Standardized sized logo container: w-10 h-10 to match menu items */}
          <div className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
            K
          </div>
          {/* Explicit width/opacity transition for text to prevent layout jumping */}
          <div
            className={cn(
              "transition-all duration-300 overflow-hidden",
              open ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            <span className="text-xl font-heading font-bold text-foreground tracking-tight whitespace-nowrap">
              ELS Kids
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
        <Menu
          {...props}
          className="w-full"
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: open ? "stretch" : "center",
            "&.RaMenu-closed": {
              width: "100%",
              alignItems: "center",
            },
          }}
        >
          <SectionHeader title="Main" isOpen={open} />
          <CustomMenuItem
            to="/"
            primaryText="Dashboard"
            leftIcon={<LayoutDashboard size={20} />}
            isOpen={open}
          />
          <CustomMenuItem
            to="/manage"
            primaryText="Manage"
            leftIcon={<Settings size={20} />}
            isOpen={open}
          />
          {permissions === "SUPERADMIN" && (
            <CustomMenuItem
              to="/admin/orgs"
              primaryText="All Orgs"
              leftIcon={<Building2 size={20} />}
              isOpen={open}
            />
          )}
          <CustomMenuItem
            to="/users"
            primaryText="Users"
            leftIcon={<Users size={20} />}
            isOpen={open}
          />
          <CustomMenuItem
            to="/invoices"
            primaryText="Invoices"
            leftIcon={<FileText size={20} />}
            isOpen={open}
          />

          <SectionHeader title="Learning" isOpen={open} />
          <CustomMenuItem
            to="/my-subscriptions"
            primaryText="My Subscriptions"
            leftIcon={<GraduationCap size={20} />}
            isOpen={open}
          />
          <CustomMenuItem
            to="/browse-courses"
            primaryText="Browse Courses"
            leftIcon={<BookOpen size={20} />}
            isOpen={open}
          />
          <CustomMenuItem
            to="/progress"
            primaryText="My Progress"
            leftIcon={<GraduationCap size={20} />}
            isOpen={open}
          />

          {isTeacherOrAdmin && (
            <CustomMenuItem
              to="/my-contents"
              primaryText="My Studio"
              leftIcon={<BookOpen size={20} />}
              isOpen={open}
            />
          )}
        </Menu>
      </div>

      {/* Footer Area: Toggle + User Profile */}
      <div className="mt-auto flex flex-col shrink-0 w-full overflow-hidden">
        {/* Collapse Toggle - Moved to bottom */}
        <div
          className={cn(
            "px-4 pb-4 pt-2 border-border/50 flex transition-all duration-300",
            open ? "justify-start" : "justify-center"
          )}
        >
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex items-center gap-2 rounded-lg hover:bg-secondary/10 transition-colors text-muted-foreground hover:text-primary",
              "border border-transparent hover:border-border/50",
              // Unified w-10 h-10 for toggle in collapsed mode
              open
                ? "px-3 py-2 w-full min-h-[40px]"
                : "w-10 h-10 justify-center p-0"
            )}
            title={open ? "Minimize Sidebar" : "Expand Sidebar"}
          >
            {open ? (
              <>
                <ChevronLeft size={20} />
                <span className="text-sm font-medium">Minimize</span>
              </>
            ) : (
              <MenuIcon size={20} />
            )}
          </button>
        </div>

        {/* User Footer */}
        <div
          className={cn(
            "border-t border-border/50 bg-card/30 transition-all duration-300",
            open ? "p-4" : "p-3"
          )}
        >
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              open ? "gap-3" : "justify-center gap-0"
            )}
          >
            <div className="flex-1 min-w-0">
              <PortalDropdown
                trigger={
                  <div
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group",
                      "hover:bg-secondary/20",
                      !open && "justify-center p-0"
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          identity?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                            identity?.fullName || "User"
                          }`
                        }
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>

                    {/* User Text Info - strictly hidden/width-0 when collapsed */}
                    <div
                      className={cn(
                        "flex-1 min-w-0 text-left transition-all duration-300 overflow-hidden",
                        open ? "w-auto opacity-100" : "w-0 opacity-0 hidden"
                      )}
                    >
                      <h4 className="text-sm font-bold text-foreground truncate leading-none mb-0.5">
                        {identity?.fullName || "User"}
                      </h4>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">
                        {permissions || "Guest"}
                      </p>
                    </div>

                    {open && (
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                      />
                    )}
                  </div>
                }
              >
                <div className="px-3 py-3 border-b border-border/50 mb-1 bg-muted/20">
                  <p className="text-sm font-bold text-foreground truncate">
                    {identity?.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground opacity-80 truncate">
                    {identity?.email}
                  </p>
                </div>

                <div className="py-1">
                  <DropdownItem
                    icon={User}
                    label="Profile"
                    onClick={() => notify("Profile clicked")}
                  />
                  <DropdownItem
                    icon={Settings}
                    label="Settings"
                    onClick={() => notify("Settings clicked")}
                  />
                </div>

                {uniqueRoles.length > 1 && (
                  <div className="border-t border-border/50 my-1 pt-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Switch Role
                    </p>
                    {uniqueRoles.map((role) => (
                      <DropdownItem
                        key={role}
                        icon={role === permissions ? ChevronRight : null}
                        label={role}
                        className={
                          role === permissions
                            ? "bg-primary/5 text-primary"
                            : ""
                        }
                        onClick={() => handleRoleSwitch(role)}
                      />
                    ))}
                  </div>
                )}
                <div className="border-t border-border/50 my-1"></div>
                <DropdownItem
                  icon={LogOut}
                  label="Logout"
                  variant="destructive"
                  onClick={handleLogout}
                />
              </PortalDropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppMenu;
