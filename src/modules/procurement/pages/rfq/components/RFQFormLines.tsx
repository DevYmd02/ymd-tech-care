import React from 'react';
import { FileText } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import type { RFQFormValues } from '@/modules/procurement/schemas/rfq-schemas';

interface RFQFormLinesProps {
    readOnly?: boolean;
    isInviteMode?: boolean;
}

export const RFQFormLines: React.FC<RFQFormLinesProps> = ({
    readOnly,
    isInviteMode,
}) => {
    const { register, control, formState: { errors } } = useFormContext<RFQFormValues>();
    const { fields } = useFieldArray({
        control,
        name: 'rfqLines'
    });

    const isLocked = readOnly || isInviteMode;

    // Locked styles for inherited PR data
    const lockedInputCenter = "w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed";
    const lockedInputLeft = "w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-left cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed";
    const editableInput = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all dark:text-white";

    return (
        <div className="p-4" id="lines">
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <FileText size={18} />
                    <span className="font-semibold">รายการสินค้า - Line RFQ (Request for Quotation)</span>
                </div>


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

                        </tr>
                    </thead>
                    <tbody>
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <FileText size={20} className="opacity-40 text-purple-600" />
                                        <span className="font-medium text-xs">กรุณาเลือก PR ต้นทางที่อนุมัติแล้ว เพื่อแสดงรายละเอียดสินค้า</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            fields.map((field, index) => (
                                <tr key={field.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-3 py-1.5 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 font-medium border-r border-gray-200 dark:border-gray-700">
                                        {index + 1}
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        <input
                                            type="text"
                                            {...register(`rfqLines.${index}.item_code`)}
                                            readOnly
                                            className={lockedInputCenter}
                                            placeholder="รหัสสินค้า"
                                        />
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        <input
                                            type="text"
                                            placeholder="รายละเอียดสินค้า"
                                            {...register(`rfqLines.${index}.description`)}
                                            readOnly
                                            className={lockedInputLeft}
                                        />
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700 p-1">
                                        <input
                                            type="number"
                                            {...register(`rfqLines.${index}.qty`, { valueAsNumber: true })}
                                            readOnly
                                            className={lockedInputCenter}
                                        />
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700 p-1">
                                        <input
                                            type="text"
                                            {...register(`rfqLines.${index}.uom`)}
                                            readOnly
                                            className={lockedInputCenter}
                                            placeholder="หน่วย"
                                        />
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        <input
                                            type="date"
                                            {...register(`rfqLines.${index}.target_delivery_date`)}
                                            className={`${editableInput} ${errors.rfqLines?.[index]?.target_delivery_date ? 'border-red-500' : ''}`}
                                            disabled={isLocked}
                                            onClick={(e) => { if (!isLocked && 'showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); }}
                                        />
                                    </td>
                                    <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        <input
                                            type="text"
                                            placeholder="หมายเหตุถึงผู้ขาย"
                                            {...register(`rfqLines.${index}.note_to_vendor`)}
                                            className={(isLocked ? lockedInputLeft : editableInput).replace('text-sm', 'text-xs')}
                                            disabled={isLocked}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};