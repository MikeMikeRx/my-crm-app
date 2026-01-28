import mongoose from "mongoose"

const invoiceSchema = new mongoose.Schema(
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
        quote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quote",
            required: true,
        },
        invoiceNumber: {
            type: String,
            required: [true, "Invoice number is required"],
            unique: true,
            trim: true,
        },
        issueDate: {
            type: Date,
            required: [true, "Issue date is required"]
        },
        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
        },
        items: [
            {
                description: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                taxRate: {
                    type: Number,
                    default: 20,
                    min: 0,
                    max: 100,
                },
            },
        ],
        status: {
            type: String,
            enum: ["unpaid", "paid", "overdue"],
            default: "unpaid"
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

invoiceSchema.virtual("totals").get(function () {
    const items = this.items || [];

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const tax = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.taxRate || 0)) / 100, 0);

    const round = (num) => Math.round(num * 100) / 100;

    return {
        subtotal: round(subtotal),
        tax: round(tax),
        total: round(subtotal + tax),
    };
});

export default mongoose.model("Invoice", invoiceSchema)
