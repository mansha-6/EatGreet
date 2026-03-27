import { useState } from 'react';
import { Mail, Phone, SendHorizonal, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoFull from '../../assets/logo-full.png';
import LandingFooter from '../../components/landing/LandingFooter';

const contactInfo = [
    { icon: Mail, label: 'Email', value: 'eatgreetofficial@gmail.com' },
    { icon: Phone, label: 'Phone', value: '+91 95125 77062' },
];

export default function ContactUs() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            toast.error('Please fill in all required fields');
            return;
        }
        setIsLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send message');
            toast.success('Message sent! We\'ll get back to you shortly.');
            setSubmitted(true);
        } catch (err) {
            toast.error(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] font-sans flex flex-col">
            {/* Top Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
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

            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                >
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Contact Us</h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">Have a question or need help? We're here for you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
                        {/* Contact Info */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                            <div className="space-y-6">
                                {contactInfo.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-4">
                                        <div className="p-3 bg-[#FD6941]/10 rounded-2xl text-[#FD6941] shrink-0">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                                            <p className="text-gray-900 font-bold">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 bg-[#FD6941]/5 rounded-3xl border border-[#FD6941]/10">
                                <h3 className="font-bold text-gray-900 mb-2">Enterprise Support</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    For custom plans and enterprise inquiries, reach out directly at{' '}
                                    <a href="mailto:eatgreetofficial@gmail.com" className="text-[#FD6941] font-bold hover:underline">
                                        eatgreetofficial@gmail.com
                                    </a>.
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>

                            {submitted ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center text-center py-12 gap-5 h-full"
                                >
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl mb-2">Message Received!</h3>
                                        <p className="text-gray-500 text-sm">Our team typically responds within 1 business day.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
                                            <input
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FD6941] focus:ring-4 focus:ring-[#FD6941]/10 outline-none text-sm text-gray-900 font-medium transition-all"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                                            <input
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FD6941] focus:ring-4 focus:ring-[#FD6941]/10 outline-none text-sm text-gray-900 font-medium transition-all"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Subject</label>
                                        <input
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FD6941] focus:ring-4 focus:ring-[#FD6941]/10 outline-none text-sm text-gray-900 font-medium transition-all"
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Message <span className="text-red-500">*</span></label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            rows={5}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FD6941] focus:ring-4 focus:ring-[#FD6941]/10 outline-none text-sm text-gray-900 font-medium transition-all resize-none"
                                            placeholder="Describe your issue or question..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#FD6941] text-white py-4 rounded-2xl font-bold hover:bg-[#e15a35] transition-all shadow-lg shadow-[#FD6941]/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <SendHorizonal className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>

            <LandingFooter />
        </div>
    );
}
