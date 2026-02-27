import type { UseFormRegisterReturn } from 'react-hook-form';
import { Info, MoreHorizontal, Star, AlignLeft, History } from 'lucide-react';
import { TabPanel } from '@ui';

interface SharedRemarksTabProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    readOnly?: boolean;
    remarks?: string;
    onRemarksChange?: (value: string) => void;
    register?: UseFormRegisterReturn; 
    placeholder?: string;
    className?: string;
}

export const SharedRemarksTab: React.FC<SharedRemarksTabProps> = ({
    activeTab,
    onTabChange,
    readOnly = false,
    remarks,
    onRemarksChange,
    register,
    placeholder = "กรอกหมายเหตุเพิ่มเติม...",
    className = ""
}) => {
    const tabs = [
        { id: 'detail', label: 'Detail', icon: <Info size={16} /> },
        { id: 'more', label: 'More', icon: <MoreHorizontal size={16} /> },
        { id: 'rate', label: 'Rate', icon: <Star size={16} /> },
        { id: 'description', label: 'Description', icon: <AlignLeft size={16} /> },
        { id: 'history', label: 'History', icon: <History size={16} /> },
    ];

    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm';

    return (
        <div className={`${cardClass} ${className}`}>
            <div className="p-4">
                <TabPanel tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} variant="underline">
                    {activeTab === 'detail' && (
                        <div className="space-y-3">
                            <textarea
                                placeholder={placeholder}
                                rows={3}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white resize-none"
                                disabled={readOnly}
                                {...(register ? register : {
                                    value: remarks || '',
                                    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onRemarksChange?.(e.target.value)
                                })}
                            />
                        </div>
                    )}
                    {['more', 'rate', 'description', 'history'].includes(activeTab) && (
                        <div className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                            {tabs.find(t => t.id === activeTab)?.label} (พร้อมใช้งานเร็วๆ นี้)
                        </div>
                    )}
                </TabPanel>
            </div>
        </div>
    );
};
