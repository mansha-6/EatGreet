import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI, statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { Mail, Lock, ArrowRight, UserCircle, LayoutDashboard, UtensilsCrossed, TrendingUp, X } from 'lucide-react';

export default function AdminLogin() {
    const { login } = useSettings();
    const navigate = useNavigate();
    const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [liveStats, setLiveStats] = useState({
        revenueToday: "$42,108.00",
        activeTables: 38,
        capacity: "75%",
        satisfiedClients: "10k+"
    });

    useEffect(() => {
        const fetchPublicStats = async () => {
            try {
                const res = await statsAPI.getPublicStats();
                if (res.data) {
                    setLiveStats(res.data);
                }
            } catch (err) {
                console.warn("Could not fetch live stats:", err);
            }
        };
        fetchPublicStats();
        // Refresh every 30 seconds to keep it "Live"
        const interval = setInterval(fetchPublicStats, 30000);
        return () => clearInterval(interval);
    }, []);

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
            <div className="w-full max-w-[1200px] min-h-[700px] bg-white rounded-none md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-100 relative">
                
                {/* Close Button */}
                <Link 
                    to="/" 
                    className="absolute top-6 right-6 md:top-8 md:right-8 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white transition-all hover:scale-110 active:scale-95 group"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </Link>

                {/* Left Side: Form Area */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between relative z-10 bg-gradient-to-br from-[#FFFBF0]/50 to-white">
                    <div className="mb-0">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-12"
                        >
                            <div className="w-10 h-10 bg-[#FD6941] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                                <UtensilsCrossed className="text-white w-5 h-5" />
                            </div>
                            <span className="text-gray-900 font-bold text-xl tracking-tight">EatGreet</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight mb-2 italic">Welcome back</h1>
                            <p className="text-gray-400 text-sm mb-10 font-light italic">Login to manage your restaurant dashboard</p>
                        </motion.div>

                        <form onSubmit={handleLogin} className="space-y-6">
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

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-2 ml-1 uppercase tracking-[0.1em]">Password (6-Digit PIN)</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength="6"
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#FD6941]/20 transition-all text-[24px] tracking-[0.5em] shadow-sm"
                                            placeholder="••••••"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#FD6941] transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 px-1 italic">
                                <label className="flex items-center cursor-pointer hover:text-gray-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-200 text-[#FD6941] focus:ring-[#FD6941] mr-2"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="hover:text-[#FD6941] transition-colors font-medium underline-offset-4 hover:underline">Forgot Password?</Link>
                            </div>

                            <button
                                disabled={isLoading}
                                className="w-full bg-[#FD6941] text-white py-5 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:bg-[#ff7a55] transition-all duration-300 text-base tracking-wide mt-4 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Sign In to Dashboard
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-center text-sm text-gray-400 font-light italic">
                            Don't have an account? <Link to="/signup" className="text-[#FD6941] font-bold hover:underline ml-1">Get Started</Link>
                        </p>
                    </div>
                </div>

                {/* Right Side: Visual Content Area */}
                <div className="hidden md:flex w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
                    <img 
                        src="/login-bg.png" 
                        alt="Restaurant Management" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent"></div>
                    
                    {/* Floating UI Elements matching "Crextio" aesthetic */}
                    <div className="relative z-10 w-full h-full p-12 flex flex-col justify-end">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] w-fit mb-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="text-[#FD6941] w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white text-xs opacity-70 mb-1">Total Revenue</p>
                                    <p className="text-white text-xl font-bold">{liveStats.revenueToday}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] w-[280px]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex -space-x-3">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-gray-800 flex items-center justify-center overflow-hidden">
                                            <UserCircle className="text-white opacity-40" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-white text-xs opacity-80">+{liveStats.activeTables} active tables</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "75%" }}
                                    transition={{ duration: 1.5, delay: 1 }}
                                    className="h-full bg-white"
                                />
                            </div>
                            <p className="text-[10px] text-white opacity-60 mt-3 font-medium uppercase tracking-widest">Live Kitchen Status: {liveStats.capacity} Capacity</p>
                        </motion.div>

                        <div className="mt-12 text-white">
                            <h2 className="text-2xl font-bold italic mb-2">Smart Management</h2>
                            <p className="text-sm opacity-60 font-light leading-relaxed max-w-[320px] italic">
                                Elevate your dining experience with EatGreet's intelligent automation and 6-digit PIN security.
                            </p>
                        </div>
                    </div>

                    {/* Branding Watermark Removed */}
                </div>
            </div>
        </div>
    );
}

