import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Plus, MoreVertical, Edit2, Ban,
    X, Check, Calendar, ChevronLeft, ChevronRight, Download,
    CheckCircle, Trash2, Globe, LayoutDashboard, ExternalLink, Store,
    User, Mail, Lock, Phone, MapPin, UtensilsCrossed, Loader2, Eye,
    Clock, CreditCard, Building2, ShieldCheck, ShieldX, EyeOff, RefreshCw,
    MessageSquare
} from 'lucide-react';
import { restaurantAPI, authAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
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
                        className="p-3 hover:bg-gray-50 rounded-full transition-colors border border-gray-100"
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
                        className="p-3 hover:bg-gray-50 rounded-full transition-colors border border-gray-100"
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
                                className={`h-11 w-11 flex items-center justify-center text-sm rounded-full transition-all ${isSelected
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
    const { impersonate } = useSettings();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [editForm, setEditForm] = useState({
        plan: 'None',
        status: 'None',
        endDate: '',
        autoRenew: false
    });
    const [isApproving, setIsApproving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        password: '',
        restaurantName: '',
        phone: '',
        city: '',
        cuisine: '',
        plan: 'None',
    });
    const [addFormErrors, setAddFormErrors] = useState({});
    const [previewRestaurant, setPreviewRestaurant] = useState(null);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const suggestionSession = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.google?.maps?.places) return;
        if (document.getElementById('google-maps-script')) return;
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
        return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const openAddModal = () => {
        const pw = generatePassword();
        setAddForm({ name: '', email: '', password: pw, restaurantName: '', phone: '', city: '', cuisine: '', plan: 'None' });
        setAddFormErrors({});
        setCitySuggestions([]);
        setShowCitySuggestions(false);
        setShowPassword(true);
        setIsAddModalOpen(true);
    };

    const handleAddFormInput = (field, rawValue) => {
        let value = rawValue;
        if (field === 'name') value = rawValue.replace(/[^a-zA-Z\s]/g, '');
        if (field === 'phone') value = rawValue.replace(/[^0-9]/g, '').slice(0, 10);
        if (field === 'password') value = rawValue.slice(0, 16);

        setAddForm(prev => ({ ...prev, [field]: value }));

        // Live validation
        let err = '';
        if (field === 'name' && value.length > 0 && !/^[a-zA-Z\s]+$/.test(value)) err = 'Only alphabets allowed';
        if (field === 'email' && value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = 'Invalid email format';
        if (field === 'phone' && value.length > 0 && value.length !== 10) err = 'Must be exactly 10 digits';
        setAddFormErrors(prev => ({ ...prev, [field]: err }));
    };

    const handleAddCityChange = async (value) => {
        setAddForm(prev => ({ ...prev, city: value }));
        setAddFormErrors(prev => ({ ...prev, city: '' }));

        if (value.length > 0 && window.google?.maps) {
            try {
                // Load the places library
                const { AutocompleteSuggestion, AutocompleteSessionToken } = await window.google.maps.importLibrary("places");

                if (!suggestionSession.current) {
                    suggestionSession.current = new AutocompleteSessionToken();
                }

                const request = {
                    input: value,
                    includedRegionCodes: ['in'],
                    sessionToken: suggestionSession.current,
                };

                const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                if (suggestions) {
                    setCitySuggestions(suggestions.map(s => s.placePrediction.text.text));
                    setShowCitySuggestions(true);
                } else {
                    setCitySuggestions([]);
                    setShowCitySuggestions(false);
                }
            } catch (err) {
                console.error("Autocomplete Error:", err);
                // Fallback to legacy
                if (window.google.maps.places && window.google.maps.places.AutocompleteService) {
                    const legacyService = new window.google.maps.places.AutocompleteService();
                    legacyService.getPlacePredictions(
                        { input: value, componentRestrictions: { country: 'in' } },
                        (predictions) => {
                            if (predictions) {
                                setCitySuggestions(predictions.map(p => p.description));
                                setShowCitySuggestions(true);
                            }
                        }
                    );
                }
            }
        } else {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
        }
    };

    const selectAddCity = (city) => {
        setAddForm(prev => ({ ...prev, city }));
        setAddFormErrors(prev => ({ ...prev, city: '' }));
        setCitySuggestions([]);
        setShowCitySuggestions(false);
    };

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

    const filteredRestaurants = restaurants.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === 'all') return matchesSearch;

        switch (statusFilter) {
            case 'active':
                return matchesSearch && res.isActive;
            case 'deactivated':
                return matchesSearch && !res.isActive;
            case 'pending':
                return matchesSearch && !res.isApproved;
            default:
                return matchesSearch;
        }
    });

    const getInitials = (res) => {
        const name = res.restaurantName || res.name;
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getColor = (idx) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-[#FD6941]/10 text-[#FD6941]', 'bg-emerald-100 text-emerald-600'];
        return colors[idx % colors.length];
    };

    const handleVisitRestaurant = (restaurant) => {
        impersonate(restaurant);
        const slug = restaurant.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
        navigate(`/${slug}/admin`);
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

    const handleApproveRestaurant = async (restaurant) => {
        if (!window.confirm(`Approve ${restaurant.restaurantName || restaurant.name}? This will generate random credentials and email them to ${restaurant.email}.`)) return;

        setIsApproving(true);
        try {
            await authAPI.approveRestaurant(restaurant._id);
            toast.success('Restaurant approved and credentials sent!');
            fetchRestaurants();
        } catch (error) {
            console.error('Error approving restaurant:', error);
            toast.error(error.response?.data?.message || 'Failed to approve restaurant');
        } finally {
            setIsApproving(false);
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

    const handleCreateRestaurant = async () => {
        const errors = {};
        if (!addForm.name.trim()) errors.name = 'Required field';
        else if (!/^[a-zA-Z\s]+$/.test(addForm.name.trim())) errors.name = 'Only alphabets allowed';
        if (!addForm.email.trim()) errors.email = 'Required field';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errors.email = 'Invalid email';
        if (!addForm.password.trim()) errors.password = 'Required field';
        else if (addForm.password.length < 8) errors.password = 'Min 8 characters';
        else if (addForm.password.length > 16) errors.password = 'Max 16 characters';
        if (!addForm.restaurantName.trim()) errors.restaurantName = 'Required field';
        if (!addForm.phone.trim()) errors.phone = 'Required field';
        else if (addForm.phone.length !== 10) errors.phone = 'Must be exactly 10 digits';
        if (!addForm.city.trim()) errors.city = 'Required field';
        if (!addForm.cuisine.trim()) errors.cuisine = 'Required field';
        if (Object.keys(errors).length > 0) {
            setAddFormErrors(errors);
            return;
        }
        setAddFormErrors({});
        setIsCreating(true);
        try {
            await authAPI.superAdminCreateRestaurant({
                name: addForm.name,
                email: addForm.email,
                password: addForm.password,
                restaurantName: addForm.restaurantName,
                phone: addForm.phone,
                city: addForm.city,
                cuisine: addForm.cuisine,
                role: 'admin',
                subscription: addForm.plan !== 'None' ? {
                    plan: addForm.plan,
                    status: 'Active',
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                } : undefined,
            });
            toast.success(`${addForm.restaurantName} added successfully!`);
            setIsAddModalOpen(false);
            setAddForm({ name: '', email: '', password: '', restaurantName: '', phone: '', city: '', cuisine: '', plan: 'None' });
            setAddFormErrors({});
            fetchRestaurants();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create restaurant');
        } finally {
            setIsCreating(false);
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
        <div className="flex-1 min-h-0 w-full bg-[#F0F2F4] px-4 md:px-10 py-6 flex flex-col overflow-y-auto no-scrollbar pb-10">
            <div className="max-w-[1850px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-normal text-gray-900">Restaurants</h1>
                            <span className="bg-[#FD6941]/10 text-[#FD6941] px-4 py-1 rounded-full text-sm font-normal">
                                {restaurants.length} Total
                            </span>
                        </div>
                        <p className="text-gray-500 font-normal">Manage Partner restaurants, Monitor performance, Control access.</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-lg text-sm overflow-hidden h-10 w-10 sm:h-[52px] sm:w-[52px] sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2 active:scale-95"
                    >
                        <Plus className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                            Add Restaurant
                        </span>
                    </button>
                </div>

                <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col overflow-visible sm:overflow-hidden">
                    <div className="px-8 pt-8 pb-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                            <h2 className="text-xl font-normal text-gray-900 font-['Urbanist'] tracking-tight">Subscription Management</h2>
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
                                        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all border ${statusFilter !== 'all' ? 'bg-[#FD6941]/5 border-[#FD6941]/30 text-[#FD6941]' : 'bg-gray-100/50 hover:bg-white border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm md:shadow-none'}`}
                                        title="Filter by status"
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
                                                            { id: 'all', label: 'All Statuses' },
                                                            { id: 'active', label: 'Active' },
                                                            { id: 'deactivated', label: 'Deactivated' },
                                                            { id: 'pending', label: 'Pending Approval' }
                                                        ].map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    setStatusFilter(item.id);
                                                                    setIsFilterOpen(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-normal transition-all ${statusFilter === item.id ? 'bg-[#FD6941]/10 text-[#FD6941]' : 'text-gray-600 hover:bg-gray-50'}`}
                                                            >
                                                                <span>{item.label}</span>
                                                                {statusFilter === item.id && (
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

                        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 mt-4">
                            <div className="col-span-3 text-[10px] font-normal text-gray-400 uppercase tracking-widest">User / Business</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest">Contact Info</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Plan Type</div>
                            <div className="col-span-1 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Days Left</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-center">Status</div>
                            <div className="col-span-2 text-[10px] font-normal text-gray-400 uppercase tracking-widest text-right pr-4">Actions</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-3 no-scrollbar">
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
                                        className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 bg-white hover:bg-gray-50/50 px-6 py-5 rounded-[1.8rem] border border-gray-100 transition-all cursor-pointer group"
                                    >
                                        <div className="lg:col-span-3 flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-normal text-sm shrink-0 ${getColor(idx)}`}>
                                                {getInitials(restaurant)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold lg:font-normal text-gray-900 truncate">{restaurant.restaurantName || restaurant.name}</h3>
                                                    {restaurant.registrationNote && (
                                                        <MessageSquare className="w-3 h-3 text-[#FD6941] shrink-0" title="Has registration note" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-normal">ID {restaurant._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 flex lg:flex-col justify-between items-center lg:items-start border-t lg:border-none pt-2 lg:pt-0">
                                            <p className="text-[10px] lg:hidden text-gray-400 uppercase tracking-widest">Owner</p>
                                            <div className="text-right lg:text-left">
                                                <p className="font-normal text-sm text-gray-800">{restaurant.name}</p>
                                                <p className="text-xs text-gray-400 font-normal truncate max-w-[150px] lg:max-w-none">{restaurant.email}</p>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 flex lg:justify-center justify-between items-center border-t lg:border-none pt-2 lg:pt-0">
                                            <p className="text-[10px] lg:hidden text-gray-400 uppercase tracking-widest">Plan</p>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-tight ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="lg:col-span-1 flex lg:justify-center justify-between items-center border-t lg:border-none pt-2 lg:pt-0">
                                            <p className="text-[10px] lg:hidden text-gray-400 uppercase tracking-widest">Days Left</p>
                                            <p className="font-normal text-sm text-gray-800">
                                                {daysLeft !== null ? `${daysLeft}d` : '-'}
                                            </p>
                                        </div>
                                        <div className="lg:col-span-2 flex lg:justify-center justify-between items-center gap-2 border-t lg:border-none pt-2 lg:pt-0">
                                            <p className="text-[10px] lg:hidden text-gray-400 uppercase tracking-widest">Status</p>
                                            <div className="flex gap-2">
                                                {!restaurant.isApproved && (
                                                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Pending
                                                    </span>
                                                )}
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-tight ${restaurant.isActive ? 'bg-[#E7F9F0] text-[#10B981]' : 'bg-rose-50 text-rose-500'}`}>
                                                    {restaurant.isActive ? 'Active' : 'Deactivated'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 flex items-center justify-end gap-1 sm:gap-2 border-t lg:border-none pt-4 lg:pt-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewRestaurant(restaurant);
                                                }}
                                                className="p-2.5 bg-gray-50 lg:bg-transparent hover:bg-[#FD6941]/10 rounded-full transition-colors text-gray-400 hover:text-[#FD6941]"
                                                title="Preview Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditSubscription(restaurant);
                                                }}
                                                className="p-2.5 bg-gray-50 lg:bg-transparent hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                                title="Edit Subscription"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {!restaurant.isApproved && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApproveRestaurant(restaurant);
                                                    }}
                                                    className="p-2.5 bg-gray-50 lg:bg-transparent hover:bg-emerald-50 rounded-full transition-colors text-emerald-500 hover:text-emerald-600"
                                                    title="Approve & Send Credentials"
                                                    disabled={isApproving}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(restaurant);
                                                }}
                                                className={`p-2.5 bg-gray-50 lg:bg-transparent hover:bg-gray-100 rounded-full transition-colors ${restaurant.isActive ? 'text-gray-400 hover:text-rose-500' : 'text-rose-500 hover:text-emerald-500'}`}
                                                title={restaurant.isActive ? 'Ban Restaurant' : 'Reactivate Restaurant'}
                                            >
                                                {restaurant.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRestaurant(restaurant);
                                                }}
                                                className="p-2.5 bg-gray-50 lg:bg-transparent hover:bg-rose-50 rounded-full transition-colors text-gray-400 hover:text-rose-600"
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
                                                className={`py-3 rounded-full text-xs font-normal transition-all border-2 ${editForm.plan === plan
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
                                                className={`py-3 rounded-full text-sm font-normal transition-all border-2 ${editForm.status === status
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
                                        <div className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent hover:bg-white hover:border-[#FD6941]/30 rounded-full text-sm font-normal transition-all cursor-pointer shadow-sm">
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
                                className="w-full mt-8 bg-[#FD6941] hover:bg-[#FD6941]/90 text-white py-4 rounded-full font-normal transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Update Subscription
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── Restaurant Preview Modal ─── */}
            <AnimatePresence>
                {previewRestaurant && (
                    <div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setPreviewRestaurant(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Top Banner */}
                            <div className="bg-gradient-to-br from-[#FFF5F1] to-[#FFE4D9] px-8 pt-8 pb-10 relative">
                                <button
                                    onClick={() => setPreviewRestaurant(null)}
                                    className="absolute top-5 right-5 p-2 hover:bg-white/60 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.2rem] bg-white shadow-md flex items-center justify-center text-xl font-normal text-[#FD6941] border border-[#FD6941]/10">
                                        {previewRestaurant.restaurantDetails?.logo ? (
                                            <img
                                                src={previewRestaurant.restaurantDetails.logo}
                                                alt={previewRestaurant.restaurantName || 'Restaurant Logo'}
                                                className="w-full h-full object-cover rounded-[1.2rem]"
                                            />
                                        ) : (
                                            getInitials(previewRestaurant)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-normal text-gray-900">{previewRestaurant.restaurantName || previewRestaurant.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5 font-normal">ID: {previewRestaurant._id.slice(-10)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-wide ${previewRestaurant.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                                                {previewRestaurant.isActive ? '● Active' : '● Deactivated'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-wide ${getSubscriptionStatus(previewRestaurant).color}`}>
                                                {getSubscriptionStatus(previewRestaurant).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Body */}
                            <div className="px-8 py-6 -mt-4 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-[1.5rem] p-5 space-y-3.5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Admin User Details</p>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Owner</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.name || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Email</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.email || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Phone</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.phone || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">City</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.city || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Role</p>
                                                <p className="text-sm text-gray-800 font-normal capitalize">{previewRestaurant.role || 'admin'}</p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Currency</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.currency || 'INR'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Approved</p>
                                                <p className={`text-sm font-normal ${previewRestaurant.isApproved ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {previewRestaurant.isApproved ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Onboarded</p>
                                                <p className={`text-sm font-normal ${previewRestaurant.isOnboarded ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {previewRestaurant.isOnboarded ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-[1.5rem] p-5 space-y-3.5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Restaurant Details</p>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Business Name</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantName || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Address</p>
                                                <p className="text-sm text-gray-800 font-normal break-words">{previewRestaurant.restaurantDetails?.address || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Business Phone</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.contactNumber || '—'}</p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Business Email</p>
                                                <p className="text-sm text-gray-800 font-normal break-all">{previewRestaurant.restaurantDetails?.businessEmail || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Cuisine</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.cuisineType || previewRestaurant.cuisine || '—'}</p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">GST Number</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.gstNumber || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Total Tables</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.totalTables ?? 0}</p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Staff Count</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.staffCount ?? 0}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Open</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.operatingHours?.open || '—'}</p>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Close</p>
                                                <p className="text-sm text-gray-800 font-normal">{previewRestaurant.restaurantDetails?.operatingHours?.close || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Row */}
                                <div className="bg-gray-50 rounded-[1.5rem] p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <CreditCard className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Plan</p>
                                            <p className="text-sm text-gray-800 font-normal">{previewRestaurant.subscription?.plan || 'No Plan'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Expires</p>
                                        <p className="text-sm text-gray-800 font-normal">
                                            {previewRestaurant.subscription?.endDate
                                                ? new Date(previewRestaurant.subscription.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">Days Left</p>
                                        <p className={`text-sm font-normal ${getDaysLeft(previewRestaurant.subscription?.endDate) !== null && getDaysLeft(previewRestaurant.subscription?.endDate) <= 3 ? 'text-rose-500' : 'text-gray-800'}`}>
                                            {getDaysLeft(previewRestaurant.subscription?.endDate) !== null ? `${getDaysLeft(previewRestaurant.subscription?.endDate)}d` : '—'}
                                        </p>
                                    </div>
                                </div>

                                {previewRestaurant.registrationNote && (
                                    <div className="bg-[#FFF5F1] rounded-[1.5rem] p-5 border border-[#FD6941]/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MessageSquare className="w-4 h-4 text-[#FD6941]" />
                                            <p className="text-[10px] text-[#FD6941] uppercase tracking-wider font-bold">Registration Note / Requirements</p>
                                        </div>
                                        <p className="text-sm text-gray-700 font-normal italic leading-relaxed">
                                            "{previewRestaurant.registrationNote}"
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <p className="text-xs text-gray-400 font-normal">
                                            Restaurant Joined {previewRestaurant.createdAt ? new Date(previewRestaurant.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 px-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <p className="text-xs text-gray-400 font-normal">
                                            User Registered {previewRestaurant.registeredAt ? new Date(previewRestaurant.registeredAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-8 pb-8 flex gap-3">
                                <button
                                    onClick={() => { setPreviewRestaurant(null); handleEditSubscription(previewRestaurant); }}
                                    className="flex-1 py-3 rounded-full border border-gray-200 text-gray-600 font-normal text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Plan
                                </button>
                                <button
                                    onClick={() => { setPreviewRestaurant(null); handleVisitRestaurant(previewRestaurant); }}
                                    className="flex-1 py-3 rounded-full bg-[#FD6941] hover:bg-[#FD6941]/90 text-white font-normal text-sm transition-all shadow-lg shadow-[#FD6941]/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" /> Visit Dashboard
                                </button>
                            </div>
                            {!previewRestaurant.isApproved && (
                                <div className="px-8 pb-8 pt-0">
                                    <button
                                        onClick={() => { setPreviewRestaurant(null); handleApproveRestaurant(previewRestaurant); }}
                                        className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Approve & Send Welcome Email
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Add Restaurant Modal ─── */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setShowCitySuggestions(false); }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-normal text-gray-900">Add Restaurant</h3>
                                    <p className="text-sm text-gray-400 font-normal mt-1">Create a new restaurant account manually</p>
                                </div>
                                <button onClick={() => { setIsAddModalOpen(false); setShowCitySuggestions(false); }} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">

                                    {/* Owner Full Name */}
                                    <div className="md:col-span-2 space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Owner Full Name<span className="text-red-500">*</span></span>
                                            {addFormErrors.name && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.name}</span>}
                                        </label>
                                        <div className="relative">
                                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="text"
                                                placeholder="Only alphabets allowed"
                                                value={addForm.name}
                                                onChange={e => handleAddFormInput('name', e.target.value)}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.name ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Email Address<span className="text-red-500">*</span></span>
                                            {addFormErrors.email && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.email}</span>}
                                        </label>
                                        <div className="relative">
                                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={addForm.email}
                                                onChange={e => handleAddFormInput('email', e.target.value)}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.email ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Set Password<span className="text-red-500">*</span></span>
                                            {addFormErrors.password && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.password}</span>}
                                        </label>
                                        <div className="relative">
                                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Auto-generated (max 8 chars)"
                                                value={addForm.password}
                                                maxLength={8}
                                                onChange={e => handleAddFormInput('password', e.target.value)}
                                                className={`w-full pl-12 pr-12 h-12 bg-white border ${addFormErrors.password ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(prev => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Mobile Number<span className="text-red-500">*</span></span>
                                            {addFormErrors.phone && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.phone}</span>}
                                        </label>
                                        <div className="relative">
                                            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="tel"
                                                placeholder="10 digits only"
                                                value={addForm.phone}
                                                onChange={e => handleAddFormInput('phone', e.target.value)}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.phone ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                        </div>
                                    </div>

                                    {/* Restaurant Name */}
                                    <div className="md:col-span-2 space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Restaurant Name<span className="text-red-500">*</span></span>
                                            {addFormErrors.restaurantName && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.restaurantName}</span>}
                                        </label>
                                        <div className="relative">
                                            <Store className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.restaurantName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="text"
                                                placeholder="Your restaurant's official name"
                                                value={addForm.restaurantName}
                                                onChange={e => { setAddForm({ ...addForm, restaurantName: e.target.value }); setAddFormErrors(p => ({ ...p, restaurantName: '' })); }}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.restaurantName ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                        </div>
                                    </div>

                                    {/* City */}
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>City<span className="text-red-500">*</span></span>
                                            {addFormErrors.city && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.city}</span>}
                                        </label>
                                        <div className="relative">
                                            <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.city ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="text"
                                                placeholder="Search your location..."
                                                value={addForm.city}
                                                onChange={e => handleAddCityChange(e.target.value)}
                                                onFocus={() => {
                                                    if (citySuggestions.length > 0) setShowCitySuggestions(true);
                                                }}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.city ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                            {showCitySuggestions && citySuggestions.length > 0 && (
                                                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto">
                                                    {citySuggestions.map((city) => (
                                                        <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => selectAddCity(city)}
                                                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-[#FD6941]/5 transition-colors"
                                                        >
                                                            {city}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cuisine */}
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                                            <span>Cuisine Type<span className="text-red-500">*</span></span>
                                            {addFormErrors.cuisine && <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic">{addFormErrors.cuisine}</span>}
                                        </label>
                                        <div className="relative">
                                            <UtensilsCrossed className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${addFormErrors.cuisine ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                                            <input
                                                type="text"
                                                placeholder="e.g. Italian, Indian, Chinese"
                                                value={addForm.cuisine}
                                                onChange={e => { setAddForm({ ...addForm, cuisine: e.target.value }); setAddFormErrors(p => ({ ...p, cuisine: '' })); }}
                                                className={`w-full pl-12 pr-5 h-12 bg-white border ${addFormErrors.cuisine ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                                            />
                                        </div>
                                    </div>

                                    {/* Subscription Plan */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Subscription Plan</label>
                                        <div className="grid grid-cols-4 gap-3 pt-1">
                                            {['None', 'Basic', 'Pro', 'Enterprise'].map(plan => (
                                                <button
                                                    key={plan}
                                                    type="button"
                                                    onClick={() => setAddForm({ ...addForm, plan })}
                                                    className={`h-12 rounded-full text-sm font-bold transition-all border shadow-sm ${addForm.plan === plan
                                                        ? 'bg-[#FD6941] border-[#FD6941] text-white shadow-[#FD6941]/25'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-[#FD6941]/40 hover:text-[#FD6941]'
                                                        }`}
                                                >
                                                    {plan}
                                                </button>
                                            ))}
                                        </div>
                                        {addForm.plan !== 'None' && (
                                            <p className="text-xs text-gray-400 pl-1">Active for 30 days from today.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 pb-8 pt-4 flex gap-3">
                                <button
                                    onClick={() => { setIsAddModalOpen(false); setAddFormErrors({}); setShowCitySuggestions(false); }}
                                    className="flex-1 py-3.5 rounded-full border border-gray-200 text-gray-600 font-normal text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRestaurant}
                                    disabled={isCreating}
                                    className="flex-1 py-3.5 rounded-full bg-[#FD6941] hover:bg-[#FD6941]/90 text-white font-extrabold text-sm transition-all shadow-lg shadow-[#FD6941]/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                                    ) : (
                                        <><Plus className="w-4 h-4" /> Create Restaurant</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
