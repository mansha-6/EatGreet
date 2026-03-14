import axios from 'axios';

const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost) return '/api';
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()).replace(/\/$/, '');


const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
        // Use impersonated restaurant if user is superadmin and impersonation is active
        const impersonated = localStorage.getItem('impersonatedRestaurant');
        const isSuperAdmin = user && user.role === 'superadmin';

        let targetRestaurantName = user?.restaurantName;
        if (isSuperAdmin && impersonated) {
          try {
            const impData = JSON.parse(impersonated);
            if (impData.name) targetRestaurantName = impData.name;
          } catch (e) { }
        }

        if (targetRestaurantName) {
          if (!config.headers['x-restaurant-name'] && !config.params?.restaurantName) {
            config.headers['x-restaurant-name'] = targetRestaurantName;
          }
          if (!config.params?.restaurantName && !config.headers['x-restaurant-name']) {
            config.params = { ...config.params, restaurantName: targetRestaurantName };
          }
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        // Clear corrupt data to prevent repeated crashes
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle session expiration or database resolution errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Unauthorized / Session Expired
    // 400 with specific message: Tenant/Restaurant resolution failed
    if (error.response) {
      const isAuthError = error.response.status === 401;
      const isLoginRequest = error.config.url.includes('/auth/login');

      // Only redirect for Auth errors that AREN'T login attempts.
      // 401 during login means "Invalid Credentials", not "Session Expired".
      if (isAuthError && !isLoginRequest) {
        console.warn("Session expired. Clearing session info...", error.response.data);
        localStorage.clear();
        
        // Only redirect if the user is in the admin or super-admin area
        const path = window.location.pathname;
        const isAdminArea = path.includes('/admin') || path.includes('/super-admin') || path.includes('/kitchen');
        
        const isPublicAuthPage = path.includes('/login') || path.includes('/forgot-password') || path.includes('/reset-password') || path.includes('/onboarding');
        
        if (isAdminArea && !isPublicAuthPage) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  setupPassword: (data) => api.post('/auth/setup-password', data),
  sendSuperAdminOtp: (email) => api.post('/auth/superadmin/send-otp', { email }),
  verifySuperAdminOtp: (email, otp) => api.post('/auth/superadmin/verify-otp', { email, otp }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  getUsers: () => api.get('/auth/users'),
  getSuperAdminLoginActivity: () => api.get('/auth/superadmin/login-activity'),
  updatePassword: () => Promise.resolve({ data: { message: 'Password update not implemented yet' } }), // Pending backend
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  getRestaurants: () => api.get('/restaurant/all'),
  getPendingApprovals: () => api.get('/restaurant/pending'),
  approveRestaurant: (id) => api.put(`/restaurant/approve/${id}`),
  deleteRestaurant: (id) => api.delete(`/restaurant/${id}`),
  updateSubscription: (data) => api.put('/restaurant/subscription', data),
  sendReminder: (data) => api.post('/restaurant/reminder', data),
  superAdminCreateRestaurant: (data) => api.post('/auth/register', data),
};

export const statsAPI = {
  getAdminStats: async (params) => {
    return api.get('/stats/admin', { params });
  },
  getSuperAdminStats: async () => {
    return api.get('/stats/super-admin');
  },
  getPublicStats: async () => {
    return api.get('/stats/public');
  }
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  verifyAccount: (credentials) => api.post('/payments/verify-account', credentials),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
};

export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }), // params can contain restaurantId
  create: (itemData) => api.post('/menu', itemData),
  update: (id, itemData) => api.put(`/menu/${id}`, itemData),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const offerAPI = {
  getAll: (params) => api.get('/offers', { params }),
  create: (offerData) => api.post('/offers', offerData),
  update: (id, offerData) => api.put(`/offers/${id}`, offerData),
  delete: (id) => api.delete(`/offers/${id}`),
};

export const orderAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  create: (orderData, restaurantName) => api.post('/orders', orderData, { params: { restaurantName } }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId, itemIdx, status) => api.put(`/orders/${orderId}/items/${itemIdx}/status`, { status }),
  checkTableStatus: (tableNumber, restaurantName) => api.get(`/orders/table-status/${tableNumber}`, { params: { restaurantName } }),

  // Public Kitchen API
  getKitchenOrders: (restaurantName) => api.get(`/orders/kitchen/${restaurantName}`),
  updateKitchenOrderStatus: (restaurantName, orderId, status) => api.put(`/orders/kitchen/${restaurantName}/${orderId}/status`, { status }),
};

/* 
   CUSTOMER / OTHER FLOWS
*/
export const customerAPI = {
  // Customers use the same auth endpoints but different flows in frontend potentially
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', { ...data, role: 'customer' }),
  getProfile: () => api.get('/auth/profile'),
};

export const restaurantAPI = {
  getDetails: () => api.get('/restaurant'),
  updateDetails: (details) => api.put('/restaurant', details),
  completeOnboarding: (details) => api.post('/restaurant/onboard', details),
  getSetupDetails: (token) => api.get(`/restaurant/setup-details/${token}`),
  getBySlug: (slug) => api.get(`/restaurant/slug/${slug}`),
  getPublicDetails: (id) => api.get(`/restaurant/${id}`),
};

export const uploadAPI = {
  uploadFile: (fileOrFormData) => {
    let data = fileOrFormData;
    if (fileOrFormData instanceof File) {
      data = new FormData();
      data.append('file', fileOrFormData);
    }
    return api.post('/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadDirectNew: async (fileOrFormData, onUploadProgress, config = {}, resourceType = 'auto') => {
    let file = fileOrFormData;
    if (fileOrFormData instanceof FormData) {
      file = fileOrFormData.get('file');
    }

    // Force resource_type to 'image' for 3D models (glb, gltf) as Cloudinary often handles them as such
    if (file && file.name && file.name.match(/\.(glb|gltf)$/i)) {
      resourceType = 'image';
    }

    try {
      // 1. Get Signature from Backend
      console.log("Fetching signature...");
      const signRes = await api.get('/upload/signature', { ...config, params: { resource_type: resourceType } });
      console.log("Signature received:", signRes.data);

      // 2. Prepare Direct Upload Data
      const { signature, timestamp, folder, cloudName, apiKey, use_filename } = signRes.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      if (use_filename) {
        formData.append('use_filename', 'true');
      }

      // 3. Upload Directly to Cloudinary
      // Note: We use a naked axios instance to avoid sending our Backend Auth Headers to Cloudinary
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (onUploadProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onUploadProgress(percentCompleted);
            }
          },
          ...config // Pass cancellation signal
        }
      );

      return cloudinaryRes; // Cloudinary returns { data: { secure_url, ... } } which matches our expectation
    } catch (error) {
      // Don't log if it's just a cancellation
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        const message = error.response?.data?.error?.message || error.message;
        console.error("Direct Upload Error:", message, error.response?.data);
      }
      throw error;
    }
  },
  uploadDirect: function () { return this.uploadDirectNew(...arguments); },
  cleanupFiles: (publicIds) => api.post('/upload/cleanup', { publicIds }),
};

const apis = {
  authAPI,
  statsAPI,
  menuAPI,
  categoryAPI,
  offerAPI,
  orderAPI,
  customerAPI,
  restaurantAPI,
  uploadAPI
};

export default apis;
