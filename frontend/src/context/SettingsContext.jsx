import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    // Derive currency from user object, with fallback
    const currency = user?.currency || 'INR';

    const currencySymbol = {
        'USD': '$',
        'EUR': '€',
        'INR': '₹',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
    }[currency] || '₹';

    const updateSettings = (newData) => {
        setUser(prevUser => {
            const updatedUser = { ...prevUser, ...newData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const fetchProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            if (data) {
                // Keep the token from localStorage
                const savedUser = JSON.parse(localStorage.getItem('user'));
                const updatedUser = { ...data, token: savedUser?.token };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('user')) {
            fetchProfile();
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userData.role);
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const [isLocked, setIsLocked] = useState(false);
    const [lockType, setLockType] = useState('expiry'); // 'expiry' or 'ban'

    // Global Subscription & Account Monitor
    useEffect(() => {
        if (user && user.role === 'admin') {
            const isBanned = user.restaurantDetails?.isActive === false;

            const endDate = user.subscription?.endDate ? new Date(user.subscription.endDate) : null;
            const now = new Date();
            const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
            const isPlanExpired = (daysLeft !== null && daysLeft <= 0) || user.subscription?.status === 'Expired';

            if (isBanned) {
                setIsLocked(true);
                setLockType('ban');
            } else if (isPlanExpired) {
                setIsLocked(true);
                setLockType('expiry');
                if (user.subscription.status !== 'Expired') {
                    updateSettings({
                        subscription: { ...user.subscription, status: 'Expired' }
                    });
                }
            } else {
                setIsLocked(false);
                if (daysLeft !== null && daysLeft <= 3) {
                    toast("Subscription expiring soon!", {
                        id: 'sub-warning-toast',
                        icon: '⚠️',
                        duration: 10000,
                        description: `Your ${user.subscription.plan} plan expires in ${daysLeft} days.`,
                        style: { borderRadius: '15px', border: '1px solid #FD6941', color: '#FD6941' }
                    });
                }
            }
        } else {
            setIsLocked(false);
        }
    }, [user?.subscription?.endDate, user?.subscription?.status, user?.restaurantDetails?.isActive]);

    return (
        <SettingsContext.Provider value={{ user, currency, currencySymbol, updateSettings, login, logout, isLocked }}>
            {children}
            {isLocked && user?.role === 'admin' && (
                <div className="fixed inset-0 z-[999999] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-6 text-center overflow-hidden">
                    <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-normal text-gray-900 mb-4 tracking-tight">
                            {lockType === 'ban' ? 'Account Suspended' : 'Plan Expired'}
                        </h2>
                        <p className="text-gray-500 font-normal text-sm leading-relaxed mb-10">
                            {lockType === 'ban'
                                ? "Your dashboard access has been suspended by the administration. Please contact support for more information."
                                : `Your ${user?.subscription?.plan || 'current'} plan has reached its limit. Access to the software is locked until your subscription is renewed.`
                            }
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => window.open(`mailto:support@eatgreet.com?subject=${lockType === 'ban' ? 'Account Suspension Inquiry' : 'Plan Renewal Support'}`)}
                                className="w-full py-5 bg-[#FD6941] text-white rounded-3xl font-normal text-sm uppercase tracking-widest shadow-xl shadow-[#FD6941]/20 hover:scale-[1.02] transition-all"
                            >
                                {lockType === 'ban' ? 'Contact Administration' : 'Renew Subscription Now'}
                            </button>
                            <p className="text-[10px] text-gray-400 font-normal uppercase tracking-[0.2em]">
                                {lockType === 'ban' ? 'Immediate action required for reactivation' : 'Contact support to unlock your business dashboard'}
                            </p>
                        </div>
                    </div>
                    <div className="absolute bottom-10 flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-normal uppercase tracking-[0.3em]">Powered By</span>
                        <h1 className="text-xl font-normal text-gray-300 mt-2">EatGreet</h1>
                    </div>
                </div>
            )}
        </SettingsContext.Provider>
    );
};
