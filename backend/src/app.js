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

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
// Define allowed origins for cross-origin requests
const allowedOrigins = [
    "http://localhost:5173", // Vite dev server
    // "https://my-production-domain.com" // Add production URL when deploying
]

// ============================================================================
// SECURITY & MIDDLEWARE
// ============================================================================
// Helmet: Sets various HTTP headers for security
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for backend/frontend testing
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" }, // Prevent clickjacking
}))

// Compression: Compress response bodies
app.use(compression())

// CORS: Configure cross-origin resource sharing
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true) // Allow requests with no origin (Postman, cURL)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true, // Allow cookies and auth headers
    optionsSuccessStatus: 200 // Avoid issues with legacy browsers
}))

// JSON parsing: Parse incoming JSON payloads
app.use(express.json())

// Input sanitization: Sanitize all incoming data (NoSQL injection, XSS prevention)
sanitizeMiddleware(app)

// Logging: HTTP request logging (development mode)
app.use(morgan("dev"))

// Rate limiting: Global rate limiting (100 requests/min per IP)
app.use(globalRateLimiter)

// ============================================================================
// API ROUTES
// ============================================================================
app.use("/api/auth", authRoutes)           // Authentication (register, login, profile)
app.use("/api/admin", adminRoutes)         // Admin-only routes (prepared for future features)
app.use("/api/dashboard", dashboardRoutes) // Dashboard analytics
app.use("/api/customers", customerRoutes)  // Customer management
app.use("/api/invoices", invoiceRoutes)    // Invoice management
app.use("/api/quotes", quoteRoutes)        // Quote management
app.use("/api/payments", paymentRoutes)    // Payment management

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
// GET /health
// Returns server status, uptime, and database connection state
app.get("/health", async (req, res) => {
    const dbState = mongoose.connection.readyState
    const states = ["disconnected", "connected", "connecting", "disconnecting"]

    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        db: states[dbState] || "unknown",
        timestamp: new Date().toISOString(),
    })
})

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
// Must be last middleware - catches all errors from routes and middleware
app.use(errorHandler)

export default app
