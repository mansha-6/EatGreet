import React, { useState } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import { cn } from "../../lib/utils";
import logoFull from '../../assets/logo-full.png';

export const FloatingNav = ({
    navItems,
    className,
}) => {
    const { scrollY } = useScroll();

    const [visible, setVisible] = useState(true);
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const hideTimerRef = React.useRef(null);

    // Track active section based on scroll
    React.useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px', // More centered detection
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.id === "hero-container") {
                        setActiveSection("");
                    } else {
                        setActiveSection(`#${entry.target.id}`);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe Hero
        const hero = document.getElementById("hero-container");
        if (hero) observer.observe(hero);

        // Target sections based on nav item links
        navItems.forEach(item => {
            const id = item.link.replace('#', '');
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [navItems]);

    useMotionValueEvent(scrollY, "change", (latest) => {
        // Show immediately while scrolling
        setVisible(true);
        setScrolled(latest > 50);

        // Reset the idle timer
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        // Hide after 2.2 seconds of inactivity, only if scrolled down and menu is closed
        hideTimerRef.current = setTimeout(() => {
            if (latest > 120 && !open) {
                setVisible(false);
            }
        }, 2200);
    });

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.header
                // ❌ Removed x: "-50%"
                initial={{ y: -100 }}
                animate={{
                    y: visible ? (scrolled ? 16 : 0) : -100,
                    width: scrolled ? "min(1250px, 94%)" : "100%",
                    // ❌ Removed x: "-50%"
                }}
                transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1]
                }}
                className={cn(
                    "fixed top-0 left-0 right-0 mx-auto z-[5000] flex items-center transition-all duration-500",
                    scrolled
                        ? "rounded-full bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] border border-white/50 h-14 md:h-16 mt-4"
                        : "h-16 md:h-20 bg-white border-b border-black/[0.05]",
                    className
                )}
            >
                <div className="max-w-[1400px] mx-auto w-full px-6 md:px-10 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <img src={logoFull} alt="EatGreet Logo" className="h-[24px] md:h-[28px] w-auto" />
                    </div>

                    {/* Navigation Links - Desktop with Animated Box */}
                    <nav className="hidden md:flex items-center justify-center relative h-10 px-2">
                        <div className="flex items-center gap-1 relative h-full">
                            {navItems.map((item, idx) => {
                                const isActive = activeSection === item.link && scrolled;
                                return (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        className={cn(
                                            "relative px-6 h-full flex items-center justify-center text-[13px] font-bold transition-colors tracking-[0.18em] uppercase rounded-full z-10 min-w-[110px]",
                                            isActive ? "text-[#FD6941]" : "text-gray-500 hover:text-black"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                initial={false} // ✅ Prevents the awkward corner jump when it first appears
                                                className="absolute inset-0 bg-[#FD6941]/30 border border-[#FD6941]/40 rounded-full z-[-1]"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                        {/* ✅ Wrap the text in a span to ensure it always stays above the pill */}
                                        <span className="relative z-10">{item.name}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4 md:gap-8">
                        <a
                            href="/admin/login"
                            className="text-[13px] font-bold text-gray-700 hover:text-black transition-colors px-1 uppercase tracking-widest hidden md:block"
                        >
                            LOGIN
                        </a>
                        <a
                            href="#contact"
                            className="hidden md:flex px-8 py-3 bg-[#FD6941] text-white text-[12px] font-extrabold rounded-full hover:bg-[#E55A35] transition-all shadow-lg shadow-[#FD6941]/20 whitespace-nowrap tracking-wider uppercase"
                        >
                            Get Started
                        </a>

                        {/* Mobile Menu Toggle (Three Line Dropdown) */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="md:hidden flex flex-col gap-1.5 w-6 cursor-pointer focus:outline-none pr-1"
                        >
                            <motion.span
                                animate={{ rotate: open ? 45 : 0, y: open ? 8 : 0 }}
                                className="h-0.5 w-full bg-black rounded-full block origin-center"
                            />
                            <motion.span
                                animate={{ opacity: open ? 0 : 1 }}
                                className="h-0.5 w-full bg-black rounded-full block"
                            />
                            <motion.span
                                animate={{ rotate: open ? -45 : 0, y: open ? -8 : 0 }}
                                className="h-0.5 w-full bg-black rounded-full block origin-center"
                            />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.98 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.98 }}
                            className={cn(
                                "absolute top-full left-0 right-0 bg-white border-b border-black/[0.05] md:hidden overflow-hidden",
                                scrolled && "rounded-3xl mt-2 shadow-2xl border border-black/5 mx-2"
                            )}
                        >
                            <div className="flex flex-col p-8 gap-6">
                                {navItems.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-bold text-gray-700 tracking-[0.2em] uppercase"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <a href="/admin/login" className="text-xs font-bold text-gray-900 tracking-[0.22em] uppercase">Login</a>
                                    <a href="#contact" onClick={() => setOpen(false)} className="text-xs font-extrabold text-[#FD6941] tracking-[0.2em] uppercase">Connect</a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
        </AnimatePresence>
    );
};
