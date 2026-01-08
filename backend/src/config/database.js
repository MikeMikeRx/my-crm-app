import mongoose from "mongoose"

// Handles MongoDB connection with automatic reconnection on failure and unexpected disconnections.
// Retries every 5 seconds. Called by server.js on startup.

export const connectDB = async () => {
    // Inner function allows recursive retry without re-registering event listeners
    const connect = async () => {
        try {
            await mongoose.connect(process.env.DATABASE, {
                serverSelectionTimeoutMS: 5000,
            })
            console.log("✅ MongoDB connected")
        } catch (err) {
            console.error("❌ MongoDB connection error:", err.message)
            setTimeout(connect, 5000)
        }
    }

    // Auto-reconnect on unexpected disconnection (network issues, server restart)
    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...")
        setTimeout(connect, 5000)
    })

    await connect()
}
