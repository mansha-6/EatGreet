require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./src/db/db');
const seedSuperAdmin = require('./src/utils/seedSuperAdmin');

const app = express();
const server = http.createServer(app);

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
    if (!origin) return true;
    if (process.env.NODE_ENV === 'development') return true;
    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) return true;
    if (normalizedOrigin.endsWith('.vercel.app')) return true;

    return false;
};

const corsOriginHandler = (origin, callback) => {
    if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    callback(null, false);
};

const corsOptions = {
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-restaurant-name', 'Origin', 'Accept']
};

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
        origin: corsOriginHandler,
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
const { resolveTenant } = require('./src/middleware/tenantMiddleware');

// Express 5 wildcard syntax (replaces '*' used in Express 4)
app.options('/{*any}', cors(corsOptions));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', resolveTenant, orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments', resolveTenant, paymentRoutes);
app.use('/api/offers', resolveTenant, offerRoutes); // Added offerRoutes usage

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
// Database Connection and Server Startup
const startServer = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();

        const PORT = process.env.PORT || 5001;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        });

        console.log('Seeding Super Admin if needed...');
        await seedSuperAdmin();
        console.log('✅ Startup complete');
    } catch (error) {
        console.error('❌ Fatal Startup Error:', error);
        // On serverless environments, we don't want to exit immediately
        if (process.env.NODE_ENV !== 'production') process.exit(1);
    }
};

// Start server if run directly
if (require.main === module) {
    startServer();
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
