/**
 * UstadJi - Central API Configuration
 * Change only API_BASE_URL to connect to any FastAPI backend.
 */
const CONFIG = {
  // Prefer NO trailing slash. Endpoints already start with "/"
  // Include "/api" if your FastAPI app mounts routes under /api
  API_BASE_URL: "https://ustaji-backend.onrender.com/api",

  APP_NAME: "UstadJi",
  APP_TAGLINE: "Your Trusted Home Service Partner",

  // Auth / storage keys
  TOKEN_KEY: "ustadji_access_token",
  REFRESH_TOKEN_KEY: "ustadji_refresh_token",
  USER_KEY: "ustadji_user",
  WORKER_KEY: "ustadji_worker",
  ROLE_KEY: "ustadji_role",

  // Other
  THEME_KEY: "ustadji_theme",
  CART_KEY: "ustadji_cart",
  WISHLIST_KEY: "ustadji_wishlist",

  DEFAULT_CURRENCY: "₹",
  DEFAULT_LOCALE: "en-IN",
  PAGE_SIZE: 12,
  REQUEST_TIMEOUT: 30000,   // 30s is fine for slower free-tier backends
  RETRY_ATTEMPTS: 2,
};

// Freeze to prevent accidental mutation
Object.freeze(CONFIG);