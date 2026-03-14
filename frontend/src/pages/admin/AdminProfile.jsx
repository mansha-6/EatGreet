import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, LogOut, Settings, Camera, CheckCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, uploadAPI, restaurantAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const AdminProfile = () => {
    const navigate = useNavigate();
    const { user, updateSettings } = useSettings();
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        restaurantName: user?.restaurantName || '',
        city: user?.city || '',
        profilePicture: user?.profilePicture || ''
    });

    // Update form when user context changes (e.g. from settings page)
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                restaurantName: user.restaurantName || '',
                city: user.city || '',
                profilePicture: user.profilePicture || ''
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        const loadToast = toast.loading('Saving changes...');
        try {
            // Update Auth Profile
            const res = await authAPI.updateProfile({
                name: form.name,
                email: form.email,
                phone: form.phone,
                city: form.city,
                profilePicture: form.profilePicture
            });

            // Update Restaurant name matching
            if (form.restaurantName !== user.restaurantName) {
                await restaurantAPI.updateDetails({ name: form.restaurantName });
            }

            updateSettings({ 
                ...user, 
                ...res.data, 
                restaurantName: form.restaurantName 
            });
            toast.success('Profile updated!', { id: loadToast });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Profile save failed:", error);
            toast.error(error.response?.data?.message || 'Failed to save profile', { id: loadToast });
        }
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogout = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-1">
                <p className="font-normal text-gray-800 text-sm">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            toast.dismiss(t.id);
                            navigate('/admin/login');
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000, style: { borderRadius: '20px' } });
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const loadToast = toast.loading('Updating photo...');
        try {
            const res = await uploadAPI.uploadDirect(file);
            const picUrl = res.data.secure_url;
            setForm(prev => ({ ...prev, profilePicture: picUrl }));
            toast.success('Looking good!', { id: loadToast });
        } catch (error) {
            toast.error('Upload failed', { id: loadToast });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-normal text-black tracking-tight leading-none mb-2">My Profile</h1>
                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium uppercase tracking-[0.2em]">
                                <CheckCircle className="w-3 h-3" />
                                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveProfile}
                        className="h-11 px-8 bg-[#FD6941] hover:bg-[#FD6941]/90 text-white rounded-full font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm text-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                    </button>
                    <Link
                        to={`/${user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant'}/admin/settings`}
                        className="h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm"
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        Advanced Settings
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Profile Overview Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FD6941]/10 group-hover:bg-[#FD6941]/20 transition-colors" />
                    
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-full bg-[#FD6941]/10 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative group/pic">
                            {form.profilePicture ? (
                                <img src={form.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-normal text-[#FD6941]">
                                    {form.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/pic:opacity-100 transition-opacity flex items-center justify-center">
                                <Activity className="w-6 h-6 text-white animate-pulse" />
                            </div>
                        </div>
                        <input
                            type="file"
                            id="admin-profile-pic"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfilePicUpload}
                        />
                        <button
                            onClick={() => document.getElementById('admin-profile-pic').click()}
                            className="absolute bottom-1 right-1 p-2.5 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 active:scale-90 transition-all z-10"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <input 
                            className="text-3xl font-medium text-gray-900 border-none p-0 focus:ring-0 w-full bg-transparent hover:bg-gray-50/50 rounded-lg transition-colors cursor-text px-2"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                        />
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                            <span className="text-sm text-gray-400 font-medium uppercase tracking-widest">
                                {user?.role === 'admin' ? 'Restaurant Manager' : 'Business Owner'}
                            </span>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Online
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full md:w-auto px-8 py-4 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Editable Details Grid */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-medium text-gray-900 mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FD6941]/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#FD6941]" />
                        </div>
                        Identity & Contact
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#FD6941] transition-colors">Account Email</label>
                            <div className="flex items-center gap-4 text-gray-700 font-medium text-base p-4 bg-gray-50/50 rounded-[1.5rem] border border-transparent focus-within:border-[#FD6941]/30 focus-within:bg-white transition-all">
                                <Mail className="w-5 h-5 text-gray-300" />
                                <input 
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-300"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="admin@example.com"
                                    type="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#FD6941] transition-colors">Primary Phone</label>
                            <div className="flex items-center gap-4 text-gray-700 font-medium text-base p-4 bg-gray-50/50 rounded-[1.5rem] border border-transparent focus-within:border-[#FD6941]/30 focus-within:bg-white transition-all">
                                <Phone className="w-5 h-5 text-gray-300" />
                                <input 
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-300"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#FD6941] transition-colors">Business Name</label>
                            <div className="flex items-center gap-4 text-gray-700 font-medium text-base p-4 bg-gray-50/50 rounded-[1.5rem] border border-transparent focus-within:border-[#FD6941]/30 focus-within:bg-white transition-all">
                                <Building className="w-5 h-5 text-gray-300" />
                                <input 
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-300"
                                    name="restaurantName"
                                    value={form.restaurantName}
                                    onChange={handleChange}
                                    placeholder="The Grand Palace"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#FD6941] transition-colors">Base Location</label>
                            <div className="flex items-center gap-4 text-gray-700 font-medium text-base p-4 bg-gray-50/50 rounded-[1.5rem] border border-transparent focus-within:border-[#FD6941]/30 focus-within:bg-white transition-all">
                                <MapPin className="w-5 h-5 text-gray-300" />
                                <input 
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-300"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Ahmedabad, Gujarat"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-between p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Activity className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-blue-900">Member Since</h4>
                                <p className="text-xs text-blue-600 opacity-80">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Loading...'}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest hidden sm:block">Verified Business Partner</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
