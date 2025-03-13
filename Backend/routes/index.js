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

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Authorization Header:", authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const token = authHeader.split(' ')[1]; // **A token pontos kivágása**
  console.log("Extracted Token:", token);

  jwt.verify(token, jwt_secret, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.status(403).json({ message: 'Invalid token' });
    }

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

    // **Validáció: Minden mező kitöltve van-e?**
    if (!name || !username || !password || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // **Felhasználónév és email hosszának ellenőrzése**
    if (username.length < 4) {
      return res.status(400).json({ message: "Username must be at least 4 characters long" });
    }
    if (email.length < 6 || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // **Jelszó ellenőrzés (legalább 8 karakter, 1 nagybetű, 1 szám)**
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long, contain 1 uppercase letter and 1 number" });
    }

    // **Felhasználónév és email egyediségének ellenőrzése**
    const usernameSnapshot = await dbUser.orderByChild("username").equalTo(username).once("value");
    if (usernameSnapshot.exists()) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const emailSnapshot = await dbUser.orderByChild("email").equalTo(email).once("value");
    if (emailSnapshot.exists()) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // **Jelszó titkosítása**
    const hashedPassword = await bcrypt.hash(password, 10);

    // **Új felhasználó létrehozása**
    const newUserRef = dbUser.push();
    const userId = newUserRef.key;

    await newUserRef.set({
      id: userId,
      name,
      username,
      password: hashedPassword,
      phoneNumber,
      email,
      role: role || "user",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // **Validáció: kitöltött mezők**
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // **Felhasználó keresése**
    const snapshot = await dbUser.orderByChild('username').equalTo(username).once('value');
    if (!snapshot.exists()) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // **Felhasználó adatainak lekérése**
    let userId, userData;
    snapshot.forEach(childSnapshot => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    // **Jelszó ellenőrzése**
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // **Token generálás**
    const token = jwt.sign(
      { id: userId, username: userData.username, role: userData.role },
      jwt_secret,
      { expiresIn: '24h' }
    );

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

router.get('/users', async (req, res) => {
  try {
    const usersRef = dbUser;
    const snapshot = await usersRef.once('value');
    const users = [];
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      // Don't send password
      delete user.password;
      users.push(user);
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userRef = dbUser.child(req.user.id);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = snapshot.val();
    delete userData.password; // **Jelszót eltávolítjuk a válaszból**

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phoneNumber, email, username } = req.body;

    // **Validáció: Legalább egy mező kötelező**
    if (!name && !phoneNumber && !email && !username) {
      return res.status(400).json({ message: "At least one field is required for update" });
    }

    // **Email formátum ellenőrzése (ha módosítva lett)**
    if (email && (!email.includes("@") || email.length < 6)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // **Felhasználó keresése**
    const userRef = dbUser.child(userId);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (email) updates.email = email;
    if (username) updates.username = username;

    // **Adatok frissítése az adatbázisban**
    await userRef.update(updates);

    res.status(200).json({ message: "Profile updated successfully", updatedFields: updates });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;