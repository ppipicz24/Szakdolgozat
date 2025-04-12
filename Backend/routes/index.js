const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

// ROUTES
const authRoutes = require("./auth.routes");
const eventsRoutes = require("./events.routes");
const googleCalendarRoutes = require("./googleCalendar.routes");
const usersRoutes = require("./users.routes");

app.use("/auth", authRoutes);
app.use("/events", eventsRoutes);
app.use("/google", googleCalendarRoutes)
app.use("/users", usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;