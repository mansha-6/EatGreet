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
- ☁️ **Cloudinary** integration (Direct Secure Uploads)
- 📧 **Automated Email System** for OTP, Welcome, and Approvals

---

## 🚀 Recent Updates (March 2026)

We have recently implemented major stability and UX improvements:

### 1. 📧 Integrated Email OTP & SMTP
- **Secure Authentication**: Added Gmail App Password support for reliable OTP delivery.
- **Automated Workflow**: Automated Welcome emails for users and Approval notifications with credentials for restaurant owners.
- **Error Tracking**: Detailed server-side logging for mail delivery failures (e.g., SMTP Auth errors).

### 2. 📱 Full Mobile Responsiveness
- **Admin Command Center**: Re-engineered the Admin Dashboard, Menu, and Orders pages for 100% mobile and tablet compatibility.
- **Floating Mobile Drawer**: Implemented a responsive sidebar navigation for small screens.
- **Dynamic Scaling**: Fluid typography and grid layouts that adapt to any device size.

### 3. ✅ Optimized Onboarding Flow
- **Stricter Logic**: Fixed a bug where new users could skip the onboarding process. The app now enforces mandatory business profile completion before dashboard access.
- **SPA Routing Fix**: Added `vercel.json` configuration to handle internal React routing on Vercel (fixes "404 on refresh" error).

### 4. 🔒 Enhanced Media Security
- **Signature-based Uploads**: Switched to direct-to-Cloudinary uploads using backend signatures, reducing server load and improving security.
- **Support for 3D/AR**: Enhanced support for GLB/GLTF model uploads in the Menu section.

---

## 🚀 Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI Framework |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first Styling |
| [Socket.io Client](https://socket.io/) | Real-time Communication |
| [Three.js](https://threejs.org/) | 3D / AR Model Rendering |
| [Recharts](https://recharts.org/) | Sales & Analytics Charts |

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | Runtime Environment |
| [Express 5](https://expressjs.com/) | REST API Server |
| [MongoDB](https://www.mongodb.com/) | Database |
| [Nodemailer](https://nodemailer.com/) | Email Services |
| [Socket.io](https://socket.io/) | Real-time WebSocket Server |
| [JWT](https://jwt.io/) | Authentication |
| [Cloudinary](https://cloudinary.com/) | Media Storage |

---

## ✨ Features by Role

### 👑 Super Admin
- Manage all registered restaurants across the platform
- **Restaurant Approval**: Review registration requests and approve with one click (triggers automated email with credentials).
- View platform-wide payments and revenue reports
- Manage platform users and access levels

### 🍴 Restaurant Admin
- **Onboarding** — Mandatory setup for Business Details, GST, and Location.
- **Dashboard** — Live sales overview with responsive charts.
- **Menu Management** — Add items with images, videos, and 3D models.
- **Orders** — Real-time tracking with status updates (Pending → Preparing → Ready → Delivered).
- **Sales & Reports** — Exportable transaction history.

### 👨‍🍳 Kitchen Staff
- Live kitchen order dashboard via Socket.io.
- Update order status in real time.

---

## 📂 Project Structure

```
EatGreet/
├── backend/                    # Node.js / Express API Server
│   ├── index.js                # Entry point, Express & Socket.io setup
│   ├── src/
│   │   ├── controllers/        # Route handler logic
│   │   ├── middleware/         # Auth & tenant middleware
│   │   ├── models/             # Mongoose schemas
│   │   └── utils/              # emailService.js, seedSuperAdmin.js
│
├── frontend/                   # React / Vite Frontend
│   ├── vercel.json             # Vercel Routing Configuration
│   └── src/
│       ├── components/         # Navbar, MediaSlider, Map, ...
│       ├── context/            # SocketContext, SettingsContext
│       ├── pages/
│       │   ├── admin/          # Responsive Dashboard, Menu, Orders
│       │   ├── super-admin/    # Restaurant Management
│       │   └── landing/        # Smart Public Landing Page
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

# Email (Gmail recommended with App Password)
EMAIL_USER=eatgreetofficial@gmail.com
EMAIL_PASS=your_16_digit_app_password
APP_ADMIN_EMAIL=admin@eatgreet.com

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
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Start the frontend: `npm run dev`
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
| `EMAIL_USER` | Your email for sending (e.g., `eatgreetofficial@gmail.com`) |
| `EMAIL_PASS` | Your 16-digit app password for the email |
| `APP_ADMIN_EMAIL` | Admin email for notifications (e.g., `admin@eatgreet.com`) |
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

5. Deploy! The `vercel.json` ensures SPA routes like `/admin/orders` don't 404 on refresh.

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