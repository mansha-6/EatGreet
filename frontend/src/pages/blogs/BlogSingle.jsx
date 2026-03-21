import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogAPI } from '../../utils/api';
import { Calendar, User, ChevronLeft, Clock, Share2, Tag } from 'lucide-react';
import LandingFooter from '../../components/landing/LandingFooter';
import { FloatingNav } from '../../components/landing/FloatingNav';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';

export default function BlogSingle() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await blogAPI.getBySlug(slug);
                setBlog(response.data);
                // Update page title and meta description dynamically
                document.title = `${response.data.title} | EatGreet Blog`;
            } catch (error) {
                console.error('Failed to fetch blog:', error);
                toast.error('Blog post not found');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
        return () => { document.title = 'EatGreet'; }; // Reset title on unmount
    }, [slug]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const navItems = [
        { name: "Home", link: "/" },
        { name: "Blogs", link: "/blogs" },
        { name: "Pricing", link: "/#pricing" },
        { name: "Waitlist", link: "/#contact" },
    ];

    if (isLoading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin"></div>
        </div>
    );

    if (!blog) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <Link to="/blogs" className="text-[#FD6941] font-bold flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" /> Back to Journals
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <SEO 
                title={blog.title}
                description={blog.metaDescription || blog.excerpt || blog.content.substring(0, 150)}
                keywords={blog.tags?.join(', ')}
                image={blog.coverImage}
            />
            <FloatingNav navItems={navItems} />

            {/* Hero Header */}
            <header className="pt-32 pb-16 md:pt-48 md:pb-24 px-4 md:px-6 bg-[#F7F7F5]">
                <div className="max-w-4xl mx-auto text-center">
                    <Link to="/blogs" className="inline-flex items-center gap-2 text-[#FD6941] font-bold text-xs uppercase tracking-widest mb-8 hover:gap-3 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back to Journals
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.15] tracking-tight">
                            {blog.title}
                        </h1>
                    </motion.div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 md:-mt-20">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="aspect-[21/9] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-[10px] md:border-[15px] border-white ring-1 ring-gray-100"
                >
                    <img 
                        src={blog.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c77?q=80&w=2070&auto=format&fit=crop'} 
                        className="w-full h-full object-cover"
                        alt={blog.title} 
                    />
                </motion.div>
            </div>

            {/* Content Area */}
            <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-3xl prose-strong:text-gray-900">
                    <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed mb-12 border-l-4 border-[#FD6941] pl-8">
                        {blog.excerpt || blog.content.substring(0, 150) + '...'}
                    </p>
                    {/* Render content - assuming plain text for now, could be markdown/html */}
                    <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }} />
                </div>

                {/* Share bar */}
                <div className="mt-20 pt-8 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-2">
                        {blog.tags?.map(tag => (
                            <span key={tag} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-white border border-gray-200 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors"
                    >
                        <Share2 className="w-4 h-4" /> Share Article
                    </button>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
