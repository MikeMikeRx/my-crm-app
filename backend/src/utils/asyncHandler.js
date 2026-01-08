// ============================================================================
// ASYNC HANDLER UTILITY
// ============================================================================

/**
 * Wraps async Express route handlers and forwards errors to `next()`.
 *
 * Purpose:
 * - Express does not catch rejected Promises from async handlers
 * - Prevents unhandled promise rejections
 * - Removes repetitive try/catch blocks from controllers
 *
 * Usage:
 * export const controller = asyncHandler(async (req, res) => {
 *   await doSomething()
 * })
 */

export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
