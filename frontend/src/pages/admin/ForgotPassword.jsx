import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authAPI.forgotPassword(email);
            toast.success(res.data.message || 'Reset link sent to your email');
            setIsSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FD6941]/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-orange-100/50 w-full max-w-md border border-gray-100 relative"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="mb-6">
                        <img src="/logo-v.svg" alt="EatGreet Logo" className="w-[120px]" />
                    </div>
                    
                    {!isSent ? (
                        <>
                            <h2 className="text-gray-900 font-medium text-[24px] tracking-tight">Forgot Password?</h2>
                            <p className="text-gray-400 text-[14px] mt-2 font-light text-center max-w-[280px]">
                                No worries! Enter your email and we'll send you a link to reset your password.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-gray-900 font-medium text-[24px] tracking-tight">Check Your Inbox</h2>
                            <p className="text-gray-400 text-[14px] mt-2 font-light text-center">
                                We've sent a password reset link to <br/>
                                <span className="text-gray-900 font-medium">{email}</span>
                            </p>
                        </>
                    )}
                </div>

                {!isSent ? (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-normal text-gray-400 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:border-gray-200 transition-all text-sm shadow-sm"
                                    placeholder="e.g. alex@restaurant.com"
                                />
                                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full bg-black text-white py-4 rounded-2xl font-medium shadow-xl shadow-black/10 hover:shadow-black/20 hover:bg-gray-900 transition-all duration-300 text-base flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={() => setIsSent(false)}
                            className="w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            Didn't receive? Try again
                        </button>
                    </div>
                )}

                <div className="mt-10 text-center">
                    <Link 
                        to="/admin/login" 
                        className="text-gray-400 hover:text-black text-sm font-light flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
