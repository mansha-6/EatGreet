require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./src/db/db');
const seedSuperAdmin = require('./src/utils/seedSuperAdmin');

const app = express();
const server = http.createServer(app);

// Database Connection State Management
let isDBConnected = false;
let dbConnectionPromise = null;

const initDB = async () => {
    if (isDBConnected) return true;
    if (dbConnectionPromise) return dbConnectionPromise;

    dbConnectionPromise = (async () => {
        try {
            console.log('⏳ Connecting to MongoDB...');
            await connectDB();
            isDBConnected = true;
            console.log('✅ MongoDB Connected');
            
            // Seed in background
            seedSuperAdmin().catch(err => console.error('❌ Super Admin Seed Error:', err));
            return true;
        } catch (err) {
            console.error('❌ MongoDB Connection Failed:', err.message);
            isDBConnected = false;
            dbConnectionPromise = null;
            return false;
        }
    })();

    return dbConnectionPromise;
};

// Immediate init (Background)
initDB().then(async (connected) => {
    if (connected) {
        const { verifySMTP } = require('./src/utils/emailService');
        await verifySMTP();
    }
});

// Enhanced CORS configuration
const normalizeOrigin = (value) => {
    if (!value) return '';
    return String(value).trim().replace(/\/+$/, '').toLowerCase();
};

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://eat-greet.vercel.app',
    'https://eatgreet.vercel.app',
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(',').map((s) => s.trim())
].filter(Boolean).map(normalizeOrigin);

const isOriginAllowed = (origin) => {
    if (!origin) return true; // Allow non-browser requests (like Postman)
    if (process.env.NODE_ENV === 'development') return true;
    
    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app');
    
    console.log(`📡 CORS check: origin=[${origin}] normalized=[${normalizedOrigin}] allowed=[${isAllowed}]`);
    return isAllowed;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-restaurant-name', 'Origin', 'Accept', 'x-requested-with'],
    preflightContinue: false,
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS globally
app.use(cors(corsOptions));


app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Request Logging Middleware (Helpful for debugging 404s on live)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: corsOptions.origin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 60000,
    transports: ['polling', 'websocket']
});

// Store io instance in app to use in controllers
app.set('io', io);

// Debug socket events
io.engine.on("connection_error", (err) => {
    console.log('Socket Connection Error Detail:', {
        req: err.req?.url,
        code: err.code,
        message: err.message,
        context: err.context
    });
});

io.on('connection', (socket) => {
    console.log(`New Socket Connected: ${socket.id}`);

    // Join a specific restaurant room for updates
    socket.on('joinRestaurant', (nameOrId) => {
        // Sanitize for commonality with tenantDbName logic
        const room = String(nameOrId).toLowerCase().replace(/[^a-z0-9]/g, '_');
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Socket ${socket.id} disconnected: ${reason}`);
    });
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const offerRoutes = require('./src/routes/offerRoutes'); // Added offerRoutes
const blogRoutes = require('./src/routes/blogRoutes'); // Added blogRoutes
const { resolveTenant } = require('./src/middleware/tenantMiddleware');

// Health check
app.get('/api/health', async (req, res) => {
    const dbStatus = isDBConnected ? 'Connected' : 'Disconnected';
    res.json({ 
        status: 'ok', 
        db: dbStatus,
        timestamp: new Date(), 
        env: process.env.NODE_ENV,
        ver: '1.2.0'
    });
});

app.get('/api/health/smtp', async (req, res) => {
    const { verifySMTP } = require('./src/utils/emailService');
    const isSmtpWorking = await verifySMTP();
    if (isSmtpWorking) {
        res.json({ status: 'ok', message: 'SMTP Connection is active' });
    } else {
        res.status(503).json({ 
            status: 'error', 
            message: 'SMTP Connection failed',
            tip: 'Check your EMAIL_USER and EMAIL_PASS environment variables.'
        });
    }
});

// Middleware to ensure DB is connected for critical routes
const ensureDB = async (req, res, next) => {
    // Skip DB check for preflight requests
    if (req.method === 'OPTIONS') return next();
    
    if (isDBConnected) return next();
    const success = await initDB();
    if (success) {
        next();
    } else {
        res.status(503).json({ message: 'Database connecting, please retry in a second.' });
    }
};

app.use('/api/auth', ensureDB, authRoutes);
app.use('/api/restaurant', ensureDB, restaurantRoutes);
app.use('/api/categories', ensureDB, categoryRoutes);
app.use('/api/menu', ensureDB, menuRoutes);
app.use('/api/orders', ensureDB, resolveTenant, orderRoutes);
app.use('/api/stats', ensureDB, statsRoutes);
app.use('/api/payments', ensureDB, paymentRoutes);
app.use('/api/offers', ensureDB, resolveTenant, offerRoutes); 
app.use('/api/blogs', ensureDB, blogRoutes);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const cloudinary = require('cloudinary').v2;
const { protect } = require('./src/middleware/authMiddleware'); // Import protect middleware

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Signature Route for Direct Upload
app.get('/api/upload/signature', protect, (req, res) => {
    try {
        const timestamp = Math.round((new Date).getTime() / 1000);

        // Tenant Isolation: Create folder path
        const tenantName = req.user.restaurantName
            ? req.user.restaurantName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
            : `user_${req.user._id}`;
        const folder = `eatgreet_main/${tenantName}`;

        // Parameters to sign (Must match what frontend sends EXACTLY)
        const paramsToSign = {
            timestamp: timestamp,
            folder: folder,
            use_filename: true,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
        console.log('Generated Signature for params:', paramsToSign, 'Signature:', signature);

        res.json({
            signature,
            timestamp,
            folder,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            use_filename: true
        });
    } catch (error) {
        console.error('Signature Error:', error);
        res.status(500).json({ message: 'Could not generate signature' });
    }
});

// Cleanup Route for Cancelled Uploads
app.post('/api/upload/cleanup', protect, async (req, res) => {
    try {
        const { publicIds } = req.body;
        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return res.status(200).json({ message: "Nothing to clean" });
        }

        console.log(`Cleaning up ${publicIds.length} orphaned files...`);
        const results = await Promise.all(publicIds.map(id => {
            // Determine resource type? Default image. If video, ID usually implies?
            // Cloudinary destroy defaults to image. If video, we need to know.
            // For now, try both or expect frontend to send type/object.
            // Simplification: Try destroying as image (most likely).
            // Better: Frontend sends objects { id, type }?
            // Let's assume frontend sends string IDs and we try default.
            return cloudinary.uploader.destroy(id);
        }));

        res.json({ message: "Cleanup successful", results });
    } catch (error) {
        console.error("Cleanup Error", error);
        res.status(500).json({ message: "Cleanup failed" });
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Catch-all 404 logging
app.use((req, res, next) => {
    console.log(`[404] No route matches: ${req.method} ${req.url}`);
    res.status(404).json({ message: `Path ${req.url} not found` });
});
// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server instance export for Vercel
module.exports = app;
