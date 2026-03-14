import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, CheckCircle2, User, Phone, MapPin, Store, ArrowRight, Zap, Sparkles, ChevronDown, CheckCircle } from 'lucide-react';
import { paymentAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const StepBar = ({ step, title, activeStep, completedSteps, setActiveStep, children }) => {
    const isCompleted = completedSteps.includes(step);
    const isActive = activeStep === step;

    return (
        <div className={`w-full overflow-hidden transition-all duration-500 rounded-[1.5rem] sm:rounded-[2rem] border mb-4 ${
            isActive 
            ? 'bg-white/40 border-white/60 shadow-xl backdrop-blur-xl' 
            : 'bg-white/10 border-white/20 backdrop-blur-md'
        }`}>
            <button 
                onClick={() => isCompleted && setActiveStep(step)}
                disabled={!isCompleted && activeStep < step}
                type="button"
                className={`w-full flex items-center justify-between p-5 sm:p-7 text-left transition-all ${
                    !isCompleted && activeStep < step ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/10'
                }`}
            >
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-medium transition-all ${
                        isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-[#FD6941] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : step}
                    </div>
                    <div>
                        <h3 className={`text-base sm:text-xl font-medium tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{title}</h3>
                        {isCompleted && !isActive && <p className="text-[10px] sm:text-xs text-green-600 font-medium uppercase tracking-widest mt-0.5">Completed</p>}
                    </div>
                </div>
                {isCompleted && activeStep !== step && <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            <AnimatePresence initial={false}>
                {isActive && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="px-5 pb-8 sm:px-10 sm:pb-12"
                    >
                        <div className="pt-4 border-t border-gray-100/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function PlanActivation() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get plan from URL or default to Annually
    const queryParams = new URLSearchParams(location.search);
    const initialPlan = queryParams.get('plan') || 'Annually';

    const [activeStep, setActiveStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [accountDetails, setAccountDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(initialPlan);

    const plans = {
        Monthly: { price: 2499, name: 'Monthly Pro' },
        Annually: { price: 24099, name: 'Annually Pro' }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await paymentAPI.verifyAccount(credentials);
            setAccountDetails(data);
            setCompletedSteps(prev => [...prev, 1]);
            setActiveStep(2);
            toast.success("Account Verified!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDetails = () => {
        setCompletedSteps(prev => (prev.includes(2) ? prev : [...prev, 2]));
        setActiveStep(3);
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const plan = plans[selectedPlan];
            const { data: order } = await paymentAPI.createOrder({ 
                amount: plan.price, 
                planType: selectedPlan, 
                userId: accountDetails.userId 
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "EatGreet",
                description: `Renewal: ${plan.name}`,
                image: "/favicon.svg",
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await paymentAPI.verifyPayment({
                            ...response,
                            planType: selectedPlan,
                            amount: plan.price,
                            userId: accountDetails.userId
                        });

                        if (verifyRes.data.success) {
                            toast.success("Subscription renewed successfully!");
                            navigate('/payment-status?success=true');
                        }
                    } catch (err) {
                        console.error("Verification Error:", err);
                        navigate('/payment-status?success=false');
                    }
                },
                prefill: {
                    name: accountDetails.adminName,
                    email: accountDetails.email,
                    contact: accountDetails.phone || ""
                },
                theme: { color: "#FD6941" },
                modal: { ondismiss: () => setIsProcessing(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment Error:", err);
            toast.error("Failed to start payment process.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F4F4] via-[#E2E8E8] to-[#D6DFDF] flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-hidden">
            {/* Abstract background shapes for premium feel */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#FD6941]/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#FD6941]/5 rounded-full blur-[80px]" />

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md rounded-full border border-white/60 shadow-sm mb-6">
                        <ShieldCheck className="w-5 h-5 text-[#FD6941]" />
                        <span className="text-xs font-bold text-gray-700 tracking-widest uppercase">Activation Portal</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-medium text-gray-900 tracking-tight leading-tight">Activate Your Membership</h1>
                    <p className="text-gray-500 mt-4 text-sm sm:text-lg font-normal max-w-xl mx-auto">Verify your identity and select a plan to continue your journey with EatGreet.</p>
                </div>

                <div className="space-y-4">
                    {/* Step 1: Verification */}
                    <StepBar step={1} title="Manager Data Check" activeStep={activeStep} completedSteps={completedSteps} setActiveStep={setActiveStep}>
                        <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Admin Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FD6941] transition-colors" />
                                        <input
                                            type="email"
                                            value={credentials.email}
                                            required
                                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-white/50 border border-white/60 focus:bg-white focus:border-[#FD6941]/50 rounded-2xl outline-none transition-all text-sm font-normal"
                                            placeholder="manager@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FD6941] transition-colors" />
                                        <input
                                            type="password"
                                            value={credentials.password}
                                            required
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-white/50 border border-white/60 focus:bg-white focus:border-[#FD6941]/50 rounded-2xl outline-none transition-all text-sm font-normal"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !credentials.email || !credentials.password}
                                className="w-full py-4.5 sm:py-5 bg-[#FD6941] text-white rounded-2xl font-medium shadow-xl shadow-[#FD6941]/20 hover:opacity-95 transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? "Processing..." : "Verify & Next"}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </StepBar>

                    {/* Step 2: Confirmation */}
                    <StepBar step={2} title="Confirm Entity Details" activeStep={activeStep} completedSteps={completedSteps} setActiveStep={setActiveStep}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {[
                                { label: 'Restaurant Name', value: accountDetails?.restaurantName, icon: Store },
                                { label: 'Admin Full Name', value: accountDetails?.adminName, icon: User },
                                { label: 'Registered Email', value: accountDetails?.email, icon: Mail },
                                { label: 'Contact Number', value: accountDetails?.phone || 'N/A', icon: Phone },
                            ].map((detail, idx) => (
                                <div key={idx} className="p-5 bg-white/50 rounded-2xl border border-white/60">
                                    <div className="flex items-center gap-3 mb-2">
                                        <detail.icon className="w-4 h-4 text-[#FD6941]" />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{detail.label}</span>
                                    </div>
                                    <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{detail.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={confirmDetails}
                                className="px-10 py-4 sm:py-5 bg-black text-white rounded-2xl font-medium shadow-xl hover:bg-black/90 transition-all flex items-center justify-center gap-2 group"
                            >
                                Details are Correct
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </StepBar>

                    {/* Step 3: Plan Selection */}
                    <StepBar step={3} title="Select Activation Plan" activeStep={activeStep} completedSteps={completedSteps} setActiveStep={setActiveStep}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            {Object.entries(plans).map(([key, plan]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlan(key)}
                                    className={`p-6 sm:p-8 rounded-[2rem] border-2 text-left transition-all relative group overflow-hidden ${
                                        selectedPlan === key 
                                        ? 'border-[#FD6941] bg-white shadow-xl' 
                                        : 'border-white/40 bg-white/20 hover:border-white/60'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl transition-colors ${selectedPlan === key ? 'bg-[#FD6941] text-white' : 'bg-white/50 text-gray-400'}`}>
                                            {key === 'Annually' ? <Sparkles className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                        </div>
                                        {selectedPlan === key && (
                                            <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-1">{plan.name}</h4>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="text-2xl sm:text-3xl font-medium text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
                                        <span className="text-xs text-gray-500 font-normal">/ {key === 'Annually' ? 'year' : 'month'}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-normal leading-relaxed">
                                        {key === 'Annually' ? 'Perfect for growing businesses. Save up to 20% on the yearly package.' : 'Flexibility without commitment. Standard tools for your restaurant.'}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center max-w-lg mx-auto">
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-5 bg-[#FD6941] text-white rounded-2xl font-medium text-base sm:text-lg shadow-2xl shadow-[#FD6941]/30 hover:opacity-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                {isProcessing ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Pay ₹{plans[selectedPlan].price.toLocaleString('en-IN')}
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </StepBar>
                </div>

                <p className="text-center text-gray-400 text-xs mt-12 flex items-center justify-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4" /> Professional SSL Protected Encryption • Powered by Razorpay
                </p>
            </motion.div>
        </div>
    );
}
