import Quote from "../models/Quote.js";
import Customer from "../models/Customer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveQuoteStatus } from "../utils/invoiceStatus.js";

export const getQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quote.find({ user: req.user.id })
    .populate("customer", "name email company")
    .sort({ createdAt: -1 });

  const withTotals = quotes.map((q) => {
    const obj = q.toObject();
    return { ...obj, status: resolveQuoteStatus(obj), totals: q.totals };
  });

  res.json(withTotals);
});

export const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, user: req.user.id }).populate(
    "customer",
    "name email company"
  );

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  const obj = quote.toObject();
  res.json({ ...obj, status: resolveQuoteStatus(obj), totals: quote.totals });
});

export const createQuote = asyncHandler(async (req, res) => {
  const { customer, quoteNumber, issueDate, expiryDate, items, notes, status } = req.body;

  const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id });
  if (!existingCustomer) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  const allowedStatuses = new Set(["draft", "sent", "accepted", "declined"]);
  const safeStatus = status && allowedStatuses.has(status) ? status : "draft";

  const newQuote = await Quote.create({
    user: req.user.id,
    customer,
    quoteNumber,
    issueDate,
    expiryDate,
    items,
    notes,
    status: safeStatus,
  });

  res.status(201).json({
    ...newQuote.toObject(),
    totals: newQuote.totals,
  });
});

export const updateQuote = asyncHandler(async (req, res) => {
  const allowedStatuses = new Set(["draft", "sent", "accepted", "declined"]);
  const { status, ...rest } = req.body;
  const update = status && allowedStatuses.has(status) ? { ...rest, status } : rest;

  const quote = await Quote.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    update,
    { new: true, runValidators: true }
  );

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  res.json({
    ...quote.toObject(),
    totals: quote.totals,
  });
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  res.json({ message: "Quote deleted successfully" });
});
