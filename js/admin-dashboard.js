/**
 * UstadJi — Admin Control Panel
 * Only role=admin can use these APIs/UI.
 */

const AdminDashboard = {
  async init() {
    await this.loadOverview();
    await this.loadBookings();
    this.bindTabs();
  },

  bindTabs() {
    document.querySelectorAll(".admin-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        document.querySelectorAll(".admin-tab").forEach((b) => {
          b.classList.remove("bg-amber-500", "text-slate-900");
          b.classList.add("bg-white", "dark:bg-slate-800", "border", "border-slate-200", "dark:border-slate-700");
        });
        btn.classList.add("bg-amber-500", "text-slate-900");
        btn.classList.remove("bg-white", "dark:bg-slate-800", "border");
        document.querySelectorAll(".admin-panel").forEach((p) => p.classList.add("hidden"));
        document.getElementById("panel-" + tab)?.classList.remove("hidden");
        if (tab === "customers") this.loadCustomers();
        if (tab === "workers") this.loadWorkers();
        if (tab === "bookings") this.loadBookings();
      });
    });
  },

  async loadOverview() {
    try {
      const d = await API.admin.dashboard();
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v ?? 0;
      };
      set("adm-customers", d.customer_count);
      set("adm-workers", d.worker_count);
      set("adm-active-workers", d.active_workers);
      set("adm-live", d.live_bookings);
      set("adm-pending", d.pending_bookings);
      set("adm-notif-sent", d.notifications?.sent);
      set("adm-notif-seen", d.notifications?.seen);
      set("adm-notif-unseen", d.notifications?.unseen);
    } catch (err) {
      Helper.toast(err.message, "error");
      if (err.status === 403) location.href = "/admin-login.html";
    }
  },

  async loadBookings() {
    const container = document.getElementById("admin-bookings-list");
    if (!container) return;
    container.innerHTML = Helper.skeletonCard(4);
    const status = document.getElementById("booking-status-filter")?.value || "";
    const q = document.getElementById("booking-search")?.value?.trim() || "";
    try {
      const params = {};
      if (status) params.status = status;
      if (q) params.q = q;
      const data = await API.admin.bookings(params);
      const list = data.results || [];
      if (!list.length) {
        container.innerHTML = Helper.emptyState("No bookings found", "fa-calendar");
        return;
      }
      container.innerHTML = list
        .map(
          (b) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div class="min-w-0 flex-1">
              <p class="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">#${b.booking_id || b.id}</p>
              <p class="text-xs sm:text-sm text-slate-500 truncate">${b.service_name || "Service"}</p>
            </div>
            <div class="flex-shrink-0">${Helper.statusBadge(b.status)}</div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3">
            <p class="truncate"><i class="fas fa-user text-sky-500 w-4"></i> <strong>${b.user_name || "—"}</strong> <span class="text-slate-400">#${b.user_id || "—"}</span></p>
            <p class="truncate"><i class="fas fa-user-hard-hat text-emerald-500 w-4"></i> <strong>${b.worker_name || "Unassigned"}</strong>${b.worker_id ? ` <span class="text-slate-400">#${b.worker_id}</span>` : ""}</p>
            <p><i class="fas fa-calendar text-primary-500 w-4"></i> ${Helper.formatDate(b.booking_date)} · ${b.booking_time || "—"}</p>
            <p><i class="fas fa-rupee-sign text-primary-500 w-4"></i> ${Helper.formatCurrency(b.final_amount || 0)} · ${b.payment_status || "—"}</p>
            <p class="sm:col-span-2 break-words"><i class="fas fa-map-marker-alt text-rose-500 w-4"></i> ${b.address || "—"}</p>
            ${b.notes ? `<p class="sm:col-span-2 text-[11px] sm:text-xs text-slate-400 line-clamp-2">Notes: ${b.notes}</p>` : ""}
          </div>
          <div class="flex flex-col sm:flex-row gap-2">
            <button type="button" onclick="AdminDashboard.openStatusModal(${b.id}, '${(b.booking_id || "").replace(/'/g, "")}', '${b.status || "pending"}', ${b.worker_id || "null"})"
                    class="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 text-xs font-medium bg-amber-500 text-slate-900 rounded-lg touch-manipulation">Control Status</button>
            <button type="button" onclick="AdminDashboard.viewDetail(${b.id})" class="w-full sm:w-auto px-3 py-2.5 sm:py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg touch-manipulation">Full Detail</button>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadBookings());
    }
  },

  async viewDetail(id) {
    try {
      Helper.showLoader();
      const b = await API.admin.booking(id);
      Helper.hideLoader();
      const cust = b.customer ? `${b.customer.full_name} | ${b.customer.email} | ${b.customer.phone || ""}` : "—";
      const work = b.worker ? `${b.worker.full_name} | ${b.worker.email} | ${b.worker.phone || ""}` : "Unassigned";
      alert(
        `Booking #${b.booking_id}\n\nService: ${b.service_name}\nStatus: ${b.status}\n\nCustomer: ${cust}\nWorker: ${work}\n\nWhen: ${b.booking_date} ${b.booking_time || ""}\nAddress: ${b.address || "—"}\nAmount: ${b.final_amount}\nPayment: ${b.payment_method} / ${b.payment_status}\n\nNotes: ${b.notes || "—"}`
      );
    } catch (err) {
      Helper.hideLoader();
      Helper.toast(err.message, "error");
    }
  },

  openStatusModal(id, bookingId, status, workerId) {
    document.getElementById("modal-booking-id").value = id;
    document.getElementById("modal-booking-label").textContent = `#${bookingId || id}`;
    document.getElementById("modal-status").value = status || "pending";
    document.getElementById("modal-worker-id").value = workerId && workerId !== "null" ? workerId : "";
    document.getElementById("modal-notes").value = "";
    document.getElementById("admin-status-modal").classList.remove("hidden");
  },

  closeModal() {
    document.getElementById("admin-status-modal")?.classList.add("hidden");
  },

  async saveStatus() {
    const id = document.getElementById("modal-booking-id").value;
    const status = document.getElementById("modal-status").value;
    const workerRaw = document.getElementById("modal-worker-id").value;
    const notes = document.getElementById("modal-notes").value;
    const body = { status };
    if (workerRaw) body.worker_id = parseInt(workerRaw, 10);
    if (notes) body.notes = notes;
    try {
      Helper.showLoader();
      await API.admin.updateBookingStatus(id, body);
      Helper.toast("Booking updated", "success");
      this.closeModal();
      await this.loadBookings();
      await this.loadOverview();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async loadCustomers() {
    const container = document.getElementById("admin-customers-list");
    if (!container) return;
    container.innerHTML = Helper.skeletonCard(3);
    try {
      const data = await API.admin.customers();
      const list = data.results || [];
      if (!list.length) {
        container.innerHTML = Helper.emptyState("No customers", "fa-users");
        return;
      }
      container.innerHTML = list
        .map(
          (u) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:flex-wrap justify-between gap-3 sm:items-center">
          <div class="min-w-0">
            <p class="font-semibold text-sm sm:text-base truncate">${u.full_name}</p>
            <p class="text-[11px] sm:text-xs text-slate-500 break-all">${u.email}</p>
            <p class="text-[11px] sm:text-xs text-slate-500">${u.phone || "—"} · Bookings: ${u.bookings_count ?? 0}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            ${u.is_active ? '<span class="text-xs text-emerald-600 font-medium">Active</span>' : '<span class="text-xs text-rose-600 font-medium">Disabled</span>'}
            <button type="button" onclick="AdminDashboard.toggleUser(${u.id}, ${!u.is_active})" class="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 touch-manipulation">
              ${u.is_active ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message);
    }
  },

  async loadWorkers() {
    const container = document.getElementById("admin-workers-list");
    if (!container) return;
    container.innerHTML = Helper.skeletonCard(3);
    try {
      const data = await API.admin.workers();
      const list = data.results || [];
      if (!list.length) {
        container.innerHTML = Helper.emptyState("No workers", "fa-user-hard-hat");
        return;
      }
      container.innerHTML = list
        .map(
          (u) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700">
          <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm sm:text-base truncate">${u.full_name} <span class="text-xs text-slate-400 font-normal">${u.worker_id || ""}</span></p>
              <p class="text-[11px] sm:text-xs text-slate-500 break-all">${u.email}</p>
              <p class="text-[11px] sm:text-xs text-slate-500">${u.phone || "—"} · ★ ${u.rating || 0}</p>
            </div>
            <div class="flex-shrink-0">${Helper.statusBadge(u.kyc_status || "pending")}</div>
          </div>
          <p class="text-[11px] sm:text-xs text-slate-500 mb-3">₹ ${Helper.formatCurrency(u.total_earnings || 0)} · Jobs ${u.jobs_completed || 0} · ${u.is_available ? "Available" : "Busy"}</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" onclick="AdminDashboard.toggleUser(${u.id}, ${!u.is_active})" class="w-full px-3 py-2.5 sm:py-1.5 text-xs rounded-lg border touch-manipulation">${u.is_active ? "Disable" : "Enable"}</button>
            <button type="button" onclick="AdminDashboard.setKyc(${u.id}, 'approved')" class="w-full px-3 py-2.5 sm:py-1.5 text-xs rounded-lg bg-emerald-600 text-white touch-manipulation">KYC Approve</button>
            <button type="button" onclick="AdminDashboard.setKyc(${u.id}, 'rejected')" class="w-full px-3 py-2.5 sm:py-1.5 text-xs rounded-lg border border-rose-200 text-rose-600 touch-manipulation">KYC Reject</button>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message);
    }
  },

  async toggleUser(id, isActive) {
    try {
      await API.admin.updateUser(id, { is_active: isActive });
      Helper.toast(isActive ? "User enabled" : "User disabled", "success");
      this.loadCustomers();
      this.loadWorkers();
      this.loadOverview();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async setKyc(id, kyc_status) {
    try {
      await API.admin.updateUser(id, { kyc_status });
      Helper.toast("KYC updated", "success");
      this.loadWorkers();
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },
};
