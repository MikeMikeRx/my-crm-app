![Logo](./frontend/src/assets/images/logo/Logo-long.png)

Vitesse is a full-stack CRM/ERP application built for self-employed professionals and small businesses.  
It manages the complete business workflow from customers and quotes to invoices, payments, and real-time analytics.

Built with Node.js and MongoDB on the backend, and React, TypeScript with Vite on the frontend.

---

###  📊 Features

- 👥 Customer & company management
- 📄 Quotes with automatic totals and expiry tracking
- 🧾 Invoices with quote conversion and overdue detection
- 💳 Payments (partial, multiple, multi-method)
- 💰 Revenue tracking and outstanding balances
- 📈 Real-time dashboard with KPIs and trends
- 🔐 Secure authentication with role-based access
- 🛡 Input validation, rate limiting, and error handling

---

![Dashboard](./screenshots/Dashboard.png)  
More screenshots available in `./screenshots`.

---

## ⚙️ Tech Stack

### Backend
- Node.js (ES Modules), Express.js
- MongoDB, Mongoose
- JWT authentication, bcryptjs
- Security: Helmet, express-rate-limit, mongo-sanitize, sanitize-html, express-validator
- Utilities: Morgan, dayjs, dotenv, compression

### Frontend
- React, TypeScript, Vite
- Ant Design, Tailwind CSS
- Zustand, React Router
- Axios
- React Hook Form, Zod

---

## 🏗 Architecture Overview

Vitesse is built as a clear frontend / backend split with strict responsibility boundaries.

### Backend
- REST API built with Express (ES Modules)
- MongoDB with Mongoose models
- Stateless authentication via JWT access tokens
- Business rules enforced server-side (not only in UI)

Key backend responsibilities:
- Validate and sanitize all input
- Enforce domain rules (e.g. invoice creation constraints)
- Protect all resources with auth middleware
- Return consistent API errors

### Frontend
- React + TypeScript SPA
- API layer isolated from UI components
- Global auth state managed with Zustand
- Forms validated with React Hook Form + Zod
- Ant Design used for layout and components

The frontend never assumes business rules — all critical rules are enforced by the backend.

---

## 🧪 Testing Strategy

This project includes automated tests on both backend and frontend.

### Backend unit and integration tests
- Jest + Supertest
- mongodb-memory-server for isolated test database
- Auth flow tested (register, login, protected routes)
- CRUD endpoints tested with authorization
- Business rules tested (e.g. preventing invoice creation from declined/expired quotes)
- Tests drive fixes for discovered domain issues


Backend tests ensure:
- Security rules are enforced server-side
- Business logic cannot be bypassed by clients
- Changes do not introduce regressions

### Frontend component tests
- Vitest + React Testing Library
- User-focused tests (not implementation details)
- Login form validation tested
- Customer list rendering tested with mocked API

Frontend tests ensure:
- Critical user flows work as expected
- UI logic is stable during refactors

---

## 🔁 Continuous Integration

The project includes a GitHub Actions CI pipeline that runs on every push and pull request.

CI checks:
- Backend tests
- Frontend tests

This ensures the main branch always stays in a working, tested state.

---

## 🐳 Run with Docker

```bash
Start: docker compose up --build

Frontend: http://localhost:5173

Backend: http://localhost:8888

Stop: docker compose down
```
---
## 🌱 Demo Data

You can populate the database with demo data for quick evaluation.

Demo credentials:
- Email: demo@vitesse.app
- Password: demo123

Seed database:
```bash
# Local development
cd backend && npm run seed

# Docker
docker compose exec backend node scripts/seed.js
```
---
##  Installation
👉 See [SETUP.md](SETUP.md) for full setup instructions.