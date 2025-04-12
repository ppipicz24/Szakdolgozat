const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://szakdolgozat-d4ca7-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = {
  users: admin.database().ref("users"),
  events: admin.database().ref("events"),
  userEvents: admin.database().ref("userEvents"),
};

module.exports = { admin, db };
