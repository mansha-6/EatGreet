import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Settings, Bell, Menu as MenuIcon, X, LogOut, ChevronDown,
    ShoppingBag, Heart, ChefHat, LayoutDashboard, Utensils, Layers, Table2, TrendingUp, Users, CreditCard, FileText
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import logo from '../assets/logo-full.png';
import tableIcon from '../assets/Table-Bar--Streamline-Sharp-Material.svg';

const DynamicNavbar = ({ customerProps }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { restaurantName: paramRestName } = useParams();
    const { user, logout } = useSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Determine Role & View Type
    const role = user?.role || 'customer';
    const path = location.pathname;

    let viewType = 'CUSTOMER';
    if (path.startsWith('/super-admin')) viewType = 'SUPER_ADMIN';
    else if (path.includes('/admin')) viewType = 'ADMIN';
    else if (path.includes('/kitchen')) viewType = 'KITCHEN';

    // --- Admin Notification Logic ---
    const {
        notifications, unreadCount, markAsRead, markAllRead, clearAll
    } = useAdminNotifications();

    // --- Navigation Items ---
    const restaurantSlug = user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || paramRestName || 'restaurant';

    const getNavItems = () => {
        switch (viewType) {
            case 'SUPER_ADMIN':
                return [
                    { label: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
                    { label: 'Restaurants', path: '/super-admin/restaurants', icon: Utensils },
                    { label: 'Payment', path: '/super-admin/payments', icon: CreditCard },
                    { label: 'Reports', path: '/super-admin/reports', icon: FileText },
                    { label: 'Users', path: '/super-admin/users', icon: Users },
                ];
            case 'ADMIN':
                return [
                    { label: 'Dashboard', path: `/${restaurantSlug}/admin`, icon: LayoutDashboard },
                    { label: 'Menu', path: `/${restaurantSlug}/admin/menu`, icon: Utensils },
                    { label: 'Category', path: `/${restaurantSlug}/admin/category`, icon: Layers },
                    { label: 'Order', path: `/${restaurantSlug}/admin/orders`, icon: ShoppingBag },
                    { label: 'Table', path: `/${restaurantSlug}/admin/table`, icon: Table2 },
                    { label: 'Sales', path: `/${restaurantSlug}/admin/sales`, icon: TrendingUp },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        logout();
        if (viewType === 'SUPER_ADMIN') navigate('/super-admin/login');
        else navigate('/admin/login');
    };

    const isActive = (path) => {
        return location.pathname === path || (path !== '/' && location.pathname.endsWith(path))
            ? 'bg-black text-white shadow-md'
            : 'text-gray-500 hover:text-black hover:bg-gray-50/50';
    };

    // --- Customer Logic Helper ---
    // If we are in customer view, we rely on props passed from CustomerLayout because state is managed there.
    const {
        cart, favorites, tableNo, setShowBill, totalItems, baseUrl
    } = customerProps || {};

    // --- Render ---

    // 1. KITCHEN VIEW (Simplified)
    if (viewType === 'KITCHEN') {
        return (
            <nav className="bg-[#F5F5F5] px-10 py-8 flex justify-between items-center sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
                    <img src={user?.restaurantDetails?.logo || logo} alt="EatGreet" className="h-10 w-auto object-contain" onError={(e) => e.target.src = logo} />
                </Link>
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <button className="bg-white rounded-full pl-2 pr-6 py-2 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 transition-all hover:shadow-md group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FD6941] to-red-500 p-[2px] shadow-inner">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    {user?.profilePicture ? (
                                        <img src={user.profilePicture} alt="Kitchen" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Kitchen'}&background=FD6941&color=fff`} alt="Kitchen" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-gray-800 tracking-tight">{user?.name || 'Kitchen'}</span>
                                <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                            </div>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] overflow-hidden">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    // 2. CUSTOMER VIEW
    if (viewType === 'CUSTOMER') {
        return (
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
                    <Link to={`${baseUrl}/menu`} className="flex items-center gap-2">
                        <img src={customerProps?.logo || logo} alt="EatGreet" className="h-8 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-2 md:gap-4">
                        {tableNo && (
                            <>
                                <div className="hidden md:flex items-center gap-1 text-sm font-normal bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-wider text-gray-500">
                                    Table no. {tableNo !== 'preview' && <span className="text-black font-bold ml-1">{tableNo}</span>}
                                </div>
                                <div className="flex md:hidden items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-right-2">
                                    <img src={tableIcon} alt="Table" className="w-4 h-4" />
                                    <span className="text-xs font-bold text-gray-900 leading-none">{tableNo !== 'preview' ? tableNo : 'P'}</span>
                                </div>
                            </>
                        )}

                        <Link to={`${baseUrl}/favorites`} className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group">
                            <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
                            {favorites && Object.keys(favorites).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FD6941] rounded-full text-[10px] text-white flex items-center justify-center border border-white">
                                    {Object.keys(favorites).length}
                                </span>
                            )}
                        </Link>

                        <button onClick={() => setShowBill && setShowBill(true)} className="relative p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border border-white">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>
        );
    }

    // 3. ADMIN & SUPER_ADMIN VIEW
    return (
        <>
            {/* Main Header (Pill Style for Desktop, Simple for Mobile) */}
            <header className="px-4 sm:px-[30px] py-3 flex items-center justify-between sticky top-0 z-[100] bg-transparent backdrop-blur-md transition-all border-b border-gray-100 md:border-b-0">
                {/* Logo Section */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <button
                        className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>

                    <Link to={viewType === 'SUPER_ADMIN' ? '/super-admin' : `/${restaurantSlug}/admin`} className="block">
                        <img src={user?.restaurantDetails?.logo || logo} alt="EatGreet" className="h-7 sm:h-9 w-auto object-contain" />
                    </Link>
                </div>

                {/* Desktop Navigation (Pill Style) */}
                <nav className="hidden lg:flex items-center bg-white p-1.5 rounded-full border border-gray-100 shadow-sm gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-normal transition-all duration-300 ${isActive(item.path)}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Link
                        to={viewType === 'SUPER_ADMIN' ? '/super-admin/settings' : `/${restaurantSlug}/admin/settings`}
                        className="w-9 h-9 sm:w-11 sm:h-11 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-sm border border-gray-100 text-gray-600 hover:text-black"
                    >
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>

                    {viewType === 'ADMIN' && (
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="hidden sm:flex w-11 h-11 bg-white hover:bg-gray-50 rounded-full items-center justify-center transition-all shadow-sm border border-gray-100 text-gray-600 hover:text-black relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-normal text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100] bg-transparent" onClick={() => setIsNotificationOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[1.5rem] shadow-xl border border-gray-100 z-[101] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                            <h3 className="font-normal text-gray-800">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <button onClick={clearAll} className="text-xs font-normal text-red-500 hover:text-red-600">Clear all</button>
                                            )}
                                        </div>
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((notif) => (
                                                    <div key={notif.id} onClick={() => markAsRead(notif.id)} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read ? 'bg-[#FD6941]' : ''}`}>
                                                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${notif.type === 'newOrder' ? 'bg-green-100 text-green-600' : notif.type === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-[#FD6941] text-[#FD6941]'}`}>
                                                            <Bell className="w-5 h-5 fill-current" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="text-sm font-normal text-gray-900 truncate">{notif.title}</h4>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                                        </div>
                                                        {!notif.read && <div className="w-2 h-2 bg-[#FD6941] rounded-full mt-2 shrink-0"></div>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><Bell className="w-6 h-6 text-gray-300" /></div>
                                                    <p className="text-sm">No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
                                                <button onClick={markAllRead} className="text-xs font-normal text-gray-600 hover:text-black transition-colors">Mark all as read</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="relative group/profile">
                        <div className="flex items-center gap-3 pl-1.5 pr-1.5 sm:pr-4 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-50">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://ui-avatars.com/api/?name=${user?.name || (viewType === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin')}&background=FD6941&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="hidden md:flex items-center gap-2">
                                <span className="text-sm font-normal text-gray-800">{user?.name || (viewType === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin')}</span>
                                <ChevronDown className="w-4 h-4 text-gray-400 group-hover/profile:text-gray-600" />
                            </div>
                        </div>

                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-[110] overflow-hidden">
                            <Link
                                to={viewType === 'SUPER_ADMIN' ? '/super-admin/profile' : `/${restaurantSlug}/admin/profile`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4" /> Profile Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar (Floating Drawer - Phone Only) */}
            {isMenuOpen && (
                <div className="lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    ></div>

                    {/* Drawer Content - Flush Left, Rounded Right */}
                    <div className="fixed top-0 left-0 bottom-0 w-[290px] bg-white rounded-r-[2.5rem] shadow-2xl z-[151] flex flex-col overflow-hidden animate-in slide-in-from-left duration-300 ring-1 ring-black/5">
                        <div className="px-8 pt-12 pb-6 text-center relative border-b border-gray-50/50">
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-6 left-6 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
                            >
                                <X size={16} />
                            </button>

                            <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-tr from-[#FD6941] to-orange-300 mx-auto mb-4 p-[3px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-white p-[2px]">
                                    {user?.profilePicture ? (
                                        <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=FD6941&color=fff`}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    )}
                                </div>
                            </div>

                            <h3 className="text-[22px] font-normal text-gray-900 tracking-tight leading-tight">{user?.name || 'Admin'}</h3>
                            <button
                                onClick={() => {
                                    navigate(viewType === 'SUPER_ADMIN' ? '/super-admin/profile' : `/${restaurantSlug}/admin/profile`);
                                    setIsMenuOpen(false);
                                }}
                                className="mt-1 text-xs text-[#FD6941] font-normal block mx-auto active:opacity-70 transition-opacity"
                            >
                                View Profile
                                <span className="ml-1 bg-orange-100 px-1.5 py-0.5 rounded-full text-[9px] uppercase font-bold align-middle">New</span>
                            </button>
                        </div>

                        {/* Nav Items Section */}
                        <nav className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-1.5 no-scrollbar">
                            {navItems.map((item) => {
                                const active = location.pathname === item.path || (item.path !== '/' && location.pathname.endsWith(item.path));
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 active:scale-[0.98] ${active
                                            ? 'bg-black text-white shadow-xl shadow-black/10'
                                            : 'text-gray-500'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-white/10' : 'bg-gray-50'}`}>
                                            {Icon && <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />}
                                        </div>
                                        <span className="text-[17px] font-normal tracking-tight">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Logout Section */}
                        <div className="px-6 py-6 border-t border-gray-50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 active:bg-red-50 transition-all font-normal active:scale-95"
                            >
                                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                                    <LogOut size={20} className="text-red-500" />
                                </div>
                                <span className="text-[17px] tracking-tight">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DynamicNavbar;
