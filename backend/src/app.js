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

const allowedOrigins = [
    "http://localhost:5173",
]

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
}))

app.use(compression())

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
    optionsSuccessStatus: 200
}))

app.use(express.json())

sanitizeMiddleware(app)

app.use(morgan("dev"))

app.use(globalRateLimiter)

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/quotes", quoteRoutes)
app.use("/api/payments", paymentRoutes)

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

app.use(errorHandler)

export default app
