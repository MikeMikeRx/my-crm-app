import dotenv from "dotenv"

// Config - Load environment variables FIRST
dotenv.config()

import { connectDB } from "./config/database.js"
import app from "./app.js"

// Database
connectDB()

// Start the server
const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
})