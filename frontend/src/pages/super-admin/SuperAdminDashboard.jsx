import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Store,
    Ticket,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const DashboardStat = ({ title, value, change, icon: Icon, gradient, colorClass, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className={`p-5 rounded-[1.8rem] shadow-sm border border-white/50 relative overflow-hidden ${gradient} flex flex-col justify-between h-36 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-600 text-xs font-normal mb-1">{title}</p>
                <h3 className="text-3xl font-normal text-gray-900">{value}</h3>
            </div>
            <div className="bg-white/60 p-3 rounded-2xl shadow-sm border border-white/40">
                <Icon className="w-6 h-6 text-gray-700" />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${colorClass} bg-white/50 px-3 py-1 rounded-full text-xs font-normal`}>
                <TrendingUp className="w-3 h-3" />
                {change}
            </div>
            <span className="text-xs text-gray-500 font-normal">Real-time</span>
        </div>
    </motion.div>
);

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { currencySymbol } = useSettings();
    const [stats, setStats] = useState({
        totalRestaurants: 0,
        activeRestaurants: 0,
        estimatedMRR: 0,
        recentRestaurants: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await statsAPI.getSuperAdminStats();
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto w-full pb-12">
                {/* Welcome */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 text-sm font-normal">System Overview & Management</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/super-admin/restaurants')}
                        className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-normal hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Store className="w-5 h-5" />
                        Manage Restaurants
                    </motion.button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardStat
                        title="Total Restaurants"
                        value={stats.totalRestaurants || 0}
                        change="Live"
                        icon={Store}
                        gradient="bg-gradient-to-br from-[#E2F0E9] to-[#D4E9F2]"
                        colorClass="text-emerald-600"
                        onClick={() => navigate('/super-admin/restaurants')}
                    />
                    <DashboardStat
                        title="Active Packages"
                        value={stats.activeRestaurants || 0}
                        change="Active"
                        icon={Ticket}
                        gradient="bg-gradient-to-br from-[#E6F3E6] to-[#CDE7CD]"
                        colorClass="text-emerald-600"
                    />
                    <DashboardStat
                        title="Pending Approvals"
                        value={stats.pendingApprovals || 0}
                        change="New"
                        icon={CheckCircle}
                        gradient="bg-gradient-to-br from-[#FFF5F1] to-[#FFE4D9]"
                        colorClass="text-[#FD6941]"
                        onClick={() => navigate('/super-admin/approvals')}
                    />
                    <DashboardStat
                        title="Monthly Revenue"
                        value={`${currencySymbol}${(stats.estimatedMRR || 0).toLocaleString()}`}
                        change="Forecast"
                        icon={BarChart3}
                        gradient="bg-gradient-to-br from-[#F5F3FF] to-[#EBE9FE]"
                        colorClass="text-violet-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {/* Recent Subscriptions Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-normal text-gray-900">Recently Onboarded Users</h3>
                                <p className="text-xs text-gray-500">Track the latest business signups and their plans</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-100">
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase">Business Name</th>
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase">Admin Name</th>
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase">Plan Tier</th>
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase text-center">Status</th>
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase text-right">Join Date</th>
                                        <th className="pb-4 text-xs font-normal text-gray-400 tracking-widest uppercase text-right px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats.recentRestaurants || []).map((res) => (
                                        <tr key={res._id} className="group hover:bg-white/40 transition-colors">
                                            <td className="py-5">
                                                <p className="text-sm font-normal text-gray-900">{res.restaurantName}</p>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700 font-normal">{res.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-normal">{res.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <span className="text-xs font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{res.subscription?.plan || 'None'}</span>
                                            </td>
                                            <td className="py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest ${
                                                    res.subscription?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                    res.subscription?.status === 'Expired' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {res.subscription?.status || 'None'}
                                                </span>
                                            </td>
                                            <td className="py-5 text-right">
                                                <p className="text-xs text-gray-400 font-normal">{new Date(res.createdAt).toLocaleDateString()}</p>
                                            </td>
                                            <td className="py-5 text-right px-4">
                                                <button
                                                    onClick={() => navigate(`/${res.restaurantName?.toLowerCase()?.replace(/\s+/g, '-')}/admin`)}
                                                    className="px-4 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-600 rounded-full text-[10px] font-normal transition-all uppercase tracking-wider"
                                                >
                                                    Visit Dashboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
