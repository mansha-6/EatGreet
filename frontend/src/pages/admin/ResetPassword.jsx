import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        if (formData.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setIsLoading(true);
        try {
            await authAPI.resetPassword(token, formData.password);
            toast.success('Password updated successfully');
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/admin/login');
            }, 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired token');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl shadow-orange-100/50 border border-gray-100"
                >
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>

                    <h1 className="text-3xl font-medium text-gray-900 mb-4">Security Updated</h1>
                    <p className="text-gray-400 text-lg mb-10 font-light leading-relaxed">
                        Your password has been successfully reset. Redirecting you to the login page...
                    </p>

                    <Link
                        to="/admin/login"
                        className="w-full bg-black text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-xl shadow-black/10"
                    >
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FD6941]/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-orange-100/50 w-full max-w-md border border-gray-100"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#FD6941]/5 rounded-2xl flex items-center justify-center mb-6">
                        <ShieldCheck className="w-8 h-8 text-[#FD6941]" />
                    </div>
                    <h2 className="text-gray-900 font-medium text-[26px] tracking-tight text-center">Set New Password</h2>
                    <p className="text-gray-400 text-[14px] mt-2 font-light text-center">
                        Please enter a strong password to secure your account.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-normal text-gray-400 mb-2 ml-1 uppercase tracking-wider">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:border-gray-200 transition-all text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-normal text-gray-400 mb-2 ml-1 uppercase tracking-wider">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:border-gray-200 transition-all text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-black text-white py-4 rounded-2xl font-medium shadow-xl shadow-black/10 hover:shadow-black/20 hover:bg-gray-900 transition-all duration-300 text-base flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 mt-4"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-400 text-sm font-light">
                        Remembered your password? <Link to="/admin/login" className="text-black font-medium hover:underline ml-1 transition-all">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
