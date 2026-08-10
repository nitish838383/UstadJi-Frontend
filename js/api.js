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
    API_BASE_URL: "https://ustaji-backend.onrender.com"
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
      return API.post("/auth/register", data, { auth: false });
    },
    login(data) {
      return API.post("/auth/login", data, { auth: false });
    },
    workerRegister(data) {
      return API.post("/auth/worker/register", data, { auth: false });
    },
    workerLogin(data) {
      return API.post("/auth/worker/login", data, { auth: false });
    },
    logout() {
      return API.post("/auth/logout", {});
    },
    forgotPassword(data) {
      return API.post("/auth/forgot-password", data, { auth: false });
    },
    resetPassword(data) {
      return API.post("/auth/reset-password", data, { auth: false });
    },
    refresh(refreshToken) {
      return API.post("/auth/refresh", { refresh_token: refreshToken }, { auth: false });
    },
    me() {
      return API.get("/auth/me");
    },
  },

  // ========== Services ==========
  services: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/services${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`/services/${id}`);
    },
    categories() {
      return API.get("/services/categories");
    },
    search(query) {
      return API.get(`/services/search?q=${encodeURIComponent(query)}`);
    },
  },

  // ========== Workers ==========
  workers: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/workers${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`/workers/${id}`);
    },
    byService(serviceId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/workers/service/${serviceId}${qs ? "?" + qs : ""}`);
    },
    search(query) {
      return API.get(`/workers/search?q=${encodeURIComponent(query)}`);
    },
    reviews(workerId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/workers/${workerId}/reviews${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Bookings ==========
  bookings: {
    create(data) {
      return API.post("/bookings", data);
    },
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/bookings${qs ? "?" + qs : ""}`);
    },
    get(id) {
      return API.get(`/bookings/${id}`);
    },
    cancel(id, reason) {
      return API.post(`/bookings/${id}/cancel`, { reason });
    },
    reschedule(id, data) {
      return API.post(`/bookings/${id}/reschedule`, data);
    },
    invoice(id) {
      return API.get(`/bookings/${id}/invoice`);
    },
    // Worker actions
    accept(id) {
      return API.post(`/bookings/${id}/accept`);
    },
    reject(id, reason) {
      return API.post(`/bookings/${id}/reject`, { reason });
    },
    start(id) {
      return API.post(`/bookings/${id}/start`);
    },
    complete(id) {
      return API.post(`/bookings/${id}/complete`);
    },
    workerList(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/bookings/worker${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Profile ==========
  profile: {
    get() {
      return API.get("/profile");
    },
    update(data) {
      return API.put("/profile", data);
    },
    uploadAvatar(formData) {
      return API.upload("/profile/avatar", formData);
    },
    addresses() {
      return API.get("/profile/addresses");
    },
    addAddress(data) {
      return API.post("/profile/addresses", data);
    },
    updateAddress(id, data) {
      return API.put(`/profile/addresses/${id}`, data);
    },
    deleteAddress(id) {
      return API.delete(`/profile/addresses/${id}`);
    },
    // Worker specific
    workerProfile() {
      return API.get("/profile/worker");
    },
    updateWorkerProfile(data) {
      return API.put("/profile/worker", data);
    },
    uploadKYC(formData) {
      return API.upload("/profile/worker/kyc", formData);
    },
  },

  // ========== Reviews ==========
  reviews: {
    create(data) {
      return API.post("/reviews", data);
    },
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/reviews${qs ? "?" + qs : ""}`);
    },
  },

  // ========== Notifications ==========
  notifications: {
    list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/notifications${qs ? "?" + qs : ""}`);
    },
    markRead(id) {
      return API.patch(`/notifications/${id}/read`);
    },
    markAllRead() {
      return API.post("/notifications/read-all");
    },
    delete(id) {
      return API.delete(`/notifications/${id}`);
    },
    unreadCount() {
      return API.get("/notifications/unread-count");
    },
  },

  // ========== Coupons ==========
  coupons: {
    validate(code, bookingData) {
      return API.post("/coupons/validate", { code, ...bookingData });
    },
  },

  // ========== Wishlist ==========
  wishlist: {
    list() {
      return API.get("/wishlist");
    },
    add(workerId) {
      return API.post("/wishlist", { worker_id: workerId });
    },
    remove(workerId) {
      return API.delete(`/wishlist/${workerId}`);
    },
  },

  // ========== Payments ==========
  payments: {
    createOrder(data) {
      return API.post("/payments/create-order", data);
    },
    verify(data) {
      return API.post("/payments/verify", data);
    },
    methods() {
      return API.get("/payments/methods");
    },
  },

  // ========== Contact ==========
  contact: {
    submit(data) {
      return API.post("/contact", data, { auth: false });
    },
  },

  // ========== Dashboard ==========
  dashboard: {
    user() {
      return API.get("/dashboard/user");
    },
    worker() {
      return API.get("/dashboard/worker");
    },
    stats() {
      return API.get("/dashboard/stats");
    },
  },


  admin: {
    login(data) {
      return API.post("/admin/login", data, { auth: false });
    },
    dashboard() {
      return API.get("/admin/dashboard");
    },
    bookings(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/admin/bookings${qs ? "?" + qs : ""}`);
    },
    booking(id) {
      return API.get(`/admin/bookings/${id}`);
    },
    updateBookingStatus(id, data) {
      return API.patch(`/admin/bookings/${id}/status`, data);
    },
    customers(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/admin/customers${qs ? "?" + qs : ""}`);
    },
    workers(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get(`/admin/workers${qs ? "?" + qs : ""}`);
    },
    updateUser(id, data) {
      return API.patch(`/admin/users/${id}`, data);
    },
  },

  // ========== Search ==========
  search(query) {
    return API.get(`/search?q=${encodeURIComponent(query)}`);
  },
};
