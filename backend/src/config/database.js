import mongoose from "mongoose"

export const connectDB = async () => {
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

    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...")
        setTimeout(connect, 5000)
    })

    await connect()
}