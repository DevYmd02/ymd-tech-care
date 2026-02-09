/**
 * @file MainLayout.tsx
 * @description Main application layout wrapper
 * @purpose Provides the common layout structure for all pages:
 *   - Left: Collapsible Sidebar navigation
 *   - Top: Header with breadcrumb, notifications, settings
 *   - Center: Main content area (renders child routes via Outlet)
 */

import { useState, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { WindowManagerProvider } from '@/core/contexts/WindowManagerContext';
import { WindowManager } from '@system/WindowManager';
import { PageLoader } from '@layout/PageLoader';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auto-collapse sidebar on smaller screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <WindowManagerProvider>
            <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200 relative z-0">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <Header 
                        isSidebarOpen={isSidebarOpen} 
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                    />

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                        <Suspense fallback={<PageLoader />}>
                            <Outlet />
                        </Suspense>
                    </main>
                </div>

                {/* Global Window Manager (Persistent Modals) */}
                <WindowManager />
            </div>
        </WindowManagerProvider>
    );
}
