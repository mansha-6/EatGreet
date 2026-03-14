import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

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

    const [impersonatedRestaurant, setImpersonatedRestaurant] = useState(() => {
        const saved = localStorage.getItem('impersonatedRestaurant');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const impersonate = (restaurant) => {
        const data = {
            id: restaurant._id,
            name: restaurant.restaurantName,
            slug: restaurant.restaurantName?.toLowerCase()?.replace(/\s+/g, '-')
        };
        localStorage.setItem('impersonatedRestaurant', JSON.stringify(data));
        setImpersonatedRestaurant(data);
    };

    const stopImpersonating = () => {
        localStorage.removeItem('impersonatedRestaurant');
        setImpersonatedRestaurant(null);
    };

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userData.role);
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setImpersonatedRestaurant(null);
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
        <SettingsContext.Provider value={{ user, currency, currencySymbol, updateSettings, login, logout, isLocked, impersonatedRestaurant, impersonate, stopImpersonating }}>
            {children}
            {isLocked && user?.role === 'admin' && (
                <div className="fixed inset-0 z-[999999] bg-white/40 backdrop-blur-3xl flex items-center justify-center p-6 text-center overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FD6941]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

                    <div className="max-w-lg w-full bg-white/80 backdrop-blur-md rounded-[3rem] p-12 shadow-2xl border border-white/60 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FD6941] to-orange-400" />
                        
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping opacity-20" />
                            <svg className="w-12 h-12 text-rose-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h2 className="text-4xl font-medium text-gray-900 mb-6 tracking-tight">
                            {lockType === 'ban' ? 'Access Suspended' : 'Subscription Expired'}
                        </h2>
                        
                        <p className="text-gray-500 font-normal text-base leading-relaxed mb-12 px-4">
                            {lockType === 'ban'
                                ? "Your dashboard access has been suspended by the administration due to policy violations or pending verification. Please contact support for assistance."
                                : `Your access to the EatGreet Dashboard has been paused. Renew your ${user?.subscription?.plan || 'current'} plan today to restore your restaurant's digital operations.`
                            }
                        </p>

                        <div className="space-y-4">
                            {lockType !== 'ban' && (
                                <button
                                    onClick={() => window.location.href = '/activate-plan'}
                                    className="w-full py-5 bg-[#FD6941] text-white rounded-[2rem] font-medium text-base shadow-xl shadow-[#FD6941]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                                >
                                    Renew Subscription Now
                                    <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            )}
                            
                            <button
                                onClick={() => window.location.href = `mailto:support@eatgreet.com?subject=${lockType === 'ban' ? 'Account Suspension Inquiry' : 'Billing Assistance'}`}
                                className={`w-full py-5 ${lockType === 'ban' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'} rounded-[2rem] font-medium text-base hover:opacity-90 active:scale-95 transition-all`}
                            >
                                {lockType === 'ban' ? 'Contact Support' : 'Talk to Support'}
                            </button>

                            <button 
                                onClick={logout}
                                className="text-xs text-gray-400 font-medium uppercase tracking-widest hover:text-gray-600 transition-colors mt-6 underline underline-offset-8"
                            >
                                Switch Account Or Logout
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-12 flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.4em]">Verified By</span>
                        <h1 className="text-2xl font-medium text-gray-400 mt-2 opacity-50 tracking-tighter">EatGreet</h1>
                    </div>
                </div>
            )}
        </SettingsContext.Provider>
    );
};
