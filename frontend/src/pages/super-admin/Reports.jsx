import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    AreaChart,
    Area,
} from 'recharts';
import {
    TrendingUp,
    Users,
    Store,
    MapPin,
    DollarSign,
    UserPlus,
    FileText,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';

const AnalyticsCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-white/60 shadow-sm"
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-normal">{title}</p>
                <h3 className="text-2xl font-normal text-gray-900">{value}</h3>
            </div>
        </div>
        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">{subtitle}</p>
    </motion.div>
);

export default function Reports() {
    const { currencySymbol } = useSettings();
    const [statsData, setStatsData] = useState({
        totalUsers: 0,
        totalRestaurants: 0,
        totalCustomers: 0,
        activeRestaurants: 0,
        platformTotalRevenue: 0,
        estimatedMRR: 0,
        roleDistribution: [],
        planDistribution: [],
        cityDistribution: [],
        trendData: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    const getPlanColor = (name) => {
        if (name === 'Monthly') return '#3B82F6'; // Blue
        if (name === 'Inactive' || name === 'Expired' || name === 'None') return '#EF4444'; // Red
        if (name === 'Trial') return '#F59E0B'; // Yellow/Amber
        if (name === 'Annually') return '#10B981'; // Green/Emerald
        return '#94A3B8'; // Default Slate
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await statsAPI.getSuperAdminStats();
                setStatsData(response.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                toast.error("Failed to load analytics data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-[#F0F2F4]">
            <div className="animate-pulse text-gray-400 font-normal">Loading Platform Analytics...</div>
        </div>;
    }

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-12">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900">Platform Reports</h1>
                        <p className="text-gray-500 text-sm font-normal">Comprehensive website data & business analytics</p>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalyticsCard
                        title="Platform Reach"
                        value={statsData.totalUsers}
                        subtitle="Total Registered Users"
                        icon={Users}
                        color="bg-emerald-500"
                    />
                    <AnalyticsCard
                        title="Business Base"
                        value={statsData.totalRestaurants}
                        subtitle="Restaurant Owners"
                        icon={Store}
                        color="bg-blue-500"
                    />
                    <AnalyticsCard
                        title="Gross Volume"
                        value={`${currencySymbol}${statsData.platformTotalRevenue.toLocaleString()}`}
                        subtitle="Total Sales Handled"
                        icon={DollarSign}
                        color="bg-violet-500"
                    />
                    <AnalyticsCard
                        title="MRR Forecast"
                        value={`${currencySymbol}${statsData.estimatedMRR.toLocaleString()}`}
                        subtitle="Est. Monthly Revenue"
                        icon={TrendingUp}
                        color="bg-orange-500"
                    />
                </div>

                {/* Main Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/60 shadow-sm"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-normal text-gray-900">Growth & Revenue Trend</h3>
                                <p className="text-xs text-gray-500">Cross-database performance tracking</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[10px] text-gray-400 font-bold">REVENUE</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-400"></div><span className="text-[10px] text-gray-400 font-bold">USERS</span></div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={statsData.trendData}>
                                    <defs>
                                        <linearGradient id="colorRevRep" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `${currencySymbol}${v / 1000}k`} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevRep)" />
                                    <Line yAxisId="right" type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col"
                    >
                        <h3 className="text-xl font-normal text-gray-900 mb-1">Package Distribution</h3>
                        <p className="text-xs text-gray-500 mb-8">Business subscription tiers</p>

                        {(() => {
                            const order = ['Annually', 'Monthly', 'Trial', 'Expired', 'Inactive', 'None'];
                            const sortedPlans = [...(statsData.planDistribution || [])].sort((a, b) => {
                                let indexA = order.indexOf(a.name);
                                let indexB = order.indexOf(b.name);
                                if (indexA === -1) indexA = 999;
                                if (indexB === -1) indexB = 999;
                                return indexA - indexB;
                            });

                            return (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-full h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={sortedPlans}
                                                    innerRadius="65%"
                                                    outerRadius="90%"
                                                    paddingAngle={10}
                                                    dataKey="value"
                                                >
                                                    {sortedPlans.map((entry, index) => (
                                                        <Cell key={index} fill={getPlanColor(entry.name)} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-full space-y-4 mt-8">
                                        {sortedPlans.map((item, index) => (
                                            <div key={item.name} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getPlanColor(item.name) }}></div>
                                                    <span className="text-gray-600 font-normal">{item.name === 'None' ? 'Expired' : item.name}</span>
                                                </div>
                                                <span className="font-normal text-gray-900 bg-white px-3 py-1 rounded-full shadow-sm">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                </div>

                {/* Secondary Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/60 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600"><MapPin className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-xl font-normal text-gray-900">Regional Impact</h3>
                                <p className="text-xs text-gray-500">City-wise business distribution</p>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData.cityDistribution} layout="vertical">
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" fill="#FD6941" radius={[0, 15, 15, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4 mt-8">
                                {statsData.cityDistribution.map((city) => (
                                    <div key={city.name} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#FD6941]/40"></div>
                                            <span className="text-gray-600 font-normal">{city.name}</span>
                                        </div>
                                        <span className="font-normal text-gray-900 bg-white px-3 py-1 rounded-full shadow-sm">{city.value} Businesses</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/60 shadow-sm"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><UserPlus className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-xl font-normal text-gray-900">Registration Segments</h3>
                                <p className="text-xs text-gray-500">Breakdown of account types</p>
                            </div>
                        </div>
                        <div className="space-y-8 mt-4">
                            {statsData.roleDistribution.map((role) => {
                                const percentage = ((role.value / statsData.totalUsers) * 100).toFixed(1);
                                return (
                                    <div key={role.name} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-base font-normal text-gray-700 capitalize">{role.name}s</span>
                                            <span className="text-sm text-gray-400 font-normal">{role.value} Accounts ({percentage}%)</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full ${role.name === 'Admin' ? 'bg-[#FD6941]' : 'bg-blue-400'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
