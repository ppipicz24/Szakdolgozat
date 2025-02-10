// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
//const faker = require('faker');

require('dotenv').config();

// Firebase inicializálása
const serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Felhasználó regisztráció
app.post('/register', async (req, res) => {
    console.log("asdasd")
   /* const { email, password, name, role } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name
        });
        await db.ref('users/' + userRecord.uid).set({
            name,
            email,
            role
        });
        res.status(201).send({ message: 'Felhasználó sikeresen regisztrálva!' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }*/
});

// Időpontok létrehozása
/*app.post('/timeslots', async (req, res) => {
    const { date, groupSize, ageGroup, language, coordinatorId } = req.body;
    try {
        const newSlotRef = db.ref('timeslots').push();
        await newSlotRef.set({ date, groupSize, ageGroup, language, coordinatorId, applicants: {} });
        res.status(201).send({ message: 'Időpont sikeresen létrehozva!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Animátor jelentkezése időpontra
app.post('/apply', async (req, res) => {
    const { userId, timeslotId } = req.body;
    try {
        const slotRef = db.ref(`timeslots/${timeslotId}/applicants`);
        await slotRef.child(userId).set(true);
        res.status(200).send({ message: 'Jelentkezés sikeres!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Időpontok listázása
app.get('/timeslots', async (req, res) => {
    try {
        const snapshot = await db.ref('timeslots').once('value');
        res.status(200).send(snapshot.val());
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Felhasználók listázása
app.get('/users', async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        res.status(200).send(snapshot.val());
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Időpont törlése
app.delete('/timeslots/:id', async (req, res) => {
    try {
        await db.ref(`timeslots/${req.params.id}`).remove();
        res.status(200).send({ message: 'Időpont sikeresen törölve!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Adatbázis feltöltése random adatokkal
app.post('/seed', async (req, res) => {
    try {
        let users = {};
        let timeslots = {};
        
        // 10 random felhasználó létrehozása
        for (let i = 0; i < 10; i++) {
            const userId = `user${i}`;
            users[userId] = {
                name: faker.name.findName(),
                email: faker.internet.email(),
                role: i % 2 === 0 ? 'animator' : 'coordinator'
            };
        }

        // 10 random időpont létrehozása
        for (let i = 0; i < 10; i++) {
            const timeslotId = `timeslot${i}`;
            timeslots[timeslotId] = {
                date: faker.date.future().toISOString(),
                groupSize: faker.datatype.number({ min: 5, max: 20 }),
                ageGroup: faker.random.arrayElement(['6-8', '9-12', '13-16']),
                language: faker.random.arrayElement(['English', 'German', 'French']),
                coordinatorId: `user${faker.datatype.number({ min: 0, max: 9 })}`,
                applicants: {}
            };
        }

        await db.ref('users').set(users);
        await db.ref('timeslots').set(timeslots);

        res.status(200).send({ message: 'Random adatok sikeresen feltöltve!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});