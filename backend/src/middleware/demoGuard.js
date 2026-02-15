const DEMO_EMAIL = "demo@vitesse.app";

export const demoGuard = (req, res, next) => {
  if (
    req.user?.email === DEMO_EMAIL &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    return res.status(403).json({
      message: "Demo account is read-only. Register a new account to create and edit data.",
    });
  }
  next();
};
