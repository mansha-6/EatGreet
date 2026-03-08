import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';
import { shouldRequireOnboarding } from './utils/onboarding';

// Lazy loading all pages and layouts for better performance
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));

// Super Admin Imports
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const Restaurants = lazy(() => import('./pages/super-admin/Restaurants'));
const Payments = lazy(() => import('./pages/super-admin/Payments'));
const Reports = lazy(() => import('./pages/super-admin/Reports'));
const SuperAdminProfile = lazy(() => import('./pages/super-admin/SuperAdminProfile'));
const SuperAdminSettings = lazy(() => import('./pages/super-admin/SuperAdminSettings'));
const SuperAdminLogin = lazy(() => import('./pages/super-admin/SuperAdminLogin'));

// Admin Imports
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'));
const AdminCategory = lazy(() => import('./pages/admin/AdminCategory'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminTable = lazy(() => import('./pages/admin/AdminTable'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminSales = lazy(() => import('./pages/admin/AdminSales'));
const Onboarding = lazy(() => import('./pages/admin/Onboarding'));

// Kitchen Imports
const KitchenLayout = lazy(() => import('./layouts/KitchenLayout'));
const KitchenDashboard = lazy(() => import('./pages/kitchen/KitchenDashboard'));
const KitchenProfile = lazy(() => import('./pages/kitchen/KitchenProfile'));
const KitchenSettings = lazy(() => import('./pages/kitchen/KitchenSettings'));

// Customer Imports
const CustomerLayout = lazy(() => import('./layouts/CustomerLayout'));
const Menu = lazy(() => import('./pages/customer/Menu'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const CustomerSettings = lazy(() => import('./pages/customer/CustomerSettings'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#EBF2F2]">
    <div className="w-10 h-10 border-4 border-[#FD6941]/20 border-t-[#FD6941] rounded-full animate-spin"></div>
  </div>
);


// Protected Route for Store Admins
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const { user: contextUser } = useSettings();
  const localUser = JSON.parse(localStorage.getItem('user'));
  const user = contextUser || localUser;
  const role = localStorage.getItem('userRole') || user?.role;
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to onboarding only for first-time/new admin setup
  if (role === 'admin' && shouldRequireOnboarding(user) && !location.pathname.includes('/onboarding')) {
    return <Navigate to="/admin/onboarding" replace />;
  }

/* 
  // Temporarily disabled for testing - Existing/working restaurants should not see onboarding again
  if (role === 'admin' && !shouldRequireOnboarding(user) && location.pathname.includes('/onboarding')) {
    const restaurantSlug = user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
    return <Navigate to={`/${restaurantSlug}/admin`} replace />;
  }
*/

  return children;
};

// Protected Route for Super Admin
const SuperAdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated || role !== 'superadmin') {
    return <Navigate to="/super-admin/login" replace />;
  }
  return children;
};

// Helper component for redirecting /admin/subpath
const AdminSubpathRedirect = () => {
  const { "*": splat } = useParams();
  const user = JSON.parse(localStorage.getItem('user'));
  const restaurantSlug = user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
  return <Navigate to={`/${restaurantSlug}/admin/${splat}`} replace />;
};

const SessionClearRedirect = () => {
  useEffect(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
  }, []);
  return <Navigate to="/" replace />;
};

const TitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = 'EatGreet';

    // Admin Routes
    if (pathname === '/admin') title = 'Dashboard';
    else if (pathname === '/admin/menu') title = 'Menu';
    else if (pathname === '/admin/category') title = 'Category';
    // Super Admin Routes
    else if (pathname === '/super-admin') title = 'Super Admin';
    else if (pathname === '/super-admin/login') title = 'Super Admin Login';

    // Auth & Landing
    else if (pathname === '/login') title = 'Login';
    else if (pathname === '/signup') title = 'Signup';

    // Default fallback
    else {
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      }
    }

    document.title = title;
  }, [pathname]);

  return null;
};



function App() {
  return (
    <ErrorBoundary>
      <Router>
        <TitleUpdater />
        <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* ... public routes ... */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin Auth */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Super Admin Auth */}
            <Route path="/super-admin/login" element={<Navigate to="/super-admin/secure-login" replace />} />
            <Route path="/super-admin/secure-login" element={<SuperAdminLogin />} />

            <Route path="/admin/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<Navigate to={`/${JSON.parse(localStorage.getItem('user'))?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant'}/admin`} replace />} />
            <Route path="/admin/*" element={<AdminSubpathRedirect />} />

            <Route path="/:restaurantName/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="category" element={<AdminCategory />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="table" element={<AdminTable />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={
              <SuperAdminRoute>
                <SuperAdminLayout />
              </SuperAdminRoute>
            }>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="restaurants" element={<Restaurants />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Navigate to="/super-admin/restaurants" replace />} />
              <Route path="profile" element={<SuperAdminProfile />} />
              <Route path="settings" element={<SuperAdminSettings />} />
            </Route>

            <Route path="/kitchen" element={<Navigate to={`/${JSON.parse(localStorage.getItem('user'))?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant'}/kitchen`} replace />} />

            <Route path="/:restaurantName/kitchen" element={
              <ProtectedRoute>
                <KitchenLayout />
              </ProtectedRoute>
            }>
              <Route index element={<KitchenDashboard />} />
              <Route path="profile" element={<KitchenProfile />} />
              <Route path="settings" element={<KitchenSettings />} />
            </Route>



            {/* Dynamic Restaurant Routes */}
            <Route path="/r/:restaurantId" element={<CustomerLayout />}>
              <Route index element={<Menu />} />
              <Route path="menu" element={<Menu />} />
              <Route path="profile" element={<CustomerProfile />} />

            </Route>

            {/* New Table Specific Route */}
            <Route path="/:restaurantName/table/:tableNo" element={<CustomerLayout />}>
              <Route index element={<Menu />} />
              <Route path="menu" element={<Menu />} />
              <Route path="profile" element={<CustomerProfile />} />

            </Route>



            {/* Fallback */}
            <Route path="*" element={<SessionClearRedirect />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
