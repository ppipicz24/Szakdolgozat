import { writeUserData } from "functions.js"

const express = require('express')
const admin = require('firebase-admin');

// Firebase inicializálása
const serviceAccount = require('../firebase-adminsdk.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
});

const app = express()

app.get('/', function (req, res) {
    res.send('Ez igy mar egy kesz szakdoli nem?')
})

app.get('/register', function (req,res){
    const {email, password, userName, phoneNumber, admin} = req.body
    try{
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: userName
        });
        await db.ref('users/' + userRecord.uid).set({
            userName,
            email,
            phoneNumber,
            admin
        });
        res.status(201).send({ message: 'Felhasználó sikeresen regisztrálva!' });
        writeUserData()

    }
})

app.listen(3000)