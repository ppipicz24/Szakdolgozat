const {db} = require("../database/firebase");

const isAdminOrCoordinator = async (req, res, next) => {
    try {
      const userRef = db.users.child(req.user.id);
      const snapshot = await userRef.once("value");
      const userData = snapshot.val();
  
      if (
        userData &&
        (userData.role === "admin" || userData.role === "coordinator")
      ) {
        next();
      } else {
        res.status(403).json({
          message: "Access denied. Admin or Coordinator role required.",
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  const isAdmin = async (req, res, next) => {
    try {
      const userRef = db.users.child(req.user.id);
      const snapshot = await userRef.once("value");
      const userData = snapshot.val();
  
      if (userData && userData.role === "admin") {
        next();
      } else {
        res.status(403).json({ message: "Access denied. Admin role required." });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

module.exports = { isAdminOrCoordinator, isAdmin };