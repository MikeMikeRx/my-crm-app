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
                taxRate: {
                    type: Number,
                    default: 20,
                    enum: [0, 5, 20],
                },
            },
        ],

        globalTaxRate: { type: Number, default: null},

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

quoteSchema.virtual("totals").get(function () {
    const items = this.items || []
    const useGlobal = this.globalTaxRate !== null

    const subtotal = items.reduce((sum,i) => sum + i.quantity * i.unitPrice, 0)

    const tax = items.reduce((sum,i) => {
        const rate = useGlobal ? this.globalTaxRate : (i.taxRate || 0)
        return sum + (i.quantity * i.unitPrice * rate) / 100
    }, 0)

    const round = (num) => Math.round(num * 100) / 100

    return {
        subtotal: round(subtotal),
        tax: round(tax),
        total: round(subtotal + tax)
    }
})

export default mongoose.model("Quote", quoteSchema)