import {
    Globe,
    ShieldCheck
} from 'lucide-react';
import logoFull from '../../assets/logo-full.png';

export default function LandingFooter() {
    return (
        <footer className="bg-white pt-20 pb-10 text-gray-900 relative overflow-hidden border-t border-gray-100">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FD6941] blur-[150px] opacity-[0.03] rounded-[100%]" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center justify-center text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-8 md:gap-12 mb-16 text-left">
                    {/* Column 1 */}
                    <div className="col-span-1">
                        <img src={logoFull} alt="EatGreet" className="h-10 mb-6 opacity-80" />
                        <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
                            EatGreet is the hyper-connected dining ecosystem. Redefining interactive menus, kitchen synchronization, and management control.
                        </p>
                    </div>

                    {/* Column 2 */}
                    <div className="col-span-1">
                        <h4 className="font-medium text-gray-900 mb-6 uppercase tracking-widest text-sm">Product Map</h4>
                        <ul className="space-y-3 text-gray-600 text-sm">
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer">3D Menu Generation</li>
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer">Kitchen Display System</li>
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer">Manager Analytics</li>
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer">POS Integrations</li>
                        </ul>
                    </div>

                    {/* Column 3 */}
                    <div className="col-span-1">
                        <h4 className="font-medium text-gray-900 mb-6 uppercase tracking-widest text-sm">Connect</h4>
                        <ul className="space-y-3 text-gray-600 text-sm">
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer flex items-center gap-2"><Globe className="w-4 h-4" /> Global HQ </li>
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Security & SLA</li>
                            <li className="hover:text-[#FD6941] transition-colors cursor-pointer mt-4">support@eatgreet.com</li>
                        </ul>
                    </div>
                </div>

                {/* Aceternity Style Massive Text */}
                <div className="w-full flex justify-center mt-10 md:mt-20 select-none pointer-events-none">
                    <h1 className="text-[14vw] font-bold text-transparent bg-clip-text bg-gradient-to-b from-black/10 to-transparent leading-none tracking-tighter uppercase font-['Urbanist'] opacity-90">
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
