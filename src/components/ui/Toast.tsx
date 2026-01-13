import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning'; // เผื่ออนาคตอยากเปลี่ยนสี
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'error' }) => {
  // กำหนดสีตามประเภท (เผื่ออนาคต)
  const borderColors = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500'
  };
  
  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 bg-white border-l-4 ${borderColors[type]} shadow-xl rounded-md p-4 flex items-start space-x-3 animate-bounce-in transition-all`}>
       <AlertCircle className={iconColors[type]} size={24} />
       <div>
          <h4 className="font-bold text-gray-800 text-sm">แจ้งเตือนระบบ</h4>
          <p className="text-gray-600 text-xs">{message}</p>
       </div>
       <button onClick={onClose} type="button">
         <X size={16} className="text-gray-400 hover:text-gray-600"/>
       </button>
    </div>
  );
};