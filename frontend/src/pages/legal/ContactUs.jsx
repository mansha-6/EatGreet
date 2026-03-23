import { useState } from 'react';
import { Mail, Phone, SendHorizonal, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LegalLayout from '../../components/legal/LegalLayout';
import toast from 'react-hot-toast';

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
        <LegalLayout
            title="Contact Us"
            subtitle="Have a question or need help? We're here for you."
            lastUpdated={null}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Contact Info */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Get in Touch</h2>
                    <div className="space-y-5">
                        {contactInfo.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-4">
                                <div className="p-2.5 bg-[#FD6941]/10 rounded-xl text-[#FD6941] shrink-0">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                                    <p className="text-gray-700 font-medium text-sm">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-[#FD6941]/5 rounded-2xl border border-[#FD6941]/10">
                        <h3 className="font-bold text-gray-800 mb-2">Enterprise Support</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            For custom plans and enterprise inquiries, reach out directly at{' '}
                            <a href="mailto:eatgreetofficial@gmail.com" className="text-[#FD6941] font-bold hover:underline">
                                eatgreetofficial@gmail.com
                            </a>.
                        </p>
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Send a Message</h2>

                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center text-center py-12 gap-4"
                        >
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">Message Received!</h3>
                            <p className="text-gray-500 text-sm">Our team typically responds within 1 business day.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Name *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 outline-none text-sm text-gray-700 transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Email *</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 outline-none text-sm text-gray-700 transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Subject</label>
                                <input
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 outline-none text-sm text-gray-700 transition-all"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Message *</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#FD6941]/30 outline-none text-sm text-gray-700 transition-all resize-none"
                                    placeholder="Describe your issue or question..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#FD6941] text-white py-4 rounded-xl font-bold hover:bg-[#e15a35] transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <SendHorizonal className="w-4 h-4" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </LegalLayout>
    );
}
