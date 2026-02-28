import {
    Globe,
    ShieldCheck
} from 'lucide-react';
import logoFull from '../../assets/logo-full.png';

export default function LandingFooter() {
    return (
        <footer className="bg-white pt-12 md:pt-20 pb-8 md:pb-10 text-gray-900 relative overflow-hidden border-t border-gray-100" id="contact">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FD6941] blur-[150px] opacity-[0.03] rounded-[100%]" />

            <div className="max-w-7xl mx-auto px-6 md:px-6 relative z-10 flex flex-col items-center">
                <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-x-6 gap-y-10 md:gap-12 mb-10 md:mb-16 text-left">
                    {/* Column 1 - Brand (Full width on mobile) */}
                    <div className="col-span-2 md:col-span-1 flex flex-col items-start">
                        <img src={logoFull} alt="EatGreet" className="h-7 md:h-10 mb-4 md:mb-6 opacity-90" />
                        <p className="text-gray-500 text-[13px] md:text-sm leading-relaxed max-w-sm">
                            The hyper-connected dining ecosystem. Redefining interactive menus, kitchen sync, and management.
                        </p>
                    </div>

                    {/* Column 2 - Product */}
                    <div className="col-span-1 flex flex-col items-start pt-2 md:pt-0">
                        <h4 className="font-bold text-gray-900 mb-4 md:mb-6 uppercase tracking-[0.2em] text-[10px] md:text-xs">Product</h4>
                        <ul className="space-y-3 md:space-y-4 text-gray-500 text-[12px] md:text-sm font-medium">
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer">3D Menu</li>
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer">Kitchen Sync</li>
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer">Analytics</li>
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer">Integrations</li>
                        </ul>
                    </div>

                    {/* Column 3 - Connect */}
                    <div className="col-span-1 flex flex-col items-start pt-2 md:pt-0">
                        <h4 className="font-bold text-gray-900 mb-4 md:mb-6 uppercase tracking-[0.2em] text-[10px] md:text-xs">Connect</h4>
                        <ul className="space-y-3 md:space-y-4 text-gray-500 text-[12px] md:text-sm font-medium">
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Global</li>
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacy</li>
                            <li className="hover:text-[#FD6941] transition-all cursor-pointer mt-2 text-[11px] md:text-[13px] break-all">support@eatgreet.com</li>
                        </ul>
                    </div>
                </div>

                {/* Aceternity Style Massive Text */}
                <div className="w-full flex justify-center mt-6 md:mt-20 select-none pointer-events-none">
                    <h1 className="text-[16vw] md:text-[14vw] font-bold text-transparent bg-clip-text bg-gradient-to-b from-black/10 to-transparent leading-none tracking-tighter uppercase font-['Urbanist'] opacity-90">
                        EATGREET
                    </h1>
                </div>

                <div className="w-full mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} EatGreet Technologies. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">System Status</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
