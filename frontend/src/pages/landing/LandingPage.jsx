import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
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
    UserPlus
} from 'lucide-react';
import { FloatingNav } from '../../components/landing/FloatingNav';
import menuIcon from '../../assets/menu-icon.png';
import logoFull from '../../assets/logo-full.png';
import contactIllustrationHD from '../../assets/contact-illustration-hd.png';

import { useState } from 'react';
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

export default function LandingPage() {
    const { hash } = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: "Menu", link: "#menu-showcase" },
        { name: "Features", link: "#bento-features" },
        { name: "Pricing", link: "#pricing" },
        { name: "Waitlist", link: "#contact" },
    ];

    // Initialize Lenis Smooth Scroll
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: true, // often smoother behavior by letting Lenis handle it correctly
            touchMultiplier: 1.5,
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

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        businessName: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // Landing page registration is always for creating a NEW Restaurant (Admin)
            // The user request explicitly states "create new folder... create dynamically database"

            if (!formData.businessName) {
                setError('Restaurant/Business Name is required to set up your system.');
                setIsLoading(false);
                return;
            }

            const signupData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                city: formData.city,
                role: 'admin', // Always admin for improved landing page flow
                restaurantName: formData.businessName
            };

            const response = await authAPI.register(signupData);
            const userData = response.data;

            if (userData.isApproved === false) {
                setSuccess('Application submitted! Your account is under review. Please check your email for updates.');
                setFormData({ name: '', email: '', password: '', phone: '', city: '', businessName: '' });
            } else {
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/admin/login');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setIsLoading(false);
        }
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
        <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden relative">
            <FluidCanvas />

            <FloatingNav navItems={navItems} />

            {/* Hero Section — Centered Layout */}
            <section className="relative px-4 md:px-6 overflow-visible flex flex-col items-center justify-start bg-white pt-28 pb-8 md:pt-44 md:pb-16 text-center" id="hero-container">

                {/* Announcement pill */}
                <motion.a
                    href="#contact"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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

                            <div className="relative z-10 max-w-md">
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">3D Multimedia <br /> Menus</h3>
                                <p className="text-white/80 mb-8 text-sm">Immersive visual dining that increases average order value by 32%.</p>

                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wide">Active Visualization.js</span>
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
                <div className="max-w-7xl mx-auto bg-white bg-opacity-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
                        {/* Left Side: Illustration & Text */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight text-center lg:text-left">We’d Love to answer your questions</h2>
                                <p className="text-gray-500 text-base md:text-lg text-center lg:text-left">Have a query? We'd be happy to answer any questions you might have.</p>
                            </div>
                            <div className="flex justify-center lg:justify-start">
                                <img src={contactIllustrationHD} alt="Contact Illustration" className="w-full max-w-md object-contain" />
                            </div>
                        </div>

                        {/* Right Side: Form */}
                        <div className="bg-transparent">
                            <form className="grid gap-5" onSubmit={handleRegister}>
                                {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold">{error}</div>}
                                {success && <div className="bg-green-50 text-green-500 p-4 rounded-2xl text-sm font-bold">{success}</div>}

                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">Full Name<span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">Email Address<span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">Password<span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">Phone no.<span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="+91..."
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">City<span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="Your City"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800 ml-1">Business Name (Restaurant)<span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-[#EAEAEA] border-none rounded-2xl focus:ring-2 focus:ring-[#FD6941] outline-none transition-all placeholder-gray-400"
                                            placeholder="Your Restaurant Name"
                                        />
                                    </div>
                                </div>


                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-12 py-3.5 bg-[#FD6941] text-white font-bold rounded-full hover:bg-[#E55A35] transition-all shadow-lg  text-lg disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isLoading ? 'Creating Account...' : 'Register Now'} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section >

            <LandingFooter />
        </div >
    );
}
