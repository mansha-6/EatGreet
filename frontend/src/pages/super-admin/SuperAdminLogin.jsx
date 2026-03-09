import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

export default function SuperAdminLogin() {
    const { login } = useSettings();
    const navigate = useNavigate();
    const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_LOGIN_EMAIL || 'superadmin.eatgreet@gmail.com').toLowerCase();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (!otpSent || resendIn <= 0) return;
        const timer = setInterval(() => {
            setResendIn(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [otpSent, resendIn]);

    const handleSendOtp = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await authAPI.sendSuperAdminOtp(SUPER_ADMIN_EMAIL);
            setOtpSent(true);
            setResendIn(60);
            setOtp(['', '', '', '', '', '']);
            toast.success('OTP sent to superadmin email');
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (!otpSent) {
            handleSendOtp();
            return;
        }
        if (!otpValue || otpValue.length !== 6) {
            toast.error('Enter valid 6-digit OTP');
            return;
        }
        setIsLoading(true);

        try {
            const response = await authAPI.verifySuperAdminOtp(SUPER_ADMIN_EMAIL, otpValue);
            const userData = response.data;

            login(userData);
            toast.success('Secure login successful');
            navigate('/super-admin');
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP verification failed');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        e.preventDefault();
        const next = ['', '', '', '', '', ''];
        pasted.split('').forEach((ch, idx) => {
            next[idx] = ch;
        });
        setOtp(next);
        const focusIndex = Math.min(pasted.length, 6) - 1;
        if (focusIndex >= 0) otpRefs.current[focusIndex]?.focus();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden border border-white/60"
            >
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#FD6941]/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-16 w-44 h-44 bg-[#111827]/5 rounded-full blur-2xl" />
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-gray-900 font-bold text-2xl mt-2">Super Admin Secure Access</h2>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        OTP-only login for platform control
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <input
                            type="email"
                            value={SUPER_ADMIN_EMAIL}
                            readOnly
                            className="w-full px-6 py-3.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 transition-all text-sm cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-1 mb-1">
                            <p className="text-xs text-gray-400">Enter OTP</p>
                            {otpSent && resendIn > 0 && (
                                <p className="text-xs text-gray-500">{resendIn}s</p>
                            )}
                            {otpSent && resendIn === 0 && (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    className="text-xs font-bold text-[#FD6941] hover:underline"
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { otpRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="h-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#FD6941] focus:border-transparent transition-all"
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 px-1 mt-2">OTP is valid for 2 minutes</p>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-[#FD6941] text-white py-4 rounded-full font-bold shadow-lg hover:bg-[#e65d37] transition-all duration-200 text-base tracking-wide mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (otpSent ? 'Verify OTP & Login' : 'Send OTP')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
