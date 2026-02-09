import React from 'react';
import { Database } from 'lucide-react';

export const MasterDataHeader: React.FC = () => {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Database size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Master Data Management
                    </h1>
                    <p className="text-sm text-gray-500">
                        จัดการข้อมูลหลักสำหรับระบบจัดซื้อ - ครบถ้วนพร้อม Table Relationships
                    </p>
                </div>
            </div>
        </div>
    );
};
