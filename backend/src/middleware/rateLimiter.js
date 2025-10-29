import rateLimit from "express-rate-limit"

export const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 min for testing / 15 min when it's done
    max: 10, // 10 for testing / 5 attemps when it's done
    message: {
        succes: false,
        message: "Too many attemps from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Rate limit info in headers
    legacyHeaders: false // Disable the 'X-RateLimit-*'
})

export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 100, // 100 requests/min
    message: {
        succes: false,
        message: "Too many requests, max 100/min",
    },
    standardHeaders: true,
    legacyHeaders: false,
})