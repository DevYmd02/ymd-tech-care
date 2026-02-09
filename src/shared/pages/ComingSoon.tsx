
import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';


export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Construction size={48} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This page is currently under development. We are working hard to bring you this feature.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
