import React from "react";
import { Link } from "react-router-dom";
import { Notification } from "react-admin";
import Menu from "./Menu";
import MobileBottomNav from "./MobileBottomNav";
import ScrollToTopButton from "../components/common/ScrollToTopButton";

const AppLayout = ({ children }) => (
  <div className="flex h-screen w-full bg-background overflow-hidden relative">
    {/* Mobile Header Bar - Fixed top, only visible on mobile/tablet */}
    <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-primary h-12 flex items-center px-4 shadow-md">
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
    </header>

    {/* Sidebar Area - Hidden on mobile/tablet, visible on large screens */}
    <aside className="hidden lg:flex flex-shrink-0 h-full z-30 border-r border-border bg-card">
      <Menu />
    </aside>

    {/* Main Content Area */}
    <main
      id="main-content"
      className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col z-10 bg-background pb-32 lg:pb-0 mt-12 lg:mt-0"
    >
      <div className="flex-1 p-4 md:p-6 fade-in animate-in duration-300">
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
