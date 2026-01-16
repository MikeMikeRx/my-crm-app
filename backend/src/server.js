import dotenv from "dotenv"

// Load environment variables FIRST before importing other modules
dotenv.config()

import { connectDB } from "./config/database.js"
import app from "./app.js"

if (process.env.NODE_ENV !== "test") {
  connectDB();
}
// connectDB()

const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
})
