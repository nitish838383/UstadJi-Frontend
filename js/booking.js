/**
 * UstadJi - Booking Module
 */

const BookingModule = {
  state: {
    service_id: null,
    worker_id: null,
    address_id: null,
    date: null,
    time_slot: null,
    coupon_code: null,
    payment_method: "cash",
    notes: "",
    summary: null,
  },

  /**
   * Initialize booking form page
   */
  async init() {
    if (!Auth.requireAuth("user")) return;

    // Get IDs from URL
    this.state.service_id = Helper.getQueryParam("service_id");
    this.state.worker_id = Helper.getQueryParam("worker_id");

    // Load saved addresses
    await this.loadAddresses();

    // Load selected service + professionals
    if (this.state.service_id) {
      await this.loadServiceInfo();
      await this.loadProfessionals();
    }

    // If specific worker was already selected
    if (this.state.worker_id) {
      await this.loadWorkerInfo();
    }

    // Bind form events
    this.bindEvents();
  },

  /**
   * Load selected service information
   */
  async loadServiceInfo() {
    try {
      const service = await API.services.get(this.state.service_id);

      const el = document.getElementById("booking-service-info");

      if (el) {
        el.innerHTML = `
          <div class="flex items-center gap-3">

            <img
              src="${service.image_url || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100"}"
              class="w-14 h-14 rounded-xl object-cover"
              onerror="this.src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100'"
            >

            <div>
              <p class="font-semibold text-slate-800 dark:text-white">
                ${service.title || service.name}
              </p>

              <p class="text-sm text-primary-600 font-medium">
                ${Helper.formatCurrency(service.starting_price || 0)} onwards
              </p>
            </div>

          </div>
        `;
      }

      this.state.service = service;

    } catch (err) {
      console.error("Failed to load service:", err);
      Helper.toast("Failed to load service", "error");
    }
  },

  /**
   * Load professionals according to selected service
   */
  async loadProfessionals() {
    const container = document.getElementById("booking-worker-info");

    if (!container || !this.state.service_id) {
      return;
    }

    // If a specific worker is already selected,
    // loadWorkerInfo() will display that worker.
    if (this.state.worker_id) {
      return;
    }

    // Loading state
    container.innerHTML = `
      <p class="text-sm text-slate-400">
        Loading professionals...
      </p>
    `;

    try {
      console.log(
        "Loading professionals for service:",
        this.state.service_id
      );

      // Call:
      // GET /api/workers/service/{service_id}
      const data = await API.workers.byService(
        this.state.service_id
      );

      console.log("Professionals API response:", data);

      // Handle different possible API response formats
      const workers =
        data?.results ||
        data?.items ||
        data?.workers ||
        data ||
        [];

      // No workers
      if (!Array.isArray(workers) || workers.length === 0) {
        container.innerHTML = `
          <div class="py-3">
            <p class="text-sm text-slate-400">
              No professionals available for this service.
            </p>

            <p class="text-xs text-slate-400 mt-1">
              You can leave this blank for auto-assignment.
            </p>
          </div>
        `;

        return;
      }

      // Render workers
      container.innerHTML = `
        <div class="space-y-3">

          ${workers
            .map(
              (worker) => `
                <label class="block cursor-pointer">

                  <input
                    type="radio"
                    name="professional"
                    value="${worker.id}"
                    class="sr-only peer"
                    onchange="BookingModule.selectProfessional('${worker.id}')"
                  >

                  <div
                    class="
                      p-4
                      rounded-xl
                      border-2
                      border-slate-200
                      dark:border-slate-700
                      peer-checked:border-primary-500
                      peer-checked:bg-primary-50
                      dark:peer-checked:bg-primary-900/20
                      hover:border-primary-300
                      transition-all
                    "
                  >

                    <div class="flex items-center gap-3">

                      <!-- Avatar -->
                      <div
                        class="
                          w-11
                          h-11
                          rounded-full
                          bg-primary-600
                          text-white
                          flex
                          items-center
                          justify-center
                          font-bold
                          flex-shrink-0
                        "
                      >
                        ${Helper.getInitials(
                          worker.full_name ||
                          worker.name ||
                          "W"
                        )}
                      </div>

                      <!-- Worker information -->
                      <div class="flex-1 min-w-0">

                        <p
                          class="
                            font-semibold
                            text-slate-800
                            dark:text-white
                          "
                        >
                          ${
                            worker.full_name ||
                            worker.name ||
                            "Professional"
                          }
                        </p>

                        <div
                          class="
                            flex
                            items-center
                            gap-1
                            text-xs
                            text-slate-500
                            mt-1
                          "
                        >
                          ${Helper.renderStars(
                            worker.rating || 0
                          )}

                          <span>
                            ${Number(
                              worker.rating || 0
                            ).toFixed(1)}
                          </span>
                        </div>

                        ${
                          worker.phone
                            ? `
                              <p class="text-xs text-slate-400 mt-1">
                                ${worker.phone}
                              </p>
                            `
                            : ""
                        }

                      </div>

                      <!-- Radio indicator -->
                      <div
                        class="
                          w-5
                          h-5
                          rounded-full
                          border-2
                          border-slate-300
                          peer-checked:border-primary-500
                          peer-checked:bg-primary-500
                          flex-shrink-0
                        "
                      ></div>

                    </div>

                  </div>

                </label>
              `
            )
            .join("")}

        </div>

        <!-- Auto assignment option -->
        <div class="mt-3">

          <button
            type="button"
            onclick="BookingModule.clearProfessional()"
            class="
              text-xs
              text-primary-600
              hover:underline
            "
          >
            Leave blank for auto-assign
          </button>

        </div>
      `;

    } catch (err) {
      console.error(
        "Failed to load professionals:",
        err
      );

      container.innerHTML = `
        <div class="py-3">

          <p class="text-sm text-rose-500">
            Failed to load professionals.
          </p>

          <button
            type="button"
            onclick="BookingModule.loadProfessionals()"
            class="
              mt-2
              text-xs
              text-primary-600
              hover:underline
            "
          >
            Try again
          </button>

        </div>
      `;
    }
  },

  /**
   * Select professional
   */
  selectProfessional(workerId) {
    this.state.worker_id = workerId;

    console.log(
      "Selected professional:",
      workerId
    );
  },

  /**
   * Clear professional selection
   * Backend can auto-assign worker
   */
  clearProfessional() {
    this.state.worker_id = null;

    document
      .querySelectorAll(
        'input[name="professional"]'
      )
      .forEach((input) => {
        input.checked = false;
      });

    console.log(
      "Professional cleared - auto assign enabled"
    );
  },

  /**
   * Load specifically selected worker
   */
  async loadWorkerInfo() {
    try {
      const worker = await API.workers.get(
        this.state.worker_id
      );

      const el = document.getElementById(
        "booking-worker-info"
      );

      if (el) {
        el.innerHTML = `
          <div class="flex items-center gap-3">

            <div
              class="
                w-12
                h-12
                rounded-full
                bg-primary-600
                flex
                items-center
                justify-center
                text-white
                font-bold
              "
            >
              ${Helper.getInitials(
                worker.full_name ||
                worker.name ||
                "W"
              )}
            </div>

            <div>

              <p
                class="
                  font-semibold
                  text-slate-800
                  dark:text-white
                "
              >
                ${
                  worker.full_name ||
                  worker.name ||
                  "Professional"
                }
              </p>

              <div class="flex items-center gap-1 text-xs">
                ${Helper.renderStars(
                  worker.rating || 0
                )}
                ·
                ${worker.rating?.toFixed(1) || "0"}
              </div>

            </div>

          </div>
        `;
      }

      this.state.worker = worker;

    } catch (err) {
      console.error(
        "Failed to load professional:",
        err
      );

      Helper.toast(
        "Failed to load professional",
        "error"
      );
    }
  },


  async loadAddresses() {
    const container = document.getElementById("booking-addresses");
    if (!container) return;

    try {
      const data = await API.profile.addresses();
      const addresses = data.results || data.items || data || [];

      if (!addresses.length) {
        container.innerHTML = `
          <div class="text-center py-6">
            <p class="text-sm text-slate-500 mb-3">No saved addresses</p>
            <button type="button" onclick="BookingModule.showAddAddress()" class="text-primary-600 font-medium text-sm hover:underline">
              + Add New Address
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = addresses
        .map(
          (a, i) => `
        <label class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${i === 0 ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-slate-200 dark:border-slate-700 hover:border-primary-300"}">
          <input type="radio" name="address_id" value="${a.id}" ${i === 0 ? "checked" : ""} class="mt-1 text-primary-600 focus:ring-primary-500" onchange="BookingModule.selectAddress('${a.id}')">
          <div class="flex-1">
            <p class="font-medium text-slate-800 dark:text-white text-sm">${a.label || a.type || "Address"} · ${a.name || ""}</p>
            <p class="text-xs text-slate-500 mt-0.5">${a.address_line1 || a.line1}, ${a.city}, ${a.pincode || a.postal_code}</p>
            <p class="text-xs text-slate-500">${a.phone || ""}</p>
          </div>
        </label>
      `
        )
        .join("") + `
        <button type="button" onclick="BookingModule.showAddAddress()" class="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
          + Add New Address
        </button>
      `;

      if (addresses[0]) this.state.address_id = addresses[0].id;
    } catch (err) {
      container.innerHTML = `<p class="text-sm text-rose-500">Failed to load addresses</p>`;
    }
  },

  selectAddress(id) {
    this.state.address_id = id;
    document.querySelectorAll("#booking-addresses label").forEach((l) => {
      l.classList.remove("border-primary-500", "bg-primary-50", "dark:bg-primary-900/10");
      l.classList.add("border-slate-200", "dark:border-slate-700");
    });
    const selected = document.querySelector(`input[name="address_id"][value="${id}"]`)?.closest("label");
    if (selected) {
      selected.classList.add("border-primary-500", "bg-primary-50", "dark:bg-primary-900/10");
      selected.classList.remove("border-slate-200", "dark:border-slate-700");
    }
  },

  showAddAddress() {
    const modal = document.getElementById("add-address-modal");
    if (modal) modal.classList.remove("hidden");
  },

  hideAddAddress() {
    const modal = document.getElementById("add-address-modal");
    if (modal) modal.classList.add("hidden");
  },

  async saveAddress(e) {
    e.preventDefault();
    const form = e.target;
    const { valid } = Validation.validateForm(form);
    if (!valid) return;

    const data = Object.fromEntries(new FormData(form));
    try {
      Helper.showLoader();
      await API.profile.addAddress(data);
      Helper.toast("Address added", "success");
      this.hideAddAddress();
      form.reset();
      await this.loadAddresses();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  bindEvents() {
    // Date change
    const dateInput = document.getElementById("booking-date");
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;
      dateInput.addEventListener("change", (e) => {
        this.state.date = e.target.value;
        this.loadTimeSlots(e.target.value);
      });
    }

    // Coupon
    const applyBtn = document.getElementById("apply-coupon-btn");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => this.applyCoupon());
    }

    // Payment method
    document.querySelectorAll('input[name="payment_method"]').forEach((el) => {
      el.addEventListener("change", (e) => {
        this.state.payment_method = e.target.value;
      });
    });

    // Submit
    const form = document.getElementById("booking-form");
    if (form) {
      form.addEventListener("submit", (e) => this.submitBooking(e));
    }
  },

  async loadTimeSlots(date) {
    const container = document.getElementById("time-slots");
    if (!container) return;

    // Generate slots (backend can override)
    const slots = [
      "09:00", "10:00", "11:00", "12:00",
      "14:00", "15:00", "16:00", "17:00", "18:00",
    ];

    container.innerHTML = slots
      .map(
        (s) => `
      <button type="button" data-slot="${s}" onclick="BookingModule.selectSlot('${s}')"
              class="time-slot px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-medium hover:border-primary-400 transition-all">
        ${s}
      </button>
    `
      )
      .join("");
  },

  selectSlot(slot) {
    this.state.time_slot = slot;
    document.querySelectorAll(".time-slot").forEach((b) => {
      b.classList.remove("border-primary-500", "bg-primary-50", "dark:bg-primary-900/20", "text-primary-700");
      b.classList.add("border-slate-200", "dark:border-slate-700");
    });
    const btn = document.querySelector(`[data-slot="${slot}"]`);
    if (btn) {
      btn.classList.add("border-primary-500", "bg-primary-50", "dark:bg-primary-900/20", "text-primary-700");
      btn.classList.remove("border-slate-200", "dark:border-slate-700");
    }
  },

  async applyCoupon() {
    const code = document.getElementById("coupon-code")?.value?.trim();
    if (!code) {
      Helper.toast("Enter a coupon code", "warning");
      return;
    }
    try {
      Helper.showLoader();
      const result = await API.coupons.validate(code, {
        service_id: this.state.service_id,
        worker_id: this.state.worker_id,
      });
      this.state.coupon_code = code;
      this.state.discount = result.discount || result.amount || 0;
      Helper.toast(`Coupon applied! ${Helper.formatCurrency(this.state.discount)} off`, "success");
      this.updateSummaryUI();
    } catch (err) {
      Helper.toast(err.message || "Invalid coupon", "error");
      this.state.coupon_code = null;
      this.state.discount = 0;
    } finally {
      Helper.hideLoader();
    }
  },

  removeCoupon() {
    this.state.coupon_code = null;
    this.state.discount = 0;
    const input = document.getElementById("coupon-code");
    if (input) input.value = "";
    this.updateSummaryUI();
    Helper.toast("Coupon removed", "info");
  },

  updateSummaryUI() {
    // Summary is calculated on backend ideally; frontend shows estimates
    const el = document.getElementById("booking-summary");
    if (!el) return;
    // Placeholder until API returns full summary on create
  },

  async submitBooking(e) {
    e.preventDefault();

    if (!this.state.address_id) {
      Helper.toast("Please select an address", "warning");
      return;
    }
    if (!this.state.date) {
      Helper.toast("Please select a date", "warning");
      return;
    }
    if (!this.state.time_slot) {
      Helper.toast("Please select a time slot", "warning");
      return;
    }

    const notes = document.getElementById("booking-notes")?.value || "";

    const payload = {
      service_id: this.state.service_id,
      worker_id: this.state.worker_id,
      address_id: this.state.address_id,
      booking_date: this.state.date,
      booking_time: this.state.time_slot,
      payment_method: this.state.payment_method,
      coupon_code: this.state.coupon_code || null,
      notes,
    };

    try {
      Helper.showLoader();
      const booking = await API.bookings.create(payload);
      // Store for success page
      sessionStorage.setItem("last_booking", JSON.stringify(booking));
      window.location.href = `/booking-success.html?id=${booking.id || booking.booking_id}`;
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  /**
   * Load booking history
   */
  async loadHistory(containerId, status = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = Helper.skeletonCard(4);

    try {
      const params = {};
      if (status) params.status = status;
      const data = await API.bookings.list(params);
      const bookings = data.results || data.items || data || [];

      if (!bookings.length) {
        container.innerHTML = Helper.emptyState("No bookings found", "fa-calendar-times");
        return;
      }

      container.innerHTML = bookings.map((b) => this.renderBookingCard(b)).join("");
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadHistory(containerId, status));
    }
  },

  renderBookingCard(b) {
    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow" data-animate>
        <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p class="text-xs text-slate-500">Booking ID</p>
            <p class="font-semibold text-slate-800 dark:text-white">#${b.booking_id || b.id}</p>
          </div>
          ${Helper.statusBadge(b.status)}
        </div>
        <div class="space-y-2 text-sm mb-4">
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i class="fas fa-tools text-primary-500 w-4"></i>
            <span>${b.service_name || b.service?.title || "Service"}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i class="fas fa-user text-primary-500 w-4"></i>
            <span>${b.worker_name || b.worker?.full_name || "Professional"}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i class="fas fa-calendar text-primary-500 w-4"></i>
            <span>${Helper.formatDate(b.booking_date)} · ${b.booking_time || ""}</span>
          </div>
          <div class="flex items-center gap-2 font-semibold text-primary-600">
            <i class="fas fa-rupee-sign w-4"></i>
            <span>${Helper.formatCurrency(b.final_amount || b.total || 0)}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <a href="/booking-history.html?id=${b.id}" class="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Details
          </a>
          ${b.status === "completed" ? `
            <button onclick="ReviewModule.openReview('${b.id}', '${b.worker_id}')" class="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-lg hover:bg-amber-100 transition-colors">
              Rate
            </button>
          ` : ""}
          ${["pending", "accepted"].includes(b.status) ? `
            <button onclick="BookingModule.cancelBooking('${b.id}')" class="px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
              Cancel
            </button>
          ` : ""}
          ${b.status === "completed" ? `
            <a href="/booking.html?service_id=${b.service_id}&worker_id=${b.worker_id}" class="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
              Rebook
            </a>
          ` : ""}
        </div>
      </div>
    `;
  },

  async cancelBooking(id) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const reason = prompt("Reason for cancellation (optional):") || "";
    try {
      Helper.showLoader();
      await API.bookings.cancel(id, reason);
      Helper.toast("Booking cancelled", "success");
      this.loadHistory("booking-history-list");
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  /**
   * Progress tracker for booking status
   */
  renderProgressTracker(status) {
    const steps = [
      { key: "pending", label: "Pending", icon: "fa-clock" },
      { key: "accepted", label: "Accepted", icon: "fa-check" },
      { key: "assigned", label: "Assigned", icon: "fa-user-check" },
      { key: "on_the_way", label: "On The Way", icon: "fa-motorcycle" },
      { key: "started", label: "Started", icon: "fa-play" },
      { key: "completed", label: "Completed", icon: "fa-flag-checkered" },
    ];

    if (status === "cancelled") {
      return `<div class="flex items-center justify-center gap-2 py-4 text-rose-600"><i class="fas fa-times-circle text-xl"></i><span class="font-semibold">Booking Cancelled</span></div>`;
    }

    const currentIdx = steps.findIndex((s) => s.key === status?.toLowerCase());

    return `
      <div class="flex items-center justify-between overflow-x-auto py-4 px-2">
        ${steps
          .map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return `
            <div class="flex flex-col items-center min-w-[70px] relative">
              ${i < steps.length - 1 ? `<div class="absolute top-4 left-1/2 w-full h-0.5 ${i < currentIdx ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700"}"></div>` : ""}
              <div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"} ${active ? "ring-4 ring-primary-200 dark:ring-primary-900" : ""}">
                <i class="fas ${step.icon} text-xs"></i>
              </div>
              <span class="text-[10px] mt-1.5 font-medium ${done ? "text-primary-600" : "text-slate-400"} text-center">${step.label}</span>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  },

  /**
   * Worker booking actions
   */
  async workerAccept(id) {
    try {
      Helper.showLoader();
      await API.bookings.accept(id);
      Helper.toast("Booking accepted", "success");
      DashboardModule.loadWorkerBookings();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async workerReject(id) {
    const reason = prompt("Reason for rejection:") || "Not available";
    try {
      Helper.showLoader();
      await API.bookings.reject(id, reason);
      Helper.toast("Booking rejected", "info");
      DashboardModule.loadWorkerBookings();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async workerStart(id) {
    try {
      Helper.showLoader();
      await API.bookings.start(id);
      Helper.toast("Job started", "success");
      DashboardModule.loadWorkerBookings();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },

  async workerComplete(id) {
    try {
      Helper.showLoader();
      await API.bookings.complete(id);
      Helper.toast("Job completed!", "success");
      DashboardModule.loadWorkerBookings();
    } catch (err) {
      Helper.toast(err.message, "error");
    } finally {
      Helper.hideLoader();
    }
  },
};
