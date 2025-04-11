const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');


const indexRouter = require('./routes/index');


const app = express();

cron.schedule('*/30 * * * *', async () => {
  try {
    await axios.get('http://localhost:3000/send-reminder')

  } catch (error) {
    console.error('Hiba az automatikus emlékeztető ellenőrzés során:', error.message);
  }
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
  });  

app.use('/', indexRouter);


module.exports = app;
