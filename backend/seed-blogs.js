const mongoose = require('mongoose');
require('dotenv').config();
const Blog = require('./src/models/Blog');

const sampleBlogs = [
    {
        title: "The Art of Visual Dining: AR Menus Explored",
        slug: "art-visual-dining-ar-menus",
        content: `
            <p>In the modern culinary world, taste is only half the story. The visual presentation of a dish begins long before it reaches the table. EatGreet’s Augmented Reality (AR) technology bridges the gap between imagination and reality by allowing guests to see their meals in stunning 3D before placing an order.</p>

            <h3>Bringing Transparency to Every Plate</h3>
            <p>Our AR menus allow diners to visualize every ingredient, portion size, and presentation detail in high-fidelity 3D. This transparency builds an immediate layer of trust between the restaurant and the guest. When a diner can see the exact marbling of a ribeye or the intricate layers of a mille-feuille, order anxiety disappears. They no longer have to wonder, "What will this look like?" instead, they can confidently choose the dish that matches their craving perfectly.</p>

            <h3>An Interactive Social Experience</h3>
            <p>Traditional paper menus are functional, but they aren't shareable. EatGreet turns menu selection into a social event. Guests are naturally inclined to share the "magic" of a 3D hologram over their table with their followers on social media. This organic promotion becomes a powerful marketing tool for your restaurant, turning every diner into a brand ambassador. It's not just a menu; it's a piece of interactive theatre that stays in the guest's memory long after the meal is over.</p>

            <h3>The Future of the Culinary Interface</h3>
            <p>Whether it is a complex cocktail with smoking garnishes or a multi-layered pastry, AR brings the craftsmanship of the chef to the forefront. It allows you to tell the story of your ingredients—where they came from, how they were prepared, and why they matter. By making the selection process an integral part of the dining adventure, EatGreet ensures that your brand stands out in a crowded digital landscape.</p>
        `,
        excerpt: "Bridges the gap between imagination and reality. See how AR brings the chef's craftsmanship to the forefront of the dining experience with interactive 3D visuals.",
        author: "EatGreet Team",
        category: "Innovation",
        tags: ["AR", "VisualDining", "Tech"],
        isPublished: true,
        publishedAt: new Date(),
        coverImage: "/blogs/ar-explore.png",
        metaTitle: "Visual Dining with AR Menus | EatGreet Journal",
        metaDescription: "Explore how visual representation through AR is transforming the modern dining experience."
    },
    {
        title: "Synchronized Kitchens: Orchestrating Culinary Excellence",
        slug: "synchronized-kitchens-culinary-excellence",
        content: `
            <p>The heart of every restaurant is its kitchen, and the heart of every successful kitchen is timing. In a high-pressure environment, the transition from order to plate must be flawless. Any delay at the "pass" can lead to cold food, frustrated servers, and ultimately, a negative guest experience.</p>

            <h3>Digitizing the Order Flow</h3>
            <p>The EatGreet Kitchen Display System (KDS) acts as the central conductor for your culinary team. By digitizing the order flow, we move away from the chaos of physical paper tickets that get lost or stained. Orders are instantly prioritized based on prep times, ensuring that complex dishes are started early and simple sides are finished just in time. This intelligent sequencing ensures that every member of the table receives their course together, at the optimal temperature.</p>

            <h3>Real-time Coordination and Clarity</h3>
            <p>Communication between the front-of-house and back-of-house is often where errors occur. With EatGreet, when a dish is marked "ready" in the kitchen, the server receives an instant notification on their terminal. This synchronized movement eliminates unnecessary trips to the kitchen and allows waitstaff to focus on their guests. The result is a calmer kitchen environment where chefs can focus on their craft rather than deciphering handwritten scripts.</p>

            <h3>Continuous Improvement Through Tracking</h3>
            <p>Every ticket in our KDS is tracked—from the moment it's punched to the moment it's served. This data provides invaluable feedback for managers to identify bottlenecks in the prep process. Whether it is a slow-cooking station or a peak-hour traffic jam, the EatGreet KDS gives you the visibility needed to refine your operations and strive for perfection every single night.</p>
        `,
        excerpt: "Timing is everything. Learn how a synchronized digital kitchen ensures every dish arrives at the table exactly when it should, perfectly hot and fresh.",
        author: "EatGreet Team",
        category: "Operations",
        tags: ["KDS", "KitchenEfficiency", "Operations"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 86400000),
        coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop",
        metaTitle: "Synchronized Kitchen Operations | EatGreet",
        metaDescription: "Master the art of kitchen timing with EatGreet's advanced Kitchen Display System."
    },
    {
        title: "Insightful Intelligence: Understanding Your Restaurant's Pulse",
        slug: "insightful-intelligence-restaurant-pulse",
        content: `
            <p>Every interaction in a restaurant generates a story. Understanding these stories is the key to sustainable growth. In the past, managers had to rely on "gut feeling" and manual tallies. EatGreet identifies patterns in customer behavior that were previously invisible to the naked eye.</p>

            <h3>Turning Data into Action</h3>
            <p>Our intelligence dashboard distills complex order data into actionable insights. By monitoring the real-time popularity of menu items, managers can make dynamic changes to their offerings. If a particular appetizer is trending on a Tuesday night, you can see it instantly. This level of granularity allows you to optimize stock levels and minimize food waste, directly impacting your bottom line.</p>

            <h3>Optimizing Staff and Scheduling</h3>
            <p>Understanding "peak hours" is about more than knowing when it's busy; it's about knowing *how* it's busy. Our analytics show which stations are stressed during specific times. Combined with staff performance tracking, you can schedule your "A-team" for the busiest shifts and identify training opportunities for others. Optimal staffing ensures that service quality never dips, even during a full house.</p>

            <h3>Anticipating the Needs of Your Community</h3>
            <p>With real-time feedback and trend analysis, you can anticipate needs before they arise. If guests are consistently asking for a specific modifications, your analytics will reflect that. EatGreet empowers you to stay ahead of the curve, ensuring that your restaurant remains a preferred destination for your guests time and time again.</p>
        `,
        excerpt: "Turn every interaction into an insight. Understand your community's preferences to optimize your menu, staff levels, and business strategies.",
        author: "EatGreet Team",
        category: "Intelligence",
        tags: ["Analytics", "Strategy", "Growth"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 172800000),
        coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop",
        metaTitle: "Restaurant Intelligence & Analytics | EatGreet",
        metaDescription: "Use real-time insights to stay ahead of trends and grow your restaurant business."
    },
    {
        title: "The Unified Command Center: Managing Multiple Locations",
        slug: "unified-command-center-multiple-locations",
        content: `
            <p>Scaling a brand requires consistency, but maintaining that consistency across multiple cities or even neighborhoods can be a daunting task. The EatGreet Super Admin panel serves as your unified command center, giving you total control from anywhere in the world.</p>

            <h3>One Hub, Total Control</h3>
            <p>From a single interface, you can manage menu variations, monitor high-level performance metrics, and push global updates to all your locations simultaneously. This eliminates the need for manual local updates and ensures that your brand identity remains intact across every branch. Whether it is a price change or a new seasonal special, you can execute it across fifty locations with a single click.</p>

            <h3>Cross-Location Performance Benchmarking</h3>
            <p>Our Super Admin tools allow you to compare locations side-by-side. Why is one branch outperforming another in dessert sales? With EatGreet, you can dive deep into the data to find out. This level of transparency allows you to replicate success across your entire portfolio and identify underperforming units before they become a problem.</p>

            <h3>Future-Proofing Your Expansion</h3>
            <p>Our architecture is built for growth. Whether you have two locations or two hundred, EatGreet scales with you. Our centralized approach reduces administrative overhead significantly, allowing you to focus on the high-level strategy of your expansion. Manage your empire with the confidence that every guest is getting the same premium experience, no matter which door they walk through.</p>
        `,
        excerpt: "Control your empire from one screen. Maintain brand consistency and efficiency across all your locations with our Super Admin panel.",
        author: "EatGreet Team",
        category: "Management",
        tags: ["Scaling", "SuperAdmin", "Expansion"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 259200000),
        coverImage: "/blogs/management.png",
        metaTitle: "Multi-Location Restaurant Management | EatGreet",
        metaDescription: "Scale with confidence using the EatGreet Unified Command Center for restaurant chains."
    },
    {
        title: "Digital Connections: Building Authentic Guest Relationships",
        slug: "digital-connections-guest-relationships",
        content: `
            <p>In a world of automated services, authentic human connection remains the ultimate luxury. EatGreet uses technology to enhance these connections, not move away from them. We believe the best technology is invisible, serving to make the staff more present for the guest.</p>

            <h3>Personalization at Scale</h3>
            <p>By understanding guest preferences and past experiences, your staff can provide a level of personalized service that was formerly reserved for those with the best memories. Recognizing a regular’s favorite booth or suggesting a wine based on their past orders turns a simple meal into a personal experience. guests feel seen, heard, and valued when their preferences are remembered across visits.</p>

            <h3>The Power of Recognition</h3>
            <p>Our platform captures the subtle nuances of guest behavior. Is there a birthday coming up? Does the guest prefer a quiet corner? EatGreet puts this information at your fingertips, allowing you to surprise and delight your guests with small, meaningful gestures. This recognition is the foundation of loyalty in the digital age.</p>

            <h3>Building a Community, Not Just a Customer Base</h3>
            <p>Our tools empower your team to deliver memorable moments that guests will cherish. By streamlining the "logistics" of dining—like payment and order tracking—the staff is freed up to engage in genuine hospitality. EatGreet helps your restaurant become a cornerstone of your guests' lives, ensuring they return to your table again and again.</p>
        `,
        excerpt: "Technology that enhances human connection. Personalize your service to turn every guest into a regular and build a loyal community.",
        author: "EatGreet Team",
        category: "Hospitality",
        tags: ["Loyalty", "GuestConnection", "Service"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 345600000),
        coverImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
        metaTitle: "Hospitality & Guest Connections | EatGreet Blog",
        metaDescription: "Build meaningful relationships with your guests using personalized digital tools."
    }
];

const seedBlogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding...');
        await Blog.deleteMany({});
        await Blog.insertMany(sampleBlogs);
        console.log(`✅ Successfully re-seeded ${sampleBlogs.length} original data blogs!`);
    } catch (error) {
        console.error('❌ Error seeding blogs:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB Connection closed.');
    }
};

seedBlogs();
