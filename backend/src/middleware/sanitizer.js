import mongoSanitize from "mongo-sanitize"
import sanitizeHtml from "sanitize-html"

// ============================================================================
// INPUT SANITIZATION MIDDLEWARE
// ============================================================================
// Sanitizes all incoming request data to prevent:
// - NoSQL injection attacks (via mongo-sanitize)
// - XSS attacks (via sanitize-html)
// Usage: Apply globally to sanitize req.body, req.params, req.query
export const sanitizeMiddleware = (app) => {
    // ========================================================================
    // RECURSIVE OBJECT CLEANING FUNCTION
    // ========================================================================
    // Traverses nested objects and sanitizes all string values
    const cleanObject = (obj) => {
        // Skip non-objects
        if (!obj || typeof obj !== "object") return

        // Iterate through all object properties
        for (const key in obj) {
            if (typeof obj[key] === "string") {
                // Remove all HTML tags and attributes (XSS prevention)
                obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} })
                // Remove MongoDB operators like $ne, $gt (NoSQL injection prevention)
                obj[key] = mongoSanitize(obj[key])
            } else if (typeof obj[key] === "object") {
                // Recursively clean nested objects
                cleanObject(obj[key])
            }
        }
    }

    // ========================================================================
    // APPLY SANITIZATION MIDDLEWARE
    // ========================================================================
    // Sanitize all incoming request data before it reaches routes
    app.use((req, res, next) => {
        try {
            // Clean request body (POST/PUT data)
            if (req.body) cleanObject(req.body)
            // Clean URL parameters (/:id)
            if (req.params) cleanObject(req.params)
            // Clean query strings (?search=...)
            if (req.query) cleanObject(req.query)

            // Continue to next middleware
            next()
        } catch (err) {
            // Handle sanitization errors
            console.error("❌ Sanitization error:", err)
            res.status(400).json({ message: "Invalid input detected" })
        }
    })
}
