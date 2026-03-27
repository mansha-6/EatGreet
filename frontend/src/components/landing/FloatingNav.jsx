import React, { useState } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import logoFull from '../../assets/logo-full.png';

export const FloatingNav = ({ navItems, className }) => {
    const { scrollY } = useScroll();
    const [visible, setVisible] = useState(true);
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const hideTimerRef = React.useRef(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id === "hero-container" ? "" : `#${entry.target.id}`);
                    }
                });
            },
            { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 }
        );
        const hero = document.getElementById("hero-container");
        if (hero) observer.observe(hero);
        navItems.forEach(item => {
            const el = document.getElementById(item.link.replace('#', ''));
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [navItems]);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setVisible(true);
        setScrolled(latest > 50);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (latest > 120 && !open) setVisible(false);
        }, 2200);
    });

    React.useEffect(() => {
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: visible ? 0 : -100 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                    // Always fixed full-width — NO width animation
                    "fixed top-0 left-0 right-0 z-[5000] transition-all duration-500",
                    scrolled
                        ? "pt-3 pb-0 px-3 sm:px-5 md:px-8"   // padding creates float gap
                        : "bg-white border-b border-black/[0.06]",
                    className
                )}
            >
                {/* Inner bar — pill on scroll, flat on top */}
                <div className={cn(
                    "w-full mx-auto flex flex-col transition-all duration-500",
                    scrolled
                        ? "max-w-6xl rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] border border-gray-100"
                        : "max-w-none"
                )}>
                    {/* ── Main row ── */}
                    <div className={cn(
                        "flex items-center justify-between",
                        scrolled
                            ? "h-14 px-4 sm:px-6 md:px-10"
                            : "h-16 md:h-[72px] px-5 sm:px-8 md:px-12"
                    )}>

                        {/* Logo */}
                        <a href="/" className="flex items-center shrink-0">
                            <img
                                src={logoFull}
                                alt="EatGreet"
                                className="h-[22px] sm:h-[24px] lg:h-[28px] w-auto"
                            />
                        </a>

                        {/* Nav links — desktop only (1024px+) */}
                        <nav className="hidden lg:flex items-center h-10 gap-1">
                            {navItems.map((item, idx) => {
                                const isActive = activeSection === item.link && scrolled;
                                return (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        className={cn(
                                            "relative px-5 h-full flex items-center text-[11px] font-bold uppercase tracking-[0.15em] rounded-full transition-colors whitespace-nowrap",
                                            isActive ? "text-[#FD6941]" : "text-gray-500 hover:text-black"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                initial={false}
                                                className="absolute inset-0 bg-[#FD6941]/20 border border-[#FD6941]/30 rounded-full -z-10"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        {item.name}
                                    </a>
                                );
                            })}
                        </nav>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 shrink-0">
                            {/* Login — 640px+ */}
                            <a
                                href="/admin/login"
                                className="hidden sm:block text-[11px] font-extrabold text-[#FD6941] hover:text-[#E55A35] transition-colors uppercase tracking-widest whitespace-nowrap"
                            >
                                Login
                            </a>

                            {/* Get Started — 640px+ */}
                            <a
                                href="#contact"
                                className="hidden sm:inline-flex items-center px-4 py-2 sm:px-5 lg:px-7 lg:py-2.5 bg-[#FD6941] text-white text-[10px] lg:text-[11px] font-extrabold rounded-full hover:bg-[#E55A35] transition-all shadow-md shadow-[#FD6941]/20 whitespace-nowrap tracking-wider uppercase"
                            >
                                Get Started
                            </a>

                            {/* Hamburger — below lg (mobile + tablet) */}
                            <button
                                onClick={() => setOpen(!open)}
                                className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer focus:outline-none"
                                aria-label="Toggle menu"
                            >
                                <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }} className="h-0.5 w-5 bg-gray-800 rounded-full block origin-center" />
                                <motion.span animate={{ opacity: open ? 0 : 1 }} className="h-0.5 w-5 bg-gray-800 rounded-full block" />
                                <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }} className="h-0.5 w-5 bg-gray-800 rounded-full block origin-center" />
                            </button>
                        </div>
                    </div>

                    {/* ── Dropdown ── mobile & tablet */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden lg:hidden"
                            >
                                <div className="px-4 sm:px-6 pt-1 pb-5 flex flex-col gap-4">
                                    {/* Nav links: 2 cols mobile, 4 cols tablet */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                        {navItems.map((item, idx) => (
                                            <a
                                                key={idx}
                                                href={item.link}
                                                onClick={() => setOpen(false)}
                                                className="text-[11px] font-bold text-gray-600 tracking-[0.18em] uppercase py-3 px-2 rounded-xl hover:bg-gray-50 hover:text-[#FD6941] transition-colors text-center"
                                            >
                                                {item.name}
                                            </a>
                                        ))}
                                    </div>

                                    {/* Mobile bottom row — Login + CTA (hidden sm+ since shown in header) */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 sm:hidden">
                                        <a href="/admin/login" className="text-[11px] font-extrabold text-[#FD6941] uppercase tracking-wider">
                                            Login
                                        </a>
                                        <a
                                            href="#contact"
                                            onClick={() => setOpen(false)}
                                            className="px-5 py-2 bg-[#FD6941] text-white text-[10px] font-extrabold rounded-full hover:bg-[#E55A35] transition-all uppercase tracking-wider"
                                        >
                                            Get Started
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.header>
        </AnimatePresence>
    );
};
