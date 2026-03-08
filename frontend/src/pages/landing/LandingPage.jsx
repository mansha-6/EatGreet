import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Users,
    Briefcase,
    ChefHat,
    BarChart3,
    ShieldCheck,
    Globe,
    UtensilsCrossed,
    Layout,
    Menu as MenuIcon,
    Tag,
    UserPlus,
    Mail,
    Phone,
    MapPin,
    Building2,
    User,
    Eye,
    Check,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FloatingNav } from '../../components/landing/FloatingNav';
import menuIcon from '../../assets/menu-icon.png';
import logoFull from '../../assets/logo-full.png';
import contactIllustrationHD from '../../assets/contact-illustration-hd.png';

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

import HeroVideo from '../../components/landing/HeroVideo';
import InfiniteMenuScroll from '../../components/landing/InfiniteMenuScroll';
import BentoFeatures from '../../components/landing/BentoFeatures';
import PricingPlans from '../../components/landing/PricingPlans';
import { ContainerScroll } from '../../components/landing/ContainerScroll';
import LandingFooter from '../../components/landing/LandingFooter';
import arVideo from '../../assets/AR_Menu_Experience_Video_Generation.mp4';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

import FluidCanvas from '../../components/landing/FluidCanvas';
import Lenis from 'lenis';

const navItems = [
    { name: "Menu", link: "#menu-showcase" },
    { name: "Features", link: "#bento-features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Waitlist", link: "#contact" },
];

// Load Google Maps Script
if (typeof window !== 'undefined' && !window.google && !document.getElementById('google-maps-script')) {
    const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (mapsKey) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    } else {
        console.warn("Google Maps API key is missing. City autocomplete will be disabled.");
    }
}

const WaitlistForm = ({ handleRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        businessName: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const autocompleteService = useRef(null);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'name') {
            if (!/^[a-zA-Z\s]*$/.test(value)) error = 'Only alphabets allowed';
            else if (value.length > 0 && value.length < 3) error = 'Name too short';
        }
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value.length > 0 && !emailRegex.test(value)) error = 'Invalid email format';
        }
        if (name === 'phone') {
            if (value.length > 0 && value.length !== 10) error = 'Must be exactly 10 digits';
            else if (value.length === 10 && !/^[6-9]\d{9}$/.test(value)) error = 'Invalid Indian number';
        }
        if (name === 'city' && value.length > 0 && value.length < 2) {
            error = 'Location name too short';
        }
        if (name === 'businessName' && value.length > 0 && value.length < 2) {
            error = 'Business name too short';
        }

        setFieldErrors(prev => {
            // Only update if the error actually changed to avoid unnecessary re-renders
            if (prev[name] === error) return prev;
            return { ...prev, [name]: error };
        });
        return error;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        if (name === 'name') {
            sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }
        if (name === 'phone') {
            sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
        validateField(name, sanitizedValue);
    };

    const handleCityChange = async (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, city: value }));
        validateField('city', value);

        if (value.length > 0) {
            // Use Google Places Autocomplete if available
            if (window.google && window.google.maps && window.google.maps.places) {
                if (!autocompleteService.current) {
                    autocompleteService.current = new window.google.maps.places.AutocompleteService();
                }

                autocompleteService.current.getPlacePredictions(
                    {
                        input: value,
                        // Focus on cities in India
                        types: ['(cities)'],
                        componentRestrictions: { country: 'in' } // Focus on Indian locations
                    },
                    (predictions) => {
                        if (predictions) {
                            setCitySuggestions(predictions.map(p => p.description));
                            setShowSuggestions(true);
                        } else {
                            setCitySuggestions([]);
                            setShowSuggestions(false);
                        }
                    }
                );
            }
        } else {
            setCitySuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        const loadToast = toast.loading("Fetching your location...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                    const data = await response.json();
                    if (data.results && data.results[0]) {
                        let city = '';
                        for (let component of data.results[0].address_components) {
                            if (component.types.includes('locality')) {
                                city = component.long_name;
                                break;
                            }
                        }
                        if (!city) {
                            for (let component of data.results[0].address_components) {
                                if (component.types.includes('administrative_area_level_2')) {
                                    city = component.long_name;
                                    break;
                                }
                            }
                        }
                        const finalLocation = city || data.results[0].formatted_address;

                        setFormData(prev => ({ ...prev, city: finalLocation }));
                        setFieldErrors(prev => ({ ...prev, city: '' }));
                        toast.success("Location updated!", { id: loadToast });
                    } else {
                        toast.error("Could not find address", { id: loadToast });
                    }
                } catch (error) {
                    toast.error("Failed to fetch address", { id: loadToast });
                }
            },
            () => {
                toast.error("Permission denied or location unavailable", { id: loadToast });
            }
        );
    };

    const selectCity = (city) => {
        setFormData(prev => ({ ...prev, city: city }));
        setFieldErrors(prev => ({ ...prev, city: '' }));
        setCitySuggestions([]);
        setShowSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Final validation check
        const errors = {};
        Object.keys(formData).forEach(key => {
            const err = validateField(key, formData[key]);
            if (err) errors[key] = err;
            if (!formData[key]) errors[key] = 'Required field';
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please fix the errors in the form.');
            return;
        }

        setIsLoading(true);

        try {
            const signupData = {
                ...formData,
                password: formData.phone,
                role: 'admin',
                restaurantName: formData.businessName
            };

            const response = await authAPI.register(signupData);
            const userData = response.data;

            if (userData.isApproved === false) {
                setSuccess('Application submitted! Your account is under review. Please check your email.');
                setFormData({ name: '', email: '', phone: '', city: '', businessName: '' });
                setFieldErrors({});
            } else {
                setSuccess('Registration successful! Redirecting...');
                handleRegisterSuccess();
            }
        } catch (err) {
            console.error('Registration Error Details:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please check your details.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-8" onSubmit={handleSubmit} noValidate>
            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-200"
                >
                    {error}
                </motion.div>
            )}
            {success && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold border border-green-200"
                >
                    {success}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                {/* Full Name */}
                <div className="md:col-span-2 space-y-2 group">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                        <span>Full Name<span className="text-red-500">*</span></span>
                        {fieldErrors.name && (
                            <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic animate-in fade-in slide-in-from-right-2 duration-300">
                                {fieldErrors.name}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-5 h-12 bg-white border ${fieldErrors.name ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                            placeholder="Only alphabets allowed"
                        />
                    </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2.5 group">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-widest group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                        <span>Email Address<span className="text-red-500">*</span></span>
                        {fieldErrors.email && (
                            <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic animate-in fade-in slide-in-from-right-2 duration-300">
                                {fieldErrors.email}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-5 h-12 bg-white border ${fieldErrors.email ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                        <span>Mobile Number<span className="text-red-500">*</span></span>
                        {fieldErrors.phone && (
                            <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic animate-in fade-in slide-in-from-right-2 duration-300">
                                {fieldErrors.phone}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-5 h-12 bg-white border ${fieldErrors.phone ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                            placeholder="10 digits only"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-2 group relative">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                        <span>City<span className="text-red-500">*</span></span>
                        {fieldErrors.city && (
                            <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic animate-in fade-in slide-in-from-right-2 duration-300">
                                {fieldErrors.city}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.city ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleCityChange}
                            className={`w-full pl-12 pr-12 h-12 bg-white border ${fieldErrors.city ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                            placeholder="Search your city..."
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={handleLocateMe}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#FD6941] transition-colors"
                            title="Use my current location"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm0 0V4m0 16v-4m8-4h-4M4 12h4" />
                            </svg>
                        </button>
                    </div>

                    <AnimatePresence>
                        {showSuggestions && citySuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                            >
                                {citySuggestions.map((city, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => selectCity(city)}
                                        className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-[#FD6941]/5 hover:text-[#FD6941] transition-colors"
                                    >
                                        {city}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Business Name */}
                <div className="space-y-2 group">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider group-focus-within:text-[#FD6941] transition-colors flex justify-between h-4 items-center">
                        <span>Business Name<span className="text-red-500">*</span></span>
                        {fieldErrors.businessName && (
                            <span className="text-[10px] text-red-500 font-bold lowercase tracking-normal italic animate-in fade-in slide-in-from-right-2 duration-300">
                                {fieldErrors.businessName}
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.businessName ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#FD6941]'}`} />
                        <input
                            type="text"
                            name="businessName"
                            required
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-5 h-12 bg-white border ${fieldErrors.businessName ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-[#FD6941]/5 focus:border-[#FD6941]'} rounded-full outline-none transition-all placeholder-gray-400 font-medium text-sm text-gray-900 shadow-sm`}
                            placeholder="Restaurant name"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-fit px-12 py-4 bg-[#FD6941] text-white font-extrabold rounded-full hover:bg-[#E55A35] hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2.5 text-[17px] group shadow-lg shadow-[#FD6941]/10"
                >
                    {isLoading ? 'Creating Account...' : 'Register Now'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
                <p className="mt-6 text-center lg:text-left text-xs text-gray-500 font-bold flex items-center justify-center lg:justify-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Secured with industry-standard encryption.
                </p>
            </div>
        </form>
    );
};

export default function LandingPage() {
    const { hash } = useLocation();
    const navigate = useNavigate();

    // Initialize Lenis Smooth Scroll
    useEffect(() => {
        // Disable Lenis on touch devices as it often interferes with native scroll feel
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            infinite: false,
        });

        // Integrate Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        const updateGSAP = (time) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(updateGSAP);
        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.destroy();
            gsap.ticker.remove(updateGSAP);
        };
    }, []);

    const handleRegisterSuccess = () => {
        setTimeout(() => {
            navigate('/admin/login');
        }, 1500);
    };

    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [hash]);

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-visible relative">
            <FluidCanvas />

            <FloatingNav navItems={navItems} />

            {/* Hero Section — Centered Layout */}
            <section className="relative px-4 md:px-6 overflow-visible flex flex-col items-center justify-start bg-white pt-28 pb-8 md:pt-44 md:pb-16 text-center" id="hero-container">

                {/* Announcement pill */}
                <motion.a
                    href="#contact"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }} // Slow, single-time entrance
                    className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-gray-200 bg-white shadow-sm text-[9px] md:text-xs font-medium text-gray-700 mb-6 md:mb-8 hover:bg-gray-50 transition-colors"
                >
                    🎉 Now with AR Menu Generation — <span className="text-[#FD6941] font-medium ml-1">Try it free →</span>
                </motion.a>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold text-gray-900 leading-[1.1] md:leading-[1.08] tracking-tight max-w-5xl mx-auto font-['Urbanist']"
                >
                    One-stop dining<br />
                    <span className="text-[#FD6941]">platform</span> for your<br />
                    restaurant
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 md:mt-6 text-sm md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed px-4"
                >
                    EatGreet orchestrates every touchpoint — interactive 3D menus, kitchen displays, real-time analytics, and a full manager command center in one ecosystem.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4"
                >
                    <a href="#contact" className="px-6 md:px-8 py-3 md:py-3.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-700 transition-all shadow-lg text-[11px] md:text-sm tracking-wide uppercase">
                        Get started free
                    </a>
                    <a href="#contact" className="px-6 md:px-8 py-3 md:py-3.5 text-gray-700 font-medium text-[11px] md:text-sm flex items-center gap-2 hover:text-[#FD6941] transition-colors uppercase tracking-widest">
                        Contact us <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </motion.div>

                {/* Video Card Showcase */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 40 }}
                    className="mt-10 md:mt-16 w-full max-w-5xl mx-auto relative group px-2 md:px-0"
                >
                    {/* Premium Video Card Frame */}
                    <div className="relative rounded-[2rem] md:rounded-[3rem] border border-white/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden bg-black/5 aspect-video isolate">
                        {/* Glass overlay */}
                        <div className="absolute inset-0 z-10 border-[8px] md:border-[12px] border-white/5 pointer-events-none rounded-[2rem] md:rounded-[3rem]" />

                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        >
                            <source src={arVideo} type="video/mp4" />
                        </video>
                    </div>

                    {/* Glow behind card */}
                    <div className="absolute -inset-10 bg-[#FD6941]/5 blur-[100px] rounded-full -z-10 opacity-60" />
                </motion.div>
            </section>

            {/* Menu Showcase Section */}
            <InfiniteMenuScroll />

            {/* Smart Bento Ecosystem Features */}
            <BentoFeatures />

            {/* Deep Dive Grid */}
            <section className="pb-16 md:pb-20 bg-gray-50" >
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* AI Sales Reports */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className="bg-[#FFF5F1] p-6 md:p-10 rounded-3xl flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <span className="text-[#FD6941] font-bold text-xs tracking-widest uppercase mb-2 block">Twin Intelligence</span>
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">AI-Driven Sales Reports</h3>
                                <p className="text-gray-600 mb-8 max-w-sm text-sm">Predict demand patterns, identify menu stars, and automate labor costs with 98.4% accuracy.</p>
                                <button className="text-[#FD6941] font-bold flex items-center gap-2 hover:gap-3 transition-all group-hover:text-[#FD6941]">
                                    ANALYZE NOW <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute right-0 bottom-0 top-20 w-2/3 opacity-80 translate-x-12 translate-y-12 transition-transform duration-500 group-hover:translate-x-8 group-hover:translate-y-8">
                                {/* Abstract chart representation using CSS */}
                                <div className="w-full h-full bg-white rounded-tl-2xl shadow-xl p-4">
                                    <div className="space-y-3 pt-6">
                                        <div className="h-2 w-3/4 bg-gray-100 rounded" />
                                        <div className="h-2 w-1/2 bg-gray-100 rounded" />
                                        <div className="flex justify-between items-end h-32 mt-8 gap-2">
                                            {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    transition={{ delay: 0.2 + (i * 0.1), duration: 0.8, type: "spring" }}
                                                    viewport={{ once: true }}
                                                    className="w-full bg-[#FD6941] rounded-t hover:bg-[#FD6941]/80 transition-colors cursor-pointer"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 3D Multimedia Menus */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className="bg-primary text-white p-6 md:p-10 rounded-3xl relative overflow-hidden flex flex-col justify-center"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10">
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">3D Multimedia <br /> Menus</h3>
                                <p className="text-white/80 mb-8 text-xs md:text-sm max-w-[55%] md:max-w-[60%] leading-relaxed">
                                    Immersive visual dining that increases average order value by 32%.
                                </p>

                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wide opacity-90">Active Visualization.js</span>
                                </div>
                            </div>



                            <motion.img
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                src={menuIcon}
                                alt="3D Menu"
                                className="absolute bottom-4 right-4 w-32 md:w-48 opacity-90 drop-shadow-2xl"
                            />
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
                            className="bg-white p-8 rounded-3xl flex items-center gap-6 shadow-sm border border-gray-100 transition-colors cursor-default"
                        >
                            <div className="w-16 h-16 bg-[#FFF5F1] rounded-2xl flex items-center justify-center text-[#FD6941] flex-shrink-0">
                                <Globe className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-2">Global Revenue Tracking</h4>
                                <p className="text-gray-500 text-sm">Multi-currency, multi-regional synchronization in real-time.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
                            className="bg-white p-8 rounded-3xl flex items-center gap-6 shadow-sm border border-gray-100 transition-colors cursor-default"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 flex-shrink-0">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-2">Enterprise-Grade Security</h4>
                                <p className="text-gray-500 text-sm">Military-grade encryption for every transaction and customer data point.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* SaaS Pricing Tiers */}
            <PricingPlans />

            {/* Footer / CTA Section */}
            <section id="contact" className="pt-4 pb-16 md:py-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-gray-100 relative z-10">

                    {/* Centered Heading - Single Line */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                            We’d Love to answer your questions
                        </h2>
                        <p className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto">
                            Have a query? We'd be happy to answer any questions you might have.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Side: Illustration */}
                        <div className="flex justify-center order-2 lg:order-1">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                src={contactIllustrationHD}
                                alt="Contact Illustration"
                                className="w-full max-w-md object-contain drop-shadow-xl"
                            />
                        </div>

                        {/* Right Side: Form - Improved Contrast */}
                        <div className="relative order-1 lg:order-2">
                            <WaitlistForm handleRegisterSuccess={handleRegisterSuccess} />
                        </div>
                    </div>
                </div>
            </section >

            <LandingFooter />
        </div >
    );
}
