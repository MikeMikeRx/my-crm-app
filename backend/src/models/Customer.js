import mongoose from "mongoose"

// ============================================================================
// CUSTOMER MODEL
// ============================================================================
// Represents business customers/clients
// Linked to invoices, quotes, and payments
const customerSchema = new mongoose.Schema(
    {
        // ====================================================================
        // OWNERSHIP
        // ====================================================================
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // References the User model
            required: true,
        },

        // ====================================================================
        // CUSTOMER INFORMATION
        // ====================================================================
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true, // Automatically converts to lowercase
            match: [/\S+@\S+\.\S+/, "Invalid email format"], // Email validation regex
        },
        phone: {
            type: String,
            trim: true,
        },
        company: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
)

export default mongoose.model("Customer", customerSchema)
