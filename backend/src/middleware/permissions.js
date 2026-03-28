export const PERMISSIONS = {
    customers: { owner: ["read", "write"], member: ["read", "write"] },
    quotes:    { owner: ["read", "write"], member: ["read", "write"] },
    invoices:  { owner: ["read", "write"], member: ["read"] },
    payments:  { owner: ["read", "write"], member: ["read"] },
    dashboard: { owner: ["read"],          member: ["read"] },
}

export const requirePermission = (resource, action) => (req, res, next) => {
    const role = req.tenant?.role
    if (!role) {
        return res.status(401).json({ message: "Tenant role not found in request context" });
    }

    if (!PERMISSIONS[resource]?.[role]?.includes(action)) {
        return res.status(403).json({ message: `Forbidden: '${role}' cannot ${action} ${resource}` });
    }

    next();
}
