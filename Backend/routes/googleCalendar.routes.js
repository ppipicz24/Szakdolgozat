const express = require('express');
const { google } = require('googleapis');
const { db, admin } = require('../database/firebase');
const authenticateToken = require('../middlewares/authMiddleware');
const oAuth2Client = require('./googleClient');

const router = express.Router();

const dbEvents = db.events;

router.get('/auth/google', authenticateToken, (req, res) => {
    const rawState = req.query.state;
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      state: rawState,
      redirect_uri: 'http://localhost:3000/google/auth/google/callback'
    });
    res.json({ url: authUrl });
  });
  
  
  router.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const rawState = req.query.state || '{}';
  
    try {
      const parsedState = JSON.parse(rawState);
      const userId = parsedState.userId;
      const redirectPath = parsedState.redirect || '/';
  
      if (!userId) {
        return res.status(400).json({ message: 'userId missing from state' });
      }
  
      const { tokens } = await oAuth2Client.getToken(code);

      oAuth2Client.setCredentials(tokens);


  
      await admin.database().ref(`users/${userId}/googleCalendar`).set({
        connected: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        connectedAt: Date.now(),
      });

  
      const redirectUrl = `http://localhost:4200/google/callback?redirect=${redirectPath}`;
      return res.redirect(302, redirectUrl);
    } catch (err) {
      console.error("Hibás Google callback:", err);
      return res.status(500).json({ message: 'Hiba a Google hitelesítés során' });
    }
  });
  
  router.post('/export-calendar', authenticateToken, async (req, res) => {
    try {
      const { eventId, access_token, refresh_token } = req.body;
  
      if (!eventId || !access_token) {
        return res.status(400).json({ message: 'eventId és access_token szükséges' });
      }

      if(!refresh_token) {
        return res.status(400).json({ message: 'refresh_token szükséges' });
      }
  
      // Esemény lekérése
      const eventSnap = await dbEvents.child(eventId).once('value');
      if (!eventSnap.exists()) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      const event = eventSnap.val();
  
      oAuth2Client.setCredentials({ access_token, refresh_token });
  
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
      const calendarEvent = {
        summary: event.name,
        description: `Automatikus export az appból`,
        start: {
          dateTime: new Date(`${event.date} ${event.time || '00'}:00:00`).toISOString(),
          timeZone: 'Europe/Budapest',
        },
        end: {
          dateTime: new Date(new Date(`${event.date} ${event.time || '00'}:00:00`).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Europe/Budapest',
        },
      };
  
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
      });
  
      res.status(200).json({
        message: 'Sikeresen exportálva a Google Naptárba',
        link: response.data.htmlLink,
      });
  
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: 'Szerverhiba', error: error.message });
    }
  });
  
  module.exports = router;