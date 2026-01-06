// ============================================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================================================
// Centralized error handling for all Express errors
// Usage: Apply as the last middleware in app (after all routes)
// Catches errors from async routes, validation failures, and thrown errors
const errorHandler = (err, req, res, next) => {
    // ========================================================================
    // LOG ERROR DETAILS
    // ========================================================================
    // Log error with context (message, stack trace, request info)
    // Stack trace only shown in development environment
    console.error("❌ Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : "hidden",
        path: req.originalUrl,
        method: req.method
    })

    // ========================================================================
    // SEND ERROR RESPONSE
    // ========================================================================
    // Status code: use error's statusCode or default to 500
    // Stack trace: only included in development for debugging
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    })
}

export default errorHandler
