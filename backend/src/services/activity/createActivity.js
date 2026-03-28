import Activity from "../../models/Activity.js";

export async function createActivity({ tenant, user, entityType, entityId, action, message, metadata }) {
  try {
    await Activity.create({ tenant, user, entityType, entityId, type: "event", action, message, metadata });
  } catch (err) {
    console.error("[activity] failed to record:", err.message);
  }
}
