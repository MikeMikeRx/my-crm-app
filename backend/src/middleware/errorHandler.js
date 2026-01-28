const errorHandler = (err, req, res, next) => {
    console.error("Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : "hidden",
        path: req.originalUrl,
        method: req.method
    })

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    })
}

export default errorHandler
