import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, LogOut, Settings, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, uploadAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const AdminProfile = () => {
    const navigate = useNavigate();
    const { user } = useSettings();

    // Dynamic profile data from context
    const profile = {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        restaurantName: user?.restaurantName || '',
        address: user?.city || '',
        role: user?.role === 'admin' ? 'Restaurant Manager' : user?.role === 'super-admin' ? 'Super Admin' : 'Restaurant Admin',
        joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    };

    const handleLogout = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-normal text-gray-800">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            localStorage.removeItem('isAuthenticated');
                            localStorage.removeItem('user');
                            toast.dismiss(t.id);
                            toast.success('Logged out successfully');
                            navigate('/');
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-normal hover:bg-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-normal hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const loadToast = toast.loading('Uploading profile picture...');
        try {
            const res = await uploadAPI.uploadDirect(file);
            const picUrl = res.data.secure_url;
            await authAPI.updateProfile({ name: user.name, profilePicture: picUrl });
            const updatedUser = { ...user, profilePicture: picUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
            toast.success('Profile picture updated!', { id: loadToast });
        } catch (error) {
            toast.error('Upload failed', { id: loadToast });
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[30px] font-normal text-black tracking-tight leading-none">My Profile</h1>
                <Link
                    to={`/${user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant'}/admin/settings`}
                    className="h-9 sm:h-auto px-3 sm:px-6 py-0 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-normal flex items-center gap-2 transition-colors shadow-sm text-sm"
                >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Manage Profile &amp; Settings</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Profile Overview Card */}
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 sm:gap-8">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-[#FD6941]/10 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl sm:text-4xl font-normal text-[#FD6941]">
                                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                                </span>
                            )}
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
                            className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors z-10"
                        >
                            <Camera className="w-3 h-3 sm:w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-1.5">
                        <h2 className="text-lg sm:text-2xl font-normal text-gray-800">{profile.fullName}</h2>
                        <p className="text-sm text-gray-500 font-normal">{profile.role}</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-normal">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Active
                        </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full md:w-auto px-6 py-2.5 sm:py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm font-normal flex items-center justify-center gap-2 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Read-Only Details Grid */}
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-sm border border-gray-100">
                    <h3 className="text-base sm:text-lg font-normal text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#FD6941]" />
                        Account Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 sm:gap-y-8">
                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider">Email Address</label>
                            <div className="flex items-center gap-3 text-gray-700 font-normal text-sm sm:text-base">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="truncate">{profile.email}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider">Phone Number</label>
                            <div className="flex items-center gap-3 text-gray-700 font-normal text-sm sm:text-base">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                {profile.phone}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider">Restaurant Name</label>
                            <div className="flex items-center gap-3 text-gray-700 font-normal text-sm sm:text-base">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    {user?.restaurantDetails?.logo ? (
                                        <img src={user.restaurantDetails.logo} alt="Logo" className="w-5 h-5 object-contain" />
                                    ) : (
                                        <Building className="w-4 h-4" />
                                    )}
                                </div>
                                {profile.restaurantName}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-normal text-gray-400 uppercase tracking-wider">Registered Address</label>
                            <div className="flex items-center gap-3 text-gray-700 font-normal text-sm sm:text-base">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                {profile.address}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Need to update these details? <Link to={`/${user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant'}/admin/settings`} className="text-[#FD6941] font-normal hover:underline">Go to Settings</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
