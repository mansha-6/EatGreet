import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Globe, Rocket, ShieldCheck } from 'lucide-react';

const plans = [
    {
        name: "Monthly",
        desc: "Ideal for small restaurants looking to modernize their guest experience.",
        price: 2499,
        period: "per month",
        features: ["Standard 3D Menu", "Up to 50 items", "Live Order Tracking", "Basic Analytics"],
        icon: Rocket,
        highlight: false,
    },
    {
        name: "Annually",
        desc: "The professional choice for growth-minded restaurant groups.",
        price: 24099,
        period: "per year",
        subtext: "Save ~20% compared to monthly",
        features: ["Unlimited AR Items", "Dynamic Pricing Engine", "Real-time AI Sync", "Priority 24/7 Support", "Advanced Sales Hub"],
        icon: Sparkles,
        highlight: true,
        highlightText: "Best Value",
    },
    {
        name: "Customized",
        desc: "Enterprise solutions for massive chains and high-volume operations.",
        price: "Custom",
        period: "Tailored for Scale",
        features: ["White-label branding", "Global Supply Chain Tech", "Custom POS Integration", "SLA & Dedicated Manager", "Unlimited Sites"],
        icon: ShieldCheck,
        highlight: false,
        buttonText: "Contact Sales",
    }
];

export default function PricingPlans() {
    return (
        <section className="py-24 relative overflow-hidden bg-white text-gray-900" id="pricing">
            {/* Soft decorative blur backgrounds */}
            <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-[#FD6941]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FD6941]/10 rounded-full border border-[#FD6941]/20 mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-[#FD6941]" />
                        <span className="text-[10px] font-medium tracking-[0.2em] text-[#FD6941] uppercase">Flexible Ecosystem</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
                    >
                        Pricing built for <span className="bg-gradient-to-r from-[#FD6941] to-[#ff8c6d] bg-clip-text text-transparent">every scale.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 font-medium"
                    >
                        Choose the plan that matches your ambition. No hidden fees, just pure growth.
                    </motion.p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 items-stretch pt-4">
                    {plans.map((plan, idx) => {
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={`relative group p-10 md:p-12 flex flex-col items-center text-center transition-all duration-500 ${plan.highlight
                                    ? 'rounded-[3rem] bg-white border border-[#FD6941]/20 shadow-[0_30px_60px_-15px_rgba(253,105,65,0.12)] scale-105 z-20'
                                    : 'rounded-[2.5rem] bg-white border border-gray-100/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FD6941] text-white px-6 py-1.5 rounded-full text-xs font-medium shadow-xl shadow-[#FD6941]/30 flex items-center gap-1.5 tracking-wider uppercase">
                                        <Zap className="w-3.5 h-3.5 fill-white" /> {plan.highlightText}
                                    </div>
                                )}

                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 ${plan.highlight ? 'bg-[#FD6941] text-white shadow-lg' : 'bg-gray-50 text-[#FD6941] border border-gray-100'
                                    }`}>
                                    <Icon className="w-8 h-8" />
                                </div>

                                <h3 className="text-3xl font-bold mb-3 tracking-tight">{plan.name}</h3>
                                <p className="text-gray-400 text-sm font-medium min-h-[48px] leading-relaxed mb-8">{plan.desc}</p>

                                <div className="mb-10">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-baseline gap-1">
                                            {typeof plan.price === 'number' && <span className="text-sm font-medium text-gray-400">₹</span>}
                                            <span className="text-6xl font-black font-['Urbanist'] tracking-tighter">
                                                {plan.price}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-2">{plan.period}</span>
                                        {plan.subtext && <span className="text-[10px] font-medium text-[#FD6941] mt-1">{plan.subtext}</span>}
                                    </div>
                                </div>

                                <ul className="space-y-5 mb-12 flex-grow w-full text-left bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                <div className={`p-0.5 rounded-full ${plan.highlight ? 'bg-[#FD6941] text-white' : 'bg-green-500/10 text-green-600'}`}>
                                                    <Check className="w-2.5 h-2.5" strokeWidth={4} />
                                                </div>
                                            </div>
                                            <span className="text-gray-600 text-[13px] font-medium leading-none">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="#contact"
                                    className={`w-full py-5 rounded-[1.5rem] font-medium tracking-widest uppercase text-xs transition-all duration-300 shadow-xl ${plan.highlight
                                        ? 'bg-[#FD6941] text-white shadow-[#FD6941]/30 hover:bg-[#e55a35] hover:shadow-[#FD6941]/40'
                                        : 'bg-black text-white hover:bg-gray-900 shadow-black/10'
                                        }`}
                                >
                                    {plan.buttonText || "Start My Trial"}
                                </a>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
