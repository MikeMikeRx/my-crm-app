import mongoSanitize from "mongo-sanitize"
import sanitizeHtml from "sanitize-html"

export const sanitizeMiddleware = (app) => {
    const deepSanitizeHtml = (obj) => {
        if (obj === null || typeof obj !== "object") return obj

        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
            const value = obj[key]

            if (typeof value === "string") {
                obj[key] = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                })
            } else if (typeof value === "object") {
                deepSanitizeHtml(value)
            }
        }
        return obj
    }

    app.use((req, res, next) => {
        try {
            if (req.body) req.body = mongoSanitize(req.body)
            if (req.query) req.query = mongoSanitize(req.query)
            if (req.params) req.params = mongoSanitize(req.params)

            deepSanitizeHtml(req.body)
            deepSanitizeHtml(req.query)
            deepSanitizeHtml(req.params)

            next()
        } catch (err) {
            console.error("❌ Sanitization error:", err)
            res.status(400).json({ message: "Invalid input detected" })
        }
    })
}