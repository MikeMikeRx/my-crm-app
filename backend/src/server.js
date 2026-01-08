import dotenv from "dotenv"

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================
// Load environment variables FIRST before importing other modules
// This ensures process.env values are available when other modules load
dotenv.config()

import { connectDB } from "./config/database.js"
import app from "./app.js"

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
// Connect to MongoDB using the DATABASE environment variable
// Connection includes automatic reconnection logic (see config/database.js)
connectDB()

// ============================================================================
// START SERVER
// ============================================================================
// Start the Express server on the configured port
// Default port: 8888 (if PORT environment variable is not set)
const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
})
