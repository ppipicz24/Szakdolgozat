const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const authenticateToken = require("../middlewares/authMiddleware");
const { isAdminOrCoordinator, isAdmin } = require("../middlewares/rolesMiddleware");
const sendEmail = require("../utils/email");
const admin = require("firebase-admin");
const dbEvents = db.events;
const dbUser = db.users;
const dbUserEvents = db.userEvents;

router.post("/", authenticateToken, isAdminOrCoordinator, async (req, res) => {
    try {
        const { name, date, time, numberOfPeople, age, isHungarian, isFull } =
            req.body;
        if (!name || !date || !time || !numberOfPeople || !age || isHungarian == null
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (name.length < 5 && name.length > 50) {
            return res.status(400).json({
                message: "Name must be at least 5 and maximum 50 characters long ",
            });
        }

        if (numberOfPeople < 1) {
            return res
                .status(400)
                .json({ message: "Number of people must be at least 1" });
        }

        if (age < 1) {
            return res.status(400).json({ message: "Age must be at least 1" });
        }

        if (date < new Date().toISOString()) {
            return res.status(400).json({ message: "Date must be in the future" });
        }

        if (time < 0 || time > 24) {
            return res
                .status(400)
                .json({ message: "Time must be between 0 and 24" });
        }

        if (isFull == null) {
            return res
                .status(400)
                .json({ message: "isFull must be true or false" });
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
        res.status(201).json({ message: "Event created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
);

router.get("/", authenticateToken, async (req, res) => {
    try {
        const eventsRef = dbEvents;
        const snapshot = await eventsRef.once("value");
        const events = [];

        snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            events.push(event);
        });

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//     async (req, res) => {
//         try {
//             const eventId = req.params.id;
//             const eventRef = dbEvents.child(eventId);
//             const snapshot = await eventRef.once("value");

//             if (!snapshot.exists()) {
//                 return res.status(404).json({ message: "Event not found" });
//             }

//             const eventData = snapshot.val();
//             res.status(200).json(eventData);
//         } catch (error) {
//             res.status(500).json({ message: "Server error", error: error.message });
//         }
//     }
// );

router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        const eventRef = dbEvents.child(eventId);
        const snapshot = await eventRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ message: "Event not found" });
        }

        await eventRef.remove();

        const userEventsSnapshot = await dbUserEvents.once("value");

        const deletePromises = [];

        userEventsSnapshot.forEach((childSnapshot) => {
            const entry = childSnapshot.val();
            if (entry.eventId === eventId) {
                deletePromises.push(childSnapshot.ref.remove());
            }
        });

        await Promise.all(deletePromises);

        res.status(200).json({
            message: "Event and related registrations deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/:id/register", authenticateToken, async (req, res) => {

    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const eventSnapshot = await dbEvents.child(eventId).once("value");
        if (!eventSnapshot.exists()) {
            return res.status(404).json({ message: "Event not found" });
        }

        const existingRegistrationSnapshot = await dbUserEvents.orderByChild("user_event").equalTo(`${userId}_${eventId}`).once("value");

        if (existingRegistrationSnapshot.exists()) {
            return res.status(400).json({ message: "User already registered for this event" });
        }

        const newUserEventRef = dbUserEvents.push();
        await newUserEventRef.set({
            id: newUserEventRef.key,
            userId,
            eventId,
            user_event: `${userId}_${eventId}`,
            reminderSent: false,
            registeredAt: admin.database.ServerValue.TIMESTAMP,
        });

        const userSnapshot = await dbUser.child(userId).once("value");
        const userData = userSnapshot.val();
        const eventData = eventSnapshot.val();

        await sendEmail(
            userData.email,
            "Esemény jelentkezés megerősítése",
            `Sikeresen jelentkeztél a(z) "${eventData.name}" eseményre, amely ${eventData.date} ${eventData.time}:00 kerül megrendezésre.`
        );

        const allUsersSnapshot = await dbUser.once("value");
        const coordinatorEmails = [];

        allUsersSnapshot.forEach((childSnap) => {
            const u = childSnap.val();
            if (u?.role === "coordinator" && u?.email && u?.email !== userData.email) {
                coordinatorEmails.push(u.email);
            }
        });

        const coordinatorMessage = `Új jelentkezés érkezett az eseményre: "${eventData.name}" (${eventData.date} ${eventData.time}:00)\n\nJelentkező neve: ${userData.name}`;

        for (const email of coordinatorEmails) {
            await sendEmail(email, "Új jelentkezés eseményre", coordinatorMessage);
        }

        res.status(200).json({ message: "Successfully registered for the event" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id/unregister", authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const userEventKey = `${userId}_${eventId}`;

        const snapshot = await dbUserEvents
            .orderByChild("user_event")
            .equalTo(userEventKey)
            .once("value");

        if (!snapshot.exists()) {
            return res
                .status(404)
                .json({ message: "User is not registered for this event" });
        }

        const updates = [];
        snapshot.forEach((childSnapshot) => {
            updates.push(childSnapshot.ref.remove());
        });

        await Promise.all(updates);

        const userSnap = await dbUser.child(userId).once("value");
        const userData = userSnap.val();

        const eventSnap = await dbEvents.child(eventId).once("value");
        const eventData = eventSnap.val();

        if (userData?.email && eventData?.name) {
            await sendEmail(
                userData.email,
                "Lejelentkezés eseményről",
                `Sikeresen lejelentkeztél a(z) "${eventData.name}" eseményről (${eventData.date} - ${eventData.time}).`
            );
        }

        const allUsersSnapshot = await dbUser.once("value");
        const coordinatorEmails = [];

        allUsersSnapshot.forEach((childSnap) => {
            const u = childSnap.val();
            if (u?.role === "coordinator" && u?.email && u?.email !== userData.email) {
                coordinatorEmails.push(u.email);
            }
        });

        const coordinatorMessage = `Lejelentkezés történt eseményről: "${eventData.name}" (${eventData.date} ${eventData.time}:00)\n\nJelentkező neve: ${userData.name}`;

        for (const email of coordinatorEmails) {
            await sendEmail(email, "Lejelentkezés eseményről", coordinatorMessage);
        }

        res.status(200).json({ message: "Successfully unregistered from event" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/send-reminder", async (req, res) => {
    try {
        const now = new Date();
        const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        const eventsSnapshot = await dbEvents.once("value");
        const userEventsSnapshot = await dbUserEvents.once("value");
        const usersSnapshot = await dbUser.once("value");

        const upcomingEvents = [];
        eventsSnapshot.forEach((child) => {
            const event = child.val();
            const time = event.time || "00:00";
            const dateTimeString = `${event.date} ${time}:00`;

            const eventDate = new Date(dateTimeString);
            if (eventDate > now && eventDate <= twelveHoursLater) {
                upcomingEvents.push(event);
            }
        });

        const remindersToSend = [];

        userEventsSnapshot.forEach((child) => {
            const userEvent = child.val();
            if (userEvent.reminderSent === true) return;

            const event = upcomingEvents.find((e) => e.id === userEvent.eventId);

            if (!event) return;
            const userData = usersSnapshot.child(userEvent.userId).val();
            if (!userData || !userData.email) return;
            remindersToSend.push({
                userEventId: child.key,
                email: userData.email,
                name: userData.name,
                eventName: event.name,
                eventDate: event.date,
                eventTime: event.time || "00:00",
            });

            for (const reminder of remindersToSend) {
                sendEmail(
                    reminder.email,
                    `Emlékeztető: hamarosan kezdődik az eseményed!`,
                    `Kedves ${reminder.name}!\n\nNe felejtsd el, hogy hamarosan kezdődik a(z) "${reminder.eventName}" esemény!\nIdőpont: ${reminder.eventDate} ${reminder.eventTime}:00\n\nSok szeretettel várunk!`
                );

                dbUserEvents.child(reminder.userEventId).update({ reminderSent: true });
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/my-events", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const snapshot = await dbUserEvents.once("value");
        const registeredEventIds = [];

        if (!snapshot.exists()) {
            return res.status(200).json([]);
        }

        snapshot.forEach((childSnapshot) => {
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

router.get("/:id/registered-users", authenticateToken, isAdminOrCoordinator, async (req, res) => {
    try {
        const eventId = req.params.id;
        const snapshot = await dbUserEvents.once("value");

        const registeredUsers = [];

        if (!snapshot.exists()) {
            return res.status(200).json([]);
        }

        const userFetches = [];

        snapshot.forEach((childSnapshot) => {
            const userEvent = childSnapshot.val();

            if (userEvent && userEvent.eventId === eventId) {
                const userId = userEvent.userId;

                const fetch = dbUser
                    .child(userId)
                    .once("value")
                    .then((userSnap) => {
                        const userData = userSnap.val();

                        if (userData) {
                            registeredUsers.push({
                                id: userId,
                                name: userData.name || "Név nincs",
                                email: userData.email || "Email nincs",
                                phoneNumber: userData.phoneNumber || "Telefonszám nincs",
                            });
                        } else {
                            registeredUsers.push({
                                id: userId,
                                name: "Ismeretlen felhasználó",
                                email: "-",
                                phoneNumber: "-",
                            });
                        }
                    });

                userFetches.push(fetch);
            }
        });

        await Promise.all(userFetches);

        res.status(200).json(registeredUsers);
    } catch (error) {
        res.status(500).json({ message: "Szerverhiba", error: error.message });
    }
}
);

module.exports = router