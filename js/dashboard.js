/**
 * UstadJi - Dashboard Module (Phase 1: live track + notif stats)
 */

const DashboardModule = {
  _pollTimer: null,
  POLL_MS: 30000,

  async loadUserDashboard() {
    if (!Auth.requireAuth("user")) return;

    try {
      const data = await API.dashboard.user();
      this.renderUserStats(data);
      this.renderLiveTrack(data.live_bookings || data.active_bookings || [], "user");
      this.renderUserActiveBookings(data.active_bookings || data.live_bookings || []);
      this.renderRecentActivity(data.recent_activity || data.activity || []);
      this.renderNotifStats(data.notification_stats || data.stats);
      this.startPolling("user");
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
      "stat-notif-sent": data.notification_stats?.sent ?? data.stats?.notif_sent ?? 0,
      "stat-notif-seen": data.notification_stats?.seen ?? data.stats?.notif_seen ?? 0,
      "stat-notif-unseen": data.notification_stats?.unseen ?? data.stats?.notif_unseen ?? 0,
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

  renderNotifStats(stats) {
    if (!stats) return;
    const box = document.getElementById("notif-stats-box");
    if (!box) return;
    const sent = stats.sent ?? stats.notif_sent ?? 0;
    const seen = stats.seen ?? stats.notif_seen ?? 0;
    const unseen = stats.unseen ?? stats.notif_unseen ?? stats.unread ?? 0;
    box.innerHTML = `
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <p class="text-lg font-bold text-slate-800 dark:text-white">${sent}</p>
          <p class="text-[11px] text-slate-500">Sent</p>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
          <p class="text-lg font-bold text-emerald-600">${seen}</p>
          <p class="text-[11px] text-slate-500">Seen</p>
        </div>
        <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
          <p class="text-lg font-bold text-amber-600">${unseen}</p>
          <p class="text-[11px] text-slate-500">Unseen</p>
        </div>
      </div>
    `;
  },

  /** Live booking track with progress steps */
  renderLiveTrack(bookings, role = "user") {
    const container = document.getElementById("live-track-list");
    if (!container) return;

    if (!bookings.length) {
      container.innerHTML = Helper.emptyState("No live bookings right now", "fa-route");
      return;
    }

    container.innerHTML = bookings
      .map((b) => {
        const tracker =
          typeof BookingModule !== "undefined" && BookingModule.renderProgressTracker
            ? BookingModule.renderProgressTracker(b.status)
            : Helper.statusBadge(b.status);
        const who =
          role === "worker"
            ? b.user_name || b.customer_name || "Customer"
            : b.worker_name || "Professional";
        return `
        <div class="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 mb-4 last:mb-0 bg-slate-50/50 dark:bg-slate-900/30">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p class="font-semibold text-slate-800 dark:text-white">#${b.booking_id || b.id} · ${b.service_name || "Service"}</p>
              <p class="text-xs text-slate-500 mt-0.5">
                <i class="fas fa-user text-primary-500"></i> ${who}
                &nbsp;·&nbsp;
                <i class="fas fa-calendar text-primary-500"></i> ${Helper.formatDate(b.booking_date)} ${b.booking_time || ""}
              </p>
            </div>
            ${Helper.statusBadge(b.status)}
          </div>
          <div class="overflow-x-auto">${tracker}</div>
          <div class="flex flex-wrap gap-2 mt-3">
            <a href="/booking-history.html?id=${b.id}" class="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-800">Details</a>
            ${
              role === "worker" && b.status === "pending"
                ? `<button onclick="BookingModule.workerAccept('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg">Accept</button>
                   <button onclick="BookingModule.workerReject('${b.id}')" class="px-3 py-1.5 text-xs font-medium border border-rose-200 text-rose-600 rounded-lg">Reject</button>`
                : ""
            }
            ${
              role === "worker" && ["accepted", "assigned"].includes(b.status)
                ? `<button onclick="BookingModule.workerStart('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg">Start Job</button>`
                : ""
            }
            ${
              role === "worker" && ["started", "on_the_way"].includes(b.status)
                ? `<button onclick="BookingModule.workerComplete('${b.id}')" class="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg">Complete</button>`
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");
  },

  renderUserActiveBookings(bookings) {
    const container = document.getElementById("dashboard-active-bookings");
    if (!container) return;

    if (!bookings.length) {
      container.innerHTML = Helper.emptyState("No active bookings", "fa-calendar-check");
      return;
    }

    container.innerHTML = bookings
      .slice(0, 5)
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
      .slice(0, 8)
      .map(
        (a) => `
      <div class="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <div class="w-8 h-8 rounded-full ${a.is_read === false ? "bg-primary-100 text-primary-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"} flex items-center justify-center text-xs flex-shrink-0">
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
      this.renderLiveTrack(data.live_jobs || [], "worker");
      this.renderNotifStats(data.notification_stats || data.stats);
      this.loadWorkerBookings();
      this.startPolling("worker");
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  renderWorkerStats(data) {
    const map = {
      "stat-requests": data.pending_requests ?? data.stats?.requests ?? 0,
      "stat-today": data.today_jobs ?? data.stats?.today ?? 0,
      "stat-in-progress": data.in_progress ?? data.stats?.in_progress ?? 0,
      "stat-completed": data.completed_jobs ?? data.stats?.completed ?? 0,
      "stat-earnings": Helper.formatCurrency(data.total_earnings ?? data.stats?.earnings ?? 0),
      "stat-rating": (data.rating ?? data.stats?.rating ?? 0).toFixed
        ? (data.rating ?? data.stats?.rating ?? 0).toFixed(1)
        : data.rating ?? 0,
      "stat-notif-sent": data.notification_stats?.sent ?? data.stats?.notif_sent ?? 0,
      "stat-notif-seen": data.notification_stats?.seen ?? data.stats?.notif_seen ?? 0,
      "stat-notif-unseen": data.notification_stats?.unseen ?? data.stats?.notif_unseen ?? 0,
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

    const kycEl = document.getElementById("kyc-status");
    if (kycEl && data.kyc_status) {
      kycEl.innerHTML = Helper.statusBadge(data.kyc_status);
    }

    const avail = document.getElementById("worker-availability");
    if (avail) {
      avail.textContent = data.is_available !== false ? "Available" : "Busy";
      avail.className =
        data.is_available !== false
          ? "text-xs font-semibold text-emerald-600"
          : "text-xs font-semibold text-slate-500";
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

  /** Platform overview (customer count, active workers, notif global) */
  async loadPlatformStats() {
    const el = document.getElementById("platform-stats");
    if (!el) return;
    try {
      const data = await API.dashboard.stats();
      el.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-center">
            <p class="text-2xl font-bold text-sky-600">${data.customer_count ?? 0}</p>
            <p class="text-xs text-slate-500 mt-1">Customers</p>
          </div>
          <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
            <p class="text-2xl font-bold text-emerald-600">${data.active_workers ?? 0}</p>
            <p class="text-xs text-slate-500 mt-1">Active Workers</p>
          </div>
          <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
            <p class="text-2xl font-bold text-amber-600">${data.busy_workers ?? 0}</p>
            <p class="text-xs text-slate-500 mt-1">Busy Workers</p>
          </div>
          <div class="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-center">
            <p class="text-2xl font-bold text-violet-600">${data.live_bookings ?? 0}</p>
            <p class="text-xs text-slate-500 mt-1">Live Bookings</p>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"><span class="font-bold">${data.notifications?.sent ?? 0}</span> Sent</div>
          <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"><span class="font-bold text-emerald-600">${data.notifications?.seen ?? 0}</span> Seen</div>
          <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"><span class="font-bold text-amber-600">${data.notifications?.unseen ?? 0}</span> Unseen</div>
        </div>
      `;
    } catch {
      el.innerHTML = `<p class="text-sm text-slate-500">Stats unavailable</p>`;
    }
  },

  startPolling(role) {
    this.stopPolling();
    this._pollTimer = setInterval(() => {
      if (role === "user") this.loadUserDashboardQuiet();
      else this.loadWorkerDashboardQuiet();
    }, this.POLL_MS);
  },

  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  async loadUserDashboardQuiet() {
    try {
      const data = await API.dashboard.user();
      this.renderUserStats(data);
      this.renderLiveTrack(data.live_bookings || data.active_bookings || [], "user");
      this.renderNotifStats(data.notification_stats || data.stats);
    } catch {
      /* silent poll */
    }
  },

  async loadWorkerDashboardQuiet() {
    try {
      const data = await API.dashboard.worker();
      this.renderWorkerStats(data);
      this.renderLiveTrack(data.live_jobs || [], "worker");
      this.renderNotifStats(data.notification_stats || data.stats);
    } catch {
      /* silent */
    }
  },
};

window.addEventListener("beforeunload", () => DashboardModule.stopPolling());
