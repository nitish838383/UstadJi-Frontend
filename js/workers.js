/**
 * UstadJi - Workers Module
 */

const WorkersModule = {
  currentPage: 1,
  currentFilters: {},

  renderCard(worker) {
    const rating = worker.rating || 0;
    const reviews = worker.review_count || worker.reviews_count || 0;
    const exp = worker.experience_years || worker.experience || 0;
    const price = Helper.formatCurrency(worker.hourly_rate || worker.price || 0);
    const img = worker.avatar_url || worker.profile_photo || worker.image || "";
    const verified = worker.is_verified || worker.verified;
    const available = worker.is_available !== false;

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 group" data-animate>
        <div class="p-5">
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              ${img
                ? `<img src="${img}" alt="${worker.full_name || worker.name}" class="w-16 h-16 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                     onerror="this.outerHTML='<div class=\\'w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg\\'>${Helper.getInitials(worker.full_name || worker.name || "W")}</div>'">`
                : `<div class="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">${Helper.getInitials(worker.full_name || worker.name || "W")}</div>`
              }
              ${verified ? '<span class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800" title="Verified"><i class="fas fa-check text-white text-[10px]"></i></span>' : ""}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-slate-800 dark:text-white truncate">${worker.full_name || worker.name}</h3>
                ${verified ? '<i class="fas fa-badge-check text-sky-500 text-sm" title="Verified Professional"></i>' : ""}
              </div>
              <p class="text-xs text-slate-500 mb-1">ID: ${worker.worker_id || worker.id}</p>
              <div class="flex items-center gap-1.5 text-sm">
                ${Helper.renderStars(rating)}
                <span class="text-xs text-slate-500">(${reviews})</span>
              </div>
            </div>
            <button onclick="WorkersModule.toggleWishlist('${worker.id}')" class="text-slate-400 hover:text-rose-500 transition-colors p-1" data-wishlist="${worker.id}" title="Save">
              <i class="far fa-heart text-lg"></i>
            </button>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex items-center gap-1.5"><i class="fas fa-briefcase text-primary-500 w-4"></i> ${exp}+ years exp</div>
            <div class="flex items-center gap-1.5"><i class="fas fa-map-marker-alt text-primary-500 w-4"></i> ${worker.service_area || worker.city || "Local"}</div>
            <div class="flex items-center gap-1.5"><i class="fas fa-language text-primary-500 w-4"></i> ${worker.languages || "Hindi, English"}</div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${available ? "bg-emerald-500" : "bg-slate-400"}"></span>
              ${available ? "Available" : "Busy"}
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500">From</span>
              <p class="font-bold text-primary-600">${price}<span class="text-xs font-normal text-slate-500">/hr</span></p>
            </div>
            <div class="flex gap-2">
              <a href="/worker-profile.html?id=${worker.id}" class="px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                View
              </a>
              <a href="/booking.html?worker_id=${worker.id}${worker.service_id ? "&service_id=" + worker.service_id : ""}" 
                 class="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                Book
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async loadList(containerId, params = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentFilters = { ...params };
    container.innerHTML = Helper.skeletonCard(6);

    try {
      const data = await API.workers.list(params);
      const workers = data.results || data.items || data.data || data || [];
      const total = data.total || data.count || workers.length;

      if (!workers.length) {
        container.innerHTML = Helper.emptyState("No professionals found matching your criteria", "fa-user-hard-hat");
        this.updatePagination(0, 1);
        return;
      }

      container.innerHTML = workers.map((w) => this.renderCard(w)).join("");
      this.updatePagination(total, params.page || 1);
      Helper.initScrollAnimations();
      this.syncWishlistUI();
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadList(containerId, params));
    }
  },

  updatePagination(total, page) {
    const el = document.getElementById("workers-pagination");
    if (!el) return;
    const pageSize = CONFIG.PAGE_SIZE;
    const totalPages = Math.ceil(total / pageSize) || 1;
    this.currentPage = page;

    if (totalPages <= 1) {
      el.innerHTML = "";
      return;
    }

    let html = `<div class="flex items-center justify-center gap-2 mt-8">`;
    html += `<button onclick="WorkersModule.goToPage(${page - 1})" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}" ${page <= 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        html += `<button onclick="WorkersModule.goToPage(${i})" class="w-10 h-10 rounded-lg font-medium ${i === page ? "bg-primary-600 text-white" : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="px-1 text-slate-400">…</span>`;
      }
    }

    html += `<button onclick="WorkersModule.goToPage(${page + 1})" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}" ${page >= totalPages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>`;
    html += `</div>`;
    el.innerHTML = html;
  },

  goToPage(page) {
    if (page < 1) return;
    this.loadList("workers-grid", { ...this.currentFilters, page });
    Helper.scrollToTop();
  },

  applyFilters() {
    const params = { page: 1 };
    const rating = document.getElementById("filter-rating")?.value;
    const experience = document.getElementById("filter-experience")?.value;
    const priceMin = document.getElementById("filter-price-min")?.value;
    const priceMax = document.getElementById("filter-price-max")?.value;
    const availability = document.getElementById("filter-availability")?.value;
    const sort = document.getElementById("filter-sort")?.value;
    const serviceId = Helper.getQueryParam("service_id");
    const search = document.getElementById("worker-search")?.value;

    if (rating) params.min_rating = rating;
    if (experience) params.min_experience = experience;
    if (priceMin) params.min_price = priceMin;
    if (priceMax) params.max_price = priceMax;
    if (availability) params.available = availability;
    if (sort) params.sort = sort;
    if (serviceId) params.service_id = serviceId;
    if (search) params.q = search;

    this.loadList("workers-grid", params);
  },

  async loadProfile() {
    const id = Helper.getQueryParam("id");
    if (!id) {
      window.location.href = "/workers.html";
      return;
    }

    const main = document.getElementById("worker-profile-content");
    if (!main) return;

    main.innerHTML = `<div class="animate-pulse space-y-6"><div class="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div><div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div></div>`;

    try {
      const worker = await API.workers.get(id);
      this.renderProfile(worker);
      this.loadReviews(id);
    } catch (err) {
      main.innerHTML = Helper.errorState(err.message, () => this.loadProfile());
    }
  },

  renderProfile(worker) {
    const main = document.getElementById("worker-profile-content");
    if (!main) return;

    const rating = worker.rating || 0;
    const reviews = worker.review_count || 0;
    const exp = worker.experience_years || 0;
    const img = worker.avatar_url || worker.profile_photo || "";
    const verified = worker.is_verified;
    const price = Helper.formatCurrency(worker.hourly_rate || 0);

    main.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <!-- Cover -->
        <div class="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
        <div class="px-6 pb-6">
          <div class="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div class="relative">
              ${img
                ? `<img src="${img}" class="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg" onerror="this.outerHTML='<div class=\\'w-24 h-24 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-white dark:ring-slate-800\\'>${Helper.getInitials(worker.full_name || "W")}</div>'">`
                : `<div class="w-24 h-24 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-white dark:ring-slate-800">${Helper.getInitials(worker.full_name || "W")}</div>`
              }
              ${verified ? '<span class="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white"><i class="fas fa-check text-white text-xs"></i></span>' : ""}
            </div>
            <div class="flex-1 pt-2 sm:pt-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">${worker.full_name || worker.name}</h1>
                ${verified ? '<span class="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-semibold rounded-full">Verified</span>' : ""}
              </div>
              <p class="text-sm text-slate-500">Worker ID: ${worker.worker_id || worker.id}</p>
              <div class="flex items-center gap-2 mt-1">
                ${Helper.renderStars(rating)}
                <span class="text-sm text-slate-500">${rating.toFixed(1)} · ${reviews} reviews</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="WorkersModule.toggleWishlist('${worker.id}')" class="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" data-wishlist="${worker.id}">
                <i class="far fa-heart"></i>
              </button>
              <a href="/booking.html?worker_id=${worker.id}" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary-600/20">
                Book Now
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- About -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-3">About</h2>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${worker.bio || worker.about || "Professional service provider dedicated to quality work."}</p>
          </div>

          <!-- Skills -->
          ${worker.skills || worker.services ? `
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-3">Skills & Services</h2>
            <div class="flex flex-wrap gap-2">
              ${(worker.skills || worker.services || []).map(s => `
                <span class="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium">${typeof s === "string" ? s : s.name}</span>
              `).join("")}
            </div>
          </div>
          ` : ""}

          <!-- Reviews -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Reviews</h2>
            <div id="worker-reviews-list">
              <div class="animate-pulse space-y-4">
                <div class="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
                <div class="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 class="font-semibold text-slate-800 dark:text-white mb-4">Details</h3>
            <ul class="space-y-3 text-sm">
              <li class="flex justify-between"><span class="text-slate-500">Experience</span><span class="font-medium text-slate-800 dark:text-white">${exp}+ years</span></li>
              <li class="flex justify-between"><span class="text-slate-500">Rate</span><span class="font-medium text-primary-600">${price}/hr</span></li>
              <li class="flex justify-between"><span class="text-slate-500">Service Area</span><span class="font-medium text-slate-800 dark:text-white">${worker.service_area || "Local"}</span></li>
              <li class="flex justify-between"><span class="text-slate-500">Languages</span><span class="font-medium text-slate-800 dark:text-white">${worker.languages || "Hindi, English"}</span></li>
              <li class="flex justify-between"><span class="text-slate-500">Jobs Done</span><span class="font-medium text-slate-800 dark:text-white">${worker.jobs_completed || worker.completed_jobs || 0}</span></li>
            </ul>
          </div>

          ${worker.gallery && worker.gallery.length ? `
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 class="font-semibold text-slate-800 dark:text-white mb-4">Gallery</h3>
            <div class="grid grid-cols-2 gap-2">
              ${worker.gallery.slice(0, 4).map(g => `
                <img src="${g}" class="rounded-xl aspect-square object-cover" loading="lazy">
              `).join("")}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    `;
  },

  async loadReviews(workerId) {
    const container = document.getElementById("worker-reviews-list");
    if (!container) return;

    try {
      const data = await API.workers.reviews(workerId);
      const reviews = data.results || data.items || data || [];

      if (!reviews.length) {
        container.innerHTML = Helper.emptyState("No reviews yet", "fa-star");
        return;
      }

      container.innerHTML = reviews
        .map(
          (r) => `
        <div class="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold text-sm">
              ${Helper.getInitials(r.user_name || r.user?.name || "U")}
            </div>
            <div>
              <p class="font-medium text-sm text-slate-800 dark:text-white">${r.user_name || r.user?.name || "Anonymous"}</p>
              <div class="flex items-center gap-1 text-xs">${Helper.renderStars(r.rating)} · ${Helper.timeAgo(r.created_at)}</div>
            </div>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-300">${r.comment || r.review || ""}</p>
        </div>
      `
        )
        .join("");
    } catch {
      container.innerHTML = `<p class="text-sm text-slate-500">Unable to load reviews</p>`;
    }
  },

  async toggleWishlist(workerId) {
    if (!Auth.isAuthenticated()) {
      Helper.toast("Please login to save favorites", "warning");
      return;
    }
    try {
      const btn = document.querySelector(`[data-wishlist="${workerId}"]`);
      const icon = btn?.querySelector("i");
      if (icon?.classList.contains("fas")) {
        await API.wishlist.remove(workerId);
        icon.classList.replace("fas", "far");
        icon.classList.remove("text-rose-500");
        Helper.toast("Removed from wishlist", "info");
      } else {
        await API.wishlist.add(workerId);
        icon?.classList.replace("far", "fas");
        icon?.classList.add("text-rose-500");
        Helper.toast("Added to wishlist", "success");
      }
    } catch (err) {
      Helper.toast(err.message, "error");
    }
  },

  async syncWishlistUI() {
    if (!Auth.isAuthenticated()) return;
    try {
      const data = await API.wishlist.list();
      const ids = (data.results || data.items || data || []).map((w) => String(w.worker_id || w.id));
      document.querySelectorAll("[data-wishlist]").forEach((btn) => {
        const id = btn.getAttribute("data-wishlist");
        const icon = btn.querySelector("i");
        if (ids.includes(String(id))) {
          icon?.classList.replace("far", "fas");
          icon?.classList.add("text-rose-500");
        }
      });
    } catch {
      // silent
    }
  },
};
