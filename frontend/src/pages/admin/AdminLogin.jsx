import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI, statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { Mail, Lock, ArrowRight, X } from 'lucide-react';
import logoFull from '../../assets/logo-full.png';

export default function AdminLogin() {
    const { login } = useSettings();
    const navigate = useNavigate();
    const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await authAPI.login({ email, password });
            const userData = response.data;
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            login(userData);
            if (userData.role === 'superadmin') {
                navigate('/super-admin/login');
                return;
            } else {
                const restaurantSlug = userData.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
                navigate(`/${restaurantSlug}/admin`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-0 md:p-6 font-sans">
            <div className="w-full max-w-[1200px] min-h-screen md:min-h-[600px] lg:min-h-[700px] bg-white rounded-none md:rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-100 relative">

                {/* Close Button */}
                <Link
                    to="/"
                    className="absolute top-5 right-5 md:top-8 md:right-8 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white transition-all hover:scale-110 active:scale-95 group"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </Link>

                {/* Left Side: Form */}
                <div className="w-full md:w-[48%] lg:w-1/2 p-8 sm:p-10 md:p-10 lg:p-16 flex flex-col justify-between relative z-10 bg-gradient-to-br from-[#FFFBF0]/50 to-white">
                    <div>
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-10 md:mb-8 lg:mb-12"
                        >
                            <img src={logoFull} alt="EatGreet" className="h-8 lg:h-10 w-auto" />
                        </motion.div>

                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-[28px] md:text-[30px] lg:text-[40px] font-bold text-gray-900 leading-tight mb-2">Welcome back</h1>
                            <p className="text-gray-400 text-sm mb-8 font-normal">Login to manage your restaurant dashboard</p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 text-red-500 text-xs p-4 rounded-2xl text-center font-medium border border-red-100"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-2 ml-1 uppercase tracking-[0.1em]">Email Address</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#FD6941]/20 transition-all text-sm shadow-sm"
                                            placeholder="alex@restaurant.com"
                                        />
                                        <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#FD6941] transition-colors" />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-2 ml-1 uppercase tracking-[0.1em]">Password</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#FD6941]/20 transition-all text-sm shadow-sm"
                                            placeholder="••••••••"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#FD6941] transition-colors" />
                                    </div>
                                </div>
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                                <label className="flex items-center cursor-pointer hover:text-gray-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-200 text-[#FD6941] focus:ring-[#FD6941] mr-2"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="hover:text-[#FD6941] transition-colors font-medium underline-offset-4 hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                disabled={isLoading}
                                className="w-full bg-[#FD6941] text-white py-4 lg:py-5 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:bg-[#ff7a55] transition-all duration-300 text-base tracking-wide mt-2 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In to Dashboard
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom signup link — tighter spacing, darker text */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-center text-sm text-gray-500 font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-[#FD6941] font-bold hover:underline ml-1">
                                Get Started
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Side: Image Panel */}
                <div className="hidden md:flex md:w-[52%] lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
                    <img
                        src="/login-bg.png"
                        alt="Restaurant Management"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent" />
                    <div className="relative z-10 w-full h-full p-10 lg:p-12 flex flex-col justify-end" />
                </div>
            </div>
        </div>
    );
}
