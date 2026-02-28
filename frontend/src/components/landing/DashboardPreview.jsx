import React from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Bell,
    ChevronDown,
    Activity,
    Users,
    TrendingUp,
    ArrowUpRight,
    LayoutDashboard
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const dummyData = [
    { time: '4 PM', sales: 400 },
    { time: '5 PM', sales: 800 },
    { time: '6 PM', sales: 1200 },
    { time: '7 PM', sales: 4708 },
    { time: '8 PM', sales: 3200 },
    { time: '9 PM', sales: 1500 },
    { time: '10 PM', sales: 600 },
];

const DashboardPreview = () => {
    return (
        <div className="w-full bg-[#fcfcfc] flex flex-col h-full min-h-[500px] md:min-h-[600px] text-gray-800 font-sans overflow-hidden select-none">
            {/* Top Navigation Bar - Exact Replica */}
            <header className="h-[70px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4 md:gap-12">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                            <svg width="20" height="20" md:width="24" md:height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0Z" fill="#FD6941" />
                                <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" />
                            </svg>
                        </div>
                        <span className="text-gray-900 font-bold text-base md:text-lg tracking-tight">EatGreet</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-2">
                        {['Dashboard', 'Menu', 'Category', 'Order', 'Table', 'Sales'].map((item) => (
                            <button
                                key={item}
                                className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${item === 'Dashboard' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 pr-6 border-r border-gray-100 text-gray-400">
                        <Settings className="w-5 h-5 cursor-pointer hover:text-gray-600 transition-colors" />
                        <div className="relative">
                            <Bell className="w-5 h-5 cursor-pointer hover:text-gray-600 transition-colors" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-[34px] h-[34px] bg-[#FF7F5C] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">NI</div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-700">Niyati</span>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Content — Precise Layout */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-[10px] md:text-[11px] text-gray-400 font-medium mt-1.5 tracking-[0.1em] uppercase opacity-80">WELCOME BACK, ADMIN</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Main Section */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* 3 Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Active Orders', value: '0', icon: (props) => <Activity {...props} />, color: 'text-gray-300' },
                                { label: 'Occupied Tables', value: '0', sub: '/6', icon: (props) => <Users {...props} />, color: 'text-gray-300' },
                                { label: 'Today Revenue', value: '₹ 4,708', icon: (props) => <TrendingUp {...props} />, color: 'text-gray-300' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-gray-100/50 shadow-[0_4px_20px_-1px_rgba(0,0,0,0.02)] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50/50 rounded-xl md:rounded-2xl flex items-center justify-center border border-gray-100">
                                            <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline">
                                                <h4 className="text-xl md:text-2xl font-bold font-['Urbanist'] tracking-tight text-gray-900">{stat.value}</h4>
                                                {stat.sub && <span className="text-xs md:text-sm font-semibold text-gray-300 ml-1">{stat.sub}</span>}
                                            </div>
                                            <p className="text-[9px] md:text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5 opacity-80">{stat.label}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Large Sales Analytics Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[350px] md:min-h-[420px] flex flex-col relative"
                        >
                            <div className="flex justify-between items-start mb-8 md:mb-12">
                                <div>
                                    <h5 className="text-base md:text-lg font-bold text-gray-900">Sales Analytics</h5>
                                    <p className="text-[9px] md:text-[10px] text-gray-400 font-medium mt-1 md:mt-1.5 tracking-[0.15em] uppercase opacity-80">TODAY BREAKDOWN</p>
                                </div>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 cursor-pointer hover:text-[#FD6941] transition-colors group">
                                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                                </div>
                            </div>

                            <div className="flex-1 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dummyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FD6941" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#FD6941" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#D1D5DB' }}
                                            dy={15}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-medium shadow-2xl border border-white/10">
                                                            {`₹${payload[0].value.toLocaleString()}`}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            cursor={{ stroke: '#FD6941', strokeWidth: 1, strokeDasharray: '6 6' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#FD6941"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                            animationDuration={2500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Gauge Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm aspect-square flex flex-col relative overflow-hidden"
                        >
                            <h5 className="text-sm font-medium text-gray-900 border-b border-gray-50 pb-4 mb-4">Time Status</h5>

                            <div className="flex-1 flex flex-col items-center justify-center relative">
                                {/* SVG for the tick gauge */}
                                <div className="w-48 h-24 relative overflow-hidden flex items-end justify-center">
                                    <div className="absolute top-0 w-48 h-48 border-[10px] border-gray-50 rounded-full"></div>
                                    <div className="absolute top-0 w-48 h-48 border-[10px] border-[#FD6941] rounded-full border-b-transparent border-l-transparent rotate-[225deg]"></div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="flex items-baseline">
                                            <span className="text-5xl font-bold font-['Urbanist'] tracking-tighter">0</span>
                                            <span className="text-sm font-bold text-gray-400 ml-1.5">min</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mt-1 opacity-80">Avg. Wait Time</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Live Feed Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-[380px] relative"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h5 className="text-sm font-medium text-gray-900">Live Feed</h5>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 cursor-pointer">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 bg-gray-50/50 rounded-full flex items-center justify-center mb-6">
                                    <Activity className="w-8 h-8 text-gray-100" />
                                </div>
                                <p className="text-[11px] text-gray-300 font-medium uppercase tracking-widest leading-relaxed">No active orders<br />at the moment</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPreview;
