# Vitesse CRM/ERM

Full-stack CRM/ERP application for self-employed professionals and small businesses. Manages the full lifecycle from customers and quotes to invoices, payments, and real-time analytics. Built with Node.js, MongoDB, and Vite.

## Screenshot
![Dashboard](./screenshots/Dashboard.png)
- more screenshots in ./screenshots

## Backend

- Full business lifecycle management (Customers → Quotes → Invoices → Payments)

- Secure JWT-based authentication with role-based access (admin/user)

- Customer relationship management (CRUD)

- Quote management with:

    - Automatic subtotal, tax, and total calculations

    - Automatic expiry tracking and status updates

- Invoice management with:

    - Quote-to-invoice conversion with validation

    - Auto-overdue detection based on due dates

    - Real-time status updates (unpaid / paid / overdue)

- Payment processing with:

    - Partial and multiple payments per invoice

    - Automatic invoice status reconciliation

    - Multiple payment methods (cash, card, bank transfer, PayPal)

- Centralized dashboard analytics API:

    - Monthly trends and totals

    - Status distributions (quotes, invoices, payments)

    - Outstanding balance calculations

- Security and reliability:

    - Rate limiting and request validation

    - Input sanitization (NoSQL injection & XSS protection)

    - Centralized error handling and logging

##

# Frontend

- React + TypeScript single-page application

- Secure authentication flow with protected routes

- Role-aware UI (admin vs user access)

- Customer, quote, invoice, and payment management interfaces

- Quote and invoice forms with dynamic line items and tax calculations

- Real-time dashboard with:

    - Business KPIs and summary cards

    - Status distribution charts

    - Recent activity previews

- State management with Zustand

- Form handling with React Hook Form + Zod validation

- Responsive, production-ready UI using Ant Design and Tailwind CSS

##

# Tech Stack
### Backend
- Node.js (ES Modules)
- Express.js
- MongoDB with Mongoose
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- Security & middleware:
    - Helmet
    - express-rate-limit
    - mongo-sanitizer
    - sanitize-html
    - express-validator
- Utilities:
    - Morgan(logging)
    - dayjs (date handling)
    - dotenv
    - compression


##

### Frontend
- React with TypeScript
- Vite (build tool)
- Ant Design (UI components)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router
- Axios (API communication)
- React Hook Form + Zod (forms & validation)

