import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const SetupPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateSettings } = useSettings();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing setup token.');
            navigate('/admin/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const checks = {
            length: password.length >= 8 && password.length <= 15,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const missing = [];
        if (password.length < 8) missing.push("Password too short (min 8 chars)");
        if (password.length > 15) missing.push("Password too long (max 15 chars)");
        if (password.length === 0) missing.push("Password required");
        if (!checks.upper) missing.push("Uppercase letter missing");
        if (!checks.lower) missing.push("Lowercase letter missing");
        if (!checks.digit) missing.push("Digit missing");
        if (!checks.symbol) missing.push("Symbol missing");

        if (missing.length > 0) {
            toast.error(missing[0]);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.setupPassword({ token, password });
            const userData = res.data.user;

            // Log user in automatically
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', userData.role);
            
            updateSettings(userData);

            toast.success('Password set successfully!');
            setStatus('success');
            
            // Redirect to onboarding directly
            setTimeout(() => {
                navigate('/admin/onboarding');
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to setup password');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Ready!</h1>
                    <p className="text-gray-500 mb-8">Your password has been set. Redirecting to your onboarding dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-orange-100/50 border border-gray-100 overflow-hidden">
                <div className="bg-[#FD6941] p-8 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Secure Your Account</h1>
                    <p className="text-white/80 text-sm mt-2">Create a permanent password for your restaurant dashboard</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1 uppercase tracking-wider">New Password (8-15 chars)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    maxLength="15"
                                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#FD6941] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <Lock className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-2 ml-1 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    maxLength="15"
                                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-800 text-sm focus:ring-2 focus:ring-[#FD6941]/20 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#FD6941] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {password && confirmPassword && (
                                <p className={`text-[10px] mt-2 ml-1 font-medium ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <div className="mt-2 space-y-1 bg-gray-50/50 p-4 rounded-2xl">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Password Requirements:</p>
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-100 text-gray-400'}`}>Uppercase</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-100 text-gray-400'}`}>Lowercase</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[0-9]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-100 text-gray-400'}`}>Digit</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-100 text-gray-400'}`}>Symbol</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${password.length >= 8 && password.length <= 15 ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-100 text-gray-400'}`}>8-15 Chars</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || password !== confirmPassword}
                            className="w-full bg-[#FD6941] hover:bg-[#FD6941]/90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Security Check...
                                </>
                            ) : (
                                "Complete Account Setup"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
                        By completing setup, you agree to our <br />
                        <span className="text-gray-600 font-medium">Terms of Service</span> and <span className="text-gray-600 font-medium">Privacy Policy</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetupPassword;
