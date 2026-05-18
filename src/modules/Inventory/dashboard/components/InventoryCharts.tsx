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
    Package,
    Activity,
    Layers,
    Sparkles,
} from 'lucide-react';
import { Card } from '@ui';

// ====================================================================================
// TYPES
// ====================================================================================

export interface StockFlowItem {
    month: string;
    inbound: number;
    outbound: number;
}

export interface CategoryValueItem {
    name: string;
    value: number;
    amount: number;
    color: string;
    [key: string]: string | number;
}

export interface ZoneCapacityItem {
    zone: string;
    used: number;
    free: number;
    utilization: number;
}

export interface FastMovingItem {
    id: string;
    code: string;
    name: string;
    picks: number;
    qty: number;
    location: string;
    speed: 'High' | 'Medium' | 'Low';
}

interface InventoryChartsProps {
    flowData: StockFlowItem[];
    categoryData: CategoryValueItem[];
    zoneData: ZoneCapacityItem[];
    fastMovingProducts: FastMovingItem[];
}

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-gray-700 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-slate-500 dark:text-gray-400 text-[10px] mb-1.5 font-bold uppercase tracking-wider">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs font-bold flex items-center gap-1.5" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: {entry.value.toLocaleString()} {entry.name.includes('มูลค่า') ? '฿' : 'ชิ้น'}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const FastMovingProductRow = ({ item }: { item: FastMovingItem }) => {
    const speedColors = {
        High: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
        Medium: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
        Low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    };

    return (
        <div className="flex items-center justify-between py-2 px-3 border-b border-gray-100 dark:border-gray-800/80 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all rounded-xl">
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
                        {item.code}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${speedColors[item.speed]}`}>
                        {item.speed} Velocity
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <span>ตำแหน่งจัดเก็บ:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{item.location}</span>
                </p>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-gray-900 dark:text-white">{item.qty.toLocaleString()} ชิ้น</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">เบิก {item.picks} ครั้ง/เดือน</p>
            </div>
        </div>
    );
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export const InventoryCharts: React.FC<InventoryChartsProps> = ({
    flowData,
    categoryData,
    zoneData,
    fastMovingProducts,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Inbound vs Outbound - Smooth Area Chart */}
            <Card className="lg:col-span-8 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            วิเคราะห์ความเร็วการรับ-จ่ายสินค้า (Inbound vs Outbound Velocity)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            อัตราความเร็วและทรูพุต (Throughput) ในการนำเข้าสินค้าเปรียบเทียบกับนำออกจากคลัง
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">รับเข้า (Inbound)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">จ่ายออก (Outbound)</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={flowData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-800" opacity={0.3} />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                tickFormatter={(val) => `${val.toLocaleString()} ชิ้น`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="inbound" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorInbound)" 
                                name="จำนวนสินค้าเข้า (Inbound)"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="outbound" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorOutbound)" 
                                name="จำนวนสินค้าจ่ายออก (Outbound)"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Stock Value by Category - Donut Chart */}
            <Card className="lg:col-span-4 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    สัดส่วนมูลค่าสินค้าตามหมวดหมู่
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    โครงสร้างและสัดส่วนทุนจมที่อยู่ในรูปแบบสต็อกสินค้า (Total Value)
                </p>
                <div className="flex-1 relative h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={4}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={1000}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Package className="w-7 h-7 text-indigo-500 mb-1" />
                        <span className="text-xl font-black text-gray-900 dark:text-white">฿45.28M</span>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black">มูลค่าคลังสินค้าทั้งหมด</span>
                    </div>
                </div>
                
                <div className="space-y-2 mt-4">
                    {categoryData.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-slate-100 dark:hover:bg-gray-800/50 transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-gray-900 dark:text-white">฿{(item.amount / 1000000).toFixed(2)}M</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1.5">({item.value}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Storage Efficiency by Zone - Bar Chart */}
            <Card className="lg:col-span-12 xl:col-span-7 border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            อัตราการหมุนเวียนสินค้าและพื้นที่ใช้งานตามโซน (Zone Stock Levels)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            สถิติมูลค่าสินค้าที่จัดเก็บแยกตามโซน และอัตราเปรียบเทียบการใช้งานพื้นที่จริง
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-full uppercase tracking-wider">
                        Real-time space
                    </span>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={zoneData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-800" opacity={0.3} />
                            <XAxis 
                                dataKey="zone" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                tickFormatter={(val) => `${val.toLocaleString()} Pallets`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="used" fill="#3b82f6" radius={[6, 6, 0, 0]} name="พื้นที่ใช้งานอยู่ (Used Pallets)" barSize={40} />
                            <Bar dataKey="free" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="พื้นที่ว่าง (Free Pallets)" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Fast Moving Items */}
            <Card className="lg:col-span-12 xl:col-span-5 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            สินค้าเบิกจ่ายบ่อยที่สุด (Fast-Moving Ranking)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            จัดอันดับกลุ่มสินค้าที่มีความเร็วในการเบิกออก (Picks) สูงสุด 5 ลำดับแรก
                        </p>
                    </div>
                    <button className="text-blue-500 hover:text-blue-600 text-xs font-bold flex items-center transition-all duration-200">
                        ดูอันดับทั้งหมด <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                    {fastMovingProducts.map((item) => (
                        <FastMovingProductRow key={item.id} item={item} />
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex-shrink-0">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                            การวิเคราะห์การเคลื่อนย้ายสินค้า (Movement Insight)
                        </p>
                        <h4 className="text-lg font-black mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" /> Slotting Optimization
                        </h4>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                            แนะนำให้โอนย้ายสินค้า <span className="font-bold text-white underline decoration-amber-300 decoration-2 underline-offset-4">{fastMovingProducts[0]?.name}</span> ไปไว้ที่ชั้นจัดเก็บแถวหน้าสุด (A1-03) เพื่อประหยัดเวลาการหยิบสินค้าลงได้สูงสุดถึง 18% ต่อครั้ง
                        </p>
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default InventoryCharts;
