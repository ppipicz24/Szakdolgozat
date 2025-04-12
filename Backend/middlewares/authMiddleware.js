const jwt = require("jsonwebtoken");

const jwt_secret = "6f3b3caf3d56762361999c8a3b635bcce51d54aad4170be9b08e19f4564768a5";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, jwt_secret, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
