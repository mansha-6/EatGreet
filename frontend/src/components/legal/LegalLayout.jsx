import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import logoFull from '../../assets/logo-full.png';

const legalLinks = [
    { label: 'Terms & Conditions', path: '/terms' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Shipping Policy', path: '/shipping-policy' },
    { label: 'Cancellation & Refunds', path: '/cancellation-refunds' },
];

export default function LegalLayout({ title, subtitle, lastUpdated, children }) {
    return (
        <div className="min-h-screen bg-[#FDFCFB] font-sans">
            {/* Top Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/">
                        <img src={logoFull} alt="EatGreet" className="h-8" />
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#FD6941] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
                {/* Sidebar */}
                <aside className="w-full lg:w-60 shrink-0">
                    <div className="lg:sticky lg:top-24">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Legal Pages</p>
                        <nav className="space-y-1">
                            {legalLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        window.location.pathname === link.path
                                            ? 'bg-[#FD6941] text-white font-bold shadow-md shadow-orange-100'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Header */}
                        <div className="mb-10 pb-8 border-b border-gray-100">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
                            <p className="text-gray-500 text-base">{subtitle}</p>
                            {lastUpdated && (
                                <p className="text-xs text-gray-400 mt-3 font-medium">Last updated: {lastUpdated}</p>
                            )}
                        </div>

                        {/* Page Content */}
                        <div>{children}</div>
                    </motion.div>
                </main>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 mt-16 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} EatGreet Technologies. All rights reserved.</p>
                    <div className="flex gap-6">
                        {legalLinks.map((link) => (
                            <Link key={link.path} to={link.path} className="hover:text-gray-700 transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
