/**
 * @file ProcurementCharts.tsx
 * @description คอมโพเนนต์แสดงผลแผนภูมิและรายการติดตามสำหรับ Procurement Module
 * @updated ดีไซน์ระดับ Premium ERP พร้อม Custom Glassmorphic Tooltips และการจัดรูปแบบพรีเมียม
 */

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { 
    ChevronRight, 
    Sparkles, 
    Clock, 
    Package,
    ShoppingCart,
    TrendingUp,
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

export interface FollowUpItem {
    id: string;
    vendor: string;
    deliveryDate: string;
    status: string;
    daysLeft: number;
}

interface ProcurementChartsProps {
    vendorPieData: VendorPieItem[];
    trendData: TrendItem[];
    leadTimeData: LeadTimeItem[];
    followUpList: FollowUpItem[];
}

// Custom Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-slate-500 dark:text-gray-400 text-[10px] mb-1.5 font-bold uppercase tracking-wider">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs font-black flex items-center gap-1.5" style={{ color: entry.color }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: {entry.value >= 10000 ? `฿${entry.value.toLocaleString()}` : `${entry.value} วัน`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Follow-up card row component
function FollowUpCardRow({ id, vendor, deliveryDate, status, daysLeft }: FollowUpItem) {
    const isOverdue = daysLeft < 0;
    const isDueToday = daysLeft === 0;

    const badgeColors = isOverdue
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
        : isDueToday
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';

    return (
        <div className="p-3.5 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800/80 hover:border-indigo-100 dark:hover:border-indigo-950 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${badgeColors}`}>
                            {status}
                        </span>
                        <span className="font-mono text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3 text-indigo-500" /> {id}
                        </span>
                    </div>
                    <span className={`text-[10px] font-black ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isOverdue 
                            ? `⚠️ เกินกำหนด ${Math.abs(daysLeft)} วัน` 
                            : isDueToday 
                            ? '⏰ ครบกำหนดวันนี้' 
                            : `⚡ อีก ${daysLeft} วัน`
                        }
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{vendor}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>กำหนดส่งมอบ:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{deliveryDate}</span>
                </p>
            </div>
            
            <div className="mt-3 flex gap-2">
                <button className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1">
                    <span>เร่งด่วน/ติดตามสินค้า</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export const ProcurementCharts: React.FC<ProcurementChartsProps> = ({
    vendorPieData,
    trendData,
    leadTimeData,
    followUpList,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Monthly Trend - High-tech Smooth Area Chart */}
            <Card className="lg:col-span-8 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            แนวโน้มยอดการสั่งซื้อสะสม (Procurement Trend Analysis)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            สถิติมูลค่าการทำรายการจัดซื้อสะสมรายเดือน (7 เดือนล่าสุด) เพื่อประเมินทิศทางงบประมาณ
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">ยอดการจัดซื้อสุทธิ (Net Purchase)</span>
                    </div>
                </div>
                
                <div className="flex-1 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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
                                tickFormatter={(value: number) => `฿${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#6366f1" 
                                strokeWidth={3.5}
                                fillOpacity={1} 
                                fill="url(#colorPurchase)" 
                                name="ยอดจัดซื้อสะสม"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* 2. Vendor Distribution - High-end Donut Chart */}
            <Card className="lg:col-span-4 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1.5 flex items-center gap-2 flex-shrink-0">
                    <Package className="w-5 h-5 text-indigo-500" />
                    ยอดซื้อสะสมตามผู้ให้บริการ
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-shrink-0">
                    สัดส่วนมูลค่าการจัดซื้อรวมตามคู่ค้ารายหลักขององค์กร (YTD Distribution)
                </p>
                
                <div className="flex-1 relative h-[220px] flex items-center justify-center flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={vendorPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={800}
                            >
                                {vendorPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value?: string | number) => [`${value}%`, 'สัดส่วน']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <ShoppingCart className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-lg font-black text-gray-900 dark:text-white">Top 5 Vendors</span>
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-black">สัดส่วนซื้อสะสมรวม</span>
                    </div>
                </div>
                
                <div className="space-y-2 mt-4 overflow-y-auto max-h-[160px] pr-1">
                    {vendorPieData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-slate-100 dark:hover:bg-gray-800/50 transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                            </div>
                            <span className="text-xs font-black text-gray-900 dark:text-white flex-shrink-0">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* 3. Lead Time Analysis - Glowing Rounded Bar Chart */}
            <Card className="lg:col-span-12 xl:col-span-7 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            วิเคราะห์ระยะเวลาดำเนินการเฉลี่ย (Lead Time Analysis)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            แสดงระยะเวลาในแต่ละขั้นตอนการจัดซื้อ เปรียบเทียบระหว่างช่วงออกเอกสารและระยะเวลาจัดส่งจริง (วัน)
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-full uppercase tracking-wider flex-shrink-0">
                        Performance Metric
                    </span>
                </div>
                
                <div className="flex-1 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leadTimeData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-gray-800" opacity={0.3} />
                            <XAxis 
                                dataKey="process" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                tickFormatter={(val) => `${val} วัน`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="days" 
                                fill="#8b5cf6" 
                                radius={[6, 6, 0, 0]} 
                                name="จำนวนวันดำเนินการเฉลี่ย" 
                                barSize={45}
                            >
                                {leadTimeData.map((_, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index === 0 ? '#6366f1' : '#10b981'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* 4. Items to Follow-up - Elite Tracking Panel */}
            <Card className="lg:col-span-12 xl:col-span-5 flex flex-col border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Clock className="w-32 h-32 text-indigo-900" />
                </div>
                
                <div className="flex items-center justify-between mb-4 flex-shrink-0 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            รายการติดตามการส่งมอบค้างรับ
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            ใบสั่งซื้อ (PO) ที่ใกล้หรือเลยกำหนดส่งมอบจริงจากคู่ค้า
                        </p>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar max-h-[300px] relative z-10">
                    <div className="space-y-2.5">
                        {followUpList.length > 0 ? (
                            followUpList.map((item, index) => (
                                <FollowUpCardRow key={index} {...item} />
                            ))
                        ) : (
                            <div className="h-full py-10 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-gray-800">
                                <Package className="w-10 h-10 text-slate-300 dark:text-gray-700 mb-2" />
                                <p className="text-xs font-bold text-slate-500 dark:text-gray-400">ไม่มีรายการที่ต้องติดตามส่งมอบเร่งด่วน</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex-shrink-0 relative z-10">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                            ระบบจัดซื้อวิเคราะห์เชิงรับ (AI Suggestion)
                        </p>
                        <h4 className="text-base font-black mb-1.5">Supplier Reliability Insight</h4>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                            ผู้รับจ้างรายหลักมีสถิติการส่งล่าช้าสะสมสูงขึ้น แนะนำให้เปิดการเจรจาระดับสัญญาและตั้งค่าเผื่อความต้องการใช้วัตถุดิบ (Safety Lead Time Buffer) เพิ่มขึ้น +2 วันในขั้นตอนถัดไป
                        </p>
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default ProcurementCharts;
