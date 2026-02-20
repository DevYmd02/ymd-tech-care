import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { RFQLineFormData } from '@/modules/procurement/types/rfq-types';

interface RFQFormLinesProps {
    lines: RFQLineFormData[];
    handleLineChange: (index: number, field: keyof RFQLineFormData, value: string | number) => void;
    handleRemoveLine: (index: number) => void;
}

export const RFQFormLines: React.FC<RFQFormLinesProps> = ({
    lines,
    handleLineChange,
    handleRemoveLine,
}) => {

    // Locked styles for inherited PR data
    const lockedInputCenter = "w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium";
    const lockedInputLeft = "w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-left cursor-not-allowed font-medium";

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
                                            readOnly
                                            className={lockedInputCenter}
                                            placeholder="รหัสสินค้า"
                                        />
                                    </div>
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                    <input
                                        type="text"
                                        placeholder="รายละเอียดสินค้า"
                                        value={line.item_description}
                                        readOnly
                                        className={lockedInputLeft}
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700 p-1">
                                    <input
                                        type="text"
                                        value={line.required_qty || 0}
                                        readOnly
                                        className={lockedInputCenter}
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700 p-1">
                                    <input
                                        type="text"
                                        value={line.uom}
                                        readOnly
                                        className={lockedInputCenter}
                                        placeholder="หน่วย"
                                    />
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
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveLine(index)} 
                                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-colors"
                                            title="ลบรายการนี้ออกจากการขอใบเสนอราคา (ไม่ลบออกจาก PR)"
                                        >
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