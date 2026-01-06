import { validationResult } from "express-validator"

// ============================================================================
// VALIDATION RESULT HANDLER MIDDLEWARE
// ============================================================================
// Processes validation results from express-validator rules
// Usage: Apply after express-validator validation chains
// Example: [body('email').isEmail(), validateRequest]
export const validateRequest = (req, res, next) => {
    // ========================================================================
    // CHECK VALIDATION RESULTS
    // ========================================================================
    // Extract validation errors from request (set by express-validator)
    const errors = validationResult(req)

    // If no validation errors, continue to next middleware
    if (!errors.isEmpty()) {
        // ====================================================================
        // FORMAT ERROR MESSAGES
        // ====================================================================
        // Extract error messages from validation results
        const messages = errors.array().map(err => err.msg)

        // Single error: return simple message format
        if (messages.length === 1) {
            return res.status(400).json({
                success: false,
                message: messages[0],
            })
        }

        // Multiple errors: return detailed error list
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: messages,
        })
    }

    // No validation errors, continue to next middleware
    next()
}
