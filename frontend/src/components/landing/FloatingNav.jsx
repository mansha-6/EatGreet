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

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        // Check if current is not undefined and is a number
        if (typeof current === "number") {
            let direction = current - scrollYProgress.getPrevious();

            if (scrollYProgress.get() < 0.05) {
                setVisible(true);
            } else {
                if (direction < 0) {
                    setVisible(true);
                } else {
                    setVisible(false);
                }
            }
        }
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{
                    opacity: 1,
                    y: -100,
                }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0,
                }}
                transition={{
                    duration: 0.2,
                }}
                className={cn(
                    "flex fixed top-6 md:top-10 inset-x-4 md:inset-x-0 mx-auto border border-black/[0.08] rounded-full bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-[5000] px-3 md:px-4 py-2 items-center justify-between md:justify-center md:space-x-6 max-w-[95%] md:max-w-fit",
                    className
                )}
            >
                {/* Logo - Always visible */}
                <div className="flex items-center pr-2 md:pr-4 md:border-r border-black/[0.05]">
                    <img src={logoFull} alt="Logo" className="h-4 md:h-5 w-auto" />
                </div>

                {/* Nav Items Container for better control */}
                <div className="flex items-center space-x-3 md:space-x-6">
                    {navItems.map((navItem, idx) => (
                        <a
                            key={`link=${idx}`}
                            href={navItem.link}
                            className={cn(
                                "relative text-gray-600 items-center flex hover:text-primary transition-colors text-[10px] md:text-xs font-medium tracking-[0.1em] md:tracking-[0.15em] uppercase"
                            )}
                        >
                            <span className="md:hidden">{navItem.icon}</span>
                            <span className="hidden md:block">{navItem.name}</span>
                        </a>
                    ))}
                </div>

                <div className="hidden md:block h-4 w-px bg-black/[0.05]" />

                <div className="flex items-center gap-1.5 md:gap-2">
                    <a
                        href="/login"
                        className="hidden sm:block text-[10px] font-medium text-gray-500 hover:text-black transition-colors px-2 md:px-3 uppercase tracking-widest"
                    >
                        LOGIN
                    </a>
                    <a
                        href="#contact"
                        className="px-4 md:px-5 py-2 bg-primary text-white text-[9px] md:text-[10px] font-medium rounded-full hover:bg-[#E55A35] transition-all shadow-lg shadow-primary/20 whitespace-nowrap tracking-widest uppercase"
                    >
                        {/* Smaller text on mobile to avoid overflow */}
                        <span className="sm:hidden">START</span>
                        <span className="hidden sm:block">GET STARTED</span>
                    </a>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
