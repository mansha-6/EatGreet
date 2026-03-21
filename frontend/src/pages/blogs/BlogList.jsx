import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { blogAPI } from '../../utils/api';
import { ArrowRight, Calendar, User, Tag } from 'lucide-react';
import LandingFooter from '../../components/landing/LandingFooter';
import { FloatingNav } from '../../components/landing/FloatingNav';

const BlogCard = ({ blog }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl group"
    >
        <Link to={`/blogs/${blog.slug}`} className="block relative aspect-[16/10] overflow-hidden">
            <img 
                src={blog.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c77?q=80&w=2070&auto=format&fit=crop'} 
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-[#FD6941] uppercase tracking-widest shadow-sm">
                {blog.category}
            </div>
        </Link>
        <div className="p-8">
            <Link to={`/blogs/${blog.slug}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#FD6941] transition-colors leading-tight">
                    {blog.title}
                </h3>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                {blog.excerpt || blog.content.substring(0, 150) + '...'}
            </p>
            <Link 
                to={`/blogs/${blog.slug}`}
                className="inline-flex items-center gap-2 text-[#FD6941] font-bold text-sm tracking-widest uppercase group/btn"
            >
                Read Article
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
        </div>
    </motion.div>
);

export default function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await blogAPI.getAll();
                setBlogs(response.data);
            } catch (error) {
                console.error('Failed to fetch blogs:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const navItems = [
        { name: "Home", link: "/" },
        { name: "Features", link: "/#bento-features" },
        { name: "Pricing", link: "/#pricing" },
        { name: "Waitlist", link: "/#contact" },
    ];

    return (
        <div className="min-h-screen bg-[#F7F7F5] pt-32">
            <FloatingNav navItems={navItems} />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <header className="text-center mb-20">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[#FD6941] font-bold text-xs tracking-[0.3em] uppercase mb-4 block"
                    >
                        Our Journal
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight"
                    >
                        Kitchen Intelligence & <br/>
                        <span className="text-[#FD6941]">The Future of Dining</span>
                    </motion.h1>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/50 animate-pulse h-96 rounded-[2.5rem]" />
                        ))}
                    </div>
                ) : blogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
                        {blogs.map(blog => (
                            <BlogCard key={blog._id} blog={blog} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-400">No blog posts found yet.</h2>
                        <p className="text-gray-400 mt-2">Check back soon for latest insights from EatGreet.</p>
                    </div>
                )}
            </div>
            
            <LandingFooter />
        </div>
    );
}
