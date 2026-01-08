import { validationResult } from "express-validator"

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
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

    next()
}
