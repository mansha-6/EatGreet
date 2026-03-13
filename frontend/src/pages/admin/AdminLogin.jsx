import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { shouldRequireOnboarding } from '../../utils/onboarding';

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
                // Enforce separation: Super Admins must use their own login portal
                navigate('/super-admin/login');
                return;
            } else {
                // All other roles (admin/restaurant) go directly to dashboard
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
        <div className="min-h-screen flex items-center justify-center bg-[#EBF2F2] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#F4F7F7] p-8 md:p-12 rounded-[2.5rem] shadow-xl w-full max-w-md border border-white/50 relative overflow-hidden"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="mb-6">
                        <img src="/logo-v.svg" alt="EatGreet Logo" className="w-[140px]" />
                    </div>
                    <h2 className="text-gray-900 font-medium text-[26px] tracking-tight">Restaurant Portal</h2>
                    <p className="text-gray-400 text-[14px] mt-2 font-light text-center max-w-[250px]">
                        Sign in to manage your inventory, orders, and restaurant growth.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-500 text-xs p-4 rounded-2xl text-center font-medium border border-red-100"
                        >
                            {error}
                        </motion.div>
                    )}
                    <div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all text-sm shadow-sm"
                            placeholder="Email Address"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all text-sm shadow-sm"
                            placeholder="Password"
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400 px-1 font-light">
                        <label className="flex items-center cursor-pointer hover:text-gray-600 group">
                            <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black mr-2 transition-all group-hover:border-gray-400" 
                            />
                            <span>Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="hover:text-gray-900 transition-colors">Forgot Password?</Link>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-black text-white py-4 rounded-2xl font-medium shadow-xl shadow-black/10 hover:shadow-black/20 hover:bg-gray-900 transition-all duration-300 text-base tracking-wide mt-4 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Sign In
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    →
                                </motion.span>
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-10 text-center text-sm text-gray-400 font-light">
                    Don't have an account? <Link to="/signup" className="text-black font-medium hover:underline ml-1">Get Started</Link>
                </p>
            </motion.div>
        </div>
    );
}
