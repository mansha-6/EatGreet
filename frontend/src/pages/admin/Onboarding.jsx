import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Store, MapPin, Clock, FileText, Upload, Save, Loader2, Mail, Phone, Info, Utensils, CheckCircle, Lock, Eye, EyeOff, ShieldCheck, Rocket } from 'lucide-react';

import toast from 'react-hot-toast';
import { restaurantAPI, uploadAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import LocationPickerMap from '../../components/LocationPickerMap';


const Onboarding = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { user, updateSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        token: token || '',
        password: '',
        confirmPassword: '',
        restaurantName: '',
        description: '',
        address: '',
        contactNumber: '',
        gstNumber: '',
        cuisineType: '',
        businessEmail: '',
        logo: '',
        location: { lat: 23.0225, lng: 72.5714 },
        operatingHours: { open: '09:00', close: '23:00' }
    });

    useEffect(() => {
        const fetchSetupData = async () => {
            if (token) {
                setLoading(true);
                try {
                    const res = await restaurantAPI.getSetupDetails(token);
                    if (res.data.alreadyOnboarded) {
                        setIsSuccess(true);
                        setLoading(false);
                        return;
                    }
                    const { email, phone, restaurantName } = res.data;
                    setFormData(prev => ({
                        ...prev,
                        restaurantName: restaurantName || '',
                        businessEmail: email || '',
                        contactNumber: phone || ''
                    }));
                } catch (error) {
                    toast.error('Could not load your application details. Please fill the form manually.');
                    console.error('Fetch setup details error:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSetupData();
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'contactNumber') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleNestedChange = (category, field, value) => {
        if (category === 'location') {
            if (typeof field === 'object') {
                setFormData(prev => ({ ...prev, location: { ...prev.location, ...field } }));
            } else {
                setFormData(prev => ({ ...prev, location: { ...prev.location, [field]: value } }));
            }
        } else if (category === 'hours') {
            setFormData(prev => ({ ...prev, operatingHours: { ...prev.operatingHours, [field]: value } }));
        }
    };


    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PNG and SVG formats are allowed for logo.');
            return;
        }

        setUploadingLogo(true);
        const loadToast = toast.loading('Uploading logo...');
        try {
            const res = await uploadAPI.uploadDirect(file);
            setFormData(prev => ({ ...prev, logo: res.data.secure_url }));
            toast.success('Logo uploaded!', { id: loadToast });
        } catch (error) {
            toast.error('Logo upload failed', { id: loadToast });
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const mandatoryFields = ['restaurantName', 'address', 'contactNumber', 'gstNumber', 'cuisineType', 'businessEmail'];
        if (token) {
            mandatoryFields.push('password');
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
            }
        }

        for (const field of mandatoryFields) {
            if (!formData[field]) {
                toast.error(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is mandatory`);
                return;
            }
        }

        setLoading(true);
        const loadToast = toast.loading('Setting up your restaurant...');
        try {
            await restaurantAPI.completeOnboarding(formData);

            toast.success('Restaurant setup complete!', { id: loadToast });
            setIsSuccess(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete onboarding', { id: loadToast });
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
                <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl shadow-orange-100/50 border border-gray-100">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>

                    <h1 className="text-4xl font-normal text-gray-800 mb-4">Thank You!</h1>
                    <p className="text-gray-500 text-lg mb-10 leading-relaxed font-light">
                        Your restaurant application is complete and your security credentials have been successfully updated.
                    </p>

                    <div className="bg-[#FD6941]/5 rounded-3xl p-8 mb-10 border border-[#FD6941]/10">
                        <div className="flex items-start gap-4 text-left">
                            <div className="bg-[#FD6941]/10 p-3 rounded-2xl shrink-0 mt-1">
                                <Mail className="w-6 h-6 text-[#FD6941]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">Check Your Inbox</h3>
                                <p className="text-sm text-gray-500 leading-relaxed font-light">
                                    The login details to access the dashboard have been sent to your email. Please check your inbox for your **unique restaurant dashboard link** to log in securely.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/admin/login')}
                        className="w-full bg-[#FD6941] hover:bg-[#FD6941]/90 text-white py-4 rounded-2xl font-normal text-lg shadow-lg shadow-orange-100 flex items-center justify-center gap-3 transition-all"
                    >
                        Go to Main Login
                        <Rocket className="w-5 h-5" />
                    </button>

                    <p className="mt-8 text-xs text-gray-400 font-light">
                        EatGreet Team • Your Setup is Finished
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-xl shadow-orange-100/50 border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full">

                    {/* Left Panel - Info */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#FD6941] to-[#FF8C6B] p-8 lg:p-12 text-white flex flex-col justify-between shrink-0">
                        <div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                                <Store className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-normal leading-tight mb-6">
                                Welcome to EatGreet!
                            </h1>
                            <p className="text-white/80 text-lg font-light leading-relaxed">
                                Let's get your restaurant set up. This information will be used for your public menu, invoices, and analytics.
                            </p>
                        </div>

                        <div className="space-y-6 mt-12 lg:mt-0">
                            {token && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-sm font-light text-white/90">Secure your account</p>
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-sm font-light text-white/90">Add GST & business info</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-sm font-light text-white/90">Pin location on the map</p>
                            </div>
                        </div>
                    </div>


                    {/* Right Panel - Form (Scrollable) */}
                    <div className="lg:col-span-3 p-8 lg:p-12 lg:max-h-[85vh] overflow-y-auto no-scrollbar">


                        <form onSubmit={handleSubmit} className="space-y-8">
                            {token && (
                                <div className="space-y-6 pb-4 border-b border-gray-100">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-normal text-gray-800">Security Credentials</h2>
                                        <p className="text-sm text-gray-400">Create a permanent password for your dashboard</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="••••••••"
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#FD6941] transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Confirm Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    placeholder="••••••••"
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                    required
                                                />
                                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-normal text-gray-800">Restaurant Details</h2>
                                    <p className="text-sm text-gray-400">All fields are mandatory to access the dashboard</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Restaurant Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="restaurantName"
                                                value={formData.restaurantName}
                                                onChange={handleChange}
                                                placeholder="e.g. The Italian Bistro"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                required
                                            />
                                            <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Cuisine Type</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="cuisineType"
                                                value={formData.cuisineType}
                                                onChange={handleChange}
                                                placeholder="e.g. Italian, Thai"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                required
                                            />
                                            <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">GST Number</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="gstNumber"
                                                value={formData.gstNumber}
                                                onChange={handleChange}
                                                placeholder="22AAAAA0000A1Z5"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                required
                                            />
                                            <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Contact Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                name="contactNumber"
                                                value={formData.contactNumber}
                                                onChange={handleChange}
                                                placeholder="Enter 10-digit number"
                                                maxLength="10"
                                                pattern="\d*"
                                                inputMode="numeric"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                required
                                            />
                                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Business Email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="businessEmail"
                                                value={formData.businessEmail}
                                                onChange={handleChange}
                                                placeholder="hello@restaurant.com"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                                required
                                            />
                                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Full Address</label>
                                        <div className="relative">
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="123 Foodie Street, Corner Lane..."
                                                rows="2"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all resize-none"
                                                required
                                            ></textarea>
                                            <MapPin className="absolute right-4 top-4 w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Pin Restaurant Location</label>
                                        <Suspense fallback={
                                            <div className="h-64 rounded-2xl bg-gray-50 animate-pulse flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading map...
                                            </div>
                                        }>
                                            <LocationPickerMap
                                                lat={formData.location.lat}
                                                lng={formData.location.lng}
                                                onLocationSelect={(lat, lng) => handleNestedChange('location', { lat, lng })}
                                                onAddressUpdate={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                                            />
                                        </Suspense>
                                    </div>



                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Opening Time</label>
                                            <input
                                                type="time"
                                                value={formData.operatingHours.open}
                                                onChange={(e) => handleNestedChange('hours', 'open', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-normal text-gray-400 mb-1.5 ml-1">Closing Time</label>
                                            <input
                                                type="time"
                                                value={formData.operatingHours.close}
                                                onChange={(e) => handleNestedChange('hours', 'close', e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#FD6941] hover:bg-[#FD6941]/90 text-white py-4 rounded-2xl font-normal text-lg shadow-lg shadow-orange-100 flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving Details...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Complete Final Setup
                                        </>
                                    )}
                                </button>

                                <div className="text-center pt-2">
                                    <p className="text-gray-400 text-sm">
                                        Already have your credentials?{' '}
                                        <Link to="/admin/login" className="text-[#FD6941] font-medium hover:underline">
                                            Sign In
                                        </Link>
                                    </p>
                                </div>

                                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5 py-2">
                                    <Info className="w-3.5 h-3.5" />
                                    Security credentials will be applied immediately
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;

