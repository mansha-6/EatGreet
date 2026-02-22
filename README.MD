# 🍽️ EatGreet - Modern Restaurant Ecosystem

**EatGreet** is a premium, high-performance MERN stack ecosystem designed for modern restaurants. It features a multi-tenant architecture, real-time order tracking, 3D menu visualization, and a sophisticated admin dashboard.

---

## 🌐 System Architecture (Overall View)

EatGreet operates as a unified ecosystem where different modules communicate in real-time:

*   **Core API (Backend):** A Node/Express server handling authentication, multi-tenant database routing, and business logic.
*   **Real-time Engine:** Socket.io layer for instant communication between the Admin Dashboard and the Kitchen Display System (KDS).
*   **Admin Dashboard (Frontend):** A React-based interface for restaurant owners to manage menus, track sales, and configure settings.
*   **Kitchen KDS:** A specialized view for chefs to see and update order statuses in real-time.
*   **Multi-Tenant Database:** Isolated MongoDB collections for each restaurant to ensure data privacy and performance.

---

## ✨ Key Features & Modules

### 👑 Admin & Super-Admin
- **Global Management:** Super-Admins can manage all restaurants and users.
- **Sales Analytics:** Visual charts for revenue, orders, and expense tracking.
- **Tenant Isolation:** Every restaurant has its own slug (e.g., `eatgreet.com/my-cafe`).

### � Menu & 3D Visuals
- **Dynamic Categories:** Create and organize food categories with drag-and-drop ease.
- **3D Model Viewer:** Support for `.glb` and `.gltf` files to show customers 3D views of food.
- **Cloud Imagery:** High-speed image delivery via Cloudinary integration.

### 🔔 Real-time Operations
- **Instant Orders:** Kitchen receives orders the second they are placed.
- **Status Sync:** Live updates on "Preparing", "Ready", and "Delivered" states.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** Tailwind CSS & Framer Motion
- **Real-time:** Socket.io Client
- **Typography:** [Inter](https://rsms.me/inter/) (Professional, high-readability font)

### Backend
- **Runtime:** Node.js with Express
- **Database:** MongoDB (Mongoose)
- **Real-time Engine:** Socket.io
- **File Storage:** Cloudinary
- **Security:** JWT Authentication & Bcrypt

---

## 📂 Project Structure

```text
EatGreet/
├── backend/                # Express API & Socket.io Server (Port 5002)
│   ├── src/
│   │   ├── controllers/    # Business logic (Auth, Orders, Stats)
│   │   ├── models/         # Multi-tenant MongoDB Schemas
│   │   ├── routes/         # API Endpoint definitions
│   │   ├── middleware/     # Tenant resolution & JWT protection
│   │   └── utils/          # Helpers (Seeding, Cloudinary)
│   └── index.js            # Server entry point
├── frontend/               # React Application (Vite)
│   ├── src/
│   │   ├── components/     # UI Elements (MediaSlider, Charts)
│   │   ├── context/        # Global state (Socket, Settings)
│   │   ├── pages/          # Auth, Admin, Kitchen, & SuperAdmin views
│   │   └── utils/          # Axios API services
│   └── index.html          # Application shell
└── README.md
```

---

## 🚀 Quick Startup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Cloudinary API keys

### 2. Configure Environment Variables
- **Backend (`/backend/.env`):** Define your `PORT` (e.g., `3000`) and other secrets.
- **Frontend (`/frontend/.env`):** Set `VITE_API_BASE_URL` using your server's port (e.g., `http://localhost:YOUR_SERVER_PORT/api`).

### 3. Run Both Servers
```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

---
