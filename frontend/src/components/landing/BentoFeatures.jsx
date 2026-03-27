import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ShieldCheck, BarChart3, ChefHat, Users } from 'lucide-react';

export default function BentoFeatures() {
    const containerRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();
    const [disableParallax, setDisableParallax] = useState(false);

    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (prefersReducedMotion || isTouchDevice) {
            setDisableParallax(true);
        }
    }, [prefersReducedMotion]);

    // Parallax scales for the bento items
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const scale1 = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
    const scale2 = useTransform(scrollYProgress, [0.1, 0.6], [0.8, 1]);
    const scale3 = useTransform(scrollYProgress, [0.2, 0.7], [0.8, 1]);
    const scale4 = useTransform(scrollYProgress, [0.3, 0.8], [0.8, 1]);

    const y1 = useTransform(scrollYProgress, [0, 1], ["50px", "-50px"]);
    const y2 = useTransform(scrollYProgress, [0, 1], ["80px", "-80px"]);
    const staticMotionStyle = { scale: 1, y: 0 };

    return (
        <section ref={containerRef} className="pt-16 pb-0 md:pt-32 md:pb-0 bg-gray-50 relative overflow-hidden" id="bento-features">
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

                <div className="text-center max-w-2xl mx-auto mb-10 md:mb-24 px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
                    >
                        An ecosystem built for <br />
                        <span className="text-[#FD6941] italic font-['Urbanist']">absolute control.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-sm md:text-lg"
                    >
                        Every module is hyper-connected, allowing data to flow seamlessly from the customer's phone directly to the kitchen display.
                    </motion.p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 grid-rows-14 md:grid-rows-2 h-auto md:h-[600px]">

                    {/* Item 1 - Large Left */}
                    <motion.div
                        style={disableParallax ? staticMotionStyle : { scale: scale1, y: y1 }}
                        className="md:col-span-8 md:row-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between"
                    >
                        <div className="relative z-10 max-w-md">
                            <div className="w-10 h-10 md:w-14 md:h-14 bg-[#FFF5F1] text-[#FD6941] rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                                <BarChart3 className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 font-['Urbanist']">Global Revenue Intelligence</h3>
                            <p className="text-gray-500 text-sm md:text-lg leading-relaxed">Instantly visualize live sales data, peak hours, and top-selling items across all your locations in one beautiful dashboard.</p>
                        </div>

                        {/* Decorative Graphic */}
                        <div className="absolute -bottom-10 -right-10 w-[70%] h-[70%] bg-gradient-to-tl from-gray-50 to-white rounded-tl-[3rem] border-t border-l border-gray-100 shadow-2xl transition-transform duration-700 group-hover:-translate-y-4 group-hover:-translate-x-4 flex items-end justify-start p-8">
                            {/* Faux Chart Bars */}
                            <div className="flex items-end gap-3 w-full h-full opacity-60">
                                {[40, 70, 45, 90, 65, 100, 80].map((height, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${height}%` }}
                                        transition={{ duration: 1, delay: i * 0.1, type: 'spring' }}
                                        className={`flex-1 rounded-t-lg ${i === 5 ? 'bg-[#FD6941]' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Item 2 - Top Right */}
                    <motion.div
                        style={disableParallax ? staticMotionStyle : { scale: scale2, y: y2 }}
                        className="md:col-span-4 md:row-span-1 bg-gray-900 text-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group shadow-xl"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FD6941] blur-[60px] opacity-20 rounded-full group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10">
                            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-[#FD6941] mb-3 md:mb-4" />
                            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Enterprise Security</h3>
                            <p className="text-gray-400 text-[11px] md:text-sm">Bank-grade encryption protecting your data.</p>
                        </div>
                    </motion.div>

                    {/* Item 3 - Bottom Middle (Small) */}
                    <motion.div
                        style={disableParallax ? staticMotionStyle : { scale: scale3, y: y1 }}
                        className="md:col-span-2 md:row-span-1 bg-[#FFF5F1] rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-6 relative overflow-hidden group flex flex-col justify-center items-center text-center border border-[#FD6941]/10"
                    >
                        <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-[#FD6941] mb-2 md:mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-[10px] md:text-sm font-medium text-gray-900">Kitchen Sync</h3>
                    </motion.div>

                    {/* Item 4 - Bottom Right */}
                    <motion.div
                        style={disableParallax ? staticMotionStyle : { scale: scale4, y: y2 }}
                        className="md:col-span-2 md:row-span-1 bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-6 relative overflow-hidden group shadow-md border border-gray-50 flex flex-col justify-center items-center text-center"
                    >
                        <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-500 mb-2 md:mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-[10px] md:text-sm font-medium text-gray-900">Auto-Staffing</h3>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
