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
    const { scrollYProgress } = useScroll();

    const [visible, setVisible] = useState(true);
    const [open, setOpen] = useState(false);

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        if (typeof current === "number") {
            let direction = current - scrollYProgress.getPrevious();
            if (scrollYProgress.get() < 0.05) {
                setVisible(true);
            } else {
                if (direction < 0) {
                    setVisible(true);
                } else {
                    setVisible(false);
                    setOpen(false); // Close menu on scroll down
                }
            }
        }
    });

    return (
        <AnimatePresence mode="wait">
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: visible ? 0 : -100 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn(
                    "fixed top-0 left-0 right-0 h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-black/[0.05] z-[5000] flex items-center transition-all",
                    className
                )}
            >
                <div className="max-w-7xl mx-auto w-full px-4 md:px-6 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <img src={logoFull} alt="EatGreet Logo" className="h-5 md:h-6 w-auto" />
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center gap-10">
                        {navItems.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                className="text-xs font-semibold text-gray-600 hover:text-primary transition-colors tracking-[0.2em] uppercase"
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <a
                            href="/login"
                            className="text-xs font-semibold text-gray-700 hover:text-black transition-colors px-1 uppercase tracking-widest hidden md:block"
                        >
                            LOGIN
                        </a>
                        <a
                            href="#contact"
                            className="hidden md:flex px-8 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-[#E55A35] transition-all shadow-lg shadow-primary/20 whitespace-nowrap tracking-widest uppercase"
                        >
                            GET STARTED
                        </a>

                        {/* Mobile Menu Toggle (Three Line Dropdown) */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="md:hidden flex flex-col gap-1.5 w-6 cursor-pointer focus:outline-none"
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
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="absolute top-16 left-0 right-0 bg-white border-b border-black/[0.05] md:hidden overflow-hidden"
                        >
                            <div className="flex flex-col p-6 gap-6">
                                {navItems.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-medium text-gray-600 tracking-[0.2em] uppercase"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <a href="/login" className="text-xs font-bold text-gray-800 tracking-[0.2em] uppercase">Login</a>
                                    <a href="#contact" onClick={() => setOpen(false)} className="text-xs font-bold text-primary tracking-[0.2em] uppercase">Connect</a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
        </AnimatePresence>
    );
};
