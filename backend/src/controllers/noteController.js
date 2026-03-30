import Customer from "../models/Customer.js";
import Quote from "../models/Quote.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ENTITY_MODELS = {
  customer: Customer,
  quote: Quote,
  invoice: Invoice,
  payment: Payment,
};

export const createNote = asyncHandler(async (req, res) => {
  const { entityType, entityId, message } = req.body;

  const Model = ENTITY_MODELS[entityType];
  if (!Model) {
    return res.status(400).json({ message: `Invalid entityType: ${entityType}` });
  }

  const entity = await Model.findOne({ _id: entityId, tenant: req.tenant.id });
  if (!entity) {
    return res.status(404).json({ message: `${entityType} not found` });
  }

  const note = await Activity.create({
    tenant: req.tenant.id,
    user: req.user.id,
    entityType,
    entityId,
    type: "note",
    action: "note_added",
    message,
  });

  res.status(201).json({ data: note });
});
