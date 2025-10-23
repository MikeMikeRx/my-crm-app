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
        invoiceNumber: {
            type: String,
            required: [true, "Invoice number is requiered"],
            unique: true,
            trim: true,
        },
        issueDate: {
            type: Date,
            required: [true, "Issue date is required"]
        },
        dueDate : {
            type: Date,
            required: [true, "Due date is required"],
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
            enum: ["draft", "sent", "paid", "overdue"],
            default: "draft"
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
)

invoiceSchema.virtual("total").get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
})

export default mongoose.model("Invoice", invoiceSchema)