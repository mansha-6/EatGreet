import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, ShieldCheck, Rocket } from 'lucide-react';

const standardPlanBase = {
    name: "EatGreet Pro",
    desc: "The professional choice for growth-minded restaurant groups.",
    features: [
        "Unlimited AR Items",
        "Dynamic Pricing Engine",
        "Real-time AI Sync",
        "Priority 24/7 Support",
        "Advanced Sales Hub",
    ],
    icon: Sparkles,
    monthly: {
        price: 2499,
        period: "per month",
        subtext: null,
        highlight: false,
    },
    annually: {
        price: 24099,
        period: "per year",
        subtext: "Save ~20% compared to monthly",
        highlight: true,
    },
};

const customizedPlan = {
    name: "Customized",
    desc: "Enterprise solutions for massive chains and high-volume operations.",
    price: "Custom",
    period: "Tailored for Scale",
    features: [
        "White-label branding",
        "Global Supply Chain Tech",
        "Custom POS Integration",
        "SLA & Dedicated Manager",
        "Unlimited Sites",
    ],
    icon: ShieldCheck,
};

export default function PricingPlans() {
    const [isAnnual, setIsAnnual] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleWidth = isMobile ? 210 : 260;
    const pillWidth = isMobile ? 101 : 124;
    const padding = 4; // internal padding of the toggle

    const activePricing = isAnnual ? standardPlanBase.annually : standardPlanBase.monthly;
    const isHighlighted = activePricing.highlight;
    // Different icon per billing period
    const ActiveIcon = isAnnual ? Sparkles : Rocket;
    const CustomIcon = customizedPlan.icon;

    return (
        <section className="pt-24 pb-8 md:pb-24 relative overflow-hidden bg-white text-gray-900" id="pricing">
            <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-[#FD6941]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

                {/* ── Section Header ── */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FD6941]/10 rounded-full border border-[#FD6941]/20 mb-4 md:mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#FD6941]" />
                        <span className="text-[9px] font-medium tracking-[0.2em] text-[#FD6941] uppercase">Flexible Ecosystem</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight px-4"
                    >
                        Pricing built for{' '}
                        <span className="bg-gradient-to-r from-[#FD6941] to-[#ff8c6d] bg-clip-text text-transparent">
                            every scale.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-sm md:text-lg text-gray-500 font-medium px-4"
                    >
                        Choose the plan that matches your ambition. No hidden fees.
                    </motion.p>

                    {/* ── Glassmorphism Text Toggle ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center mx-auto mt-10 relative justify-center"
                        style={{
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            border: '1px solid rgba(255,255,255,0.7)',
                            borderRadius: '999px',
                            padding: `${padding}px`,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
                            width: toggleWidth,
                        }}
                    >
                        {/* Sliding active pill — moves between left and right half */}
                        <motion.div
                            animate={{ x: isAnnual ? pillWidth : 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                            style={{
                                position: 'absolute',
                                top: padding,
                                bottom: padding,
                                left: padding,
                                width: pillWidth,
                                borderRadius: '999px',
                                background: isAnnual
                                    ? 'linear-gradient(135deg, #FD6941 0%, #ff8c6b 100%)'
                                    : 'rgba(22,22,22,0.92)',
                                boxShadow: isAnnual
                                    ? '0 4px 20px rgba(253,105,65,0.35)'
                                    : '0 4px 16px rgba(0,0,0,0.22)',
                            }}
                        />

                        {/* Monthly tab */}
                        <button
                            onClick={() => setIsAnnual(false)}
                            style={{ width: pillWidth, flexShrink: 0 }}
                            className="relative z-10 py-2 cursor-pointer text-center"
                        >
                            <motion.span
                                animate={{ color: !isAnnual ? '#ffffff' : '#9ca3af' }}
                                transition={{ duration: 0.22 }}
                                className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase"
                            >
                                Monthly
                            </motion.span>
                        </button>

                        {/* Annually tab — fixed width, badge floats above via absolute */}
                        <button
                            onClick={() => setIsAnnual(true)}
                            style={{ width: pillWidth, flexShrink: 0 }}
                            className="relative z-10 py-2 cursor-pointer text-center"
                        >
                            <motion.span
                                animate={{ color: isAnnual ? '#ffffff' : '#9ca3af' }}
                                transition={{ duration: 0.22 }}
                                className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase"
                            >
                                Annually
                            </motion.span>

                            {/* "Save 20%" floats centred above the Annually tab.
                                Positioning is on the plain outer span so framer-motion
                                transforms (y/scale) never override translateX(-50%). */}
                            <AnimatePresence>
                                {isAnnual && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -26,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <motion.span
                                            initial={{ opacity: 0, y: 6, scale: 0.75 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 6, scale: 0.75 }}
                                            transition={{ duration: 0.22, ease: 'easeOut' }}
                                            style={{
                                                display: 'inline-block',
                                                background: '#FD6941',
                                                borderRadius: '999px',
                                                fontSize: '8px',
                                                fontWeight: 800,
                                                color: '#fff',
                                                padding: '3px 10px',
                                                letterSpacing: '0.07em',
                                                whiteSpace: 'nowrap',
                                                boxShadow: '0 2px 10px rgba(253,105,65,0.45)',
                                            }}
                                        >
                                            SAVE 20%
                                        </motion.span>
                                    </span>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>
                </div>

                {/* ── Cards ── */}
                <div
                    className="flex md:grid md:grid-cols-2 gap-4 md:gap-10 items-stretch md:justify-center max-w-4xl mx-auto pt-4 overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory pb-8 md:px-0"
                    style={{ touchAction: 'pan-x' }}
                >
                    {/* Left Spacer to allow first card center-snapping */}
                    <div className="shrink-0 w-[7vw] md:hidden" />

                    {/* ── Standard Plan Card ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative group p-8 md:p-12 flex flex-col items-center text-center shrink-0 w-[86vw] sm:w-[80%] md:w-full snap-center rounded-[2.5rem] md:rounded-[3rem] bg-white transition-all duration-500"
                        style={{
                            border: isHighlighted ? '1.5px solid rgba(253,105,65,0.25)' : '1.5px solid rgba(229,231,235,0.6)',
                            boxShadow: isHighlighted
                                ? '0 20px 50px -15px rgba(253,105,65,0.14)'
                                : '0 10px 30px -10px rgba(0,0,0,0.04)',
                        }}
                    >
                        {/* Best Value Badge — plain div centres it, motion.div animates only y/scale/opacity.
                            Keeping them separate prevents framer overriding translateX(-50%). */}
                        <AnimatePresence>
                            {isHighlighted && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: -18,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.85 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.85 }}
                                        transition={{ duration: 0.28, ease: 'easeOut' }}
                                        className="bg-[#FD6941] text-white px-5 py-1.5 rounded-full text-[10px] font-bold shadow-lg shadow-[#FD6941]/25 flex items-center gap-1.5 tracking-wider uppercase whitespace-nowrap"
                                    >
                                        <Zap className="w-3 h-3 fill-white" /> Best Value
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Icon — crossfades between Rocket (monthly) and Sparkles (annually) */}
                        <motion.div
                            animate={{
                                background: isHighlighted ? '#FD6941' : '#f9f9f9',
                            }}
                            transition={{ duration: 0.4 }}
                            className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-500 border border-gray-100 overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isAnnual ? 'sparkles' : 'rocket'}
                                    initial={{
                                        opacity: 0,
                                        rotate: isAnnual ? -45 : 45,
                                        scale: 0.5,
                                        filter: 'blur(4px)',
                                    }}
                                    animate={{
                                        opacity: 1,
                                        rotate: 0,
                                        scale: 1,
                                        filter: 'blur(0px)',
                                    }}
                                    exit={{
                                        opacity: 0,
                                        rotate: isAnnual ? 45 : -45,
                                        scale: 0.5,
                                        filter: 'blur(4px)',
                                    }}
                                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                    style={{ color: isHighlighted ? '#fff' : '#FD6941' }}
                                    className="flex items-center justify-center"
                                >
                                    <ActiveIcon className="w-6 h-6 md:w-8 md:h-8" />
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>

                        {/* Title animates between Monthly / Annually */}
                        <div className="flex items-center justify-center mb-1 md:mb-2 min-h-[36px] md:min-h-[40px]">
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={isAnnual ? 'annually' : 'monthly'}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                    className="text-2xl md:text-3xl font-bold tracking-tight"
                                >
                                    {isAnnual ? 'Annually' : 'Monthly'}
                                </motion.h3>
                            </AnimatePresence>
                        </div>

                        <p className="text-gray-400 font-normal text-sm md:text-base min-h-[40px] md:min-h-[48px] leading-relaxed mb-5 md:mb-6">{standardPlanBase.desc}</p>

                        {/* ── Animated Price ── */}
                        <div className="mb-6 md:mb-8">
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg md:text-xl font-normal text-gray-400">₹</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={activePricing.price}
                                            initial={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                                            className="text-4xl md:text-6xl font-semibold font-['Urbanist'] tracking-tighter"
                                        >
                                            {activePricing.price.toLocaleString('en-IN')}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={activePricing.period}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs font-normal text-gray-400 uppercase tracking-wider mt-1 md:mt-2"
                                    >
                                        {activePricing.period}
                                    </motion.span>
                                </AnimatePresence>

                                {/* Fixed-height subtext slot — card never resizes */}
                                <div className="h-4 mt-1 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        {activePricing.subtext && (
                                            <motion.span
                                                key="subtext"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.22 }}
                                                className="text-xs font-normal text-[#FD6941]"
                                            >
                                                {activePricing.subtext}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow w-full text-left bg-gray-50/20 md:bg-gray-50/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100/50">
                            {standardPlanBase.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        <motion.div
                                            animate={{ background: isHighlighted ? '#FD6941' : '#22c55e20' }}
                                            transition={{ duration: 0.3 }}
                                            className="p-0.5 rounded-full"
                                        >
                                            <Check
                                                className={`w-2 md:w-2.5 h-2 md:h-2.5 ${isHighlighted ? 'text-white' : 'text-green-600'}`}
                                                strokeWidth={4}
                                            />
                                        </motion.div>
                                    </div>
                                    <span className="text-gray-600 font-normal text-sm md:text-base leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <motion.a
                            href="#contact"
                            animate={{
                                background: isHighlighted ? '#FD6941' : '#111111',
                            }}
                            transition={{ duration: 0.35 }}
                            className="w-full py-4 md:py-5 rounded-full font-normal tracking-wider uppercase text-xs md:text-sm text-white shadow-xl transition-opacity duration-300 hover:opacity-85"
                        >
                            Start My Trial
                        </motion.a>
                    </motion.div>

                    {/* ── Customized Plan Card ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative group p-8 md:p-12 flex flex-col items-center text-center shrink-0 w-[86vw] sm:w-[80%] md:w-full snap-center rounded-[2.5rem] md:rounded-[3rem] bg-white transition-all duration-500"
                        style={{
                            border: '1.5px solid rgba(229,231,235,0.6)',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
                        }}
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-5 transition-transform duration-500 group-hover:scale-110 bg-gray-50 text-[#FD6941] border border-gray-100">
                            <CustomIcon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 tracking-tight">{customizedPlan.name}</h3>
                        <p className="text-gray-400 font-normal text-sm md:text-base min-h-[40px] md:min-h-[48px] leading-relaxed mb-5 md:mb-6">{customizedPlan.desc}</p>

                        <div className="mb-6 md:mb-8">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-6xl font-semibold font-['Urbanist'] tracking-tighter">{customizedPlan.price}</span>
                                <span className="text-xs font-normal text-gray-400 uppercase tracking-wider mt-1 md:mt-2">{customizedPlan.period}</span>
                            </div>
                        </div>

                        <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow w-full text-left bg-gray-50/20 md:bg-gray-50/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100/50">
                            {customizedPlan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        <div className="p-0.5 rounded-full bg-green-500/10 text-green-600">
                                            <Check className="w-2 md:w-2.5 h-2 md:h-2.5" strokeWidth={4} />
                                        </div>
                                    </div>
                                    <span className="text-gray-600 font-normal text-sm md:text-base leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <a
                            href="#contact"
                            className="w-full py-4 md:py-5 rounded-full font-normal tracking-wider uppercase text-xs md:text-sm transition-all duration-300 shadow-xl bg-black text-white hover:bg-gray-900 shadow-black/10"
                        >
                            Contact Sales
                        </a>
                    </motion.div>

                    {/* Right Spacer to allow last card center-snapping */}
                    <div className="shrink-0 w-[7vw] md:hidden" />
                </div>
            </div>
        </section>
    );
}
