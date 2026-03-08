import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Store,
    Ticket,
    CheckCircle,
    Search,
    Clock,
    User as UserIcon,
    Mail,
    Bell,
    XCircle,
    Filter,
    Calendar,
    ChevronDown,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { statsAPI, authAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';

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
        pendingApprovals: 0
    });

    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dayFilter, setDayFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, pendingRes] = await Promise.all([
                    statsAPI.getSuperAdminStats(),
                    authAPI.getPendingApprovals()
                ]);
                setStats(statsRes.data);
                setPendingUsers(pendingRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const response = await authAPI.getPendingApprovals();
            setPendingUsers(response.data);
        } catch (error) {
            console.error('Error refreshing approvals:', error);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this restaurant? A default password and confirmation will be sent via email.')) return;

        setIsApproving(id);
        const loadingToast = toast.loading('Approving and sending email...');

        try {
            await authAPI.approveRestaurant(id);
            toast.success('Restaurant approved successfully!', { id: loadingToast });
            fetchPendingApprovals();
            // Update stats
            setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));
        } catch (error) {
            console.error('Error approving restaurant:', error);
            toast.error(error.response?.data?.message || 'Failed to approve restaurant', { id: loadingToast });
        } finally {
            setIsApproving(null);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to reject and delete the application from ${name}?`)) return;

        try {
            await authAPI.deleteRestaurant(id);
            toast.success('Application rejected and user deleted');
            fetchPendingApprovals();
            setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));
        } catch (error) {
            console.error('Error deleting application:', error);
            toast.error('Failed to processed rejection');
        }
    };

    const filteredUsers = pendingUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;
        if (dayFilter === 'all') return true;

        const recordDate = new Date(user.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dayFilter === 'today') {
            return recordDate >= startOfToday;
        }

        if (dayFilter === 'yesterday') {
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfToday.getDate() - 1);
            return recordDate >= startOfYesterday && recordDate < startOfToday;
        }

        if (dayFilter === 'week') {
            const last7Days = new Date(startOfToday);
            last7Days.setDate(startOfToday.getDate() - 7);
            return recordDate >= last7Days;
        }

        return true;
    });

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'R';
    };

    return (
        <div className="flex-1 min-h-0 w-full bg-[#F0F2F4] px-4 md:px-10 py-6 flex flex-col overflow-hidden">
            <div className="max-w-[1850px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                {/* Welcome */}
                <div className="flex justify-between items-end shrink-0">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900 font-['Urbanist']">Welcome Back</h1>
                        <p className="text-gray-500 text-sm font-normal">Super Admin Control Center</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
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
                        icon={Bell}
                        gradient="bg-gradient-to-br from-[#FFF5F1] to-[#FFE4D9]"
                        colorClass="text-[#FD6941]"
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

                {/* Approvals Section (Replacing Recent Users) */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col overflow-hidden"
                    >
                        <div className="px-8 pt-8 pb-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-normal text-gray-900 font-['Urbanist'] tracking-tight">Pending Approvals</h3>
                                    <p className="text-xs text-gray-500">Review and authorize new restaurant managers</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative group flex-1 md:min-w-[300px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FD6941] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search applications..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-11 pr-5 py-2.5 bg-gray-100/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-full text-xs font-normal transition-all outline-none"
                                        />
                                    </div>

                                    <div className="relative shrink-0">
                                        <button
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all border ${dayFilter !== 'all' ? 'bg-[#FD6941]/5 border-[#FD6941]/30 text-[#FD6941]' : 'bg-gray-100/50 hover:bg-white border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm md:shadow-none'}`}
                                            title="Filter by time"
                                        >
                                            <Filter className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {isFilterOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[110]"
                                                        onClick={() => setIsFilterOpen(false)}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-0 mt-3 w-48 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-[120]"
                                                    >
                                                        <div className="p-2 space-y-1">
                                                            {[
                                                                { id: 'all', label: 'All Period' },
                                                                { id: 'today', label: 'Today' },
                                                                { id: 'yesterday', label: 'Yesterday' },
                                                                { id: 'week', label: 'Last 7 Days' }
                                                            ].map((item) => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        setDayFilter(item.id);
                                                                        setIsFilterOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-normal transition-all ${dayFilter === item.id ? 'bg-[#FD6941]/10 text-[#FD6941]' : 'text-gray-600 hover:bg-gray-50'}`}
                                                                >
                                                                    <span>{item.label}</span>
                                                                    {dayFilter === item.id && (
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4 no-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
                                    <div className="w-8 h-8 border-3 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm font-normal">Loading new applications...</p>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                <div className="space-y-4">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredUsers.map((user, idx) => (
                                            <motion.div
                                                layout
                                                key={user._id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-lg font-normal text-gray-400 border border-gray-100 group-hover:border-[#FD6941]/20 group-hover:bg-white transition-all">
                                                        {getInitials(user.restaurantName || user.name)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-normal text-gray-900">{user.restaurantName}</h4>
                                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <UserIcon className="w-3.5 h-3.5" /> {user.name}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <Mail className="w-3.5 h-3.5" /> {user.email}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                                <Clock className="w-3.5 h-3.5" /> {new Date(user.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.name)}
                                                        className="p-3 rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-gray-100 hover:border-rose-100"
                                                        title="Reject Application"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        disabled={isApproving === user._id}
                                                        onClick={() => handleApprove(user._id)}
                                                        className="bg-[#FD6941] text-white p-3 rounded-full hover:bg-[#FD6941]/90 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
                                                        title="Approve & Send Credentials"
                                                    >
                                                        {isApproving === user._id ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center">
                                    <div className="p-6 bg-gray-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-10 h-10 opacity-10" />
                                    </div>
                                    <h4 className="text-gray-900 font-normal mb-1">Queue is Empty</h4>
                                    <p className="text-xs">No pending applications at the moment.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
