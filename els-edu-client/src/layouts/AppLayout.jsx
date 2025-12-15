import React from 'react';
import { Notification } from 'react-admin';
import Menu from './Menu';

const AppLayout = ({ children }) => (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Sidebar Area - MyMenu handles its own width/collapse state */}
        <aside className="flex-shrink-0 h-full z-30 border-r border-border bg-card">
            <Menu />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col z-10 bg-background/50">
            <div className="flex-1 p-4 md:p-6 fade-in animate-in duration-300">
                {children}
            </div>
        </main>
        
        {/* React Admin Notification Toast */}
        <Notification />
    </div>
);

export default AppLayout;
