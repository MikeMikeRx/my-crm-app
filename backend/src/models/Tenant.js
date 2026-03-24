import mongoose from "mongoose"

const tenantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Tenant name is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, "Slug is required"],
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model("Tenant", tenantSchema)
