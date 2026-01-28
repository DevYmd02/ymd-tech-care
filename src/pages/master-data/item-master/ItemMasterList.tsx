// ItemMasterList.tsx
import { useState } from 'react';
import { 
    Edit2, Trash2
} from 'lucide-react';
import { styles } from '@/constants/styles';
import { ItemMasterFormModal } from './ItemMasterFormModal';
import type { ItemListItem } from '@project-types/master-data-types';

interface ItemMasterListProps {
    data: ItemListItem[];
}

export default function ItemMasterList({ data }: ItemMasterListProps) {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const handleEdit = (id: string) => {
        setEditId(id);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditId(null);
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className={styles.tableContainer}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className={styles.tableTh}>รหัสสินค้า</th>
                                <th className={styles.tableTh}>ชื่อสินค้า</th>
                                <th className={styles.tableTh}>หมวดหมู่</th>
                                <th className={styles.tableTh}>หน่วยนับ</th>
                                <th className={styles.tableTh}>สถานะ</th>
                                <th className={styles.tableTh + " text-right"}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data.length > 0 ? (
                                data.map((item) => (
                                    <tr key={item.item_id} className={styles.tableTr}>
                                        <td className={styles.tableTd}>
                                            <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleEdit(item.item_id)}>
                                                {item.item_code}
                                            </span>
                                        </td>
                                        <td className={styles.tableTd}>{item.item_name}</td>
                                        <td className={styles.tableTd}>{item.category_name}</td>
                                        <td className={styles.tableTd}>{item.unit_name}</td>
                                        <td className={styles.tableTd}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                item.is_active 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className={styles.tableTd}>
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(item.item_id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        ไม่พบข้อมูลสินค้า
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ItemMasterFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose} 
                editId={editId}
            />
        </div>
    );
}
