import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import { connectDB } from "./config/database.js"
import authRoutes from "./routes/auth.js"
import customerRoutes from "./routes/customer.js"
import invoiceRoutes from "./routes/invoice.js"
import quoteRoutes from "./routes/quote.js"
import paymentRoutes from "./routes/payment.js"
import errorHandler from "./middleware/errorHandler.js"

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