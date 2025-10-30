import mongoSanitize from "mongo-sanitize"
import sanitizeHtml from "sanitize-html"

export const sanitizeMiddleware = (app) => {
    const cleanObject = (obj) => {
        if (!obj || typeof obj !== "object") return

        for (const key in obj) {
            if (typeof obj[key] === "string") {
                obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} })
                obj[key] = mongoSanitize(obj[key])
            } else if (typeof obj[key] === "object") {
                cleanObject(obj[key])
            }
        }
    }

    app.use((req, res, next) => {
        try {
            if (req.body) cleanObject(req.body)
            if (req.params) cleanObject(req.params)
            if (req.query) cleanObject(req.query)
            next()
        } catch (err) {
            console.error("❌ Sanitization error:", err)
            res.status(400).json({ message: "Invalid input detected" })
        }
    })
}