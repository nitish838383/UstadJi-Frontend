/**
 * UstadJi - Dashboard Module
 */

const DashboardModule = {
  async loadUserDashboard() {
    if (!Auth.requireAuth("user")) return;

    try {
      const data = await API.dashboard.user();
      this.renderUserStats(data);
      this.renderUserActiveBookings(data.active_bookings || data.active || []);
      this.renderRecentActivity(data.recent_activity || data.activity || []);
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  renderUserStats(data) {
    const map = {
      "stat-active": data.active_count ?? data.stats?.active ?? 0,
      "stat-upcoming": data.upcoming_count ?? data.stats?.upcoming ?? 0,
      "stat-completed": data.completed_count ?? data.stats?.completed ?? 0,
      "stat-notifications": data.unread_notifications ?? data.stats?.notifications ?? 0,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    const welcome = document.getElementById("dashboard-welcome");
    if (welcome) {
      const user = Auth.getUser();
      welcome.textContent = `Welcome back, ${user?.full_name?.split(" ")[0] || user?.name || "User"}!`;
    }
  },

  renderUserActiveBookings(bookings) {
    const container = document.getElementById("dashboard-active-bookings");
    if (!container) return;

    if (!bookings.length) {
      container.innerHTML = Helper.emptyState("No active bookings", "fa-calendar-check");
      return;
    }

    container.innerHTML = bookings
      .slice(0, 3)
      .map(
        (b) => `
      <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
        <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
          <i class="fas fa-tools"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-800 dark:text-white truncate">${b.service_name || "Service"}</p>
          <p class="text-xs text-slate-500">${Helper.formatDate(b.booking_date)} · ${b.booking_time || ""}</p>
        </div>
        ${Helper.statusBadge(b.status)}
      </div>
    `
      )
      .join("");
  },

  renderRecentActivity(activities) {
    const container = document.getElementById("dashboard-activity");
    if (!container) return;

    if (!activities.length) {
      container.innerHTML = `<p class="text-sm text-slate-500 text-center py-4">No recent activity</p>`;
      return;
    }

    container.innerHTML = activities
      .slice(0, 5)
      .map(
        (a) => `
      <div class="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
          <i class="fas ${a.icon || "fa-bell"}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-700 dark:text-slate-300">${a.message || a.title}</p>
          <p class="text-xs text-slate-400 mt-0.5">${Helper.timeAgo(a.created_at || a.timestamp)}</p>
        </div>
      </div>
    `
      )
      .join("");
  },

  async loadWorkerDashboard() {
    if (!Auth.requireAuth("worker")) return;

    try {
      const data = await API.dashboard.worker();
      this.renderWorkerStats(data);
      this.loadWorkerBookings();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  renderWorkerStats(data) {
    const map = {
      "stat-requests": data.pending_requests ?? data.stats?.requests ?? 0,
      "stat-today": data.today_jobs ?? data.stats?.today ?? 0,
      "stat-completed": data.completed_jobs ?? data.stats?.completed ?? 0,
      "stat-earnings": Helper.formatCurrency(data.total_earnings ?? data.stats?.earnings ?? 0),
      "stat-rating": (data.rating ?? data.stats?.rating ?? 0).toFixed(1),
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    const welcome = document.getElementById("dashboard-welcome");
    if (welcome) {
      const user = Auth.getUser();
      welcome.textContent = `Hello, ${user?.full_name?.split(" ")[0] || "Professional"}!`;
    }

    // KYC status
    const kycEl = document.getElementById("kyc-status");
    if (kycEl && data.kyc_status) {
      kycEl.innerHTML = Helper.statusBadge(data.kyc_status);
    }
  },

  async loadWorkerBookings(status = null) {
    const container = document.getElementById("worker-bookings-list");
    if (!container) return;

    container.innerHTML = Helper.skeletonCard(3);

    try {
      const params = {};
      if (status) params.status = status;
      const data = await API.bookings.workerList(params);
      const bookings = data.results || data.items || data || [];

      if (!bookings.length) {
        container.innerHTML = Helper.emptyState("No booking requests", "fa-clipboard-list");
        return;
      }

      container.innerHTML = bookings.map((b) => this.renderWorkerBookingCard(b)).join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadWorkerBookings(status));
    }
  },

  renderWorkerBookingCard(b) {
    const status = b.status?.toLowerCase();
    let actions = "";

    if (status === "pending") {
      actions = `
        <button onclick="BookingModule.workerAccept('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Accept</button>
        <button onclick="BookingModule.workerReject('${b.id}')" class="px-3 py-1.5 text-xs font-medium border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50">Reject</button>
      `;
    } else if (status === "accepted" || status === "assigned") {
      actions = `<button onclick="BookingModule.workerStart('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">Start Job</button>`;
    } else if (status === "started" || status === "on_the_way") {
      actions = `<button onclick="BookingModule.workerComplete('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Complete</button>`;
    }

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <p class="font-semibold text-slate-800 dark:text-white">#${b.booking_id || b.id}</p>
            <p class="text-sm text-slate-500">${b.service_name || "Service"}</p>
          </div>
          ${Helper.statusBadge(b.status)}
        </div>
        <div class="text-sm space-y-1.5 text-slate-600 dark:text-slate-300 mb-4">
          <p><i class="fas fa-user text-primary-500 w-4"></i> ${b.user_name || b.customer_name || "Customer"}</p>
          <p><i class="fas fa-calendar text-primary-500 w-4"></i> ${Helper.formatDate(b.booking_date)} · ${b.booking_time || ""}</p>
          <p><i class="fas fa-map-marker-alt text-primary-500 w-4"></i> ${b.address || b.location || "Address"}</p>
          <p class="font-semibold text-primary-600"><i class="fas fa-rupee-sign w-4"></i> ${Helper.formatCurrency(b.final_amount || b.total || 0)}</p>
        </div>
        <div class="flex gap-2">${actions}</div>
      </div>
    `;
  },
};
