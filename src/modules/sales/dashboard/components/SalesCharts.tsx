import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { 
    TrendingUp, 
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { Card } from '@ui';

// ====================================================================================
// TYPES
// ====================================================================================

export interface SalesTrendItem {
    month: string;
    revenue: number;
    target: number;
}

export interface ChannelDataItem {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

export interface TopProductItem {
    id: string;
    name: string;
    orders: number;
    revenue: number;
    growth: number;
}

interface SalesChartsProps {
    trendData: SalesTrendItem[];
    channelData: ChannelDataItem[];
    topProducts: TopProductItem[];
}

// ====================================================================================
// SUB-COMPONENTS
// =================================================================)===

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-700 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-slate-500 dark:text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wider">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: ฿{entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ProductItem = ({ product }: { product: TopProductItem }) => (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg">
        <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{product.orders} รายการ (Orders)</p>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-gray-900 dark:text-white">฿{product.revenue.toLocaleString()}</p>
            <p className={`text-xs flex items-center justify-end font-medium ${product.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {product.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(product.growth)}%
            </p>
        </div>
    </div>
);

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export const SalesCharts: React.FC<SalesChartsProps> = ({
    trendData,
    channelData,
    topProducts,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Trend - Main Area Chart */}
            <Card className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">วิเคราะห์ยอดขายและเป้าหมาย (Sales & Target)</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ภาพรวมรายได้รายเดือนเปรียบเทียบกับเป้าหมายที่กำหนด</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">รายได้ (Revenue)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">เป้าหมาย (Target)</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-800" opacity={0.5} />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                name="รายได้จริง (Actual Revenue)"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="target" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorTarget)" 
                                name="เป้าหมายยอดขาย (Sales Target)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Sales by Channel - Donut Chart */}
            <Card className="lg:col-span-4 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">รายได้แยกตามช่องทาง (Revenue by Channel)</h3>
                <div className="flex-1 relative h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={channelData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={105}
                                paddingAngle={5}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={1000}
                            >
                                {channelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <TrendingUp className="w-8 h-8 text-emerald-500 mb-1" />
                        <span className="text-2xl font-black text-gray-900 dark:text-white">100%</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">ยอดขายรวม (Total Sales)</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                    {channelData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{item.name}</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">{item.value}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Performance Breakdown - Mixed Chart */}
            <Card className="lg:col-span-12 xl:col-span-7">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        ประสิทธิภาพรายสัปดาห์ (Weekly Performance)
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase">Live</span>
                    </h3>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData.slice(-4)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-800" opacity={0.5} />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="ยอดขายจริง (Actual Sales)" barSize={40} />
                            <Bar dataKey="target" fill="#f59e0b" radius={[6, 6, 0, 0]} name="คาดการณ์ (Forecast)" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Top performing items */}
            <Card className="lg:col-span-12 xl:col-span-5 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">สินค้าที่ขายดีที่สุด (Top Performing)</h3>
                    <button className="text-blue-500 hover:text-blue-600 text-xs font-bold flex items-center duration-200">
                        ดูอันดับทั้งหมด (View Ranking) <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                </div>
                <div className="flex-1 space-y-1">
                    {topProducts.map((product) => (
                        <ProductItem key={product.id} product={product} />
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">สินค้าดาวเด่น (Winning Product)</p>
                        <h4 className="text-xl font-black mb-2">{topProducts[0]?.name}</h4>
                        <div className="flex items-end justify-between">
                            <div className="flex items-center text-2xl font-black">
                                <ArrowUpRight className="w-6 h-6 mr-1" />
                                {topProducts[0]?.growth}%
                            </div>
                            <p className="text-xs opacity-90 font-medium">ผลงานดีกว่าตลาด (Outperforming) 24%</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SalesCharts;
