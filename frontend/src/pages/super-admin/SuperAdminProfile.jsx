import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, Camera, Save, Shield, LogOut, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, uploadAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const SuperAdminProfile = () => {
    const navigate = useNavigate();
    const { user, logout } = useSettings();

    const [profile, setProfile] = useState({
        fullName: user.name || 'Super Admin',
        email: user.email || '',
        phone: user.phone || '+91 00000 00000',
        companyName: user.restaurantName || 'EatGreet Inc.',
        role: user.role === 'super-admin' ? 'Super Admin' : user.role,
        joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Jan 01, 2026'
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        const loadToast = toast.loading('Updating profile...');
        try {
            const response = await authAPI.updateProfile({
                name: profile.fullName,
                email: profile.email,
                phone: profile.phone,
                restaurantName: profile.companyName
            });

            // Update local storage
            const updatedUser = { ...user, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated successfully!', { id: loadToast });
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile', { id: loadToast });
        }
    };

    const handleLogout = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-normal text-gray-800">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            logout();
                            toast.dismiss(t.id);
                            toast.success('Logged out successfully');
                            navigate('/');
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
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

            // Update profile on backend
            await authAPI.updateProfile({ ...profile, profilePicture: picUrl });

            // Update local state and context
            const updatedUser = { ...user, profilePicture: picUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload(); // Quick way to sync across context

            toast.success('Profile picture updated!', { id: loadToast });
        } catch (error) {
            toast.error('Upload failed', { id: loadToast });
        }
    };

    const handleRemoveProfilePic = async () => {
        if (!user.profilePicture) return;
        const loadToast = toast.loading('Removing profile picture...');
        try {
            await authAPI.updateProfile({ ...profile, profilePicture: "" });
            const updatedUser = { ...user, profilePicture: "" };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Profile picture removed!', { id: loadToast });
            window.location.reload();
        } catch (error) {
            toast.error('Failed to remove profile picture', { id: loadToast });
        }
    };

    return (
        <div className="w-full bg-[#F0F2F4] min-h-screen">
            <div className="space-y-6 max-w-[1850px] mx-auto px-4 md:px-10 py-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">My Profile</h1>
                    <button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-normal flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isEditing
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-[#FD6941] hover:bg-[#FD6941]/90 text-white'
                            }`}
                    >
                        {isEditing ? <Save className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-fit">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full bg-black border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Super Admin" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-white" />
                                )}
                            </div>
                            <input
                                type="file"
                                id="super-admin-pic"
                                className="hidden"
                                accept="image/*"
                                onChange={handleProfilePicUpload}
                            />
                            <div className="absolute -bottom-1 -right-1 flex gap-1">
                                <button
                                    onClick={() => document.getElementById('super-admin-pic').click()}
                                    className="p-2 bg-[#FD6941] text-white rounded-full shadow-md hover:bg-[#FD6941]/90 transition-all border-2 border-white active:scale-90"
                                    title="Change Profile Picture"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                                {user?.profilePicture && (
                                    <button
                                        onClick={handleRemoveProfilePic}
                                        className="p-2 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 transition-all border-2 border-white active:scale-90"
                                        title="Remove Profile Picture"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">{profile.fullName}</h2>
                        <div className="flex items-center gap-1 text-gray-500 mb-6">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <p className="text-sm font-normal text-blue-500">{profile.role}</p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold w-full">
                                Member since {profile.joinDate}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Details Form */}
                    <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={profile.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={profile.companyName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminProfile;
