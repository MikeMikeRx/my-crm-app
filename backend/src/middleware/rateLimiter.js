import rateLimit from "express-rate-limit"

// ============================================================================
// AUTHENTICATION RATE LIMITER
// ============================================================================
// Protects authentication endpoints (login, register) from brute force attacks
// Usage: Apply to /auth routes (login, register, password reset)
export const authRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window (testing) / 15 min for production
    max: 10, // 10 attempts (testing) / 5 attempts for production
    message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Include rate limit info in response headers
    legacyHeaders: false // Disable deprecated 'X-RateLimit-*' headers
})

// ============================================================================
// GLOBAL RATE LIMITER
// ============================================================================
// General rate limiting for all API endpoints
// Usage: Apply globally to all routes to prevent API abuse
export const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 100, // 100 requests per minute per IP
    message: {
        success: false,
        message: "Too many requests, max 100/min",
    },
    standardHeaders: true, // Include rate limit info in response headers
    legacyHeaders: false, // Disable deprecated 'X-RateLimit-*' headers
})
