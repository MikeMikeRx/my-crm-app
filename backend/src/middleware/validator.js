import { validationResult } from "express-validator"

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg)
        if (messages.length === 1) {
            return res.status(400).json({
                succes: false,
                message: messages[0],
            })
        }

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: messages,
        })
    }
    next()
}