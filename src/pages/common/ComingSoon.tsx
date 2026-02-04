import { Construction } from 'lucide-react';

interface ComingSoonProps {
    title?: string;
}

export default function ComingSoon({ title = 'Coming Soon' }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full mb-4">
                <Construction size={48} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                This feature is currently under development. Stay tuned for updates!
            </p>
        </div>
    );
}
