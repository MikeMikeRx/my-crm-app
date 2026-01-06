import mongoose from "mongoose"

// ============================================================================
// USER MODEL
// ============================================================================
// Represents application users (admin or regular users)
// Handles authentication and user management
const userSchema = new mongoose.Schema(
    {
        // ====================================================================
        // USER IDENTIFICATION
        // ====================================================================
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true, // Creates unique index for email
            lowercase: true, // Automatically converts to lowercase
            match: [/\S+@\S+\.\S+/, "Invalid email format"], // Email validation regex
        },

        // ====================================================================
        // AUTHENTICATION
        // ====================================================================
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
            select: false, // Exclude from queries by default (must explicitly select)
        },

        // ====================================================================
        // AUTHORIZATION
        // ====================================================================
        role: {
            type: String,
            enum: ["admin", "user"], // Only allow these two roles
            default: "user",
        },
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
)

export default mongoose.model("User", userSchema)
