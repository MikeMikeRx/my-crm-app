import dotenv from "dotenv"

dotenv.config()

import { connectDB } from "./config/database.js"
import app from "./app.js"

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
