import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Rocket, ArrowLeft } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import logoFull from '../../assets/logo-full.png';

export default function PaymentStatus() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useSettings();
    const [status, setStatus] = useState('processing');

    const success = searchParams.get('success');

    useEffect(() => {
        if (success === 'true') {
            setStatus('success');
        } else if (success === 'false') {
            setStatus('failed');
        }
    }, [success]);

    const handleGoDashboard = () => {
        const slug = user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
        navigate(`/${slug}/admin`);
    };

    return (
        <div className="min-h-screen bg-[#EBF2F2] flex flex-col relative overflow-hidden">
            {/* Top Nav */}
            <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b border-white/80 shadow-sm">
                <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
                    <Link to="/">
                        <img src={logoFull} alt="EatGreet" className="h-7 sm:h-8" />
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#FD6941] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Home</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-gray-200/50 text-center"
                >
                {status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Your EatGreet Pro subscription is now active. You have full access to all professional tools and AR features.
                        </p>
                        
                        <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Rocket className="w-5 h-5 text-[#FD6941]" />
                                <span className="font-semibold text-gray-900">Plan Activated</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Your restaurant is now visible to customers and you can start accepting orders instantly.
                            </p>
                        </div>

                        <button
                            onClick={handleGoDashboard}
                            className="w-full py-4 bg-[#FD6941] text-white rounded-full font-bold shadow-lg shadow-[#FD6941]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                ) : status === 'failed' ? (
                    <>
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            We couldn't process your payment. Please check your bank details or try another payment method.
                        </p>
                        
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-gray-900 text-white rounded-full font-bold hover:opacity-90 transition-all"
                        >
                            Try Again
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Verifying your payment...</p>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Secure Powered by Razorpay
                </div>
            </motion.div>
            </div>
        </div>
    );
}
