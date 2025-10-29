import sanitize from "mongo-sanitize"
import sanitizeHtml from "sanitize-html"

export const sanitizeMiddleware = (app) => {        
    const sanitizeObject = (obj) => {
        if(typeof obj !== "object" || obj === null) {
            return res.status(400).json({ message: "Invalid company value"})
        }

        for (const key in obj) {
            if (typeof obj[key] === "object") {
                sanitizeObject(obj[key])
            } else if (typeof obj[key] === "string") {
                obj[key] = sanitizeHtml(obj[key], {
                    allowedTags: [],
                    allowedAttributes: {},
                })
                obj[key] = sanitize(obj[key])
            }
        }
    }

    app.use((req, res, next) => {        
        if (req.body) sanitizeObject(req.body)
        if (req.params) sanitizeObject(req.params)
        if (req.query) sanitizeObject(req.query)
        next()
    })
}