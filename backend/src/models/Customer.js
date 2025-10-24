import mongoose from "mongoose"

const customerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Invalid email format"],
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
    { timestamps: true }
)

export default mongoose.model("Customer", customerSchema)