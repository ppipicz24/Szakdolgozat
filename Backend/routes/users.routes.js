const express = require("express");
const router = express.Router();
const { db } = require("../database/firebase");
const authenticateToken = require("../middlewares/authMiddleware");
const { isAdminOrCoordinator, isAdmin } = require("../middlewares/rolesMiddleware");

const dbUser = db.users;

router.get("/",authenticateToken,isAdminOrCoordinator, async (req, res) => {
    try {
      const usersRef = dbUser;
      const snapshot = await usersRef.once("value");
      const users = [];

      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        console.log(user);
        // Don't send password
        delete user.password;
        users.push(user);
      });

      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userRef = dbUser.child(req.user.id);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = snapshot.val();
    delete userData.password;

    if (!userData.googleCalendar) {
      userData.googleCalendar = {
        connected: false,
        accessToken: '',
        refreshToken: ''
      };
    }

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phoneNumber, email } = req.body;

    if (!name && !phoneNumber && !email) {
      return res
        .status(400)
        .json({ message: "At least one field is required for update" });
    }

    if (email && (!email.includes("@") || email.length < 6)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const userRef = dbUser.child(userId);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (email) updates.email = email;

    await userRef.update(updates);

    res.status(200).json({
      message: "Profile updated successfully",
      updatedFields: updates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/:id/role",authenticateToken,isAdmin,async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      const validRoles = ["admin", "coordinator", "animator"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role provided" });
      }

      const userRef = dbUser.child(userId);
      const snapshot = await userRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({ message: "User not found" });
      }

      await userRef.update({ role });

      res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;