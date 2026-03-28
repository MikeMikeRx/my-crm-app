import Quote from "../models/Quote.js";
import Customer from "../models/Customer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatQuote } from "../utils/formatters/quoteFormatter.js";
import { isValidQuoteTransition, resolveQuoteStatus } from "../utils/status/quoteStatus.js";
import { CUSTOMER_POPULATE, DEFAULT_SORT } from "../utils/queries/queryDefaults.js";
import { createActivity } from "../services/activity/createActivity.js";

const CREATE_ALLOWED_STATUSES = new Set(["draft", "sent", "accepted", "declined"]);

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

  const safeStatus = status && CREATE_ALLOWED_STATUSES.has(status) ? status : "draft";

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

  await createActivity({
    tenant: req.tenant.id,
    user: req.user.id,
    entityType: "quote",
    entityId: newQuote._id,
    action: "quote_created",
    message: `Quote ${newQuote.quoteNumber} created`,
  });

  res.status(201).json(formatQuote(newQuote));
});

export const updateQuote = asyncHandler(async (req, res) => {
  const { customer, issueDate, expiryDate, items, notes } = req.body;

  const quote = await Quote.findOne({ _id: req.params.id, tenant: req.tenant.id });
  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  if (quote.status === "converted") {
    return res.status(400).json({ message: "Cannot edit a converted quote" });
  }

  const updated = await Quote.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant.id },
    { customer, issueDate, expiryDate, items, notes },
    { new: true, runValidators: true }
  ).populate(...CUSTOMER_POPULATE);

  res.json(formatQuote(updated));
});

export const transitionQuoteStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (status === "converted") {
    return res.status(400).json({ message: "Cannot manually transition to converted" });
  }

  const quote = await Quote.findOne({ _id: req.params.id, tenant: req.tenant.id });
  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  const effectiveStatus = resolveQuoteStatus(quote);

  if (!isValidQuoteTransition(effectiveStatus, status)) {
    return res.status(400).json({
      message: `Invalid transition: "${effectiveStatus}" → "${status}"`,
    });
  }

  quote.status = status;
  await quote.save();

  const activityActions = { sent: "quote_sent", accepted: "quote_accepted" };
  if (activityActions[status]) {
    await createActivity({
      tenant: req.tenant.id,
      user: req.user.id,
      entityType: "quote",
      entityId: quote._id,
      action: activityActions[status],
      message: status === "sent" ? "Quote sent to customer" : "Quote accepted",
    });
  }

  res.json(formatQuote(quote));
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, tenant: req.tenant.id });

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }

  if (quote.status === "converted") {
    return res.status(409).json({ message: "Cannot delete a converted quote" });
  }

  await quote.deleteOne();

  res.json({ message: "Quote deleted successfully" });
});
