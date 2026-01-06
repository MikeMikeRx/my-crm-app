import mongoose from "mongoose"

// ============================================================================
// PAYMENT MODEL
// ============================================================================
// Represents payments received against invoices
// Tracks payment method, status, and amount
// Multiple payments can be applied to a single invoice (partial payments)
const paymentSchema = new mongoose.Schema(
    {
        // ====================================================================
        // RELATIONSHIPS
        // ====================================================================
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // References the User model (owner)
            required: true,
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice", // References the Invoice being paid
            required: true,
        },

        // ====================================================================
        // PAYMENT IDENTIFICATION
        // ====================================================================
        paymentId: {
            type: String,
            required: true,
            unique: true, // Creates unique index for payment ID
            trim: true,
        },

        // ====================================================================
        // PAYMENT DETAILS
        // ====================================================================
        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "bank_transfer", "paypal"], // Allowed payment methods
            required: [true, "Payment method is required"],
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"], // Payment status
            default: "completed",
        },
        paymentDate: {
            type: Date,
            required: [true, "Payment date is required"],
            default: Date.now, // Defaults to current date/time
        },

        // ====================================================================
        // ADDITIONAL INFORMATION
        // ====================================================================
        notes: {
            type: String,
            trim: true
        },
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
)

export default mongoose.model("Payment", paymentSchema)
