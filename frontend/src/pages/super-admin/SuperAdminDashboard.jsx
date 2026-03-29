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
    Bell,
    XCircle,
    Filter,
    Check,
    Eye,
    X
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { statsAPI, authAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { useSocket } from '../../context/SocketContext';
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
                {Icon && <Icon className="w-6 h-6 text-gray-700" />}
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
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'approve' // 'approve' or 'reject'
    });

    const socket = useSocket();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newPayment', (data) => {
            console.log('Payment update received in dashboard');
            fetchDashboardData();
        });

        // Also listen for new restaurant registrations if that's emitted
        socket.on('newRestaurantRegistered', () => {
            fetchDashboardData();
        });

        return () => {
            socket.off('newPayment');
            socket.off('newRestaurantRegistered');
        };
    }, [socket]);

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

    const handleApprove = async (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Approve Restaurant',
            message: 'Are you sure you want to approve this restaurant? A default password and confirmation will be sent via email.',
            type: 'approve',
            onConfirm: () => proceedApprove(id)
        });
    };

    const proceedApprove = async (id) => {

        setIsApproving(id);
        const loadingToast = toast.loading('Approving and sending email...');

        try {
            await authAPI.approveRestaurant(id);
            toast.success('Restaurant approved successfully!', { id: loadingToast });
            await fetchDashboardData(); // Refresh all live stats
        } catch (error) {
            console.error('Error approving restaurant:', error);
            toast.error(error.response?.data?.message || 'Failed to approve restaurant', { id: loadingToast });
        } finally {
            setIsApproving(null);
        }
    };

    const handleDelete = async (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reject Application',
            message: `Are you sure you want to reject and delete the application from ${name}?`,
            type: 'reject',
            onConfirm: () => proceedDelete(id)
        });
    };

    const proceedDelete = async (id) => {

        try {
            await authAPI.rejectRestaurant(id);
            toast.success('Application rejected and user deleted');
            await fetchDashboardData(); // Refresh all live stats
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
        <>
            <div className="w-full bg-[#F0F2F4] px-4 md:px-10 py-6 pb-10">
                <div className="max-w-[1850px] mx-auto w-full space-y-6">
                    {/* Welcome */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 font-['Urbanist']">Welcome Back</h1>
                            <p className="text-gray-500 text-sm font-normal">Super Admin Control Center</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/60 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col"
                        >
                            <div className="px-4 sm:px-8 pt-5 sm:pt-8 pb-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-normal text-gray-900 font-['Urbanist'] tracking-tight">Pending Approvals</h3>
                                        <p className="text-xs text-gray-500">Review and authorize new restaurant managers</p>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="relative group flex-1 sm:min-w-[240px] md:min-w-[300px]">
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

                            <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-4 space-y-4">
                                {isLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
                                        <div className="w-8 h-8 border-3 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin mb-4"></div>
                                        <p className="text-sm font-normal">Loading new applications...</p>
                                    </div>
                                ) : filteredUsers.length > 0 ? (
                                    <div className="space-y-4">
                                        <AnimatePresence mode='popLayout'>
                                            {filteredUsers.map((user) => (
                                                <motion.div
                                                    layout
                                                    key={user._id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-lg font-normal text-gray-400 border border-gray-100 group-hover:border-[#FD6941]/20 group-hover:bg-white transition-all">
                                                            {getInitials(user.restaurantName || user.name)}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-base font-normal text-gray-900">{user.restaurantName}</h4>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                <span>Applied on {new Date(user.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            className="p-3 rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-100"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
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

            {/* Applicant Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center px-4 pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl z-[5010] overflow-hidden border border-white"
                        >
                            <div className="flex flex-col items-center text-center mt-2 mb-8 relative">
                                <button onClick={() => setSelectedUser(null)} className="absolute -right-2 -top-2 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="w-20 h-20 bg-gradient-to-tr from-gray-50 to-gray-200 rounded-full flex items-center justify-center border border-gray-100 shadow-sm mb-5 text-2xl text-gray-400 font-light">
                                    {getInitials(selectedUser.restaurantName || selectedUser.name)}
                                </div>
                                <h3 className="text-2xl font-normal tracking-tight text-gray-900 leading-tight">{selectedUser.restaurantName}</h3>
                                <p className="text-sm text-gray-500 font-normal mt-1.5">{selectedUser.city || 'Location not provided'}</p>
                            </div>

                            <div className="space-y-4 px-2">
                                <div className="flex flex-col items-center text-center bg-gray-50/50 p-3.5 rounded-3xl border border-gray-100/50">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal mb-1">Applicant Name</p>
                                    <p className="text-gray-900 font-normal text-base">{selectedUser.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col items-center text-center bg-gray-50/50 p-3.5 rounded-3xl border border-gray-100/50 overflow-hidden">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal mb-1">Email</p>
                                        <p className="text-gray-900 font-normal text-sm w-full truncate px-2" title={selectedUser.email}>{selectedUser.email}</p>
                                    </div>
                                    <div className="flex flex-col items-center text-center bg-gray-50/50 p-3.5 rounded-3xl border border-gray-100/50">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal mb-1">Phone</p>
                                        <p className="text-gray-900 font-normal text-sm">{selectedUser.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {selectedUser.registrationNote && (
                                    <div className="flex flex-col items-center text-center bg-gray-50/50 p-5 rounded-3xl border border-gray-100/50">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal mb-2">Registration Note / Requirements</p>
                                        <p className="text-gray-600 text-sm font-normal leading-relaxed italic">"{selectedUser.registrationNote}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 mt-10">
                                <button
                                    onClick={() => {
                                        handleApprove(selectedUser._id);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full py-4 text-white bg-[#FD6941] hover:bg-[#FD6941]/90 rounded-[1.5rem] font-normal transition-all shadow-lg shadow-[#FD6941]/20 flex items-center justify-center gap-2"
                                >
                                    Approve & Send Credentials
                                </button>
                                <button
                                    onClick={() => {
                                        handleDelete(selectedUser._id, selectedUser.name);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full py-4 text-gray-400 hover:text-rose-500 bg-transparent hover:bg-rose-50 rounded-[1.5rem] font-normal transition-colors"
                                >
                                    Reject Application
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl z-[6010] border border-gray-100"
                        >
                            <div className="text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'approve' ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'}`}>
                                    {confirmModal.type === 'approve' ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-8">{confirmModal.message}</p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 py-3.5 rounded-2xl font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            confirmModal.onConfirm();
                                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                        }}
                                        className={`flex-1 py-3.5 rounded-2xl font-medium text-white shadow-lg transition-all ${confirmModal.type === 'approve' ? 'bg-[#FD6941] hover:bg-[#FD6941]/90 shadow-orange-100' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-100'}`}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
