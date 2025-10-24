import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import { connectDB } from "./config/database"
import authRoutes from "./routes/auth"
import customerRoutes from "./routes/customer"
import invoiceRoutes from "./routes/invoice"
import quoteRoutes from "./routes/quote"
import paymentRoutes from "./routes/payment"
import errorHandler from "./middleware/errorHandler"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

connectDB()

app.use("/api/auth", authRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/quotes", quoteRoutes)
app.use("/api/payments", paymentRoutes)

app.get("/", (req, res) => res.send({ status: "ok", message: "API is running" }))

app.use(errorHandler)

const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})