import Quote from "../models/Quote.js"
import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import dayjs from "dayjs"

// ------ Get All Quotes ------
export const getQuotes = asyncHandler(async (req, res, next) => {

    const quotes = await Quote.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 })
    
    const withTotals = quotes.map(q => {
        const obj = q.toObject();

        // Auto-expire if past expiryDate & not already converted/declined
        if (
            obj.status !== "converted" &&
            obj.status !== "declined" &&
            obj.expiryDate &&
            dayjs(obj.expiryDate).isBefore(dayjs(), "day")
        ) {
            obj.status = "expired";
        }

        return{
            ...obj,
            totals: q.totals                
        };
    });
    res.json(withTotals)
});

// ------ Get Single Quote by ID ------
export const getQuoteById = asyncHandler(async (req, res, next) => {

    const quote = await Quote.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    if (!quote) return res.status(404).json({message: "Quote not found "});

    const obj = quote.toObject();

    // Auto-expire
    if (
        obj.status !== "converted" &&
        obj.status !== "declined" &&
        obj.expiryDate && 
        dayjs(obj.expiryDate).isBefore(dayjs(), "day")
    ) {
        obj.status = "expired";
    }

    res.json({
        ...obj,
        totals: quote.totals
    });
});

// ------ Create Quote ------
export const createQuote = asyncHandler(async (req, res, next) => {
        const { customer, quoteNumber, issueDate, expiryDate, items, notes } = req.body

        const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id })
        if (!existingCustomer) return res.status(400).json({ message: "Invalid customer ID" })

        const newQuote = await Quote.create({
            user: req.user.id,
            customer,
            quoteNumber,
            issueDate,
            expiryDate,
            items,
            notes,
        })

        res.status(201).json({
            ...newQuote.toObject(),
            totals: newQuote.totals
        })
})

// ------ Update Quote ------
export const updateQuote = asyncHandler(async (req, res, next) => {
        const quote = await Quote.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true },
        )
        if (!quote) return res.status(404).json({ message: "Quote not found" })
        res.json({
            ...quote.toObject(),
            totals: quote.totals
        })
})

// ------ Delete Quote ------
export const deleteQuote = asyncHandler(async (req, res, next) => {
        const quote = await Quote.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!quote) return res.status(404).json({ message: "Quote not found" })
        res.json({ message: "Quote deleted successfully" })
})