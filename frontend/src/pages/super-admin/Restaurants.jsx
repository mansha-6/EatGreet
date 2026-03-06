import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Filter, Plus, MoreVertical, Edit2, Ban,
    X, Check, Calendar, ChevronLeft, ChevronRight, Download,
    CheckCircle, Trash2, Globe, LayoutDashboard
} from 'lucide-react';
import { restaurantAPI, authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

// --- Custom Single Date Picker Component ---
const SingleDatePicker = ({ value, onChange, onClose }) => {
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const toLocalDateString = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
    const selectedDate = parseLocalDate(value);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleDateClick = (e, day) => {
        e.stopPropagation();
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(toLocalDateString(d));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-[380px] rounded-[3rem] shadow-2xl border border-white p-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-normal text-gray-900">Select Date</h3>
                        <p className="text-xs text-gray-400 font-normal mt-1">Pick a subscription expiry date</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex justify-between items-center mb-8 px-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1)); }}
                        className="p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="text-center">
                        <span className="block text-lg font-normal text-gray-900">{monthNames[viewDate.getMonth()]}</span>
                        <span className="block text-xs text-gray-400 font-normal">{viewDate.getFullYear()}</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1)); }}
                        className="p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
                        <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-300 tracking-widest">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                        const day = i + 1;
                        const isSelected = selectedDate.getDate() === day &&
                            selectedDate.getMonth() === viewDate.getMonth() &&
                            selectedDate.getFullYear() === viewDate.getFullYear();

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={(e) => handleDateClick(e, day)}
                                className={`h-11 w-11 flex items-center justify-center text-sm rounded-2xl transition-all ${isSelected
                                    ? 'bg-[#FD6941] text-white shadow-lg shadow-[#FD6941]/30 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default function Restaurants() {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [editForm, setEditForm] = useState({
        plan: 'None',
        status: 'None',
        endDate: '',
        autoRenew: false
    });

    useEffect(() => {
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
        const todayStr = new Date().toISOString().split('T')[0];
        setEditForm({
            plan: restaurant.subscription?.plan || 'None',
            status: restaurant.subscription?.status || 'None',
            endDate: restaurant.subscription?.endDate ? new Date(restaurant.subscription.endDate).toISOString().split('T')[0] : todayStr,
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
            toast.success('Subscription updated successfully!');
            setIsEditModalOpen(false);
            fetchRestaurants();
        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Failed to update subscription');
        }
    };

    const handleToggleStatus = async (restaurant) => {
        const newStatus = !restaurant.isActive;
        const confirmMsg = newStatus
            ? `Are you sure you want to reactivate ${restaurant.restaurantName || restaurant.name}?`
            : `Are you sure you want to BAN ${restaurant.restaurantName || restaurant.name}? This will block their dashboard access.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await authAPI.updateSubscription({
                userId: restaurant._id,
                isActive: newStatus
            });
            toast.success(newStatus ? 'Restaurant reactivated!' : 'Restaurant BANNED successfully!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error toggling restaurant status:', error);
            toast.error('Failed to update restaurant status');
        }
    };

    const handleDeleteRestaurant = async (restaurant) => {
        const confirmMsg = `Are you absolutely sure you want to PERMANENTLY DELETE ${restaurant.restaurantName || restaurant.name}? This action cannot be undone and will remove all their data.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await authAPI.deleteRestaurant(restaurant._id);
            toast.success('Restaurant deleted successfully!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            toast.error('Failed to delete restaurant');
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
        if (daysLeft <= 3) return { label: `Expiring(${daysLeft}d)`, color: 'bg-amber-100 text-amber-600' };

        return { label: sub.plan, color: 'bg-emerald-100 text-emerald-600' };
    };

    return (
        <div className="h-screen bg-[#F0F2F4] p-4 md:p-6 flex flex-col overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/super-admin')}
                                className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl shadow-sm border border-gray-100 transition-all text-gray-400 hover:text-black active:scale-95"
                                title="Back to Dashboard"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                            </button>
                            <h1 className="text-4xl font-normal text-gray-900">Restaurants</h1>
                            <span className="bg-[#FD6941]/10 text-[#FD6941] px-4 py-1 rounded-full text-sm font-normal">
                                {restaurants.length} Total
                            </span>
                        </div>
                        <p className="text-gray-500 font-normal">Manage Partner restaurants, Monitor performance, Control access.</p>
                    </div>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-normal hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Restaurant
                    </button>
                </div>

                <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-4 pt-6 pb-0">
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

                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="col-span-3 text-[10px] font-normal text-gray-400 uppercase tracking-widest">User / Business</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest">Contact Info</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Plan Type</div>
                            <div className="col-span-1 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Days Left</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Status</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-right pr-4">Actions</div>
                        </div>
                    </div>

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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const slug = restaurant.restaurantName?.toLowerCase()?.replace(/\s+/g, '-');
                                                    navigate(`/${slug}/admin`);
                                                }}
                                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black"
                                                title="Manage Restaurant"
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={`/r/${restaurant._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-[#FD6941]"
                                                title="Visit Restaurant"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSubscription(restaurant);
                                                }}
                                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(restaurant);
                                                }}
                                                className={`p-2.5 hover:bg-gray-100 rounded-xl transition-colors ${restaurant.isActive ? 'text-gray-400 hover:text-rose-500' : 'text-rose-500 hover:text-emerald-500'}`}
                                                title={restaurant.isActive ? 'Ban Restaurant' : 'Reactivate Restaurant'}
                                            >
                                                {restaurant.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRestaurant(restaurant);
                                                }}
                                                className="p-2.5 hover:bg-rose-50 rounded-xl transition-colors text-gray-400 hover:text-rose-600"
                                                title="Delete Restaurant"
                                            >
                                                <Trash2 className="w-4 h-4" />
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

            {isEditModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white"
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
                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Subscription Plan</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Trial', 'Monthly', 'Annually', 'Customized'].map((plan) => (
                                            <button
                                                key={plan}
                                                onClick={() => setEditForm({ ...editForm, plan })}
                                                className={`py-3 rounded-2xl text-xs font-normal transition-all border-2 ${editForm.plan === plan
                                                    ? 'bg-[#FD6941]/5 border-[#FD6941] text-[#FD6941]'
                                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {plan}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Current Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Active', 'Expired'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setEditForm({ ...editForm, status })}
                                                className={`py-3 rounded-2xl text-sm font-normal transition-all border-2 ${editForm.status === status
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-normal text-gray-400 uppercase tracking-widest px-1">Expiry Date</label>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(true); }}
                                        className="relative w-full group/date text-left"
                                    >
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover/date:text-[#FD6941] transition-colors" />
                                        <div className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent hover:bg-white hover:border-[#FD6941]/30 rounded-2xl text-sm font-normal transition-all cursor-pointer shadow-sm">
                                            {editForm.endDate ? new Date(editForm.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                                        </div>
                                    </button>

                                    {isDatePickerOpen && (
                                        <SingleDatePicker
                                            value={editForm.endDate}
                                            onChange={(date) => setEditForm(prev => ({ ...prev, endDate: date }))}
                                            onClose={() => setIsDatePickerOpen(false)}
                                        />
                                    )}
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
                                <CheckCircle className="w-5 h-5" />
                                Update Subscription
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
