const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication required. Please provide a token in 'Bearer <token>' format.",
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Token missing after 'Bearer' in Authorization header." });
    }

    const SECRET_KEY = process.env.JWT_SECRET;
    if (!SECRET_KEY) {
        return res.status(500).json({ error: "Server configuration error: JWT_SECRET is missing." });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (!decoded.id || !decoded.email) {
            return res.status(401).json({ error: "Invalid token: Missing required fields (id or email)." });
        }

        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token has expired", details: err.expiredAt });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token", details: "Token format or signature invalid." });
        }
        return res.status(401).json({ error: "Token verification failed", details: err.message });
    }
};

module.exports = authMiddleware;