import mongoose from "mongoose"

const membershipSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        role: {
            type: String,
            enum: ["owner", "member"],
            default: "member",
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

membershipSchema.index({ user: 1, tenant: 1 }, { unique: true })

export default mongoose.model("Membership", membershipSchema)
