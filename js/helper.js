/**
 * UstadJi - Utility Helpers
 */

const Helper = {
  /**
   * Format currency in Indian Rupees
   */
  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat(CONFIG.DEFAULT_LOCALE, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format date to readable string
   */
  formatDate(dateStr, options = {}) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const defaults = {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    };
    return date.toLocaleDateString(CONFIG.DEFAULT_LOCALE, defaults);
  },

  /**
   * Format date + time
   */
  formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString(CONFIG.DEFAULT_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Relative time (e.g. "2 hours ago")
   */
  timeAgo(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  },

  /**
   * Truncate text
   */
  truncate(str, len = 100) {
    if (!str) return "";
    return str.length > len ? str.substring(0, len) + "…" : str;
  },

  /**
   * Generate star rating HTML
   */
  renderStars(rating, max = 5) {
    const full = Math.floor(rating || 0);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = max - full - half;
    let html = "";
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star text-amber-400"></i>';
    if (half) html += '<i class="fas fa-star-half-alt text-amber-400"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="far fa-star text-gray-300"></i>';
    return html;
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Get query param
   */
  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /**
   * Set query param without reload
   */
  setQueryParam(name, value) {
    const url = new URL(window.location);
    if (value == null || value === "") url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState({}, "", url);
  },

  /**
   * Show toast notification
   */
  toast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container") || this._createToastContainer();
    const colors = {
      success: "bg-emerald-600",
      error: "bg-rose-600",
      warning: "bg-amber-500",
      info: "bg-sky-600",
    };
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };
    const toast = document.createElement("div");
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg ${colors[type] || colors.info} animate-slide-in pointer-events-auto`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info} text-lg"></i>
      <span class="flex-1 text-sm font-medium">${message}</span>
      <button class="opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-x-4");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  _createToastContainer() {
    const el = document.createElement("div");
    el.id = "toast-container";
    el.className = "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none";
    document.body.appendChild(el);
    return el;
  },

  /**
   * Show loading skeleton / spinner overlay
   */
  showLoader(target = "body") {
    const parent = target === "body" ? document.body : document.querySelector(target);
    if (!parent) return;
    let loader = document.getElementById("global-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "global-loader";
      loader.className = "fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center";
      loader.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Loading…</p>
        </div>
      `;
      document.body.appendChild(loader);
    }
    loader.classList.remove("hidden");
  },

  hideLoader() {
    const loader = document.getElementById("global-loader");
    if (loader) loader.classList.add("hidden");
  },

  /**
   * Empty state component
   */
  emptyState(message = "No data found", icon = "fa-inbox") {
    return `
      <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i class="fas ${icon} text-3xl text-slate-400"></i>
        </div>
        <p class="text-slate-500 dark:text-slate-400 font-medium">${message}</p>
      </div>
    `;
  },

  /**
   * Error state
   */
  errorState(message = "Something went wrong", retryFn = null) {
    const retryBtn = retryFn
      ? `<button onclick="(${retryFn})()" class="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition">Try Again</button>`
      : "";
    return `
      <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4">
          <i class="fas fa-exclamation-triangle text-3xl text-rose-500"></i>
        </div>
        <p class="text-slate-600 dark:text-slate-300 font-medium mb-1">Oops!</p>
        <p class="text-slate-500 dark:text-slate-400 text-sm">${message}</p>
        ${retryBtn}
      </div>
    `;
  },

  /**
   * Skeleton loader for cards
   */
  skeletonCard(count = 4) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm animate-pulse">
          <div class="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
          <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
        </div>
      `;
    }
    return html;
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast("Copied to clipboard", "success");
    } catch {
      this.toast("Failed to copy", "error");
    }
  },

  /**
   * Scroll to top smoothly
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Init scroll animations
   */
  initScrollAnimations() {
    const elements = document.querySelectorAll("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
  },

  /**
   * Toggle dark mode
   */
  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem(CONFIG.THEME_KEY, isDark ? "dark" : "light");
    return isDark;
  },

  /**
   * Apply saved theme
   */
  applyTheme() {
    const saved = localStorage.getItem(CONFIG.THEME_KEY);
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  /**
   * Safe JSON parse
   */
  safeParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  },

  /**
   * Get initials from name
   */
  getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  },

  /**
   * Status badge HTML
   */
  statusBadge(status) {
    const map = {
      pending: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", label: "Pending" },
      accepted: { bg: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300", label: "Accepted" },
      assigned: { bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300", label: "Assigned" },
      on_the_way: { bg: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300", label: "On The Way" },
      started: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", label: "Started" },
      completed: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Completed" },
      cancelled: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300", label: "Cancelled" },
      paid: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Paid" },
      failed: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300", label: "Failed" },
      refunded: { bg: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300", label: "Refunded" },
    };
    const s = map[status?.toLowerCase()] || { bg: "bg-slate-100 text-slate-700", label: status || "Unknown" };
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg}">${s.label}</span>`;
  },
};

// Apply theme on load
document.addEventListener("DOMContentLoaded", () => Helper.applyTheme());
