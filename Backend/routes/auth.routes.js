const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../firebase");
const sendEmail = require("../utils/email");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();
const jwt_secret = "6f3b3caf3d56762361999c8a3b635bcce51d54aad4170be9b08e19f4564768a5";
const dbUser = db.users;

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    if (!name || !password || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (name.length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters long" });
    }

    if (email.length < 6 || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, contain 1 uppercase letter and 1 number",
      });
    }

    const emailSnapshot = await dbUser.orderByChild("email").equalTo(email).once("value");
    if (emailSnapshot.exists()) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserRef = dbUser.push();
    const userId = newUserRef.key;

    await newUserRef.set({
      id: userId,
      name,
      password: hashedPassword,
      phoneNumber,
      email,
      role: role || "animator",
      googleCalendar: {
        connected: false,
        accessToken: "",
        refreshToken: "",
      },
      createdAt: Date.now(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const snapshot = await dbUser.orderByChild("email").equalTo(email).once("value");
    if (!snapshot.exists()) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let userId, userData;
    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({
      id: userId,
      role: userData.role,
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
    }, jwt_secret, { expiresIn: "20m" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!email.includes("@") || email.length < 6) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const snapshot = await dbUser.orderByChild("email").equalTo(email).once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    let userId, userData;
    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbUser.child(userId).update({ password: hashedPassword });

    await sendEmail(userData.email, "Password Reset", `Your new password is: ${newPassword}`);

    res.status(200).json({ message: "New password sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/new-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!oldPassword || !newPassword || !userId) {
        console.log(req.body);
      return res.status(400).json({ message: "Old password, new password and userId are required" });
    }

    const userRef = dbUser.child(userId);
    const snapshot = await userRef.once("value");
    const userData = snapshot.val();

    const validPassword = await bcrypt.compare(oldPassword, userData.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, contain 1 uppercase letter and 1 number",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbUser.child(userId).update({ password: hashedPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
