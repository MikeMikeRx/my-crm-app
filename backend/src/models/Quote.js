import mongoose from "mongoose"

const quoteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        quoteNumber: {
            type: String,
            required: [true, "Quote number is required"],
            unique: true,
            trim: true,
        },
        issueDate: {
            type: Date,
            required: [true, "Issue date is required"],
        },
        expiryDate: {
            type: Date,
            required: [true, "Expiry date is required"],
        },
        items: [
            {
                description: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
            },
        ],
        status: {
            type: String,
            enum: ["draft", "sent", "accepted", "declined", "expired"],
            default: "draft",
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

quoteSchema.virtual("total").get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
})

export default mongoose.model("Quote", quoteSchema)