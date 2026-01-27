/**
 * @file MainLayout.tsx
 * @description Main application layout wrapper
 * @purpose Provides the common layout structure for all pages:
 *   - Left: Collapsible Sidebar navigation
 *   - Top: Header with breadcrumb, notifications, settings
 *   - Center: Main content area (renders child routes via Outlet)
 */

import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { WindowManagerProvider } from '../contexts/WindowManagerContext';
import { WindowManager } from '../components/shared/WindowManager';
import { PageLoader } from '../components/shared';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <WindowManagerProvider>
            <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
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
