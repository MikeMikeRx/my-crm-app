import Quote from "../models/Quote.js"
import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import dayjs from "dayjs"

// ============================================================================
// GET ALL QUOTES
// ============================================================================
export const getQuotes = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH QUOTES
    // ========================================================================
    // Find all quotes belonging to the authenticated user
    // Populate customer details (name, email, company)
    // Sort by creation date (newest first)
    const quotes = await Quote.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 })

    // ========================================================================
    // AUTO-UPDATE EXPIRED STATUS
    // ========================================================================
    // Automatically expire quotes past their expiry date
    // Excludes already "converted" or "declined" quotes
    const withTotals = quotes.map(q => {
        const obj = q.toObject();

        // Check if quote should be expired
        if (
            obj.status !== "converted" &&
            obj.status !== "declined" &&
            obj.expiryDate &&
            dayjs(obj.expiryDate).isBefore(dayjs(), "day")
        ) {
            obj.status = "expired";
        }

        return {
            ...obj,
            totals: q.totals
        };
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(withTotals)
});

// ============================================================================
// GET QUOTE BY ID
// ============================================================================
export const getQuoteById = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH QUOTE
    // ========================================================================
    // Find quote by ID, ensuring it belongs to the authenticated user
    // Populate customer details (name, email, company)
    const quote = await Quote.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    // Check if quote exists
    if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
    }

    // ========================================================================
    // AUTO-UPDATE EXPIRED STATUS
    // ========================================================================
    const obj = quote.toObject();

    // Check if quote should be expired
    // Excludes already "converted" or "declined" quotes
    if (
        obj.status !== "converted" &&
        obj.status !== "declined" &&
        obj.expiryDate &&
        dayjs(obj.expiryDate).isBefore(dayjs(), "day")
    ) {
        obj.status = "expired";
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({
        ...obj,
        totals: quote.totals
    });
});

// ============================================================================
// CREATE QUOTE
// ============================================================================
export const createQuote = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT INPUT
    // ========================================================================
    const { customer, quoteNumber, issueDate, expiryDate, items, notes } = req.body

    // ========================================================================
    // VALIDATE CUSTOMER
    // ========================================================================
    // Ensure customer exists and belongs to the authenticated user
    const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id })
    if (!existingCustomer) {
        return res.status(400).json({ message: "Invalid customer ID" })
    }

    // ========================================================================
    // CREATE QUOTE
    // ========================================================================
    // Create new quote with default status "draft"
    const newQuote = await Quote.create({
        user: req.user.id,
        customer,
        quoteNumber,
        issueDate,
        expiryDate,
        items,
        notes,
    })

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.status(201).json({
        ...newQuote.toObject(),
        totals: newQuote.totals
    })
})

// ============================================================================
// UPDATE QUOTE
// ============================================================================
export const updateQuote = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // UPDATE QUOTE
    // ========================================================================
    // Find and update quote, ensuring it belongs to the authenticated user
    // Options:
    // - new: true -> return updated document
    // - runValidators: true -> run model validations on update
    const quote = await Quote.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true, runValidators: true },
    )

    // Check if quote exists
    if (!quote) {
        return res.status(404).json({ message: "Quote not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({
        ...quote.toObject(),
        totals: quote.totals
    })
})

// ============================================================================
// DELETE QUOTE
// ============================================================================
export const deleteQuote = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // DELETE QUOTE
    // ========================================================================
    // Find and delete quote, ensuring it belongs to the authenticated user
    const quote = await Quote.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    // Check if quote exists
    if (!quote) {
        return res.status(404).json({ message: "Quote not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({ message: "Quote deleted successfully" })
})
