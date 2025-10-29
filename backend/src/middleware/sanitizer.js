import xss from "xss-clean"
import sanitize from "mongo-sanitize"

export const sanitizeMiddleware = (app) => {
    app.use(xss())
    app.use((req, res, next) => {
        if (req.body) req.body = sanitize(req.body)
        if (req.params) req.params = sanitize(req.params)
        if (req.query) req.query = sanitize(req.query)
        next()
    })
}