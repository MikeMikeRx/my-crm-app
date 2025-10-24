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
            min: 0,
        },
        method: {
            type: String,
            enum: ["cash", "credit_card", "bank_transfer"],
            default: "cash",
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