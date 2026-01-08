import rateLimit from "express-rate-limit"

// AUTHENTICATION RATE LIMITER
export const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window (testing) / 15 min for production
    max: 10, // 10 attempts (testing) / 5 attempts for production
    message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false
})

// GLOBAL RATE LIMITER
export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests, max 100/min",
    },
    standardHeaders: true,
    legacyHeaders: false,
})
