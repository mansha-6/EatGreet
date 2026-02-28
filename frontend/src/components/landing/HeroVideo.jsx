import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import arVideo from '../../assets/AR_Menu_Experience_Video_Generation.mp4';
import { ArrowRight, Play } from 'lucide-react';

export default function HeroVideo() {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    // Parallax scroll effect for the video
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const yTransform = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const scaleTransform = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
    const opacityTransform = useTransform(scrollYProgress, [0.5, 1], [1, 0]);

    return (
        <div ref={containerRef} className="relative w-full h-[50vh] sm:h-[70vh] lg:h-[85vh] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer isolate">
            <motion.div
                style={{ y: yTransform, scale: scaleTransform, opacity: opacityTransform }}
                className="absolute inset-0 w-full h-full"
            >
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-70" />

                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="object-cover w-full h-full scale-105"
                >
                    <source src={arVideo} type="video/mp4" />
                </video>
            </motion.div>

            {/* Content overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-3 pointer-events-auto">
                        <span className="w-1.5 h-1.5 bg-[#FD6941] rounded-full animate-pulse shadow-[0_0_10px_#FD6941]" />
                        <span className="text-[10px] md:text-xs font-medium text-white tracking-widest uppercase">Live Demo</span>
                    </div>

                    <h3 className="text-white text-xl md:text-4xl font-bold font-['Urbanist'] mb-2 max-w-lg leading-tight">
                        Experience the menu before you tap order.
                    </h3>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 md:mt-6 pointer-events-auto">
                        <button className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#FD6941] text-white rounded-full hover:bg-[#E55A35] hover:scale-105 transition-all shadow-xl group/btn">
                            <Play fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 ml-1 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <div>
                            <p className="text-white text-sm md:text-base font-medium">Watch Full Experience</p>
                            <p className="text-white/70 text-[11px] md:text-sm">1:24 min overview</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Play overlay effect */}
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/10">
                <div className="w-24 h-24 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-500">
                    <span className="text-white font-medium tracking-widest uppercase text-sm">Play</span>
                </div>
            </div>
        </div>
    );
}
