import React, { useEffect, useState } from 'react';
import {
    CreditCard, Shield, Users,
    Bell, Activity, Lock, Database,
    Eye, EyeOff, Plus, Trash2,
    CheckCircle, Rocket, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { authAPI } from '../../utils/api';


const DEFAULT_PLANS = [
    {
        id: 1,
        name: 'Monthly Plan',
        tagline: 'Standard Modernization',
        price: '2,499',
        period: 'Per Month',
        color: 'blue',
        icon: Rocket,
        features: ["Standard 3D Menu", "Up to 50 items", "Live Order Tracking", "Basic Analytics"],
        isActive: true,
        isBestValue: false
    },
    {
        id: 2,
        name: 'Annually Plan',
        tagline: 'Pro Growth Choice',
        price: '24,099',
        period: 'Per Year',
        color: 'orange',
        icon: Sparkles,
        features: ["Unlimited AR Items", "Dynamic Pricing Engine", "Real-time AI Sync", "Priority 24/7 Support", "Advanced Sales Hub"],
        isActive: true,
        isBestValue: true
    },
    {
        id: 3,
        name: 'Customized Plan',
        tagline: 'Enterprise scale',
        price: 'Custom',
        period: 'Tailored for Scale',
        color: 'gray',
        icon: Shield,
        features: ["White-label branding", "Global Supply Chain Tech", "Custom POS Integration", "SLA & Dedicated Manager", "Unlimited Sites"],
        isActive: true,
        isBestValue: false
    }
];

const SuperAdminSettings = () => {
    const { currencySymbol } = useSettings();
    const [activeTab, setActiveTab] = useState('subscription');
    const [loginActivity, setLoginActivity] = useState([]);
    const [isLogLoading, setIsLogLoading] = useState(false);
    const [logsError, setLogsError] = useState('');
    const SETTINGS_STORAGE_KEY = 'super_admin_settings_v1';

    const [showApiKey, setShowApiKey] = useState(false);
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // Form State for Modal
    const [planForm, setPlanForm] = useState({
        name: '',
        tagline: '',
        price: '',
        period: 'Per Month',
        features: [''],
        isBestValue: false
    });

    const [autoSettings, setAutoSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (_) { }
        return {
            paymentProvider: 'Stripe',
            testMode: true,
            apiKey: 'pk_test_51Mz...',
            webhookSecret: 'whsec_...',
            orderAutoClose: '120',
            cancelWindow: '5',
            sessionTimeout: '30',
            maxLoginAttempts: '5',
            otpExpiry: '180',
            emailNotifications: true,
            paymentAlerts: true,
            orderAlerts: true,
            systemHealthAlerts: true,
            force2fa: false
        };
    });

    const updateSetting = (key, value) => {
        setAutoSettings(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(autoSettings));
        }, 600);
        return () => clearTimeout(timer);
    }, [autoSettings]);

    const fetchLoginActivity = async () => {
        try {
            setLogsError('');
            setIsLogLoading(true);
            const response = await authAPI.getSuperAdminLoginActivity();
            setLoginActivity(response.data || []);
        } catch (error) {
            setLogsError('Failed to load login activity');
        } finally {
            setIsLogLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'security') return;
        fetchLoginActivity();
        const timer = setInterval(fetchLoginActivity, 15000);
        return () => clearInterval(timer);
    }, [activeTab]);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({ ...plan, features: [...plan.features] });
        } else {
            setEditingPlan(null);
            setPlanForm({
                name: '',
                tagline: '',
                price: '',
                period: 'Per Month',
                features: [''],
                isBestValue: false
            });
        }
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = () => {
        if (!planForm.name || !planForm.price) {
            toast.error('Please fill in required fields');
            return;
        }

        if (editingPlan) {
            setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...planForm } : p));
            toast.success('Plan updated successfully');
        } else {
            const newPlan = {
                ...planForm,
                id: Date.now(),
                isActive: true,
                color: planForm.name.toLowerCase().includes('annual') ? 'orange' : 'blue',
                icon: planForm.name.toLowerCase().includes('annual') ? Sparkles : Rocket
            };
            setPlans([...plans, newPlan]);
            toast.success('New plan created');
        }
        setIsPlanModalOpen(false);
    };

    const handleTogglePlan = (id) => {
        setPlans(plans.map(p => {
            if (p.id === id) {
                const newState = !p.isActive;
                toast.success(`Plan ${newState ? 'enabled' : 'disabled'}`);
                return { ...p, isActive: newState };
            }
            return p;
        }));
    };

    const handleAddFeature = () => setPlanForm({ ...planForm, features: [...planForm.features, ''] });
    const handleRemoveFeature = (idx) => setPlanForm({ ...planForm, features: planForm.features.filter((_, i) => i !== idx) });
    const handleFeatureChange = (idx, val) => {
        const newFeatures = [...planForm.features];
        newFeatures[idx] = val;
        setPlanForm({ ...planForm, features: newFeatures });
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-8 px-4 md:px-10 py-6 max-w-[1850px] mx-auto w-full overflow-hidden">

            {/* Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Global Settings</h3>
                    <div className="space-y-1">
                        <SidebarItem
                            icon={CreditCard}
                            label="Subscription & Plans"
                            isActive={activeTab === 'subscription'}
                            onClick={() => setActiveTab('subscription')}
                        />
                        <SidebarItem
                            icon={CreditCard}
                            label="Payment Gateway"
                            isActive={activeTab === 'payment'}
                            onClick={() => setActiveTab('payment')}
                        />
                        <SidebarItem
                            icon={Users}
                            label="User & Roles"
                            isActive={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                        />
                        <SidebarItem
                            icon={Database}
                            label="System Config"
                            isActive={activeTab === 'system'}
                            onClick={() => setActiveTab('system')}
                        />
                        <SidebarItem
                            icon={Bell}
                            label="Notifications"
                            isActive={activeTab === 'notifications'}
                            onClick={() => setActiveTab('notifications')}
                        />
                        <SidebarItem
                            icon={Shield}
                            label="Security & Logs"
                            isActive={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'subscription' && 'Subscription & Plans'}
                            {activeTab === 'payment' && 'Payment Gateway'}
                            {activeTab === 'users' && 'User & Role Management'}
                            {activeTab === 'system' && 'System Configuration'}
                            {activeTab === 'notifications' && 'Notification Settings'}
                            {activeTab === 'security' && 'Security & Login Activity'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {activeTab === 'subscription' && 'Configure pricing tiers and plan features'}
                            {activeTab === 'payment' && 'Setup payment providers and API keys'}
                            {activeTab === 'users' && 'Manage administrator access and permissions'}
                            {activeTab === 'system' && 'Configure core system timeouts and limits'}
                            {activeTab === 'notifications' && 'Manage system-wide alerts and triggers'}
                            {activeTab === 'security' && 'Live super-admin login visibility: who, when, where, which device'}
                        </p>
                    </div>
                    <div />
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6 no-scrollbar">

                    {/* Subscription & Plans */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="flex items-center gap-2 text-[#FD6941] font-bold text-sm bg-[#FD6941]/10 px-4 py-2 rounded-lg hover:bg-[#FD6941]/20 transition-colors active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Create New Plan
                                </button>
                            </div>

                            {/* Plans Dashboard */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {plans.map((plan) => {
                                    const Icon = plan.icon || Rocket;
                                    const isOrange = plan.color === 'orange';

                                    return (
                                        <motion.div
                                            key={plan.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`bg-white rounded-[2.5rem] p-8 shadow-sm border relative group overflow-hidden flex flex-col min-h-[400px] transition-all duration-300 ${!plan.isActive ? 'grayscale opacity-60' : ''
                                                } ${isOrange ? 'border-[#FD6941]/20' : 'border-gray-100'}`}
                                        >
                                            {/* Decorative Backgrounds */}
                                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-12 translate-x-12 ${isOrange ? 'bg-[#FD6941]/5' : 'bg-blue-500/5'
                                                }`} />

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${isOrange ? 'bg-orange-50 text-[#FD6941]' : 'bg-blue-50 text-blue-500'}`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-xl text-gray-800 tracking-tight">{plan.name}</h4>
                                                        <p className={`text-xs font-bold ${isOrange ? 'text-[#FD6941]' : 'text-gray-400'}`}>{plan.tagline}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {plan.isBestValue && (
                                                        <div className="px-3 py-1 bg-[#FD6941] text-white rounded-full text-[8px] font-bold uppercase tracking-[0.1em] flex items-center gap-1 shadow-lg shadow-[#FD6941]/20">
                                                            <Sparkles className="w-2.5 h-2.5 fill-white" /> Best Value
                                                        </div>
                                                    )}
                                                    <span className="text-2xl font-black text-gray-900 leading-none">
                                                        {plan.price === 'Custom' ? 'Custom' : `₹${plan.price}`}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{plan.period}</span>
                                                </div>
                                            </div>

                                            <div className={`space-y-3 mb-8 p-5 rounded-3xl border ${isOrange ? 'bg-[#FFF5F1]/50 border-[#FD6941]/10' : 'bg-gray-50/50 border-gray-100'
                                                }`}>
                                                {plan.features.map((feat, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                                        <CheckCircle className={`w-4 h-4 ${isOrange ? 'text-[#FD6941]' : 'text-blue-500'}`} />
                                                        <span className="font-medium">{feat}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {plan.isActive ? 'Publicly Active' : 'Disabled'}
                                                </span>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleTogglePlan(plan.id)}
                                                        className={`text-xs font-bold transition-all ${plan.isActive ? 'text-gray-400 hover:text-red-500' : 'text-green-500 hover:text-green-600'
                                                            }`}
                                                    >
                                                        {plan.isActive ? 'Disable' : 'Enable Plan'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(plan)}
                                                        className={`text-xs font-bold transition-colors ${isOrange ? 'text-[#FD6941] hover:text-[#e15a35]' : 'text-blue-500 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        Edit Details
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Payment Gateway */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <SectionCard title="Provider Configuration" icon={CreditCard}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2">Payment Provider</label>
                                        <select
                                            value={autoSettings.paymentProvider}
                                            onChange={(e) => updateSetting('paymentProvider', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-700 text-sm font-bold focus:ring-0 cursor-pointer"
                                        >
                                            <option>Stripe</option>
                                            <option>Razorpay</option>
                                            <option>PayPal</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-3">
                                        <ToggleItem
                                            title="Test Mode (Sandbox)"
                                            description="Enable for testing payments"
                                            enabled={autoSettings.testMode}
                                            onToggle={(value) => updateSetting('testMode', value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-gray-100 pt-6">
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-gray-400 mb-2">API Key</label>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                value={autoSettings.apiKey}
                                                onChange={(e) => updateSetting('apiKey', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-800 text-sm font-bold focus:ring-0"
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <InputGroup
                                        label="Webhook Secret"
                                        value={autoSettings.webhookSecret}
                                        onChange={(value) => updateSetting('webhookSecret', value)}
                                    />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* User & Role Management */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <SectionCard title="Role Definitions" icon={Users}>
                                <div className="space-y-3">
                                    {['Super Admin', 'Support Agent', 'Content Manager'].map((role) => (
                                        <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="font-bold text-gray-700">{role}</span>
                                            <button className="text-xs font-bold text-[#FD6941]">Manage Permissions</button>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard title="User Actions" icon={Lock}>
                                <div className="p-6 bg-[#FD6941]/5 rounded-[1.5rem] mb-4 border border-[#FD6941]/10">
                                    <h4 className="font-bold text-[#FD6941] mb-1">Reset User Password</h4>
                                    <p className="text-xs text-gray-500 mb-4">Send a password reset link to a specific user.</p>
                                    <div className="flex gap-2">
                                        <input type="email" placeholder="Enter user email" className="flex-1 px-4 py-2 rounded-xl text-sm border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#FD6941] bg-white" />
                                        <button className="px-6 py-2 bg-[#FD6941] hover:bg-[#e15a35] text-white rounded-xl text-sm font-bold shadow-sm transition-all">Send Reset</button>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* System Configuration */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <SectionCard title="Timeouts & Limits" icon={Database}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Order Auto-Close (Minutes)" value={autoSettings.orderAutoClose} onChange={(value) => updateSetting('orderAutoClose', value)} />
                                    <InputGroup label="Cancellation Window (Minutes)" value={autoSettings.cancelWindow} onChange={(value) => updateSetting('cancelWindow', value)} />
                                    <InputGroup label="Session Timeout (Minutes)" value={autoSettings.sessionTimeout} onChange={(value) => updateSetting('sessionTimeout', value)} />
                                    <InputGroup label="Max Login Attempts" value={autoSettings.maxLoginAttempts} onChange={(value) => updateSetting('maxLoginAttempts', value)} />
                                    <InputGroup label="OTP Expiry (Seconds)" value={autoSettings.otpExpiry} onChange={(value) => updateSetting('otpExpiry', value)} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <SectionCard title="System Alerts" icon={Bell}>
                                <div className="space-y-4">
                                    <ToggleItem title="Email Notifications" description="Send system-wide emails" enabled={autoSettings.emailNotifications} onToggle={(value) => updateSetting('emailNotifications', value)} />
                                    <ToggleItem title="Payment Alerts" description="Notify on failed transactions" enabled={autoSettings.paymentAlerts} onToggle={(value) => updateSetting('paymentAlerts', value)} />
                                    <ToggleItem title="Order Alerts" description="Notify on new incoming orders" enabled={autoSettings.orderAlerts} onToggle={(value) => updateSetting('orderAlerts', value)} />
                                    <ToggleItem title="System Health Alerts" description="Notify on server downtime" enabled={autoSettings.systemHealthAlerts} onToggle={(value) => updateSetting('systemHealthAlerts', value)} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Security & Audit Logs */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <SectionCard title="Access Control" icon={Shield}>
                                <div className="space-y-4">
                                    <ToggleItem
                                        title="Force Two-Factor Authentication (2FA)"
                                        description="Require 2FA for all admin accounts"
                                        enabled={autoSettings.force2fa}
                                        onToggle={(value) => updateSetting('force2fa', value)}
                                    />
                                    <button className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                        <Lock className="w-4 h-4" /> Force Logout All Users
                                    </button>
                                </div>
                            </SectionCard>

                            <SectionCard title="Live Super Admin Login Activity" icon={Activity}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs text-gray-500">Auto-refresh every 15 seconds</p>
                                    <button
                                        onClick={fetchLoginActivity}
                                        className="text-xs font-bold text-[#FD6941] hover:underline"
                                    >
                                        Refresh now
                                    </button>
                                </div>
                                {logsError && (
                                    <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-500 text-xs font-medium">{logsError}</div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-bold">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Who</th>
                                                <th className="px-4 py-3">When</th>
                                                <th className="px-4 py-3">Where</th>
                                                <th className="px-4 py-3">Which Device</th>
                                                <th className="px-4 py-3 rounded-r-lg">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {isLogLoading && (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-6 text-center text-gray-400 text-sm">Loading activity...</td>
                                                </tr>
                                            )}
                                            {!isLogLoading && loginActivity.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-6 text-center text-gray-400 text-sm">No super-admin login activity found.</td>
                                                </tr>
                                            )}
                                            {!isLogLoading && loginActivity.map((log, idx) => (
                                                <tr key={`${log.email}-${log.when}-${idx}`}>
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-gray-800">{log.who}</p>
                                                        <p className="text-xs text-gray-400">{log.email}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {log.when ? new Date(log.when).toLocaleString('en-US', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{log.where || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{log.which || 'Unknown Device'}</td>
                                                    <td className="px-4 py-3 text-gray-500">{log.ip || 'Unknown'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                </div>
            </div>
            {/* Plan Edit/Create Modal */}
            <AnimatePresence>
                {isPlanModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPlanModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                                        <p className="text-sm text-gray-500">Define your platform tiers and pricing</p>
                                    </div>
                                    <button
                                        onClick={() => setIsPlanModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 no-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Plan Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 rounded-2xl text-sm font-bold outline-none transition-all"
                                                placeholder="e.g. Pro Plan"
                                                value={planForm.name}
                                                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tagline</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 rounded-2xl text-sm font-bold outline-none transition-all"
                                                placeholder="e.g. Best for growth"
                                                value={planForm.tagline}
                                                onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Price ({currencySymbol})</label>

                                            <input
                                                type="text"
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 rounded-2xl text-sm font-bold outline-none transition-all"
                                                placeholder="9,999"
                                                value={planForm.price}
                                                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Period</label>
                                            <select
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 rounded-2xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                                                value={planForm.period}
                                                onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })}
                                            >
                                                <option>Per Month</option>
                                                <option>Per Year</option>
                                                <option>Lifetime</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Features</label>
                                            <button
                                                onClick={handleAddFeature}
                                                className="text-[10px] font-bold text-[#FD6941] hover:underline"
                                            >
                                                + Add Line
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {planForm.features.map((feat, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 px-5 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 rounded-xl text-xs font-medium outline-none transition-all"
                                                        placeholder="Feature description..."
                                                        value={feat}
                                                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveFeature(idx)}
                                                        className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.8rem] border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 rounded-lg text-orange-500">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">Highlight as Best Value</p>
                                                <p className="text-[10px] text-gray-400">Attract more customers to this tier</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPlanForm({ ...planForm, isBestValue: !planForm.isBestValue })}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${planForm.isBestValue ? 'bg-[#FD6941]' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${planForm.isBestValue ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePlan}
                                    className="w-full mt-8 bg-[#FD6941] text-white px-8 py-3.5 rounded-full text-sm font-normal hover:bg-[#FD6941]/90 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Reusable Components
const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-[#FD6941] text-white shadow-md '
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="text-sm font-bold">{label}</span>
    </button>
);

const SectionCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#FD6941] rounded-xl text-white shadow-sm shadow-[#FD6941]/20">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-800 text-sm font-bold focus:ring-0 focus:bg-white focus:shadow-sm transition-all outline-none placeholder-gray-300"
        />
    </div>
);

const ToggleItem = ({ title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between py-2">
        <div>
            <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
            onClick={() => onToggle?.(!enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-[#FD6941]' : 'bg-gray-300'}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`} />
        </button>
    </div>
);

export default SuperAdminSettings;
