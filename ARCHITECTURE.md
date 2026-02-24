# FertilityOS Architecture Overview

## Environment
- Ubuntu VPS
- Nginx serving static frontend
- Node.js backend running on port 3000
- PM2 process manager
- Reverse proxy: /api → localhost:3000

## Frontend
Location: /var/www/ivf-platform/public
- Static HTML, CSS, JS
- login.html
- dashboard.html
- Uses fetch() to call /api/* endpoints

## Backend
Running on port 3000
Managed via PM2
Provides:
- POST /auth/login
- Other API routes

## Nginx
Server:
- Serves static files from /public
- Proxies /api to backend

## Authentication Flow
Browser → /api/auth/login
Nginx → localhost:3000/auth/login
Backend returns JWT
Frontend stores token in localStorage

## Future Goals
- Multi-clinic support
- Role-based access control
- IVF modules
- Billing
- Lab management
- Enterprise SaaS model
