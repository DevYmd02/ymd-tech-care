import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { 
    ChevronRight, 
    CheckCircle, 
    XCircle 
} from 'lucide-react';
import { Card } from '@ui';

export interface VendorPieItem {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

export interface TrendItem {
    month: string;
    value: number;
    [key: string]: string | number;
}

export interface LeadTimeItem {
    process: string;
    days: number;
    [key: string]: string | number;
}

interface ProcurementChartsProps {
    vendorPieData: VendorPieItem[];
    trendData: TrendItem[];
    leadTimeData: LeadTimeItem[];
    pendingApprovals: {
        id: string;
        type: string;
        requester: string;
        approver: string;
        amount: number;
    }[];
}

function ApprovalItem({ id, type, requester, approver, amount }: {
    id: string;
    type: string;
    requester: string;
    approver: string;
    amount: number;
}) {
    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-3 last:mb-0">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        type === 'PR' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                                       : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                    }`}>
                        {type}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{id}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">฿{amount.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ผู้ขอ: {requester}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">ผู้อนุมัติ: {approver}</p>
            <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> อนุมัติ
                </button>
                <button className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                </button>
            </div>
        </div>
    );
}

export const ProcurementCharts: React.FC<ProcurementChartsProps> = ({
    vendorPieData,
    trendData,
    leadTimeData,
    pendingApprovals,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Vendor Distribution */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ยอดซื้อแยกตามผู้ขาย (YTD)</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-full sm:w-[60%] min-w-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={vendorPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    isAnimationActive={true}
                                    animationDuration={600}
                                    animationEasing="ease-in-out"
                                >
                                    {vendorPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value?: string | number) => [`${value}%`, 'สัดส่วน']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="w-full sm:w-[40%] space-y-2">
                        {vendorPieData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: item.color }} 
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                    {item.name} {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Line Chart - Monthly Trend */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">แนวโน้มยอดซื้อ (7 เดือนล่าสุด)</h3>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} tickFormatter={(value: number) => `${(value / 1000000).toFixed(1)}M`} />
                            <Tooltip 
                                formatter={(value?: string | number) => [`฿${Number(value || 0).toLocaleString()}`, 'ยอดซื้อ']}
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#8b5cf6" 
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                name="ยอดซื้อ"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Bar Chart - Lead Time Analysis */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">วิเคราะห์ Lead Time (วัน)</h3>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leadTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis dataKey="process" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Bar dataKey="days" fill="#22c55e" name="จำนวนวัน" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Pending Approvals */}
            <Card className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">งานรออนุมัติ</h3>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                    <div className="space-y-3">
                        {pendingApprovals.map((item, index) => (
                            <ApprovalItem key={index} {...item} />
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProcurementCharts;


