/**
 * @file ItemBarcodeList.tsx
 * @description หน้าแสดงรายการบาร์โค้ดสินค้า
 */

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { styles } from '@/constants/styles';
import { ItemBarcodeFormModal } from './ItemBarcodeFormModal';
import { mockItemBarcodes } from '@/__mocks__/masterDataMocks';

export default function ItemBarcodeList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const filteredItems = mockItemBarcodes.filter(item => 
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setEditId(null);
        setIsModalOpen(true);
    };

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
             {/* Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, บาร์โค้ด..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.input + " pl-10"}
                    />
                </div>
                <div className="flex gap-2">
                    <button className={styles.btnSecondary + " flex items-center gap-2"}>
                        <Filter size={18} />
                        Filter
                    </button>
                    <button 
                        onClick={handleAddNew}
                        className={styles.btnPrimary + " flex items-center gap-2"}
                    >
                        <Plus size={18} />
                        Add New
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className={styles.tableTh}>รหัสสินค้า</th>
                                <th className={styles.tableTh}>ชื่อสินค้า</th>
                                <th className={styles.tableTh}>บาร์โค้ด</th>
                                <th className={styles.tableTh}>หน่วย</th>
                                <th className={styles.tableTh}>บาร์โค้ดหลัก</th>
                                <th className={styles.tableTh + " text-right"}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.barcode_id} className={styles.tableTr}>
                                        <td className={styles.tableTd}>
                                            <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleEdit(item.barcode_id)}>
                                                {item.item_code}
                                            </span>
                                        </td>
                                        <td className={styles.tableTd}>{item.item_name}</td>
                                        <td className={styles.tableTd}>
                                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                {item.barcode}
                                            </code>
                                        </td>
                                        <td className={styles.tableTd}>{item.unit_name || '-'}</td>
                                        <td className={styles.tableTd}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                item.is_primary 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.is_primary ? 'หลัก' : 'รอง'}
                                            </span>
                                        </td>
                                        <td className={styles.tableTd}>
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(item.barcode_id)}
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
                                        ไม่พบข้อมูลบาร์โค้ด
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ItemBarcodeFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose} 
                editId={editId}
            />
        </div>
    );
}
