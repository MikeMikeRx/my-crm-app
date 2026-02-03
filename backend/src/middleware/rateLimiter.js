import rateLimit from "express-rate-limit"

const AUTH_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 60 * 1000
const AUTH_MAX_REQUESTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10
const GLOBAL_WINDOW_MS = parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 60 * 1000
const GLOBAL_MAX_REQUESTS = parseInt(process.env.GLOBAL_RATE_LIMIT_MAX) || 100

// AUTHENTICATION RATE LIMITER
export const authRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: AUTH_MAX_REQUESTS,
    message: {
        success: false,
        message: `Too many attempts from this IP, please try again after ${AUTH_WINDOW_MS / 1000} seconds`
    },
    standardHeaders: true,
    legacyHeaders: false
})

// GLOBAL RATE LIMITER
export const globalRateLimiter = rateLimit({
    windowMs: GLOBAL_WINDOW_MS,
    max: GLOBAL_MAX_REQUESTS,
    message: {
        success: false,
        message: `Too many requests, max ${GLOBAL_MAX_REQUESTS} per ${GLOBAL_WINDOW_MS / 1000} seconds`,
    },
    standardHeaders: true,
    legacyHeaders: false,
})
