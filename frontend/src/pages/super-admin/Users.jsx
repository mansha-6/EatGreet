import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, User, MoreVertical, Shield, Mail, Ticket, CheckCircle2, XCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('active_sub'); // all, active_sub, no_sub

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await authAPI.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        // Only show Restaurant Admins (those who can have subscriptions/restaurants)
        if (user.role !== 'admin') return false;

        const matchesSearch = (
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterType === 'active_sub') {
            return matchesSearch && user.subscription?.status === 'Active';
        }
        if (filterType === 'no_sub') {
            return matchesSearch && user.subscription?.status !== 'Active';
        }

        return matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F0F2F4]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FD6941]"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900">Restaurant Partners</h1>
                        <p className="text-gray-500 font-normal text-sm mt-1">Showing {filteredUsers.length} registered business owners on the platform.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, Email or Business..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#FD6941] w-72"
                            />
                        </div>
                        <div className="flex bg-white rounded-full p-1 border border-gray-200">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'active_sub', label: 'Activated' },
                                { id: 'no_sub', label: 'Unpaid' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterType(tab.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all ${
                                        filterType === tab.id 
                                        ? 'bg-[#FD6941] text-white' 
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-auto flex-1 no-scrollbar">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 sticky top-0 z-10">
                                <tr className="text-left">
                                    <th className="px-8 py-5 text-xs font-normal text-gray-400 uppercase tracking-widest">User Profile</th>
                                    <th className="px-8 py-5 text-xs font-normal text-gray-400 uppercase tracking-widest">Business Detail</th>
                                    <th className="px-8 py-5 text-xs font-normal text-gray-400 uppercase tracking-widest">Role / joined</th>
                                    <th className="px-8 py-5 text-xs font-normal text-gray-400 uppercase tracking-widest text-center">Plan Status</th>
                                    <th className="px-8 py-5 text-xs font-normal text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user, idx) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                    {user.profilePicture ? (
                                                        <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={`https://ui-avatars.com/api/?name=${user.name}&background=FD6941&color=fff`} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-normal text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-400 font-normal">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {user.restaurantName ? (
                                                <div>
                                                    <div className="text-sm font-normal text-gray-800">{user.restaurantName}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{user.city || 'Location Pending'}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs italic">No Business Associated</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal capitalize text-gray-600">{user.role}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {user.role === 'admin' ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest flex items-center gap-1.5 ${
                                                        user.subscription?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {user.subscription?.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {user.subscription?.plan || 'No Plan'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-all shadow-none hover:shadow-sm border border-transparent hover:border-gray-100">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <User className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-gray-400 font-normal">No users found matching your criteria</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
