
import { Loader2 } from 'lucide-react';

export function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] text-gray-500 animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
        </div>
    );
}
