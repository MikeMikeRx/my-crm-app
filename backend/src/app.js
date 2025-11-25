import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import mongoose from "mongoose"
import morgan from "morgan"
import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import customerRoutes from "./routes/customer.js"
import invoiceRoutes from "./routes/invoice.js"
import quoteRoutes from "./routes/quote.js"
import paymentRoutes from "./routes/payment.js"
import dashboardRoutes from "./routes/dashboard.js"
import errorHandler from "./middleware/errorHandler.js"
import { globalRateLimiter } from "./middleware/rateLimiter.js"
import { sanitizeMiddleware } from "./middleware/sanitizer.js"

const app = express()

// CORS Configuration
const allowedOrigins = [
    "http://localhost:5173", // Vite dev server
    // "https://my-production-domain.com"
]

// Security & Middleware
app.use(helmet({
    contentSecurityPolicy: false, // disabled for backend/frontend testing
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
}))
app.use(compression())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true) // Allow Postman/cURL
        if (allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true, // Alow cookies / auth headers
    optionsSuccessStatus: 200 // Avoid issues with legacy browsers
}))
app.use(express.json())
sanitizeMiddleware(app)
app.use(morgan("dev"))
app.use(globalRateLimiter)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/quotes", quoteRoutes)
app.use("/api/payments", paymentRoutes)

// Health Check
app.get("/health", async (req, res) => {
    const dbState = mongoose.connection.readyState
    const states = ["disconnected", "connected", "connecting", "disconnecting"]

    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        db: states[dbState] || "unknown",
        timestap: new Date().toISOString(),
    })
})

// Global Error Handler
app.use(errorHandler)

export default app