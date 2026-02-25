import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    Edit2,
    Trash2,
    Ban,
    X,
    Calendar,
    CheckCircle2
} from 'lucide-react';

import { authAPI } from '../../utils/api';

export default function Restaurants() {
    const [restaurants, setRestaurants] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = React.useState(null);
    const [editForm, setEditForm] = React.useState({
        plan: 'None',
        status: 'None',
        endDate: '',
        autoRenew: false
    });

    React.useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await authAPI.getRestaurants();
            setRestaurants(response.data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRestaurants = restaurants.filter(res =>
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (res) => {
        const name = res.restaurantName || res.name;
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getColor = (idx) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-[#FD6941]/10 text-[#FD6941]', 'bg-emerald-100 text-emerald-600'];
        return colors[idx % colors.length];
    };
    const handleEditSubscription = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setEditForm({
            plan: restaurant.subscription?.plan || 'None',
            status: restaurant.subscription?.status || 'None',
            endDate: restaurant.subscription?.endDate ? new Date(restaurant.subscription.endDate).toISOString().split('T')[0] : '',
            autoRenew: restaurant.subscription?.autoRenew || false
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubscription = async () => {
        try {
            await authAPI.updateSubscription({
                userId: selectedRestaurant._id,
                ...editForm
            });
            alert('Subscription updated successfully!');
            setIsEditModalOpen(false);
            fetchRestaurants();
        } catch (error) {
            console.error('Error updating subscription:', error);
            alert('Failed to update subscription');
        }
    };

    const handleSendReminder = async (userId) => {
        try {
            await authAPI.sendReminder({ userId });
            alert('Reminder sent successfully!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    const getDaysLeft = (endDate) => {
        if (!endDate) return null;
        const diff = new Date(endDate) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const getSubscriptionStatus = (restaurant) => {
        const sub = restaurant.subscription;
        if (!sub || sub.plan === 'None') return { label: 'No Plan', color: 'bg-gray-100 text-gray-400' };
        
        const daysLeft = getDaysLeft(sub.endDate);
        if (daysLeft === 0 && sub.plan !== 'None') return { label: 'Expired', color: 'bg-rose-100 text-rose-600' };
        if (daysLeft <= 3) return { label: `Expiring (${daysLeft}d)`, color: 'bg-amber-100 text-amber-600' };
        
        return { label: sub.plan, color: 'bg-emerald-100 text-emerald-600' };
    };

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-normal text-gray-900">Restaurants</h1>
                            <span className="bg-[#FD6941]/10 text-[#FD6941] px-4 py-1 rounded-full text-sm font-normal">
                                {restaurants.length} Total
                            </span>
                        </div>
                        <p className="text-gray-500 font-normal">Manage Partner restaurants, Monitor performance, Control access.</p>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col overflow-hidden">
                    {/* Table Header/Toolbar */}
                    <div className="p-6 pb-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                            <h2 className="text-2xl font-normal text-gray-900">Subscription Management</h2>
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 pr-6 py-3 bg-gray-100/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-full w-[300px] text-sm font-normal transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Column Names */}
                        <div className="grid grid-cols-[1fr,1.2fr,1fr,1fr,1fr,0.5fr] gap-6 px-8 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">User / Business</div>
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Contact Info</div>
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Plan Type</div>
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Days Left</div>
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Status</div>
                            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-widest text-right pr-4">Actions</div>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 no-scrollbar">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <p className="font-normal text-lg animate-pulse">Loading Restaurants...</p>
                            </div>
                        ) : filteredRestaurants.length > 0 ? (
                            filteredRestaurants.map((restaurant, idx) => {
                                const status = getSubscriptionStatus(restaurant);
                                const daysLeft = getDaysLeft(restaurant.subscription?.endDate);
                                
                                return (
                                    <motion.div
                                        key={restaurant._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-12 items-center gap-4 bg-white hover:bg-gray-50/50 px-6 py-5 rounded-[1.8rem] border border-gray-100 transition-all cursor-pointer group"
                                    >
                                        <div className="col-span-3 flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-normal text-sm ${getColor(idx)}`}>
                                                {getInitials(restaurant)}
                                            </div>
                                            <div>
                                                <h3 className="font-normal text-gray-900">{restaurant.restaurantName || restaurant.name}</h3>
                                                <p className="text-xs text-gray-400 font-normal">ID {restaurant._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="font-normal text-sm text-gray-800">{restaurant.name}</p>
                                            <p className="text-xs text-gray-400 font-normal truncate">{restaurant.email}</p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-tight ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-center font-normal text-sm text-gray-800">
                                            {daysLeft !== null ? `${daysLeft}d` : '-'}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-tight ${restaurant.isActive ? 'bg-[#E7F9F0] text-[#10B981]' : 'bg-rose-50 text-rose-500'}`}>
                                                {restaurant.isActive ? 'Active' : 'Deactivated'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                                            {daysLeft !== null && daysLeft <= 7 && (
                                                <button 
                                                    onClick={() => handleSendReminder(restaurant._id)}
                                                    className="px-3 py-1.5 bg-[#FD6941]/10 text-[#FD6941] hover:bg-[#FD6941] hover:text-white rounded-full text-[10px] font-normal transition-all"
                                                >
                                                    Remind
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSubscription(restaurant);
                                                }}
                                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black">
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <div className="p-6 bg-gray-100 rounded-full mb-4">
                                    <Search className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="font-normal text-lg">No restaurants found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Subscription Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-normal text-gray-900">Edit Subscription</h2>
                                    <p className="text-sm text-gray-500 font-normal">Updating {selectedRestaurant?.restaurantName || selectedRestaurant?.name}</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Plan Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Subscription Plan</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Trial', 'Silver', 'Gold', '3 Months', 'Yearly'].map((plan) => (
                                            <button
                                                key={plan}
                                                onClick={() => setEditForm({ ...editForm, plan })}
                                                className={`py-3 rounded-2xl text-xs font-normal transition-all border-2 ${
                                                    editForm.plan === plan 
                                                    ? 'bg-[#FD6941]/5 border-[#FD6941] text-[#FD6941]' 
                                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                                }`}
                                            >
                                                {plan}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Current Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Active', 'Expired'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setEditForm({ ...editForm, status })}
                                                className={`py-3 rounded-2xl text-sm font-normal transition-all border-2 ${
                                                    editForm.status === status 
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
                                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Expiry Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl text-sm font-normal transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-normal text-gray-900">Auto Renewal</p>
                                        <p className="text-xs text-gray-400 font-normal">Enable automatic billing</p>
                                    </div>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, autoRenew: !editForm.autoRenew })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${editForm.autoRenew ? 'bg-[#FD6941]' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.autoRenew ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateSubscription}
                                className="w-full mt-8 bg-[#FD6941] hover:bg-[#e15a35] text-white py-4 rounded-2xl font-normal transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Update Subscription
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
