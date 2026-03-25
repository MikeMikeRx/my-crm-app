import Quote from "../models/Quote.js";
import Customer from "../models/Customer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatQuote } from "../utils/formatters/quoteFormatter.js";
import { CUSTOMER_POPULATE, DEFAULT_SORT } from "../utils/queries/queryDefaults.js";

const ALLOWED_QUOTE_STATUSES = new Set(["draft", "sent", "accepted", "declined"]);

export const getQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quote.find({ tenant: req.tenant.id })
    .populate(...CUSTOMER_POPULATE)
    .sort(DEFAULT_SORT);

  const withTotals = quotes.map(q => formatQuote(q));

  res.json(withTotals);
});

export const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, tenant: req.tenant.id }).populate(...CUSTOMER_POPULATE);

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  res.json(formatQuote(quote));
});

export const createQuote = asyncHandler(async (req, res) => {
  const { customer, quoteNumber, issueDate, expiryDate, items, notes, status } = req.body;

  const existingCustomer = await Customer.findOne({ _id: customer, tenant: req.tenant.id });
  if (!existingCustomer) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  const safeStatus = status && ALLOWED_QUOTE_STATUSES.has(status) ? status : "draft";

  const newQuote = await Quote.create({
    user: req.user.id,
    tenant: req.tenant.id,
    customer,
    quoteNumber,
    issueDate,
    expiryDate,
    items,
    notes,
    status: safeStatus,
  });

  res.status(201).json(formatQuote(newQuote));
});

export const updateQuote = asyncHandler(async (req, res) => {
  const { customer, issueDate, expiryDate, items, notes, status } = req.body;
  const update = { customer, issueDate, expiryDate, items, notes };
  if (status && ALLOWED_QUOTE_STATUSES.has(status)) update.status = status;

  const quote = await Quote.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant.id },
    update,
    { new: true, runValidators: true }
  );

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  res.json(formatQuote(quote));
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findOneAndDelete({
    _id: req.params.id,
    tenant: req.tenant.id,
  });

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  res.json({ message: "Quote deleted successfully" });
});
