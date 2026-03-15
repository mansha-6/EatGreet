import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import arVideo from '../../assets/AR_Menu_Experience_Video_Generation.mp4';
import { ArrowRight } from 'lucide-react';

export default function HeroVideo() {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    // Parallax scroll effect for the video
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Auto-play video on mount 
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Video autoplay failed:", error);
            });
        }
    }, []);

    const yTransform = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const scaleTransform = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
    const opacityTransform = useTransform(scrollYProgress, [0.5, 1], [1, 0]);

    return (
        <div ref={containerRef} className="relative w-full h-[50vh] sm:h-[70vh] lg:h-[85vh] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl group isolate mt-10 md:mt-16">
            <motion.div
                style={{ y: yTransform, scale: scaleTransform, opacity: opacityTransform }}
                className="absolute inset-0 w-full h-full"
            >
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent z-10 transition-opacity duration-300" />

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
                </motion.div>
            </div>
        </div>
    );
}
