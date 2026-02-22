# Restaurant CMS

A modern, responsive Content Management System (CMS) designed for restaurants to streamline their operations. This application allows restaurant owners to manage their dashboard, menu items, food categories, and general settings with ease.

## 🚀 Technlogy Stack

This project is built using the latest web technologies for speed, scalability, and developer experience:

- **Frontend Framework:** [React](https://react.dev/) (v19)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## ✨ Features

- **Dashboard:** A visual overview of key metrics and restaurant performance.
- **Menu Management:** Easily add, edit, or remove menu items.
- **Category Management:** Organize food items into specific categories.
- **Authentication:** Secure Login and Signup pages.
- **Settings:** Configure application and restaurant preferences.
- **Responsive Design:** Optimized for seamless usage across different devices.

## 📂 Project Structure

The project is currently organized with a frontend-focused structure:

```
restaurant-cms/
├── frontend/           # Frontend source code
│   ├── public/         # Static assets
│   ├── src/            # Source files (components, pages, etc.)
│   ├── index.html      # Entry HTML file
│   ├── package.json    # Dependencies and scripts
│   └── vite.config.js  # Vite configuration
└── README.md           # Project documentation
```

## 🛠️ Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually installed with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/EatGreet.git
   cd EatGreet
   ```

2. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```
### Building for Production

To build the application for production deployment:

```bash
npm run build
```

## 🌐 Deployment

To run this application live, you need to deploy both the Frontend and the Backend.

### 1. Backend Deployment (Recommended: Render)
Since this app uses **Socket.io** for real-time notifications and order updates, we recommend **Render** or **Railway** for the backend, as Vercel's serverless platform does not support permanent WebSocket connections.

1. Create a new "Web Service" on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `node index.js`.
6. Add the following **Environment Variables**:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string.
   - `PORT`: `5001`.
   - `NODE_ENV`: `production`.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### 2. Frontend Deployment (Recommended: Vercel)
Vercel is the best platform for your React/Vite frontend.

1. Connect your GitHub repository to [Vercel](https://vercel.com/).
2. Select the `frontend` directory as the project root.
3. Vercel will automatically detect **Vite** settings.
4. Add the following **Environment Variable**:
   - `VITE_API_BASE_URL`: The URL of your deployed backend (e.g., `https://eatgreet-api.onrender.com/api`).
5. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).