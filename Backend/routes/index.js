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
const dbUserEvents = admin.database().ref("userEvents");

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

const isAdminOrCoordinator = async (req, res, next) => {
  try {
    const userRef = dbUser.child(req.user.id);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    if (userData && (userData.role === 'admin' || userData.role === 'coordinator')) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin or Coordinator role required.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const userRef = dbUser.child(req.user.id);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (userData && userData.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// const isCoordinator = async (req, res, next) => {
//   try {
//     const userRef = dbUser.child(req.user.id);
//     const snapshot = await userRef.once('value');
//     const userData = snapshot.val();
    
//     if (userData && userData.role === 'coordinator') {
//       next();
//     } else {
//       res.status(403).json({ message: 'Access denied. Coordinator role required.' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

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
      role: role || "animator",
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
      { expiresIn: '20m' }
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

router.post('/logout', authenticateToken, (req, res) => {
  // JWT tokens are stateless, so we don't need to do anything server-side
  // The client should remove the token from storage
  res.status(200).json({ message: 'Logout successful' });
});

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

router.get('/users', authenticateToken, isAdminOrCoordinator, async (req, res) => {
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

router.post('/events', authenticateToken, isAdminOrCoordinator, async (req, res) => {
  try{
    const {name, date, time, numberOfPeople, age, isHungarian, isFull} = req.body;
    if (!name || !date || !time || !numberOfPeople || !age || isHungarian == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if(name.length < 5 && name.length > 50) {
      return res.status(400).json({ message: 'Name must be at least 5 and maximum 50 characters long ' });
    }

    if (numberOfPeople < 1) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    if (age < 1) {
      return res.status(400).json({ message: 'Age must be at least 1' });
    }

    if(date < new Date().toISOString()) {
      return res.status(400).json({ message: 'Date must be in the future' });
    }

    if (time < 0 || time > 24) {
      return res.status(400).json({ message: 'Time must be between 0 and 24' });
    }

    if (isFull == null) {
      return res.status(400).json({ message: 'isFull must be true or false' });
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
      isFull,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
})

router.get('/events', authenticateToken, async (req, res) => {
  try {
    const eventsRef = dbEvents;
    const snapshot = await eventsRef.once('value');
    const events = [];
    
    snapshot.forEach((childSnapshot) => {
      const event = childSnapshot.val();
      events.push(event);
    });
    
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/events/:id', authenticateToken, isAdminOrCoordinator, async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventRef = dbEvents.child(eventId);
    const snapshot = await eventRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventData = snapshot.val();
    res.status(200).json(eventData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/events/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;

    const eventRef = dbEvents.child(eventId);
    const snapshot = await eventRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 🔥 Esemény törlése
    await eventRef.remove();

    // 🧹 Kapcsoló tábla takarítása: minden userEvents, ami ehhez az eventId-hoz tartozik
    const userEventsSnapshot = await dbUserEvents.once('value');

    const deletePromises = [];

    userEventsSnapshot.forEach(childSnapshot => {
      const entry = childSnapshot.val();
      if (entry.eventId === eventId) {
        deletePromises.push(childSnapshot.ref.remove());
      }
    });

    await Promise.all(deletePromises);

    res.status(200).json({ message: 'Event and related registrations deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting event and related registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/events/:id/register', authenticateToken, async (req, res) => {
  console.log("REGISTER ENDPOINT HÍVVA:", req.params.id, "UserID:", req.user?.id);
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Ellenőrizzük, hogy az esemény létezik-e
    const eventSnapshot = await dbEvents.child(eventId).once('value');
    if (!eventSnapshot.exists()) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ellenőrizzük, hogy a user már jelentkezett-e az eseményre
    const existingRegistrationSnapshot = await dbUserEvents
      .orderByChild('user_event')
      .equalTo(`${userId}_${eventId}`)
      .once('value');

    if (existingRegistrationSnapshot.exists()) {
      return res.status(400).json({ message: 'User already registered for this event' });
    }

    // Jelentkezés mentése
    const newUserEventRef = dbUserEvents.push();
    await newUserEventRef.set({
      id: newUserEventRef.key,
      userId,
      eventId,
      user_event: `${userId}_${eventId}`,
      registeredAt: admin.database.ServerValue.TIMESTAMP
    });

    // Lekérjük a user és esemény adatait
    const userSnapshot = await dbUser.child(userId).once('value');
    const userData = userSnapshot.val();
    const eventData = eventSnapshot.val();

    // ✅ Email a jelentkezőnek
    await sendEmail(
      userData.email,
      'Esemény jelentkezés megerősítése',
      `Sikeresen jelentkeztél a(z) "${eventData.name}" eseményre, amely ${eventData.date} ${eventData.time}:00 kerül megrendezésre.`
    );

    // ✅ Email minden koordinátornak
    const allUsersSnapshot = await dbUser.once('value');
    const coordinatorEmails = [];

    allUsersSnapshot.forEach(childSnap => {
      const u = childSnap.val();
      if (u?.role === 'coordinator' && u?.email && u?.email !== userData.email) {
        coordinatorEmails.push(u.email);
      }
    });

    const coordinatorMessage = `Új jelentkezés érkezett az eseményre: "${eventData.name}" (${eventData.date} ${eventData.time}:00)\n\nJelentkező neve: ${userData.name}`;

    for (const email of coordinatorEmails) {
      await sendEmail(
        email,
        'Új jelentkezés eseményre',
        coordinatorMessage
      );
    }

    res.status(200).json({ message: 'Successfully registered for the event' });
  } catch (error) {
    console.error('Error during event registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/events/:id/unregister', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const userEventKey = `${userId}_${eventId}`;

    const snapshot = await dbUserEvents.orderByChild('user_event').equalTo(userEventKey).once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'User is not registered for this event' });
    }

    const updates = [];
    snapshot.forEach(childSnapshot => {
      updates.push(childSnapshot.ref.remove());
    });

    await Promise.all(updates);

    // 🔄 Email küldés a felhasználónak lejelentkezésről
    const userSnap = await dbUser.child(userId).once('value');
    const userData = userSnap.val();

    const eventSnap = await dbEvents.child(eventId).once('value');
    const eventData = eventSnap.val();

    if (userData?.email && eventData?.name) {
      await sendEmail(
        userData.email,
        'Lejelentkezés eseményről',
        `Sikeresen lejelentkeztél a(z) "${eventData.name}" eseményről (${eventData.date} - ${eventData.time}).`
      );
    }

    // ✅ Email minden koordinátornak
    const allUsersSnapshot = await dbUser.once('value');
    const coordinatorEmails = [];

    allUsersSnapshot.forEach(childSnap => {
      const u = childSnap.val();
      if (u?.role === 'coordinator' && u?.email && u?.email !== userData.email) {
        coordinatorEmails.push(u.email);
      }
    });

    const coordinatorMessage = `Lejelentkezés történt eseményről: "${eventData.name}" (${eventData.date} ${eventData.time}:00)\n\nJelentkező neve: ${userData.name}`;

    for (const email of coordinatorEmails) {
      await sendEmail(
        email,
        'Lejelentkezés eseményről',
        coordinatorMessage
      );
    }

    res.status(200).json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/events/send-reminders', async (req, res) => {
  try {
    const now = new Date();
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const eventsSnapshot = await dbEvents.once('value');
    const userEventsSnapshot = await dbUserEvents.once('value');
    const usersSnapshot = await dbUser.once('value');

    const upcomingEvents = [];
    eventsSnapshot.forEach(child => {
      const event = child.val();
      const time = event.time || '00:00';
      const dateTimeString = `${event.date}T${time}:00`;

      const eventDate = new Date(dateTimeString);
      if (eventDate > now && eventDate <= twelveHoursLater) {
        upcomingEvents.push(event);
      }
    });

    const remindersToSend = [];

    userEventsSnapshot.forEach(child => {
      const userEvent = child.val();

      if (userEvent.reminderSent === true) return; 

      const event = upcomingEvents.find(e => e.id === userEvent.eventId);
      if (!event) return;

      const userData = usersSnapshot.child(userEvent.userId).val();
      if (!userData || !userData.email) return;

      remindersToSend.push({
        userEventId: child.key,
        email: userData.email,
        name: userData.name,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time || '00:00'
      });
    });

    for (const reminder of remindersToSend) {
      await sendEmail(
        reminder.email,
        `Emlékeztető: hamarosan kezdődik az eseményed!`,
        `Kedves ${reminder.name}!\n\nNe felejtsd el, hogy hamarosan kezdődik a(z) "${reminder.eventName}" esemény!\nIdőpont: ${reminder.eventDate} ${reminder.eventTime}\n\nSok szeretettel várunk!`
      );

      await dbUserEvents.child(reminder.userEventId).update({ reminderSent: true });
    }

    res.status(200).json({
      message: `Emlékeztetők kiküldve: ${remindersToSend.length} db`
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get('/my-events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const snapshot = await dbUserEvents.once('value');
    const registeredEventIds = [];

    if (!snapshot.exists()) {
      return res.status(200).json([]);
    }

    snapshot.forEach(childSnapshot => {
      const userEvent = childSnapshot.val();

      if (userEvent && userEvent.userId === userId) {
        registeredEventIds.push(userEvent.eventId);
      }
    });

    res.status(200).json(registeredEventIds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get('/events/:id/registered-users', authenticateToken, isAdminOrCoordinator, async (req, res) => {
  try {
    const eventId = req.params.id;
    const snapshot = await dbUserEvents.once('value');

    const registeredUsers = [];

    if (!snapshot.exists()) {
      return res.status(200).json([]); // nincs regisztráció
    }

    const userFetches = [];

    snapshot.forEach(childSnapshot => {
      const userEvent = childSnapshot.val();

      if (userEvent && userEvent.eventId === eventId) {
        const userId = userEvent.userId;

        const fetch = dbUser.child(userId).once('value').then(userSnap => {
          const userData = userSnap.val();

          if (userData) {
            registeredUsers.push({
              id: userId,
              name: userData.name || 'Név nincs',
              email: userData.email || 'Email nincs',
              phoneNumber: userData.phoneNumber || 'Telefonszám nincs'
            });
          } else {
            // fallback ha a user már törölve lett
            registeredUsers.push({
              id: userId,
              name: 'Ismeretlen felhasználó',
              email: '-',
              phoneNumber: '-'
            });
          }
        });

        userFetches.push(fetch);
      }
    });

    await Promise.all(userFetches);

    res.status(200).json(registeredUsers);
  } catch (error) {
    console.error('❌ Hiba a regisztrált felhasználók lekérésekor:', error);
    res.status(500).json({ message: "Szerverhiba", error: error.message });
  }
});

router.patch('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const validRoles = ['admin', 'coordinator', 'animator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    const userRef = dbUser.child(userId);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userRef.update({ role });

    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;