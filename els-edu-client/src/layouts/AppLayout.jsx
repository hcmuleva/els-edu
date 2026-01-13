import React from "react";
import { Link } from "react-router-dom";
import { Notification } from "react-admin";
import Menu from "./Menu";
import MobileBottomNav from "./MobileBottomNav";
import ScrollToTopButton from "../components/common/ScrollToTopButton";

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen w-full bg-background relative lg:h-screen">
    {/* Mobile Header Bar - Fixed top, only visible on mobile/tablet */}
    <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-primary pt-safe shadow-md">
      <div className="h-12 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center p-1">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ELS</span>
        </Link>
      </div>
    </header>

    {/* Sidebar Area - Hidden on mobile/tablet, visible on large screens */}
    <aside className="hidden lg:flex flex-shrink-0 h-screen z-30 border-r border-border bg-card">
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
    <Notification />
  </div>
);

export default AppLayout;
