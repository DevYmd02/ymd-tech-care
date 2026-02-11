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
import { Card } from '@/shared/components/ui/Card';

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
}

export const ProcurementCharts: React.FC<ProcurementChartsProps> = ({
    vendorPieData,
    trendData,
    leadTimeData,
}) => {
    return (
        <>
            {/* Charts Row */}
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
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
        </>
    );
};

export default ProcurementCharts;
