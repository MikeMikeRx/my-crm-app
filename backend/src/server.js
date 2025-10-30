import dotenv from "dotenv"
import { connectDB } from "./config/database"
import app from "./app.js"

// Config 
dotenv.config()

// Database
connectDB()

// Start the server
const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
})