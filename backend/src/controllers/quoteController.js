import Quote from "../models/Quote"
import Customer from "../models/Customer"

export const getQuotes = async (req, res, next) => {
    try {
        const quotes = await Quote.find({ user: req.user.id })
            .populate("customer", "name email company")
            .sort({ createdAt: -1 })
        res.json(quotes)
    } catch (err) {
        next(err)
    }
}

export const getQuoteById = async (req, res, next) => {
    try {
        const quote = await Quote.findOne({ _id: req.params.id, user: req.user.id })
            .populate("customer", "name email company")
        if (!quote) return res.status(404).json({message: "Quote not found "})
        res.json(quote)
    } catch (err) {
        next(err)
    }
}

export const createQuote = async (req, res, next) => {
    try {
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

        res.status(201).json(newQuote)
    } catch (err) {
        next(err)
    }
}

export const updateQuote = async (req, res, next) => {
    try {
        const quote = await Quote.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true },
        )
        if (!quote) return res.status(404).json({ message: "Quote not found" })
        res.json(quote)
    } catch (err) {
        next(err)
    }
}

export const deleteQuote = async (req, res, next) => {
    try {
        const quote = await Quote.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!quote) return res.status(404).json({ message: "Quote not found" })
        res.json({ message: "Quote deleted successfully" })
    } catch (err) {
        next(err)
    }
}