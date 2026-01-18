import React from "react";
import { Link } from "react-router-dom";
import { Notification, useSidebarState } from "react-admin";
import Menu from "./Menu";
import MobileBottomNav from "./MobileBottomNav";
import ScrollToTopButton from "../components/common/ScrollToTopButton";
import NotificationBell from "../components/common/NotificationBell";
import { ClassProvider } from "../contexts/ClassContext";
import { useMediaQuery } from "@mui/material";

const AppLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1024px)");
  const [open] = useSidebarState();

  return (
    <div className="flex min-h-screen w-full bg-background relative lg:h-screen">
      <ClassProvider>
        {/* Mobile Header Bar - Fixed top, only visible on mobile/tablet */}
        <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-primary pt-safe shadow-md">
          <div className="h-12 flex items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                ELS
              </span>
            </Link>

            {/* Mobile Notification Bell */}
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
              <NotificationBell iconSize={18} />
            </div>
          </div>
        </header>

        {/* Sidebar Area - Hidden on mobile/tablet, visible on large screens */}
        <aside
          className={`hidden lg:flex flex-shrink-0 h-screen z-30 border-r border-border bg-card transition-all duration-300 ${
            open ? "w-64" : "w-20"
          }`}
        >
          <Menu />
        </aside>

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto relative flex flex-col z-10 bg-background lg:h-screen lg:pb-0 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:mt-0 mt-[calc(3rem+env(safe-area-inset-top,0px))]"
        >
          <div className="flex-1 px-4 py-2 md:px-8 md:py-6 fade-in animate-in duration-300">
            {children}
          </div>

          {/* Floating Scroll Button */}
          <ScrollToTopButton containerSelector="#main-content" />
        </main>

        {/* Mobile Bottom Navigation - Visible on mobile/tablet only */}
        <MobileBottomNav />

        {/* React Admin Notification Toast */}
        <Notification
          anchorOrigin={
            isMobile
              ? { vertical: "top", horizontal: "right" }
              : { vertical: "bottom", horizontal: "left" }
          }
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "rgba(31, 41, 55, 0.95)", // dark gray with opacity
              backdropFilter: "blur(8px)",
              borderRadius: "16px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "4px 8px",
              marginBottom: isMobile ? "0" : "24px",
              marginLeft: isMobile ? "0" : "24px",
              marginTop: isMobile ? "12px" : "0",
              marginRight: isMobile ? "12px" : "0",
            },
            "& .MuiSnackbarContent-message": {
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#fff",
            },
            "& .MuiSnackbarContent-action": {
              color: "rgba(255, 255, 255, 0.7)",
            },
          }}
        />
      </ClassProvider>
    </div>
  );
};

export default AppLayout;
