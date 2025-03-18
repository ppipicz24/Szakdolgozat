const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require("firebase-admin");
const serviceAccount = require("./../firebase-adminsdk.json");
const nodemailer = require("nodemailer");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://szakdolgozat-d4ca7-default-rtdb.europe-west1.firebasedatabase.app",
});

const router = express();
router.use(bodyParser.json());
const dbUser = admin.database().ref("users");
const dbEvents = admin.database().ref("events");

const jwt_secret="6f3b3caf3d56762361999c8a3b635bcce51d54aad4170be9b08e19f4564768a5";

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



const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "p.szakdolgozat@gmail.com",
        pass: "sodp wshz xocr lcpu",
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
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
    const { name, email, password, phoneNumber, role } = req.body;

    // **Validáció: Minden mező kitöltve van-e?**
    if (!name || !password || !phoneNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // **Felhasználónév és email hosszának ellenőrzése**
    if (name.length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters long" });
    }

    if (email.length < 6 || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // **Jelszó ellenőrzés (legalább 8 karakter, 1 nagybetű, 1 szám)**
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long, contain 1 uppercase letter and 1 number" });
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
    const { email, password } = req.body;

    // **Validáció: kitöltött mezők**
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // **Felhasználó keresése**
    const snapshot = await dbUser.orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // **Token generálás**
    const token = jwt.sign(
      { id: userId, role: userData.role, name: userData.name, email: userData.email, phoneNumber: userData.phoneNumber },
      jwt_secret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        name: userData.name,
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

//forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // **Validáció: kitöltött mező**
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // **Email ellenőrzése**
    if (!email.includes('@') || email.length < 6) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // **Felhasználó keresése**
    const snapshot = await dbUser.orderByChild('email').equalTo(email).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    // **Felhasználó adatainak lekérése**
    let userId, userData;
    snapshot.forEach(childSnapshot => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    // **Új jelszó generálása**
    const newPassword = Math.random().toString(36).slice(-8);

    // **Jelszó titkosítása**
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // **Jelszó frissítése az adatbázisban**
    await dbUser.child(userId).update({ password: hashedPassword });

    // **Jelszó küldése emailben**
    sendEmail(userData.email, 'Password Reset', `Your new password is: ${newPassword}`);

    res.status(200).json({ message: 'New password sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//new password
router.post('/new-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // **Validáció: kitöltött mező**
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    // **Felhasználó keresése**
    const userRef = dbUser.child(req.user.id);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    // **Jelszó ellenőrzése**
    const validPassword = await bcrypt.compare(oldPassword, userData.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    // **Jelszó ellenőrzés (legalább 8 karakter, 1 nagybetű, 1 szám)**
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, contain 1 uppercase letter and 1 number' });
    }

    // **Jelszó titkosítása**
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // **Jelszó frissítése az adatbázisban**
    await dbUser.child(req.user.id).update({ password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  }
  catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/users',  async (req, res) => {
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

router.post('/events', authenticateToken, async (req, res) => {
  try{
    const {name, date, time, numberOfPeople, age, isHungarian} = req.body;
    if (!name || !date || !time || !numberOfPeople || !age || isHungarian == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if(name.length < 5) {
      return res.status(400).json({ message: 'Name must be at least 5 characters long' });
    }

    if (numberOfPeople < 1) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    if (age < 0) {
      return res.status(400).json({ message: 'Age must be at least 0' });
    }

    if(date < new Date().toISOString()) {
      return res.status(400).json({ message: 'Date must be in the future' });
    }

    if (time < 0 || time > 24) {
      return res.status(400).json({ message: 'Time must be between 0 and 24' });
    }




    const newEventRef = dbEvents.push();
    const eventId = newEventRef.key;

    await newEventRef.set({
      id: eventId,
      name,
      date,
      time,
      numberOfPeople,
      age,
      isHungarian,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });

  }
})


module.exports = router;