# 🍽️ EatGreet — Restaurant Management Platform

> A full-stack, multi-tenant SaaS platform for restaurants. Manage menus, orders, tables, sales, offers, and staff — all in real time.

---

## 🌟 Overview

**EatGreet** is a comprehensive restaurant management solution built for modern dining businesses. It provides four distinct role-based interfaces — **Super Admin**, **Restaurant Admin**, **Kitchen Staff**, and **Customers** — each tailored for their specific workflows.

Key highlights:
- 🏢 **Multi-tenant** architecture — each restaurant gets its own isolated data space
- ⚡ **Real-time** order updates via Socket.io
- 🍱 **Customer-facing menu** with AR (3D model) view support
- 📊 **Sales analytics** with dynamic charts
- 🗺️ **Location picker** integrated with Leaflet maps
- 🎬 **Media slider** for image/video offer promotions
- ☁️ **Cloudinary** integration for media uploads

---

## 🚀 Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI Framework |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first Styling |
| [Socket.io Client](https://socket.io/) | Real-time Communication |
| [Leaflet](https://leafletjs.com/) | Interactive Maps |
| [Three.js](https://threejs.org/) | 3D / AR Model Rendering |
| [Recharts](https://recharts.org/) | Sales & Analytics Charts |

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/) | REST API Server |
| [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) | Database & ODM |
| [Socket.io](https://socket.io/) | Real-time WebSocket Server |
| [JWT](https://jwt.io/) | Authentication |
| [Cloudinary](https://cloudinary.com/) | Media Storage |
| [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) | Password Hashing |

---

## ✨ Features by Role

### 👑 Super Admin
- Manage all registered restaurants across the platform
- View platform-wide payments and revenue reports
- Manage platform users and access levels
- Configure global platform settings

### 🍴 Restaurant Admin
- **Dashboard** — Live sales overview, revenue charts (hourly / daily / all-time), and key metrics
- **Menu Management** — Add, edit, remove items with images, videos, and 3D model (AR) support
- **Category Management** — Organise menu items into categories
- **Offers** — Create promotional banners with image or video media
- **Orders** — Real-time order tracking with status updates (Pending → Preparing → Ready → Delivered)
- **Tables** — Manage dine-in tables and QR code assignment
- **Sales** — Detailed transaction history with date range filtering and export
- **Settings** — Restaurant profile, branding, operating hours, location (map picker), and expenses
- **Profile** — Admin account management

### 👨‍🍳 Kitchen Staff
- Live kitchen order dashboard via Socket.io
- Update order status in real time
- Profile and settings management

### 🧑‍💻 Customer
- **Menu Page** — Browse the full menu with categories, search, filters, and AR view
- **Media Offer Slider** — Auto-play promotional image/video offers
- **Favourites** — Save favourite items
- **Order Placement** — Add to cart and place orders
- **Profile & Settings** — Customer account management

---

## 📂 Project Structure

```
EatGreet/
├── backend/                    # Node.js / Express API Server
│   ├── index.js                # Entry point, Express & Socket.io setup
│   ├── .env                    # Environment variables (not committed)
│   └── src/
│       ├── controllers/        # Route handler logic
│       ├── db/                 # MongoDB connection
│       ├── middleware/         # Auth & tenant middleware
│       ├── models/             # Mongoose schemas (User, MenuItem, Order, Offer, ...)
│       ├── routes/             # API route definitions
│       └── utils/              # Helpers (seed super admin, etc.)
│
├── frontend/                   # React / Vite Frontend
│   ├── public/                 # Static assets
│   ├── vite.config.js          # Vite config (proxy → localhost:5001)
│   └── src/
│       ├── components/         # Shared components (Navbar, MediaSlider, Map, ...)
│       ├── context/            # React Context providers
│       ├── hooks/              # Custom React hooks
│       ├── layouts/            # Role-specific layout wrappers
│       ├── pages/
│       │   ├── admin/          # Restaurant admin pages (Dashboard, Menu, Orders, Sales, ...)
│       │   ├── customer/       # Customer-facing pages (Menu, Profile, Favourites)
│       │   ├── kitchen/        # Kitchen staff pages
│       │   ├── super-admin/    # Platform super-admin pages
│       │   ├── auth/           # Login / Signup
│       │   └── landing/        # Public landing page
│       └── utils/              # Frontend utility functions
│
└── README.MD
```

---

## 🛠️ Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/)
- A [MongoDB](https://www.mongodb.com/atlas) database (Atlas free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier)

---

### 1. Clone the Repository

```bash
git clone https://github.com/sagariyavaishnavi/EatGreet.git
cd EatGreet
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/eatgreet
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Start the backend dev server:

```bash
npm run dev
# Backend runs on http://localhost:5001
```

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

> **Note:** The Vite dev server proxies all `/api` and `/socket.io` requests to `http://localhost:5001`. **Both servers must be running at the same time.**

---

## 🔧 Common Issues

| Error | Cause | Fix |
|---|---|---|
| `ECONNREFUSED` on `/api/*` | Backend server not running | Run `npm run dev` in `backend/` |
| `EADDRINUSE` on port 5001/5002 | Stale process occupying the port | Run `lsof -ti:5001 \| xargs kill -9` |
| Port mismatch | `.env` `PORT` doesn't match Vite proxy | Ensure `PORT=5001` in `backend/.env` |
| CORS error | `FRONTEND_URL` not set | Add `FRONTEND_URL=http://localhost:5173` to `.env` |

---

## 🌐 Deployment

### Backend — Recommended: [Render](https://render.com/) or [Railway](https://railway.app/)

> ⚠️ **Do not use Vercel for the backend.** Vercel's serverless model does not support persistent WebSocket (Socket.io) connections.

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository and set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `node index.js`.
5. Add the following **Environment Variables**:

| Variable | Value |
|---|---|
| `PORT` | `5001` |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long, secure random string |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `FRONTEND_URL` | Your deployed frontend URL (e.g. `https://eatgreet.vercel.app`) |

---

### Frontend — Recommended: [Vercel](https://vercel.com/)

1. Connect your GitHub repository to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Vercel will auto-detect Vite settings.
4. Add the following **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your deployed backend URL (e.g. `https://eatgreet-api.onrender.com/api`) |

5. Deploy!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).