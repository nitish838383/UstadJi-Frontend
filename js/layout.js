/**
 * UstadJi - Shared Layout (Header + Footer)
 */

const Layout = {
  init() {
    this.injectHeader();
    this.injectFooter();
    this.bindMobileNav();
    this.bindThemeToggle();
    // Run after header is in DOM so Login/Sign Up hide correctly when logged in
    Auth.updateHeaderUI();
  },

  injectHeader() {
    const placeholder = document.getElementById("site-header");
    if (!placeholder) return;

    placeholder.innerHTML = `
      <header class="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-slate-700/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <a href="/index.html" class="flex items-center gap-2.5 group">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform">
                <i class="fas fa-home text-white text-sm"></i>
              </div>
              <span class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ustad<span class="text-primary-600">Ji</span></span>
            </a>

            <!-- Desktop Nav -->
            <nav class="hidden lg:flex items-center gap-1">
              <a href="/index.html" class="nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Home</a>
              <a href="/services.html" class="nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Services</a>
              <a href="/workers.html" class="nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Professionals</a>
              <a href="/about.html" class="nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">About</a>
              <a href="/contact.html" class="nav-link px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Contact</a>
            </nav>

            <!-- Right Actions -->
            <div class="flex items-center gap-2">
              <!-- Search -->
              <button onclick="Layout.toggleSearch()" class="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Search">
                <i class="fas fa-search"></i>
              </button>

              <!-- Theme -->
              <button onclick="Helper.toggleTheme()" class="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle theme">
                <i class="fas fa-moon dark:hidden"></i>
                <i class="fas fa-sun hidden dark:inline"></i>
              </button>

              <!-- Notifications (auth) -->
              <a href="/notifications.html" class="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden" data-auth="user" data-auth-also="worker" title="Notifications">
                <i class="fas fa-bell"></i>
                <span data-notification-badge class="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center hidden">0</span>
              </a>

              <!-- Guest (Auth.updateHeaderUI hides after login) -->
              <div id="guest-auth-actions" class="hidden sm:flex items-center gap-2" data-auth="guest">
                <a href="/login.html" class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600 transition-colors">Login</a>
                <a href="/register.html" class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-sm">Sign Up</a>
              </div>

              <!-- User menu -->
              <div class="relative hidden" data-auth="user" id="user-menu-wrapper">
                <button onclick="Layout.toggleUserMenu()" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
                    <img data-user-avatar class="w-full h-full object-cover hidden" alt="">
                  </div>
                  <span class="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-200" data-user-name>User</span>
                  <i class="fas fa-chevron-down text-xs text-slate-400"></i>
                </button>
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                  <a href="/dashboard-user.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-th-large w-5 text-slate-400"></i> Dashboard</a>
                  <a href="/booking-history.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-history w-5 text-slate-400"></i> My Bookings</a>
                  <a href="/dashboard-user.html#profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-user w-5 text-slate-400"></i> Profile</a>
                  <hr class="my-1 border-slate-100 dark:border-slate-700">
                  <button onclick="Auth.logout()" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"><i class="fas fa-sign-out-alt w-5"></i> Logout</button>
                </div>
              </div>

              <!-- Worker menu -->
              <div class="relative hidden" data-auth="worker" id="worker-menu-wrapper">
                <button onclick="Layout.toggleWorkerMenu()" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center">
                    <img data-user-avatar class="w-full h-full object-cover hidden" alt="">
                  </div>
                  <span class="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-200" data-user-name>Worker</span>
                  <i class="fas fa-chevron-down text-xs text-slate-400"></i>
                </button>
                <div id="worker-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                  <a href="/dashboard-worker.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-th-large w-5 text-slate-400"></i> Dashboard</a>
                  <a href="/dashboard-worker.html#bookings" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-clipboard-list w-5 text-slate-400"></i> Bookings</a>
                  <a href="/dashboard-worker.html#profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"><i class="fas fa-user w-5 text-slate-400"></i> Profile</a>
                  <hr class="my-1 border-slate-100 dark:border-slate-700">
                  <button onclick="Auth.logout()" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"><i class="fas fa-sign-out-alt w-5"></i> Logout</button>
                </div>
              </div>

              <!-- Mobile menu btn -->
              <button onclick="Layout.toggleMobileNav()" class="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <i class="fas fa-bars text-lg" id="mobile-menu-icon"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Nav -->
        <div id="mobile-nav" class="hidden lg:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div class="px-4 py-3 space-y-1">
            <a href="/index.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">Home</a>
            <a href="/services.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">Services</a>
            <a href="/workers.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">Professionals</a>
            <a href="/about.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">About</a>
            <a href="/contact.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">Contact</a>
            <a href="/faq.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">FAQ</a>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800" data-auth="guest">
              <a href="/login.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600">Login</a>
              <a href="/register.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600">Sign Up</a>
              <a href="/worker-login.html" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-600">Professional Login</a>
            </div>
          </div>
        </div>

        <!-- Search Overlay -->
        <div id="search-overlay" class="hidden absolute inset-x-0 top-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg p-4">
          <div class="max-w-2xl mx-auto relative">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" id="global-search-input" placeholder="Search services or professionals…" 
                   class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                   onkeydown="if(event.key==='Enter') Layout.doSearch()">
            <button onclick="Layout.doSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Search</button>
          </div>
        </div>
      </header>
    `;

    // Fix data-auth for notifications (show for both)
    document.querySelectorAll("[data-auth-also]").forEach((el) => {
      // handled in updateHeaderUI extension
    });
  },

  injectFooter() {
    const placeholder = document.getElementById("site-footer");
    if (!placeholder) return;

    placeholder.innerHTML = `
      <footer class="bg-slate-900 text-slate-300 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="col-span-2 md:col-span-1">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <i class="fas fa-home text-white text-sm"></i>
                </div>
                <span class="text-lg font-bold text-white">UstadJi</span>
              </div>
              <p class="text-sm text-slate-400 leading-relaxed">Your trusted partner for all home services. Quality professionals at your doorstep.</p>
              <div class="flex gap-3 mt-4">
                <a href="#" class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors"><i class="fab fa-instagram"></i></a>
                <a href="#" class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors"><i class="fab fa-twitter"></i></a>
                <a href="#" class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary-600 transition-colors"><i class="fab fa-youtube"></i></a>
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-white mb-4">Services</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="/services.html" class="hover:text-primary-400 transition-colors">All Services</a></li>
                <li><a href="/services.html?category=electrician" class="hover:text-primary-400 transition-colors">Electrician</a></li>
                <li><a href="/services.html?category=plumber" class="hover:text-primary-400 transition-colors">Plumber</a></li>
                <li><a href="/services.html?category=cleaning" class="hover:text-primary-400 transition-colors">Home Cleaning</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-white mb-4">Company</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="/about.html" class="hover:text-primary-400 transition-colors">About Us</a></li>
                <li><a href="/contact.html" class="hover:text-primary-400 transition-colors">Contact</a></li>
                <li><a href="/faq.html" class="hover:text-primary-400 transition-colors">FAQ</a></li>
                <li><a href="/worker-register.html" class="hover:text-primary-400 transition-colors">Become a Professional</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-white mb-4">Legal</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="/privacy-policy.html" class="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms.html" class="hover:text-primary-400 transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; ${new Date().getFullYear()} UstadJi. All rights reserved.</p>
            <p>Made with <i class="fas fa-heart text-rose-500"></i> for India</p>
          </div>
        </div>
      </footer>
    `;
  },

  toggleMobileNav() {
    const nav = document.getElementById("mobile-nav");
    const icon = document.getElementById("mobile-menu-icon");
    nav?.classList.toggle("hidden");
    if (icon) {
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    }
  },

  toggleSearch() {
    document.getElementById("search-overlay")?.classList.toggle("hidden");
    document.getElementById("global-search-input")?.focus();
  },

  doSearch() {
    const q = document.getElementById("global-search-input")?.value?.trim();
    if (q) window.location.href = `/services.html?q=${encodeURIComponent(q)}`;
  },

  toggleUserMenu() {
    document.getElementById("user-dropdown")?.classList.toggle("hidden");
    document.getElementById("worker-dropdown")?.classList.add("hidden");
  },

  toggleWorkerMenu() {
    document.getElementById("worker-dropdown")?.classList.toggle("hidden");
    document.getElementById("user-dropdown")?.classList.add("hidden");
  },

  bindMobileNav() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#user-menu-wrapper")) {
        document.getElementById("user-dropdown")?.classList.add("hidden");
      }
      if (!e.target.closest("#worker-menu-wrapper")) {
        document.getElementById("worker-dropdown")?.classList.add("hidden");
      }
    });
  },

  bindThemeToggle() {
    // already in helper
  },
};

document.addEventListener("DOMContentLoaded", () => Layout.init());
