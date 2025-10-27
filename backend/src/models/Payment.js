import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "bank_transfer", "paypal"],
            required: [true, "Payment method is required"],
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "completed",
        },
        paymentDate: {
            type: Date,
            required: [true, "Payment date is required"],
            default: Date.now,
        },
        notes: {
            type: String,
            trim: true
        },
    },
    { timestamps: true }
)

export default mongoose.model("Payment", paymentSchema)