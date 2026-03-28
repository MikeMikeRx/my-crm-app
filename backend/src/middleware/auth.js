import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token payload." });
        }

        if (!decoded?.tenant) {
            return res.status(401).json({ message: "Token missing tenant." });
        }

        if (!decoded?.role) {
            return res.status(401).json({ message: "Token missing role" });
        }

        if (!decoded?.membershipRole) {
            return res.status(401).json({ message: "Token missing membershipRole" });
        }

        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        req.tenant = { id: decoded.tenant, role: decoded.membershipRole };

        next();
    } catch (err) {
        console.error("JWT verification failed", err.message);
        res.status(401).json({ message: "Token is not valid or expired" });
    }
}
