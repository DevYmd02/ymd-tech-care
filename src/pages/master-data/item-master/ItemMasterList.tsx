import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; // Added hooks
import { 
    Edit2, Trash2, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { styles } from '@/constants/styles';
import { ItemMasterService } from '@/services/ItemMasterService'; // Added Service Import
import type { ItemListItem } from '@project-types/master-data-types';

export default function ItemMasterList() {
    const navigate = useNavigate();
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await ItemMasterService.getAll();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (id: string) => {
        navigate(`/master-data/item?id=${id}`);
    };

    const handleDelete = async (id: string, code: string) => {
        const result = await Swal.fire({
            title: 'คุณต้องการลบสินค้า?',
            text: `ต้องการลบรหัสสินค้า ${code} ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            background: '#1f2937',
            color: '#ffffff'
        });

        if (result.isConfirmed) {
            const success = await ItemMasterService.delete(id);
            if (success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ลบข้อมูลเรียบร้อยแล้ว!',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1f2937',
                    color: '#ffffff'
                });
                fetchData(); // Refresh list
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถลบข้อมูลได้',
                    background: '#1f2937',
                    color: '#ffffff'
                });
            }
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center text-gray-400"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className={styles.tableContainer}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className={styles.tableTh}>รหัสสินค้า</th>
                                <th className={styles.tableTh}>ชื่อสินค้า (ไทย)</th>
                                <th className={styles.tableTh}>ชื่อสินค้า (Eng)</th>
                                <th className={styles.tableTh}>หมวดหมู่</th>
                                <th className={styles.tableTh}>ประเภท</th>
                                <th className={styles.tableTh}>หน่วยนับ</th>
                                <th className={styles.tableTh}>สถานะ</th>
                                <th className={styles.tableTh + " text-center"}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.length > 0 ? (
                                items.map((item: ItemListItem) => (
                                    <tr key={item.item_id} className={styles.tableTr}>
                                        <td className={styles.tableTd}>
                                            <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleEdit(item.item_id)}>
                                                {item.item_code}
                                            </span>
                                        </td>
                                        <td className={styles.tableTd}>{item.item_name}</td>
                                        <td className={styles.tableTd}>{item.item_name_en || '-'}</td>
                                        <td className={styles.tableTd}>{item.category_name}</td>
                                        <td className={styles.tableTd}>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                {item.item_type_code || '-'}
                                            </span>
                                        </td>
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
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEdit(item.item_id)}
                                                    className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.item_id, item.item_code)}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        ไม่พบข้อมูลสินค้า
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Removed, using page navigation */}
        </div>
    );
}
