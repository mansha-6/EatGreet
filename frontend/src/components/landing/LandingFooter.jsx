import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, BookText } from 'lucide-react';
import logoFull from '../../assets/logo-full.png';

export default function LandingFooter() {
    return (
        <footer className="bg-white pt-6 md:pt-10 pb-4 md:pb-6 text-gray-900 relative overflow-hidden border-t border-gray-100" id="contact">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FD6941] blur-[150px] opacity-[0.03] rounded-[100%]" />

            <div className="max-w-7xl mx-auto px-6 md:px-6 relative z-10 flex flex-col items-center">
                <div className="flex flex-col md:flex-row w-full gap-y-8 md:gap-0 mb-8 md:mb-3 text-left">

                    {/* Column 1 - Brand */}
                    <div className="flex-1 flex flex-col items-start">
                        <img src={logoFull} alt="EatGreet" className="h-7 md:h-10 mb-2 md:mb-3 opacity-90" />
                        <p className="text-gray-500 text-[13px] md:text-sm leading-relaxed max-w-xs">
                            The hyper-connected dining ecosystem. Redefining interactive menus, kitchen sync, and management.
                        </p>
                    </div>

                    {/* Right side: Product + Legal + Connect grouped tightly */}
                    <div className="flex gap-10 md:gap-14 shrink-0">

                        {/* Product */}
                        <div className="flex flex-col items-start pt-2 md:pt-0">
                            <h4 className="font-bold text-gray-900 mb-2 md:mb-3 uppercase tracking-[0.2em] text-[10px] md:text-xs">Product</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-500 text-[12px] md:text-sm font-medium">
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer">3D Menu</li>
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer">Kitchen Sync</li>
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer">Analytics</li>
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer">Integrations</li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="flex flex-col items-start pt-2 md:pt-0">
                            <h4 className="font-bold text-gray-900 mb-2 md:mb-3 uppercase tracking-[0.2em] text-[10px] md:text-xs">Legal</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-500 text-[12px] md:text-sm font-medium">
                                <li><Link to="/terms" className="hover:text-[#FD6941] transition-all">Terms & Conditions</Link></li>
                                <li><Link to="/privacy" className="hover:text-[#FD6941] transition-all">Privacy Policy</Link></li>
                                <li><Link to="/shipping-policy" className="hover:text-[#FD6941] transition-all">Shipping Policy</Link></li>
                                <li><Link to="/cancellation-refunds" className="hover:text-[#FD6941] transition-all">Cancellation & Refunds</Link></li>
                            </ul>
                        </div>

                        {/* Connect */}
                        <div className="flex flex-col items-start pt-2 md:pt-0">
                            <h4 className="font-bold text-gray-900 mb-2 md:mb-3 uppercase tracking-[0.2em] text-[10px] md:text-xs">Connect</h4>
                            <ul className="space-y-3 md:space-y-4 text-gray-500 text-[12px] md:text-sm font-medium">
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Global</li>
                                <li className="hover:text-[#FD6941] transition-all cursor-pointer flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacy</li>
                                <li><Link to="/blogs" className="hover:text-[#FD6941] transition-all flex items-center gap-1.5"><BookText className="w-3.5 h-3.5" /> Blogs</Link></li>
                                <li><Link to="/contact" className="hover:text-[#FD6941] transition-all">Contact Us</Link></li>
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Aceternity Style Massive Background Text */}
                <div className="w-full flex justify-center -mt-10 md:-mt-16 select-none pointer-events-none">
                    <h1 className="text-[16vw] md:text-[14vw] font-bold text-transparent bg-clip-text bg-gradient-to-b from-transparent to-black/10 leading-none tracking-tighter uppercase font-['Urbanist'] opacity-90">
                        EATGREET
                    </h1>
                </div>

                {/* Bottom Bar */}
                <div className="w-full mt-4 md:mt-0 pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} EatGreet Technologies. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                        <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
