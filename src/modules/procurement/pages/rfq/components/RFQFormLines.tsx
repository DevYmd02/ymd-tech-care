import React from 'react';
import { FileText, Plus, Trash2, Search } from 'lucide-react';
import type { RFQLineFormData } from '@/modules/procurement/types/rfq-types';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

interface RFQFormLinesProps {
    lines: RFQLineFormData[];
    units: UnitListItem[];
    handleLineChange: (index: number, field: keyof RFQLineFormData, value: string | number) => void;
    handleAddLine: () => void;
    handleRemoveLine: (index: number) => void;
    handleOpenProductSearch: (index: number) => void;
}

export const RFQFormLines: React.FC<RFQFormLinesProps> = ({
    lines,
    units,
    handleLineChange,
    handleAddLine,
    handleRemoveLine,
    handleOpenProductSearch
}) => {
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";
    const selectStyle = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white";

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <FileText size={18} />
                <span className="font-semibold">รายการสินค้า - Line RFQ (Request for Quotation)</span>
            </div>

            <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                <table className="w-full min-w-[900px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                    <thead className="bg-purple-600 text-white text-xs">
                        <tr>
                            <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-14">ลำดับ</th>
                            <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-36">รหัสสินค้า</th>
                            <th className="px-3 py-2 text-left font-medium border-r border-purple-500">รายละเอียด</th>
                            <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-20">จำนวน</th>
                            <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-24">หน่วย</th>
                            <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-32">วันที่ต้องการ</th>
                            <th className="px-3 py-2 text-left font-medium border-r border-purple-500 w-32">หมายเหตุ</th>
                            <th className="px-3 py-2 text-center font-medium w-20">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-3 py-1.5 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 font-medium border-r border-gray-200 dark:border-gray-700">
                                    {line.line_no}
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={line.item_code}
                                            onChange={(e) => handleLineChange(index, 'item_code', e.target.value)}
                                            className={`${inputStyle} text-center`}
                                            placeholder="รหัสสินค้า"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleOpenProductSearch(index)}
                                            className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors shadow-sm"
                                        >
                                            <Search size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <input
                                        type="text"
                                        placeholder="รายละเอียดสินค้า"
                                        value={line.item_description}
                                        onChange={(e) => handleLineChange(index, 'item_description', e.target.value)}
                                        className={`${inputStyle} text-left`}
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <input
                                        type="number"
                                        min="0"
                                        value={line.required_qty || 0}
                                        onChange={(e) => handleLineChange(index, 'required_qty', parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <select
                                        value={line.uom}
                                        onChange={(e) => handleLineChange(index, 'uom', e.target.value)}
                                        className={selectStyle}
                                    >
                                        <option value="">เลือก</option>
                                        {units.map(unit => (
                                            <option key={unit.unit_id} value={unit.unit_name}>{unit.unit_name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <input
                                        type="date"
                                        value={line.required_date}
                                        onChange={(e) => handleLineChange(index, 'required_date', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-400"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <input
                                        type="text"
                                        placeholder="หมายเหตุ"
                                        value={line.remarks}
                                        onChange={(e) => handleLineChange(index, 'remarks', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-400"
                                    />
                                </td>
                                <td className="px-1 py-1 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button type="button" onClick={handleAddLine} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                                            <Plus size={16} />
                                        </button>
                                        <button type="button" onClick={() => handleRemoveLine(index)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};