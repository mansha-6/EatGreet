import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, X, Check, LayoutDashboard, Utensils, Mail, User as UserIcon, Calendar, CheckCircle, Trash2, Clock
} from 'lucide-react';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function PendingApprovals() {
    const navigate = useNavigate();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isApproving, setIsApproving] = useState(null); // ID of user being approved

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        setIsLoading(true);
        try {
            const response = await authAPI.getPendingApprovals();
            setPendingUsers(response.data);
        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            toast.error('Failed to load pending requests');
        } finally {
            setIsLoading(false);
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
        } catch (error) {
            console.error('Error deleting application:', error);
            toast.error('Failed to processed rejection');
        }
    };

    const filteredUsers = pendingUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/super-admin')}
                                className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl shadow-sm border border-gray-100 transition-all text-gray-400 hover:text-black active:scale-95"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                            </button>
                            <h1 className="text-4xl font-normal text-gray-900">Pending Approvals</h1>
                            <span className="bg-[#FD6941]/10 text-[#FD6941] px-4 py-1 rounded-full text-sm font-normal">
                                {pendingUsers.length} Requests
                            </span>
                        </div>
                        <p className="text-gray-500 font-normal">Review and approve new restaurant manager registrations.</p>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-6 border-b border-gray-100 bg-white/40">
                        <div className="flex items-center gap-3 w-full max-w-md">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or restaurant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-6 py-3 bg-gray-100/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-full w-full text-sm font-normal transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-8 h-8 border-4 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin mb-4"></div>
                                <p className="font-normal">Fetching new applications...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="space-y-4">
                                {filteredUsers.map((user, idx) => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-xl font-normal text-gray-400 border border-gray-100">
                                                {getInitials(user.restaurantName || user.name)}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-normal text-gray-900">{user.restaurantName}</h3>
                                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <UserIcon className="w-3.5 h-3.5" /> {user.name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Mail className="w-3.5 h-3.5" /> {user.email}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Clock className="w-3.5 h-3.5" /> Registered {new Date(user.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleDelete(user._id, user.name)}
                                                className="px-6 py-3 rounded-full text-sm font-normal text-gray-500 hover:bg-gray-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                Reject Application
                                            </button>
                                            <button
                                                disabled={isApproving === user._id}
                                                onClick={() => handleApprove(user._id)}
                                                className="bg-black text-white px-8 py-3 rounded-full text-sm font-normal hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isApproving === user._id ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Approve & Send Credentials
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <div className="p-6 bg-gray-100 rounded-full mb-4">
                                    <CheckCircle className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="font-normal text-lg">All caught up! No pending applications.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
