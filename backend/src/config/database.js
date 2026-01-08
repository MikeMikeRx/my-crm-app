import mongoose from "mongoose"

// ============================================================================
// DATABASE CONNECTION MODULE
// ============================================================================
// Handles MongoDB connection with automatic reconnection logic
// - Initial connection with 5-second timeout
// - Auto-reconnect on connection failures (5-second retry interval)
// - Auto-reconnect on unexpected disconnections
// - Connection lifecycle logging for debugging

// ============================================================================
// CONNECT TO MONGODB
// ============================================================================
/**
 * Establishes connection to MongoDB with automatic retry logic
 *
 * Features:
 * - Reads connection string from process.env.DATABASE
 * - Retries connection every 5 seconds on failure
 * - Listens for disconnection events and auto-reconnects
 * - Logs connection status for monitoring
 *
 * Called by: server.js on application startup
 */
export const connectDB = async () => {
    // ========================================================================
    // INNER CONNECTION FUNCTION
    // ========================================================================
    // Inner function allows recursive retry logic without re-registering
    // event listeners on each retry attempt
    const connect = async () => {
        try {
            // Attempt MongoDB connection
            await mongoose.connect(process.env.DATABASE, {
                serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if no server found
            })
            console.log("✅ MongoDB connected")
        } catch (err) {
            // Log error and retry connection after 5 seconds
            console.error("❌ MongoDB connection error:", err.message)

            setTimeout(connect, 5000) // Retry connection in 5 seconds
        }
    }

    // ========================================================================
    // AUTO-RECONNECT ON DISCONNECTION
    // ========================================================================
    // If MongoDB connection drops unexpectedly (network issues, server restart),
    // automatically attempt to reconnect after 5 seconds
    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...")
        setTimeout(connect, 5000) // Retry connection in 5 seconds
    })

    // ========================================================================
    // INITIATE INITIAL CONNECTION
    // ========================================================================
    // Start the initial connection attempt
    await connect()
}
