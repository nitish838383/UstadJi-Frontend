/**
 * UstadJi - Centralized API Client
 * All HTTP requests go through this module.
 */

const API = {
  /**
   * Core request method with auth, timeout, retry
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers = {},
      auth = true,
      retry = CONFIG.RETRY_ATTEMPTS,
      timeout = CONFIG.REQUEST_TIMEOUT,
      isFormData = false,
    } = options;

const CONFIG = {
    API_BASE_URL: "https://ustaji-backend.onrender.com/api"
};
    const defaultHeaders = {};
    if (!isFormData) defaultHeaders["Content-Type"] = "application/json";
    defaultHeaders["Accept"] = "application/json";

    if (auth) {
      const token = Auth.getAccessToken();
      if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      method,
      headers: { ...defaultHeaders, ...headers },
      signal: controller.signal,
    };

    if (body) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    let lastError;
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Handle 401 - try refresh token
        if (response.status === 401 && auth) {
          const refreshed = await Auth.refreshToken();
          if (refreshed) {
            // Retry original request with new token
            return this.request(endpoint, { ...options, retry: 0 });
          }
          Auth.logout(true);
          throw new Error("Session expired. Please login again.");
        }

        const contentType = response.headers.get("content-type") || "";
        let data = null;
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          const message =
            (data && (data.detail || data.message || data.error)) ||
            `Request failed with status ${response.status}`;
          const error = new Error(message);
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (err) {
        lastError = err;
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        }
        // Don't retry on 4xx (except 401 already handled)
        if (err.status && err.status >= 400 && err.status < 500) throw err;
        if (attempt < retry) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError || new Error("Network error. Please check your connection.");
  },

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", body });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", body });
  },

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "PATCH", body });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },

  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  // ========== Auth Endpoints ==========
  auth: {
    register(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/register", data, { auth: false });
    },
    login(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/login", data, { auth: false });
    },
    workerRegister(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/worker/register", data, { auth: false });
    },
    workerLogin(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/worker/login", data, { auth: false });
    },
    logout() {
      return API.post("https://ustaji-backend.onrender.com/api/auth/logout", {});
    },
    forgotPassword(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/forgot-password", data, { auth: false });
    },
    resetPassword(data) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/reset-password", data, { auth: false });
    },
    refresh(refreshToken) {
      return API.post("https://ustaji-backend.onrender.com/api/auth/refresh", { refresh_token: refreshToken }, { auth: false });
    },
    me() {
      return API.get("https://ustaji-backend.onrender.com/api/auth/me");
    },
  },

  // ========== Services ==========
  services: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/services${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`https://ustaji-backend.onrender.com/api/services/${id}`);
    },
    categories() {
      return API.get("https://ustaji-backend.onrender.com/api/services/categories");
    },
    search(query) {
      return API.get(`https://ustaji-backend.onrender.com/api/services/search?q=${encodeURIComponent(query)}`);
    },
  },

  // ========== Workers ==========
  workers: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/workers${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`https://ustaji-backend.onrender.com/api/workers/${id}`);
    },
    byService(serviceId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/workers/service/${serviceId}${qs ? "?" + qs : ""}`);
    },
    search(query) {
      return API.get(`https://ustaji-backend.onrender.com/api/workers/search?q=${encodeURIComponent(query)}`);
    },
    reviews(workerId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/workers/${workerId}/reviews${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Bookings ==========
  bookings: {
    create(data) {
      return API.post("https://ustaji-backend.onrender.com/api/bookings", data);
    },
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/bookings${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`https://ustaji-backend.onrender.com/api/bookings/${id}`);
    },
    cancel(id, reason) {
      return API.post(`https://ustaji-backend.onrender.com/apibookings/${id}/cancel`, { reason });
    },
    reschedule(id, data) {
      return API.post(`https://ustaji-backend.onrender.com/api/bookings/${id}/reschedule`, data);
    },
    invoice(id) {
      return API.get(`https://ustaji-backend.onrender.com/api/bookings/${id}/invoice`);
    },
    // Worker actions
    accept(id) {
      return API.post(`https://ustaji-backend.onrender.com/api/bookings/${id}/accept`);
    },
    reject(id, reason) {
      return API.post(`https://ustaji-backend.onrender.com/api/bookings/${id}/reject`, { reason });
    },
    start(id) {
      return API.post(`https://ustaji-backend.onrender.com/api/bookings/${id}/start`);
    },
    complete(id) {
      return API.post(`https://ustaji-backend.onrender.com/api/bookings/${id}/complete`);
    },
    workerList(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/bookings/worker${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Profile ==========
  profile: {
    get() {
      return API.get("https://ustaji-backend.onrender.com/api/profile");
    },
    update(data) {
      return API.put("https://ustaji-backend.onrender.com/api", data);
    },
    uploadAvatar(formData) {
      return API.upload("https://ustaji-backend.onrender.com/api/profile/avatar", formData);
    },
    addresses() {
      return API.get("https://ustaji-backend.onrender.com/api/profile/addresses");
    },
    addAddress(data) {
      return API.post("https://ustaji-backend.onrender.com/api/profile/addresses", data);
    },
    updateAddress(id, data) {
      return API.put(`https://ustaji-backend.onrender.com/api/profile/addresses/${id}`, data);
    },
    deleteAddress(id) {
      return API.delete(`https://ustaji-backend.onrender.com/api/profile/addresses/${id}`);
    },
    // Worker specific
    workerProfile() {
      return API.get("https://ustaji-backend.onrender.com/api/profile/worker");
    },
    updateWorkerProfile(data) {
      return API.put("https://ustaji-backend.onrender.com/api/profile/worker", data);
    },
    uploadKYC(formData) {
      return API.upload("https://ustaji-backend.onrender.com/api/profile/worker/kyc", formData);
    },
  },

  // ========== Reviews ==========
  reviews: {
    create(data) {
      return API.post("https://ustaji-backend.onrender.com/api/reviews", data);
    },
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/reviews${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Notifications ==========
  notifications: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`https://ustaji-backend.onrender.com/api/notifications${qs ? "?" + qs : ""}`);
    },
    markRead(id) {
      return API.patch(`https://ustaji-backend.onrender.com/api/notifications/${id}/read`);
    },
    markAllRead() {
      return API.post("https://ustaji-backend.onrender.com/api/notifications/read-all");
    },
    delete(id) {
      return API.delete(`https://ustaji-backend.onrender.com/api/notifications/${id}`);
    },
    unreadCount() {
      return API.get("https://ustaji-backend.onrender.com/api/notifications/unread-count");
    },
  },

  // ========== Coupons ==========
  coupons: {
    validate(code, bookingData) {
      return API.post("https://ustaji-backend.onrender.com/api/coupons/validate", { code, ...bookingData });
    },
  },

  // ========== Wishlist ==========
  wishlist: {
    list() {
      return API.get("https://ustaji-backend.onrender.com/api/wishlist");
    },
    add(workerId) {
      return API.post("https://ustaji-backend.onrender.com/api/wishlist", { worker_id: workerId });
    },
    remove(workerId) {
      return API.delete(`https://ustaji-backend.onrender.com/api/wishlist/${workerId}`);
    },
  },

  // ========== Payments ==========
  payments: {
    createOrder(data) {
      return API.post("https://ustaji-backend.onrender.com/api/payments/create-order", data);
    },
    verify(data) {
      return API.post("https://ustaji-backend.onrender.com/api/payments/verify", data);
    },
    methods() {
      return API.get("https://ustaji-backend.onrender.com/api/payments/methods");
    },
  },

  // ========== Contact ==========
  contact: {
    submit(data) {
      return API.post("https://ustaji-backend.onrender.com/api/contact", data, { auth: false });
    },
  },

  // ========== Dashboard ==========
  dashboard: {
    user() {
      return API.get("https://ustaji-backend.onrender.com/api/dashboard/user");
    },
    worker() {
      return API.get("https://ustaji-backend.onrender.com/api/dashboard/worker");
    },
    stats() {
      return API.get("https://ustaji-backend.onrender.com/api/dashboard/stats");
    },
  },

  // ========== Search ==========
  search(query) {
    return API.get(`https://ustaji-backend.onrender.com/api/search?q=${encodeURIComponent(query)}`);
  },
};
