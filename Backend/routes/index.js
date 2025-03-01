const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require("firebase-admin");
const serviceAccount = require("./../firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://szakdolgozat-d4ca7-default-rtdb.europe-west1.firebasedatabase.app",
});

const router = express();
router.use(bodyParser.json());
const dbUser = admin.database().ref("users");

const jwt_secret="6f3b3caf3d56762361999c8a3b635bcce51d54aad4170be9b08e19f4564768a5";
let authToken = ""

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log(authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log(token);
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(authToken, jwt_secret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Check if user is coordinator
const isCoordinator = async (req, res, next) => {
  try {
    const userRef = db.ref(`users/${req.user.id}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (userData && userData.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Coordinator role required.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, phoneNumber, role } = req.body;

    // Check if all fields are filled
    if (!name || !username || !password || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if username already exists
    const snapshot = await dbUser
      .orderByChild("username")
      .equalTo(username)
      .once("value");

    if (snapshot.exists()) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email already exists
    const snapshot2 = await dbUser
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (snapshot2.exists()) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUserRef = dbUser.push();
    const userId = newUserRef.key;

    await newUserRef.set({
      id: userId,
      name,
      username,
      password: hashedPassword,
      phoneNumber,
      email,
      role,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user by username
    const snapshot = await dbUser.orderByChild('username').equalTo(username).once('value');
    
    if (!snapshot.exists()) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Get user data
    let userId;
    let userData;
    
    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });
    
    // Verify password
    const validPassword = await bcrypt.compare(password, userData.password);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Create and assign token
    const token = jwt.sign(
      { id: userId, username: userData.username, role: userData.role },
      jwt_secret,
      { expiresIn: '24h' }
    );

    req.headers.authorization = `Bearer ${token}`;

    res.setHeader('authorization', `Bearer ${token}`);
    console.log(res.getHeader('authorization'));
    authToken = token;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  // JWT tokens are stateless, so we don't need to do anything server-side
  // The client should remove the token from storage
  res.status(200).json({ message: 'Logout successful' });
});
module.exports = router;
