const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

async function seedDatabase() {
    try {
        await db.ref('users').set({
            userId1: { name: "John Doe", email: "john@example.com", role: "animator" },
            userId2: { name: "Admin User", email: "admin@example.com", role: "coordinator" }
        });

        await db.ref('timeslots').set({
            timeslotId1: {
                date: "2025-02-10T10:00:00",
                groupSize: 15,
                ageGroup: "10-12",
                language: "English",
                coordinatorId: "userId2",
                applicants: {}
            }
        });

        console.log("Adatok sikeresen feltöltve!");
        process.exit();
    } catch (error) {
        console.error("Hiba történt:", error);
        process.exit(1);
    }
}

seedDatabase();
