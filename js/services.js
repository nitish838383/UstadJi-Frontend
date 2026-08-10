/**
 * UstadJi - Services Module
 */

const ServicesModule = {
  currentPage: 1,
  currentFilters: {},

  /**
   * Render service card
   */
  renderCard(service) {
    const price = Helper.formatCurrency(service.starting_price || service.price || 0);
    const rating = Number(service.rating) || 0;
    const reviews = service.review_count || service.reviews_count || 0;
    const time = service.estimated_time || service.duration || "1-2 hrs";
    const img = service.image_url || service.image || "/images/service-placeholder.jpg";
    const title = service.title || service.name || "Service";

    return `
      <a href="/service-details.html?id=${service.id}"
         class="group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
         data-animate>
        <div class="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img src="${img}"
               alt="${title}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'">
          ${service.is_popular
            ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">Popular</span>'
            : ""}
        </div>

        <div class="p-4">
          <h3 class="font-semibold text-slate-800 dark:text-white text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
            ${title}
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            ${Helper.truncate(service.description || "", 80)}
          </p>

          <div class="flex items-center gap-2 mb-3">
            <div class="flex items-center gap-0.5 text-sm">${Helper.renderStars(rating)}</div>
            <span class="text-xs text-slate-500">(${reviews})</span>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500">Starting at</span>
              <p class="font-bold text-primary-600 text-lg">${price}</p>
            </div>
            <div class="flex items-center gap-1 text-xs text-slate-500">
              <i class="far fa-clock"></i>
              <span>${time}</span>
            </div>
          </div>

          <button type="button"
                  onclick="event.preventDefault(); event.stopPropagation(); Auth.requireBooking('?service_id=${service.id}')"
                  class="mt-4 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <i class="fas fa-calendar-check"></i> Book Now
          </button>
        </div>
      </a>
    `;
  },

  /**
   * Load and render services list
   */
  async loadList(containerId, params = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentFilters = { ...params };
    container.innerHTML = Helper.skeletonCard(8);

    try {
      const data = await API.services.list(params);
      const services = data.results || data.items || data.data || data || [];
      const total = data.total || data.count || services.length;

      if (!Array.isArray(services) || !services.length) {
        container.innerHTML = Helper.emptyState("No services found", "fa-tools");
        this.updatePagination(0, 1);
        return;
      }

      container.innerHTML = services.map((s) => this.renderCard(s)).join("");
      this.updatePagination(total, params.page || 1);
      Helper.initScrollAnimations?.();
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () =>
        this.loadList(containerId, params)
      );
    }
  },

  /**
   * Pagination
   */
  updatePagination(total, page) {
    const el = document.getElementById("services-pagination");
    if (!el) return;

    const pageSize = CONFIG.PAGE_SIZE || 12;
    const totalPages = Math.ceil(total / pageSize) || 1;
    this.currentPage = page;

    if (totalPages <= 1) {
      el.innerHTML = "";
      return;
    }

    let html = `<div class="flex items-center justify-center gap-2 mt-8">`;

    // Prev
    html += `
      <button onclick="ServicesModule.goToPage(${page - 1})"
              class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}"
              ${page <= 1 ? "disabled" : ""}>
        <i class="fas fa-chevron-left"></i>
      </button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        html += `
          <button onclick="ServicesModule.goToPage(${i})"
                  class="w-10 h-10 rounded-lg font-medium ${
                    i === page
                      ? "bg-primary-600 text-white"
                      : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }">
            ${i}
          </button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="px-1 text-slate-400">…</span>`;
      }
    }

    // Next
    html += `
      <button onclick="ServicesModule.goToPage(${page + 1})"
              class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}"
              ${page >= totalPages ? "disabled" : ""}>
        <i class="fas fa-chevron-right"></i>
      </button>`;

    html += `</div>`;
    el.innerHTML = html;
  },

  goToPage(page) {
    if (page < 1) return;
    this.loadList("services-grid", { ...this.currentFilters, page });
    Helper.scrollToTop?.();
  },

  /**
   * Apply filters from the UI
   */
  applyFilters() {
    const params = { page: 1 };

    const search = document.getElementById("service-search")?.value?.trim();
    const category = document.getElementById("filter-category")?.value;
    const rating = document.getElementById("filter-rating")?.value;
    const priceMin = document.getElementById("filter-price-min")?.value;
    const priceMax = document.getElementById("filter-price-max")?.value;
    const sort = document.getElementById("filter-sort")?.value;
    const popular = document.getElementById("filter-popular")?.checked;

    // Also support category from URL
    const urlCategory = Helper.getQueryParam("category");

    if (search) params.q = search;
    if (category) params.category = category;
    else if (urlCategory) params.category = urlCategory;
    if (rating) params.min_rating = rating;
    if (priceMin) params.min_price = priceMin;
    if (priceMax) params.max_price = priceMax;
    if (sort) params.sort = sort;
    if (popular) params.is_popular = true;

    this.loadList("services-grid", params);
  },

  /**
   * Clear all filters
   */
  clearFilters() {
    const ids = [
      "service-search",
      "filter-category",
      "filter-rating",
      "filter-price-min",
      "filter-price-max",
      "filter-sort",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const popular = document.getElementById("filter-popular");
    if (popular) popular.checked = false;

    this.loadList("services-grid", { page: 1 });
  },

  /**
   * Load categories (for filter dropdown + homepage grid)
   */
  async loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const data = await API.services.categories();
      const cats = data.results || data.items || data || [];

      if (!Array.isArray(cats) || !cats.length) {
        container.innerHTML = Helper.emptyState("No categories", "fa-th-large");
        return;
      }

      // If this is a filter <select>, populate options
      if (container.tagName === "SELECT") {
        const current = Helper.getQueryParam("category") || "";
        container.innerHTML =
          `<option value="">All Categories</option>` +
          cats
            .map(
              (c) =>
                `<option value="${c.id || c.slug}" ${
                  String(c.id || c.slug) === String(current) ? "selected" : ""
                }>${c.name || c.title}</option>`
            )
            .join("");
        return;
      }

      // Otherwise render as category cards
      container.innerHTML = cats
        .map(
          (c) => `
          <a href="/services.html?category=${c.id || c.slug}"
             class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-300 hover:shadow-md transition-all group"
             data-animate>
            <div class="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-2xl group-hover:scale-110 transition-transform">
              <i class="${c.icon || "fas fa-tools"}"></i>
            </div>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
              ${c.name || c.title}
            </span>
          </a>
        `
        )
        .join("");

      Helper.initScrollAnimations?.();
    } catch (err) {
      console.error("Categories error:", err);
      container.innerHTML = Helper.errorState(
        "Failed to load categories",
        () => this.loadCategories(containerId)
      );
    }
  },

  /**
   * Initialize filters page (call this on services.html)
   */
  async initFilters() {
    // Load categories into the filter dropdown
    await this.loadCategories("filter-category");

    // Apply any category coming from URL
    const urlCategory = Helper.getQueryParam("category");
    if (urlCategory) {
      const select = document.getElementById("filter-category");
      if (select) select.value = urlCategory;
    }

    // Bind search on Enter
    const searchInput = document.getElementById("service-search");
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyFilters();
        }
      });
    }

    // Initial load with URL filters
    this.applyFilters();
  },

  /**
   * Load service details page
   */
  async loadDetails() {
    const id = Helper.getQueryParam("id");
    if (!id) {
      window.location.href = "/services.html";
      return;
    }

    const main = document.getElementById("service-details-content");
    if (!main) return;

    main.innerHTML = `
      <div class="animate-pulse space-y-6">
        <div class="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      </div>
    `;

    try {
      const service = await API.services.get(id);
      this.renderDetails(service);
    } catch (err) {
      main.innerHTML = Helper.errorState(err.message, () => this.loadDetails());
    }
  },

  /**
   * Render full service details
   */
  renderDetails(service) {
    const main = document.getElementById("service-details-content");
    if (!main) return;

    const price = Helper.formatCurrency(service.starting_price || service.price || 0);
    const rating = Number(service.rating) || 0;
    const reviews = service.review_count || service.reviews_count || 0;
    const img =
      service.image_url ||
      service.image ||
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop";
    const title = service.title || service.name || "Service";
    const includes = Array.isArray(service.includes) ? service.includes : [];

    main.innerHTML = `
      <div class="grid lg:grid-cols-2 gap-8">
        <div class="rounded-2xl overflow-hidden shadow-lg">
          <img src="${img}"
               alt="${title}"
               class="w-full h-80 object-cover"
               onerror="this.src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop'">
        </div>

        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">${title}</h1>

          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-1">${Helper.renderStars(rating)}</div>
            <span class="text-sm text-slate-500">
              ${rating.toFixed(1)} (${reviews} reviews)
            </span>
          </div>

          <p class="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            ${service.description || ""}
          </p>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1">Starting Price</p>
              <p class="text-2xl font-bold text-primary-600">${price}</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1">Estimated Time</p>
              <p class="text-lg font-semibold text-slate-800 dark:text-white">
                ${service.estimated_time || service.duration || "1-2 hrs"}
              </p>
            </div>
          </div>

          ${includes.length ? `
            <div class="mb-6">
              <h3 class="font-semibold text-slate-800 dark:text-white mb-2">What's Included</h3>
              <ul class="space-y-2">
                ${includes
                  .map(
                    (item) => `
                  <li class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <i class="fas fa-check-circle text-emerald-500"></i> ${item}
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          ` : ""}

          <button type="button"
                  onclick="Auth.requireBooking('?service_id=${service.id}')"
                  class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary-600/25">
            <i class="fas fa-calendar-check"></i> Book This Service
          </button>
        </div>
      </div>
    `;
  },
};