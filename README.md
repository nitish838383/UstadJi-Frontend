# UstadJi – Frontend Service Booking Platform

Production-ready, mobile-first frontend for a home services booking platform inspired by Urban Company.

## Features

- **Public**: Home, Services, Workers, Profiles, Contact, FAQ, About
- **User Auth**: Register, Login, Forgot/Reset Password
- **Worker Auth**: Professional Register & Login
- **Booking Flow**: Service → Worker → Address → Date/Time → Confirm
- **Dashboards**: User & Worker with stats, bookings, profile, KYC
- **Notifications**, **Reviews**, **Wishlist**, **Coupons**, **Payments UI**
- **Dark Mode**, Glassmorphism, Responsive, Toast, Skeleton loaders

## Tech Stack

- HTML5 + Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+, modular)
- Fetch API (centralized in `js/api.js`)
- Font Awesome + Google Fonts + Chart.js ready

## Quick Start

1. Clone / download this folder
2. Open `js/config.js` and set your API base URL:

```js
const CONFIG = {
  API_BASE_URL: "https://your-fastapi-backend.com/api",
  // ...
};
```

3. Deploy to Netlify (drag & drop the folder, or connect GitHub)
4. Or open `index.html` via any static server

## Folder Structure

```
/
├── index.html, about.html, services.html, ...
├── css/main.css
├── js/
│   ├── config.js      ← Change API URL here only
│   ├── api.js         ← All REST endpoints
│   ├── auth.js
│   ├── services.js, workers.js, booking.js
│   ├── dashboard.js, notification.js, review.js
│   ├── profile.js, validation.js, helper.js
│   └── layout.js
├── images/, icons/, assets/, uploads/
└── netlify.toml
```

## API Contract

All pages consume REST APIs. Expected endpoints (FastAPI compatible):

- `POST /auth/register`, `/auth/login`, `/auth/worker/*`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/me`
- `GET /services`, `/services/:id`, `/services/categories`
- `GET /workers`, `/workers/:id`, `/workers/:id/reviews`
- `POST /bookings`, `GET /bookings`, worker actions (`accept`, `reject`, `start`, `complete`)
- `GET/PUT /profile`, addresses, KYC upload
- `GET /notifications`, `POST /reviews`, `GET /dashboard/user|worker`
- `POST /contact`, `/coupons/validate`, `/wishlist`

Responses should follow common patterns: `{ results: [], total }` or direct objects. JWT Bearer tokens expected.

## Deploy on Netlify

1. Push to GitHub
2. New site from Git → select repo
3. Publish directory: `/` (root)
4. Deploy

No Node.js build step required.

## License

MIT – Built for production use with any FastAPI backend.
