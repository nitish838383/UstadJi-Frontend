/**
 * UstadJi - Services Module
 */

const ServicesModule = {
  /**
   * Render service card
   */
  renderCard(service) {
    const price = Helper.formatCurrency(service.starting_price || service.price || 0);
    const rating = service.rating || 0;
    const reviews = service.review_count || service.reviews_count || 0;
    const time = service.estimated_time || service.duration || "1-2 hrs";
    const img = service.image_url || service.image || "/images/service-placeholder.jpg";

    return `
      <a href="/service-details.html?id=${service.id}" class="group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700" data-animate>
        <div class="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img src="${img}" alt="${service.title || service.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'">
          ${service.is_popular ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">Popular</span>' : ""}
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-slate-800 dark:text-white text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">${service.title || service.name}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${Helper.truncate(service.description || "", 80)}</p>
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
          <button onclick="event.preventDefault(); window.location.href='/booking.html?service_id=${service.id}'" 
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

    container.innerHTML = Helper.skeletonCard(8);

    try {
      const data = await API.services.list(params);
      const services = data.results || data.items || data.data || data || [];

      if (!services.length) {
        container.innerHTML = Helper.emptyState("No services found", "fa-tools");
        return;
      }

      container.innerHTML = services.map((s) => this.renderCard(s)).join("");
      Helper.initScrollAnimations();
    } catch (err) {
      container.innerHTML = Helper.errorState(err.message, () => this.loadList(containerId, params));
    }
  },

  /**
   * Load categories
   */
  async loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const data = await API.services.categories();
      const cats = data.results || data.items || data || [];

      if (!cats.length) {
        container.innerHTML = Helper.emptyState("No categories", "fa-th-large");
        return;
      }

      container.innerHTML = cats
        .map(
          (c) => `
        <a href="/services.html?category=${c.id || c.slug}" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-300 hover:shadow-md transition-all group" data-animate>
          <div class="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-2xl group-hover:scale-110 transition-transform">
            <i class="${c.icon || "fas fa-tools"}"></i>
          </div>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">${c.name || c.title}</span>
        </a>
      `
        )
        .join("");
      Helper.initScrollAnimations();
    } catch (err) {
      console.error("Categories error:", err);
    }
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

  renderDetails(service) {
    const main = document.getElementById("service-details-content");
    if (!main) return;

    const price = Helper.formatCurrency(service.starting_price || service.price || 0);
    const rating = service.rating || 0;
    const reviews = service.review_count || 0;
    const img = service.image_url || service.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop";

    main.innerHTML = `
      <div class="grid lg:grid-cols-2 gap-8">
        <div class="rounded-2xl overflow-hidden shadow-lg">
          <img src="${img}" alt="${service.title || service.name}" class="w-full h-80 object-cover" 
               onerror="this.src='https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop'">
        </div>
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">${service.title || service.name}</h1>
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-1">${Helper.renderStars(rating)}</div>
            <span class="text-sm text-slate-500">${rating.toFixed(1)} (${reviews} reviews)</span>
          </div>
          <p class="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">${service.description || ""}</p>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1">Starting Price</p>
              <p class="text-2xl font-bold text-primary-600">${price}</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p class="text-xs text-slate-500 mb-1">Estimated Time</p>
              <p class="text-lg font-semibold text-slate-800 dark:text-white">${service.estimated_time || "1-2 hrs"}</p>
            </div>
          </div>

          ${service.includes ? `
            <div class="mb-6">
              <h3 class="font-semibold text-slate-800 dark:text-white mb-2">What's Included</h3>
              <ul class="space-y-2">
                ${(Array.isArray(service.includes) ? service.includes : []).map(i => `
                  <li class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <i class="fas fa-check-circle text-emerald-500"></i> ${i}
                  </li>
                `).join("")}
              </ul>
            </div>
          ` : ""}

          <a href="/booking.html?service_id=${service.id}" 
             class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary-600/25">
            <i class="fas fa-calendar-check"></i> Book This Service
          </a>
        </div>
      </div>
    `;
  },
};
