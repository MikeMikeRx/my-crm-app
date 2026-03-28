import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    entityType: {
      type: String,
      enum: ["customer", "quote", "invoice", "payment"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["note", "event"], required: true },
    action: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activitySchema.index({ tenant: 1, entityType: 1, entityId: 1 });

export default mongoose.model("Activity", activitySchema);
