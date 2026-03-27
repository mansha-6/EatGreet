import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Mock data with corresponding emojis
const menuItems = [
    { id: 1, name: "Truffle Pasta", emoji: "🍝", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2670&auto=format&fit=crop" },
    { id: 2, name: "Spicy Tuna Roll", emoji: "🍣", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2670&auto=format&fit=crop" },
    { id: 3, name: "Wagyu Burger", emoji: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2400&auto=format&fit=crop" },
    { id: 4, name: "Avocado Toast", emoji: "🥑", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=2672&auto=format&fit=crop" },
    { id: 5, name: "Matcha Latte", emoji: "🍵", image: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?q=80&w=2670&auto=format&fit=crop" },
];

const EmojiCursor = ({ emoji, isVisible }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, x: mousePos.x, y: mousePos.y }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20, mass: 0.5 }}
                    style={{
                        position: 'fixed',
                        top: -14,
                        left: -14,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        fontSize: '28px',
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))',
                    }}
                >
                    {emoji}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function InfiniteMenuScroll() {
    const containerRef = useRef(null);
    const [activeEmoji, setActiveEmoji] = useState(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const xTransformRow1 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
    const xTransformRow2 = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);

    const duplicatedItemsRow1 = [...menuItems, ...menuItems, ...menuItems];
    const duplicatedItemsRow2 = [...menuItems].reverse().concat([...menuItems].reverse(), [...menuItems].reverse());

    return (
        <section 
            ref={containerRef} 
            onMouseLeave={() => setActiveEmoji(null)}
            className="pt-8 pb-16 md:pt-16 md:pb-32 bg-white overflow-hidden relative" 
            id="menu-showcase"
        >
            <EmojiCursor emoji={activeEmoji} isVisible={!!activeEmoji} />


            <div className="max-w-7xl mx-auto px-4 md:px-6 text-center mb-10 md:mb-16">
                <span className="text-[#FD6941] font-medium tracking-widest text-[10px] md:text-xs uppercase mb-2 block">Visual Dining</span>
                <h2 className="text-2xl md:text-5xl font-bold">Eat with your eyes first.</h2>
                <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-sm md:text-lg">Present your culinary masterpieces in stunning, high-definition 3D and rich media.</p>
            </div>

            <div className="relative flex flex-col gap-6 md:gap-8 w-[200vw] -mx-[50vw] px-[50vw]">
                {/* Row 1 -> Scrolls Left */}
                <motion.div style={{ x: xTransformRow1 }} className="flex gap-6 md:gap-8 w-max">
                    {duplicatedItemsRow1.map((item, idx) => (
                        <div
                            key={`r1-${idx}`}
                            onMouseEnter={() => setActiveEmoji(item.emoji)}
                            onMouseLeave={() => setActiveEmoji(null)}
                            className="relative group w-[220px] h-[300px] md:w-[350px] md:h-[450px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex-shrink-0 cursor-none shadow-lg"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div>
                                    <p className="text-white/80 text-[10px] md:text-sm font-medium tracking-wider uppercase mb-1 drop-shadow-md">Signature</p>
                                    <h4 className="text-white text-lg md:text-2xl font-bold font-['Urbanist'] drop-shadow-md">{item.name}</h4>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white group-hover:bg-[#FD6941] group-hover:border-[#FD6941] group-hover:scale-110 transition-all duration-300 shadow-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Row 2 -> Scrolls Right */}
                <motion.div style={{ x: xTransformRow2 }} className="flex gap-6 md:gap-8 w-max -ml-[50vw]">
                    {duplicatedItemsRow2.map((item, idx) => (
                        <div
                            key={`r2-${idx}`}
                            onMouseEnter={() => setActiveEmoji(item.emoji)}
                            onMouseLeave={() => setActiveEmoji(null)}
                            className="relative group w-[220px] h-[300px] md:w-[350px] md:h-[450px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex-shrink-0 cursor-none shadow-lg"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div>
                                    <p className="text-white/80 text-[10px] md:text-sm font-medium tracking-wider uppercase mb-1 drop-shadow-md">Popular</p>
                                    <h4 className="text-white text-lg md:text-2xl font-bold font-['Urbanist'] drop-shadow-md">{item.name}</h4>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white group-hover:bg-[#FD6941] group-hover:border-[#FD6941] group-hover:scale-110 transition-all duration-300 shadow-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="mt-12 md:mt-20 text-center relative z-20">
                <a href="#contact" className="inline-flex items-center gap-3 px-8 md:px-10 py-3 md:py-4 bg-white border border-gray-200 text-gray-800 font-medium rounded-full hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg text-sm tracking-wider group">
                    View Full Interactive Demo <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </section>
    );
}
