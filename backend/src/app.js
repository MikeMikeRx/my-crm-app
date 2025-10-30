import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import authRoutes from "./routes/auth.js"
import customerRoutes from "./routes/customer.js"
import invoiceRoutes from "./routes/invoice.js"
import quoteRoutes from "./routes/quote.js"
import paymentRoutes from "./routes/payment.js"
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
app.use("/api/customers", customerRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/quotes", quoteRoutes)
app.use("/api/payments", paymentRoutes)

// Health Check
app.get("/", (req, res) => res.send({ status: "ok", message: "API is running" }))

// Global Error Handler
app.use(errorHandler)

export default app