/**
 * @file MainLayout.tsx
 * @description Main application layout wrapper
 * @purpose Provides the common layout structure for all pages:
 *   - Left: Collapsible Sidebar navigation
 *   - Top: Header with breadcrumb, notifications, settings
 *   - Center: Main content area (renders child routes via Outlet)
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
