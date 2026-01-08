// Wraps async Express route handlers and forwards errors to next()
// Express does not catch rejected Promises from async handlers
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
