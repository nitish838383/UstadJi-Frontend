/**
 * UstadJi Admin Panel — real API integration (/api/admin/*)
 * Uses CONFIG.API_BASE_URL from config.js
 */
const AdminAPI = {
  base() {
    const b = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "https://ustaji-backend.onrender.com/api";
    return b.replace(/\/$/, "");
  },
  token() {
    return localStorage.getItem(CONFIG?.TOKEN_KEY || "ustadji_access_token") || sessionStorage.getItem(CONFIG?.TOKEN_KEY || "ustadji_access_token");
  },
  async request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (auth) {
      const t = this.token();
      if (!t) {
        location.href = "/admin-login.html";
        throw new Error("Not authenticated");
      }
      headers.Authorization = `Bearer ${t}`;
    }
    AdminUI.setLoading(true);
    try {
      const res = await fetch(this.base() + path, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });
      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { detail: text };
      }
      if (res.status === 401) {
        localStorage.removeItem(CONFIG?.TOKEN_KEY || "ustadji_access_token");
        location.href = "/admin-login.html";
        throw new Error("Session expired");
      }
      if (!res.ok) {
        const msg = data?.detail || data?.message || res.statusText;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      return data;
    } finally {
      AdminUI.setLoading(false);
    }
  },
  login: (email, password) => AdminAPI.request("/admin/login", { method: "POST", body: { email, password }, auth: false }),
  dashboard: () => AdminAPI.request("/admin/dashboard"),
  customers: (p = {}) => AdminAPI.request("/admin/customers?" + new URLSearchParams(p)),
  customer: (id) => AdminAPI.request(`/admin/customers/${id}`),
  workers: (p = {}) => AdminAPI.request("/admin/workers?" + new URLSearchParams(p)),
  updateUser: (id, body) => AdminAPI.request(`/admin/users/${id}`, { method: "PATCH", body }),
  bookings: (p = {}) => AdminAPI.request("/admin/bookings?" + new URLSearchParams(p)),
  booking: (id) => AdminAPI.request(`/admin/bookings/${id}`),
  bookingStatus: (id, body) => AdminAPI.request(`/admin/bookings/${id}/status`, { method: "PATCH", body }),
  services: (p = {}) => AdminAPI.request("/admin/services?" + new URLSearchParams(p)),
  createService: (body) => AdminAPI.request("/admin/services", { method: "POST", body }),
  updateService: (id, body) => AdminAPI.request(`/admin/services/${id}`, { method: "PUT", body }),
  toggleService: (id) => AdminAPI.request(`/admin/services/${id}/toggle`, { method: "PATCH" }),
  deleteService: (id) => AdminAPI.request(`/admin/services/${id}`, { method: "DELETE" }),
  categories: () => AdminAPI.request("/admin/categories"),
  coupons: () => AdminAPI.request("/admin/coupons"),
  createCoupon: (body) => AdminAPI.request("/admin/coupons", { method: "POST", body }),
  updateCoupon: (id, body) => AdminAPI.request(`/admin/coupons/${id}`, { method: "PUT", body }),
  toggleCoupon: (id) => AdminAPI.request(`/admin/coupons/${id}/toggle`, { method: "PATCH" }),
  deleteCoupon: (id) => AdminAPI.request(`/admin/coupons/${id}`, { method: "DELETE" }),
  payments: (p = {}) => AdminAPI.request("/admin/payments?" + new URLSearchParams(p)),
  reviews: (p = {}) => AdminAPI.request("/admin/reviews?" + new URLSearchParams(p)),
  deleteReview: (id) => AdminAPI.request(`/admin/reviews/${id}`, { method: "DELETE" }),
  contacts: (p = {}) => AdminAPI.request("/admin/contacts?" + new URLSearchParams(p)),
  deleteContact: (id) => AdminAPI.request(`/admin/contacts/${id}`, { method: "DELETE" }),
  notifications: (p = {}) => AdminAPI.request("/admin/notifications?" + new URLSearchParams(p)),
  wishlists: (p = {}) => AdminAPI.request("/admin/wishlists?" + new URLSearchParams(p)),
  search: (q) => AdminAPI.request("/admin/search?q=" + encodeURIComponent(q)),
  me: () => AdminAPI.request("/admin/me"),
};

const AdminUI = {
  charts: {},
  setLoading(on) {
    const el = document.getElementById("loader-bar");
    if (!el) return;
    el.style.width = on ? "70%" : "100%";
    if (!on) setTimeout(() => (el.style.width = "0"), 300);
  },
  toast(msg, type = "info") {
    const wrap = document.getElementById("toast-wrap");
    if (!wrap) return alert(msg);
    const t = document.createElement("div");
    t.className = "toast " + (type === "error" ? "error" : type === "success" ? "success" : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
  badge(status) {
    const s = (status || "—").toString().toLowerCase();
    return `<span class="badge badge-${s.replace(/\s/g, "_")}">${s}</span>`;
  },
  money(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN");
  },
  date(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return d;
    }
  },
  stars(r) {
    const n = Math.round(Number(r) || 0);
    return `<span class="stars">${"★".repeat(n)}${"☆".repeat(Math.max(0, 5 - n))}</span>`;
  },
};

const AdminApp = {
  page: 1,

  init() {
    if (!AdminAPI.token()) {
      location.href = "/admin-login.html";
      return;
    }
    // role check
    try {
      const role = localStorage.getItem(CONFIG?.ROLE_KEY || "ustadji_role");
      if (role && role !== "admin") {
        location.href = "/admin-login.html";
        return;
      }
    } catch {}

    document.querySelectorAll(".admin-nav button[data-section]").forEach((btn) => {
      btn.addEventListener("click", () => this.go(btn.dataset.section));
    });
    document.getElementById("btn-menu")?.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
      document.getElementById("overlay").classList.toggle("show");
    });
    document.getElementById("overlay")?.addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("overlay").classList.remove("show");
    });
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      localStorage.removeItem(CONFIG?.TOKEN_KEY || "ustadji_access_token");
      localStorage.removeItem(CONFIG?.USER_KEY || "ustadji_user");
      localStorage.removeItem(CONFIG?.ROLE_KEY || "ustadji_role");
      location.href = "/admin-login.html";
    });
    document.getElementById("btn-refresh")?.addEventListener("click", () => this.loadHome());

    this.go("home");
    this.loadProfileName();
  },

  async loadProfileName() {
    try {
      const me = await AdminAPI.me();
      const el = document.getElementById("admin-name");
      if (el) el.textContent = me.full_name || me.email || "Admin";
    } catch {}
  },

  go(section) {
    document.querySelectorAll(".admin-nav button").forEach((b) => b.classList.toggle("active", b.dataset.section === section));
    document.querySelectorAll(".section").forEach((s) => s.classList.toggle("active", s.id === "sec-" + section));
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");
    const title = document.getElementById("page-title");
    if (title) title.textContent = section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, " ");

    const map = {
      home: () => this.loadHome(),
      users: () => this.loadUsers(),
      workers: () => this.loadWorkers(),
      bookings: () => this.loadBookings(),
      services: () => this.loadServices(),
      coupons: () => this.loadCoupons(),
      payments: () => this.loadPayments(),
      reviews: () => this.loadReviews(),
      contacts: () => this.loadContacts(),
      notifications: () => this.loadNotifications(),
      wishlists: () => this.loadWishlists(),
      search: () => {},
      profile: () => this.loadProfile(),
    };
    map[section]?.();
  },

  async loadHome() {
    const grid = document.getElementById("stat-grid");
    if (!grid) return;
    try {
      const d = await AdminAPI.dashboard();
      const cards = [
        ["Customers", d.customer_count, "fa-users", "#0284c7"],
        ["Workers", d.worker_count, "fa-user-hard-hat", "#059669"],
        ["Pending KYC", d.pending_kyc, "fa-id-card", "#d97706"],
        ["Approved Workers", d.approved_workers, "fa-check-circle", "#059669"],
        ["Total Bookings", d.bookings_total, "fa-calendar", "#2563eb"],
        ["Pending Bookings", d.pending_bookings, "fa-clock", "#d97706"],
        ["Completed", d.completed_bookings, "fa-flag-checkered", "#4f46e5"],
        ["Cancelled", d.cancelled_bookings, "fa-ban", "#dc2626"],
        ["Services", d.total_services, "fa-tools", "#0f172a"],
        ["Revenue", AdminUI.money(d.total_revenue), "fa-rupee-sign", "#059669"],
        ["Pending Pay", d.pending_payments, "fa-money-bill", "#d97706"],
        ["Paid", d.completed_payments, "fa-credit-card", "#059669"],
        ["Reviews", d.total_reviews, "fa-star", "#f59e0b"],
        ["Contacts", d.total_contacts, "fa-envelope", "#0284c7"],
        ["Coupons", d.total_coupons, "fa-ticket", "#7c3aed"],
        ["Wishlists", d.wishlist_count, "fa-heart", "#e11d48"],
      ];
      grid.innerHTML = cards
        .map(
          ([label, val, icon, color]) => `
        <div class="stat-card">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <div class="label">${label}</div>
              <div class="value" style="color:${color}">${val ?? 0}</div>
            </div>
            <i class="fas ${icon}" style="color:${color};opacity:.35;font-size:1.25rem"></i>
          </div>
        </div>`
        )
        .join("");

      // notif strip
      const ns = document.getElementById("notif-strip");
      if (ns && d.notifications) {
        ns.innerHTML = `<span>Notifications — Sent: <b>${d.notifications.sent}</b></span>
          <span>Seen: <b style="color:#059669">${d.notifications.seen}</b></span>
          <span>Unseen: <b style="color:#d97706">${d.notifications.unseen}</b></span>`;
      }

      this.renderStatusChart(d.status_chart || []);
      this.renderRecent(d.recent_bookings || []);
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  renderStatusChart(data) {
    const canvas = document.getElementById("chart-status");
    if (!canvas || typeof Chart === "undefined") return;
    if (this._statusChart) this._statusChart.destroy();
    this._statusChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: data.map((x) => x.label),
        datasets: [
          {
            data: data.map((x) => x.value),
            backgroundColor: ["#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#818cf8", "#f87171"],
          },
        ],
      },
      options: { plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false },
    });
  },

  renderRecent(list) {
    const el = document.getElementById("recent-bookings");
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<p class="empty">No recent bookings</p>';
      return;
    }
    el.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
      <th>ID</th><th>Service</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>
      ${list
        .map(
          (b) => `<tr>
        <td>${b.booking_id || b.id}</td>
        <td>${b.service_name || "—"}</td>
        <td>${b.user_name || "—"}</td>
        <td>${AdminUI.badge(b.status)}</td>
        <td>${AdminUI.money(b.final_amount)}</td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
  },

  async loadUsers() {
    const q = document.getElementById("users-q")?.value || "";
    const box = document.getElementById("users-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.customers({ q, page: 1, limit: 50 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No customers found</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Bookings</th><th>Joined</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (u) => `<tr>
        <td>${u.id}</td>
        <td>${u.full_name || "—"}</td>
        <td>${u.email}</td>
        <td>${u.phone || "—"}</td>
        <td>${u.is_active ? AdminUI.badge("active") : AdminUI.badge("inactive")}</td>
        <td>${u.bookings_count ?? 0}</td>
        <td>${AdminUI.date(u.created_at)}</td>
        <td class="actions">
          <button class="btn" onclick="AdminApp.viewCustomer(${u.id})">View</button>
          <button class="btn ${u.is_active ? "btn-danger" : "btn-success"}" onclick="AdminApp.toggleUser(${u.id}, ${!u.is_active})">${u.is_active ? "Disable" : "Enable"}</button>
        </td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
      AdminUI.toast(e.message, "error");
    }
  },

  async viewCustomer(id) {
    try {
      const u = await AdminAPI.customer(id);
      const bookings = (u.bookings || []).map((b) => `#${b.booking_id} ${b.service_name} [${b.status}]`).join("\n") || "None";
      alert(`Customer #${u.id}\n${u.full_name}\n${u.email}\n${u.phone || ""}\nBookings: ${u.bookings_count}\n\nRecent:\n${bookings}`);
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async toggleUser(id, is_active) {
    if (!confirm(is_active ? "Enable this user?" : "Disable this user?")) return;
    try {
      await AdminAPI.updateUser(id, { is_active });
      AdminUI.toast(is_active ? "User enabled" : "User disabled", "success");
      this.loadUsers();
      this.loadWorkers();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },
async loadWorkers(kyc) {
  const q = document.getElementById("workers-q")?.value || "";

  const kyc_status =
    kyc ?? (document.getElementById("workers-kyc")?.value || "");

  const box = document.getElementById("workers-table");

  if (!box) return;

  box.innerHTML = "Loading…";

  try {
    const params = {
      q,
      page: 1,
      limit: 50
    };

    if (kyc_status) {
      params.kyc_status = kyc_status;
    }

    const data = await AdminAPI.workers(params);

    const rows = data.results || [];

    if (!rows.length) {
      box.innerHTML = "No workers found";
      return;
    }

    box.innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Worker</th>
              <th>Contact</th>
              <th>KYC</th>
              <th>Available</th>
              <th>Rating</th>
              <th>Earnings</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map((u) => `
              <tr>
                <td>${u.worker_id || u.id}</td>

                <td>
                  ${u.full_name || "—"}
                  <br>
                  <small>${u.skills || ""}</small>
                </td>

                <td>
                  ${u.email || "—"}
                  <br>
                  ${u.phone || "—"}
                </td>

                <td>
                  ${AdminUI.badge(u.kyc_status || "pending")}
                </td>

                <td>
                  ${u.is_available ? "Yes" : "No"}
                </td>

                <td>
                  ${AdminUI.stars(u.rating || 0)}
                </td>

                <td>
                  ${AdminUI.money(u.total_earnings || 0)}
                </td>

                <td>
                  <button onclick="approveWorker(${u.worker_id || u.id})">
                    Approve
                  </button>

                  <button onclick="rejectWorker(${u.worker_id || u.id})">
                    Reject
                  </button>

                  <button onclick="toggleWorker(${u.worker_id || u.id})">
                    ${u.is_active ? "Suspend" : "Enable"}
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

  } catch (e) {
    box.innerHTML = `<p class="empty">${e.message}</p>`;
    AdminUI.toast(e.message, "error");
  }
},
  async setKyc(id, kyc_status) {
    if (!confirm(`Set KYC to ${kyc_status}?`)) return;
    try {
      await AdminAPI.updateUser(id, { kyc_status });
      AdminUI.toast("KYC updated: " + kyc_status, "success");
      this.loadWorkers();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadBookings() {
    const q = document.getElementById("bookings-q")?.value || "";
    const status = document.getElementById("bookings-status")?.value || "";
    const box = document.getElementById("bookings-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const params = { page: 1, limit: 50 };
      if (q) params.q = q;
      if (status) params.status = status;
      const data = await AdminAPI.bookings(params);
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No bookings</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>Booking</th><th>Customer</th><th>Worker</th><th>Service</th><th>When</th><th>Pay</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (b) => `<tr>
        <td><b>#${b.booking_id || b.id}</b><div style="font-size:11px">${AdminUI.money(b.final_amount)}</div></td>
        <td>${b.user_name || "—"}</td>
        <td>${b.worker_name || "Unassigned"}</td>
        <td>${b.service_name || "—"}</td>
        <td>${b.booking_date || "—"} ${b.booking_time || ""}</td>
        <td>${AdminUI.badge(b.payment_status)}<div style="font-size:11px">${b.payment_method || ""}</div></td>
        <td>${AdminUI.badge(b.status)}</td>
        <td class="actions">
          <button class="btn btn-amber" onclick="AdminApp.openBookingModal(${b.id}, '${(b.booking_id || "").replace(/'/g, "")}', '${b.status}', ${b.worker_id || "null"})">Control</button>
          <button class="btn" onclick="AdminApp.viewBooking(${b.id})">View</button>
        </td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
      AdminUI.toast(e.message, "error");
    }
  },

  async viewBooking(id) {
    try {
      const b = await AdminAPI.booking(id);
      const c = b.customer ? `${b.customer.full_name} | ${b.customer.email} | ${b.customer.phone || ""}` : b.user_name;
      const w = b.worker ? `${b.worker.full_name} | ${b.worker.phone || ""}` : b.worker_name || "Unassigned";
      alert(`#${b.booking_id}\nService: ${b.service_name}\nStatus: ${b.status}\nCustomer: ${c}\nWorker: ${w}\nWhen: ${b.booking_date} ${b.booking_time || ""}\nAddress: ${b.address || "—"}\nAmount: ${b.final_amount}\nPay: ${b.payment_method}/${b.payment_status}`);
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  openBookingModal(id, bid, status, workerId) {
    document.getElementById("modal-booking-id").value = id;
    document.getElementById("modal-booking-label").textContent = "#" + (bid || id);
    document.getElementById("modal-status").value = status || "pending";
    document.getElementById("modal-worker-id").value = workerId && workerId !== "null" ? workerId : "";
    document.getElementById("modal-notes").value = "";
    document.getElementById("booking-modal").style.display = "flex";
  },

  closeModal() {
    document.getElementById("booking-modal").style.display = "none";
    document.getElementById("service-modal").style.display = "none";
    document.getElementById("coupon-modal").style.display = "none";
  },

  async saveBookingStatus() {
    const id = document.getElementById("modal-booking-id").value;
    const status = document.getElementById("modal-status").value;
    const workerRaw = document.getElementById("modal-worker-id").value;
    const notes = document.getElementById("modal-notes").value;
    const body = { status };
    if (workerRaw) body.worker_id = parseInt(workerRaw, 10);
    if (notes) body.notes = notes;
    if (status === "cancelled" && !confirm("Cancel this booking?")) return;
    try {
      await AdminAPI.bookingStatus(id, body);
      AdminUI.toast("Booking updated", "success");
      this.closeModal();
      this.loadBookings();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadServices() {
    const q = document.getElementById("services-q")?.value || "";
    const box = document.getElementById("services-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.services({ q, limit: 100 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No services</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>ID</th><th>Title</th><th>Price</th><th>Popular</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (s) => `<tr>
        <td>${s.id}</td>
        <td>${s.title}<div style="font-size:11px;color:#64748b">${(s.description || "").slice(0, 60)}</div></td>
        <td>${AdminUI.money(s.starting_price || s.price)}</td>
        <td>${s.is_popular ? "Yes" : "No"}</td>
        <td>${s.is_active ? AdminUI.badge("active") : AdminUI.badge("inactive")}</td>
        <td class="actions">
          <button class="btn" onclick='AdminApp.editService(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Edit</button>
          <button class="btn" onclick="AdminApp.toggleService(${s.id})">Toggle</button>
          <button class="btn btn-danger" onclick="AdminApp.deleteService(${s.id})">Delete</button>
        </td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },

  openServiceModal(svc) {
    document.getElementById("svc-id").value = svc?.id || "";
    document.getElementById("svc-title").value = svc?.title || "";
    document.getElementById("svc-desc").value = svc?.description || "";
    document.getElementById("svc-price").value = svc?.starting_price || svc?.price || 0;
    document.getElementById("svc-time").value = svc?.estimated_time || "1-2 hrs";
    document.getElementById("svc-popular").checked = !!svc?.is_popular;
    document.getElementById("svc-active").checked = svc?.is_active !== false;
    document.getElementById("service-modal").style.display = "flex";
  },
  editService(s) {
    this.openServiceModal(s);
  },
  async saveService() {
    const id = document.getElementById("svc-id").value;
    const body = {
      title: document.getElementById("svc-title").value.trim(),
      description: document.getElementById("svc-desc").value.trim(),
      starting_price: parseFloat(document.getElementById("svc-price").value) || 0,
      price: parseFloat(document.getElementById("svc-price").value) || 0,
      estimated_time: document.getElementById("svc-time").value,
      is_popular: document.getElementById("svc-popular").checked,
      is_active: document.getElementById("svc-active").checked,
    };
    if (!body.title) return AdminUI.toast("Title required", "error");
    try {
      if (id) await AdminAPI.updateService(id, body);
      else await AdminAPI.createService(body);
      AdminUI.toast("Service saved", "success");
      this.closeModal();
      this.loadServices();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },
  async toggleService(id) {
    try {
      await AdminAPI.toggleService(id);
      AdminUI.toast("Service status toggled", "success");
      this.loadServices();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },
  async deleteService(id) {
    if (!confirm("Delete this service permanently?")) return;
    try {
      await AdminAPI.deleteService(id);
      AdminUI.toast("Service deleted", "success");
      this.loadServices();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadCoupons() {
    const box = document.getElementById("coupons-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.coupons();
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No coupons</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Used</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (c) => `<tr>
        <td><b>${c.code}</b></td>
        <td>${c.discount_type}</td>
        <td>${c.discount_type === "percent" ? c.discount_value + "%" : AdminUI.money(c.discount_value)}</td>
        <td>${AdminUI.money(c.min_amount)}</td>
        <td>${c.used_count || 0}/${c.usage_limit || "∞"}</td>
        <td>${c.is_active ? AdminUI.badge("active") : AdminUI.badge("inactive")}</td>
        <td class="actions">
          <button class="btn" onclick='AdminApp.editCoupon(${JSON.stringify(c)})'>Edit</button>
          <button class="btn" onclick="AdminApp.toggleCoupon(${c.id})">Toggle</button>
          <button class="btn btn-danger" onclick="AdminApp.deleteCoupon(${c.id})">Delete</button>
        </td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },

  openCouponModal(c) {
    document.getElementById("cpn-id").value = c?.id || "";
    document.getElementById("cpn-code").value = c?.code || "";
    document.getElementById("cpn-type").value = c?.discount_type || "fixed";
    document.getElementById("cpn-value").value = c?.discount_value || 0;
    document.getElementById("cpn-min").value = c?.min_amount || 0;
    document.getElementById("cpn-limit").value = c?.usage_limit || 100;
    document.getElementById("cpn-active").checked = c?.is_active !== false;
    document.getElementById("coupon-modal").style.display = "flex";
  },
  editCoupon(c) {
    this.openCouponModal(c);
  },
  async saveCoupon() {
    const id = document.getElementById("cpn-id").value;
    const body = {
      code: document.getElementById("cpn-code").value.trim(),
      discount_type: document.getElementById("cpn-type").value,
      discount_value: parseFloat(document.getElementById("cpn-value").value) || 0,
      min_amount: parseFloat(document.getElementById("cpn-min").value) || 0,
      usage_limit: parseInt(document.getElementById("cpn-limit").value, 10) || 100,
      is_active: document.getElementById("cpn-active").checked,
    };
    if (!body.code) return AdminUI.toast("Code required", "error");
    try {
      if (id) await AdminAPI.updateCoupon(id, body);
      else await AdminAPI.createCoupon(body);
      AdminUI.toast("Coupon saved", "success");
      this.closeModal();
      this.loadCoupons();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },
  async toggleCoupon(id) {
    try {
      await AdminAPI.toggleCoupon(id);
      AdminUI.toast("Coupon toggled", "success");
      this.loadCoupons();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },
  async deleteCoupon(id) {
    if (!confirm("Delete coupon?")) return;
    try {
      await AdminAPI.deleteCoupon(id);
      AdminUI.toast("Deleted", "success");
      this.loadCoupons();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadPayments() {
    const status = document.getElementById("pay-status")?.value || "";
    const q = document.getElementById("pay-q")?.value || "";
    const box = document.getElementById("payments-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const params = { page: 1, limit: 50 };
      if (status) params.status = status;
      if (q) params.q = q;
      const data = await AdminAPI.payments(params);
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No payments</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>Booking</th><th>Customer</th><th>Service</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (p) => `<tr>
        <td>#${p.booking_id || p.id}</td>
        <td>${p.customer || "—"}</td>
        <td>${p.service_name || "—"}</td>
        <td>${AdminUI.money(p.amount)}</td>
        <td>${p.payment_method || "—"}</td>
        <td>${AdminUI.badge(p.payment_status)}</td>
        <td>${AdminUI.date(p.date)}</td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },

  async loadReviews() {
    const box = document.getElementById("reviews-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.reviews({ limit: 50 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No reviews</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>ID</th><th>Customer</th><th>Worker</th><th>Rating</th><th>Comment</th><th>Date</th><th></th>
      </tr></thead><tbody>
      ${rows
        .map(
          (r) => `<tr>
        <td>${r.id}</td>
        <td>${r.user_name || r.user_id}</td>
        <td>#${r.worker_id}</td>
        <td>${AdminUI.stars(r.rating)}</td>
        <td style="max-width:220px">${r.comment || "—"}</td>
        <td>${AdminUI.date(r.created_at)}</td>
        <td><button class="btn btn-danger" onclick="AdminApp.deleteReview(${r.id})">Delete</button></td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },
  async deleteReview(id) {
    if (!confirm("Delete review?")) return;
    try {
      await AdminAPI.deleteReview(id);
      AdminUI.toast("Review deleted", "success");
      this.loadReviews();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadContacts() {
    const box = document.getElementById("contacts-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.contacts({ limit: 50 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No messages</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th><th></th>
      </tr></thead><tbody>
      ${rows
        .map(
          (m) => `<tr>
        <td>${m.name}</td>
        <td>${m.email}</td>
        <td>${m.subject || "—"}</td>
        <td style="max-width:240px">${m.message || ""}</td>
        <td>${AdminUI.date(m.created_at)}</td>
        <td><button class="btn btn-danger" onclick="AdminApp.deleteContact(${m.id})">Delete</button></td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },
  async deleteContact(id) {
    if (!confirm("Delete contact message?")) return;
    try {
      await AdminAPI.deleteContact(id);
      AdminUI.toast("Deleted", "success");
      this.loadContacts();
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadNotifications() {
    const box = document.getElementById("notifications-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.notifications({ limit: 50 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No notifications</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>ID</th><th>User</th><th>Title</th><th>Type</th><th>Read</th><th>Date</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (n) => `<tr>
        <td>${n.id}</td>
        <td>#${n.user_id}</td>
        <td>${n.title}<div style="font-size:11px;color:#64748b">${n.body || ""}</div></td>
        <td>${n.type || "—"}</td>
        <td>${n.is_read ? "Yes" : "No"}</td>
        <td>${AdminUI.date(n.created_at)}</td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },

  async loadWishlists() {
    const box = document.getElementById("wishlists-table");
    if (!box) return;
    box.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const data = await AdminAPI.wishlists({ limit: 50 });
      const rows = data.results || [];
      if (!rows.length) {
        box.innerHTML = '<p class="empty">No wishlist entries</p>';
        return;
      }
      box.innerHTML = `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>User</th><th>Worker</th><th>Added</th>
      </tr></thead><tbody>
      ${rows
        .map(
          (w) => `<tr>
        <td>${w.user_name || w.user_id}</td>
        <td>${w.worker_name || w.worker_id}</td>
        <td>${AdminUI.date(w.created_at)}</td>
      </tr>`
        )
        .join("")}
      </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },

  async doSearch() {
    const q = document.getElementById("global-q")?.value?.trim() || "";
    const box = document.getElementById("search-results");
    if (!box) return;
    if (q.length < 2) {
      box.innerHTML = '<p class="empty">Type at least 2 characters</p>';
      return;
    }
    try {
      const data = await AdminAPI.search(q);
      box.innerHTML = `
        <div class="panel"><h2>Users (${(data.users || []).length})</h2>
          ${(data.users || []).map((u) => `<div>${u.full_name} — ${u.email}</div>`).join("") || "<p class='empty'>None</p>"}
        </div>
        <div class="panel"><h2>Workers (${(data.workers || []).length})</h2>
          ${(data.workers || []).map((u) => `<div>${u.full_name} — KYC ${u.kyc_status}</div>`).join("") || "<p class='empty'>None</p>"}
        </div>
        <div class="panel"><h2>Bookings (${(data.bookings || []).length})</h2>
          ${(data.bookings || []).map((b) => `<div>#${b.booking_id} ${b.service_name} [${b.status}]</div>`).join("") || "<p class='empty'>None</p>"}
        </div>
        <div class="panel"><h2>Services (${(data.services || []).length})</h2>
          ${(data.services || []).map((s) => `<div>${s.title} — ${AdminUI.money(s.price)}</div>`).join("") || "<p class='empty'>None</p>"}
        </div>`;
    } catch (e) {
      AdminUI.toast(e.message, "error");
    }
  },

  async loadProfile() {
    const box = document.getElementById("profile-box");
    if (!box) return;
    try {
      const me = await AdminAPI.me();
      box.innerHTML = `
        <p><b>Name:</b> ${me.full_name}</p>
        <p><b>Email:</b> ${me.email}</p>
        <p><b>Phone:</b> ${me.phone || "—"}</p>
        <p><b>Role:</b> ${me.role}</p>
        <p><b>Joined:</b> ${AdminUI.date(me.created_at)}</p>
        <p style="color:#64748b;font-size:.85rem;margin-top:1rem">Password change: use existing auth reset flow if configured. No separate admin password API beyond login.</p>`;
    } catch (e) {
      box.innerHTML = `<p class="empty">${e.message}</p>`;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => AdminApp.init());
