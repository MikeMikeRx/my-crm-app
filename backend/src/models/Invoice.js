import mongoose from "mongoose"

// ============================================================================
// INVOICE MODEL
// ============================================================================
// Represents invoices issued to customers
// Can be created from quotes
// Tracks payment status and calculates totals with tax
const invoiceSchema = new mongoose.Schema(
    {
        // ====================================================================
        // RELATIONSHIPS
        // ====================================================================
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // References the User model (owner)
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer", // References the Customer model
            required: true,
        },
        quote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quote", // References the originating quote (all invoices must come from quotes)
            required: true,
        },

        // ====================================================================
        // INVOICE DETAILS
        // ====================================================================
        invoiceNumber: {
            type: String,
            required: [true, "Invoice number is required"],
            unique: true, // Creates unique index for invoice number
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

        // ====================================================================
        // LINE ITEMS
        // ====================================================================
        // Array of products/services being billed
        items: [
            {
                description: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true, min: 0 },
                taxRate: {
                    type: Number,
                    default: 20, // Default 20% tax rate
                    min: 0, // Tax rate must be non-negative
                    max: 100, // Tax rate cannot exceed 100%
                },
            },
        ],

        // ====================================================================
        // STATUS TRACKING
        // ====================================================================
        status: {
            type: String,
            enum: ["unpaid", "paid", "overdue"], // Payment status
            default: "unpaid"
        },

        // ====================================================================
        // ADDITIONAL INFORMATION
        // ====================================================================
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: { virtuals: true }, // Include virtuals when converting to JSON
        toObject: { virtuals: true } // Include virtuals when converting to object
    }
)

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================
// Calculates invoice totals dynamically (not stored in database)
invoiceSchema.virtual("totals").get(function () {
    const items = this.items || [];

    // Calculate subtotal (sum of all items before tax)
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // Calculate total tax across all items
    const tax = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.taxRate || 0)) / 100, 0);

    // Round to 2 decimal places
    const round = (num) => Math.round(num * 100) / 100;

    return {
        subtotal: round(subtotal),
        tax: round(tax),
        total: round(subtotal + tax), // Grand total = subtotal + tax
    };
});

export default mongoose.model("Invoice", invoiceSchema)
