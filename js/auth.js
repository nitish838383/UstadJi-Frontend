/**
 * UstadJi - Authentication Module
 */

const Auth = {
  /**
   * Get access token from storage
   */
  getAccessToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY) || sessionStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY) || sessionStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
  },

  /**
   * Store tokens
   * @param {boolean} remember - use localStorage if true, else sessionStorage
   */
  setTokens(access, refresh, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(CONFIG.TOKEN_KEY, access);
    if (refresh) storage.setItem(CONFIG.REFRESH_TOKEN_KEY, refresh);
    // Clear the other storage to avoid conflicts
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(CONFIG.TOKEN_KEY);
    other.removeItem(CONFIG.REFRESH_TOKEN_KEY);
  },

  /**
   * Store user / worker data
   */
  setUser(user, role = "user") {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    localStorage.setItem(CONFIG.ROLE_KEY, role);
  },

  getUser() {
    return Helper.safeParse(localStorage.getItem(CONFIG.USER_KEY));
  },

  getRole() {
    return localStorage.getItem(CONFIG.ROLE_KEY) || "user";
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },

  isWorker() {
    return this.getRole() === "worker";
  },

  isUser() {
    return this.getRole() === "user";
  },

  /**
   * Login (user)
   */
  async login(email, password, remember = true) {
    const data = await API.auth.login({ email, password });
    this.setTokens(data.access_token, data.refresh_token, remember);
    this.setUser(data.user, "user");
    return data;
  },

  /**
   * Register (user)
   */
  async register(payload) {
    const data = await API.auth.register(payload);
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token, true);
      this.setUser(data.user, "user");
    }
    return data;
  },

  /**
   * Worker login
   */
  async workerLogin(email, password, remember = true) {
    const data = await API.auth.workerLogin({ email, password });
    this.setTokens(data.access_token, data.refresh_token, remember);
    this.setUser(data.worker || data.user, "worker");
    return data;
  },

  /**
   * Worker register
   */
  async workerRegister(payload) {
    const data = await API.auth.workerRegister(payload);
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token, true);
      this.setUser(data.worker || data.user, "worker");
    }
    return data;
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;
    try {
      const data = await API.auth.refresh(refresh);
      this.setTokens(data.access_token, data.refresh_token || refresh);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Logout
   */
  async logout(redirect = true) {
    try {
      if (this.getAccessToken()) await API.auth.logout();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    localStorage.removeItem(CONFIG.ROLE_KEY);
    sessionStorage.removeItem(CONFIG.TOKEN_KEY);
    sessionStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);

    if (redirect) {
      window.location.href = "/login.html";
    }
  },

  /**
   * Require authentication - redirect if not logged in
   */
  requireAuth(role = null) {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = "/login.html?return=" + returnUrl;
      return false;
    }
    if (role && this.getRole() !== role) {
      window.location.href = role === "worker" ? "/dashboard-worker.html" : "/dashboard-user.html";
      return false;
    }
    return true;
  },

  /**
   * Go to booking only if logged in as user; else redirect to login
   */
  requireBooking(queryString) {
    if (!this.isAuthenticated()) {
      Helper.toast("Please login to book a service", "warning");
      const ret = encodeURIComponent("/booking.html" + (queryString || ""));
      window.location.href = "/login.html?return=" + ret;
      return false;
    }
    if (this.isWorker()) {
      Helper.toast("Please login with a customer account to book", "warning");
      return false;
    }
    window.location.href = "/booking.html" + (queryString || "");
    return true;
  },

  /**
   * Redirect if already logged in
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = this.isWorker() ? "/dashboard-worker.html" : "/dashboard-user.html";
    }
  },

  /**
   * Decode JWT payload (without verification - client side only)
   */
  decodeToken(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    const token = this.getAccessToken();
    if (!token) return true;
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  },

  /**
   * Auto logout check
   */
  startTokenWatcher() {
    setInterval(() => {
      if (this.isAuthenticated() && this.isTokenExpired()) {
        this.refreshToken().then((ok) => {
          if (!ok) {
            Helper.toast("Session expired. Please login again.", "warning");
            this.logout(true);
          }
        });
      }
    }, 60000); // check every minute
  },

  /**
   * Update header UI based on auth state
   * Note: Tailwind "sm:flex" overrides "hidden" at sm+ breakpoints — must remove sm:flex when logged in
   */
  updateHeaderUI() {
    const user = this.getUser();
    const isAuth = this.isAuthenticated();
    const isWorker = this.isWorker();

    // Guest: Login / Sign Up — hide completely when logged in
    document.querySelectorAll("[data-auth='guest']").forEach((el) => {
      if (isAuth) {
        el.classList.add("hidden");
        el.classList.remove("flex", "sm:flex");
        el.style.display = "none";
      } else {
        el.classList.remove("hidden");
        el.style.display = "";
        // desktop guest bar uses flex; mobile nav guest stays block
        if (el.id === "guest-auth-actions") {
          el.classList.add("flex");
        }
      }
    });

    // User menu (customer only)
    document.querySelectorAll("[data-auth='user']").forEach((el) => {
      const show = isAuth && !isWorker;
      if (show) {
        el.classList.remove("hidden");
        el.style.display = "";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    // Worker menu
    document.querySelectorAll("[data-auth='worker']").forEach((el) => {
      const show = isAuth && isWorker;
      if (show) {
        el.classList.remove("hidden");
        el.style.display = "";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    // Notifications — both user and worker
    document.querySelectorAll("[data-auth-also='worker']").forEach((el) => {
      if (isAuth) {
        el.classList.remove("hidden");
        el.style.display = "";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    document.querySelectorAll("[data-user-name]").forEach((el) => {
      if (user) el.textContent = user.full_name || user.name || user.email || "User";
    });

    document.querySelectorAll("[data-user-avatar]").forEach((el) => {
      if (user?.avatar_url) {
        el.src = user.avatar_url;
        el.classList.remove("hidden");
        const initials = el.parentElement?.querySelector(".avatar-initials");
        if (initials) initials.remove();
      } else if (user) {
        el.classList.add("hidden");
        const parent = el.parentElement;
        if (parent && !parent.querySelector(".avatar-initials")) {
          const span = document.createElement("span");
          span.className =
            "avatar-initials w-full h-full flex items-center justify-center bg-primary-600 text-white font-semibold rounded-full text-sm";
          span.textContent = Helper.getInitials(user.full_name || user.name || "U");
          parent.appendChild(span);
        }
      }
    });
  },
};

// Always sync header on every page load
document.addEventListener("DOMContentLoaded", () => {
  Auth.updateHeaderUI();
  if (Auth.isAuthenticated()) {
    Auth.startTokenWatcher();
  }
});
