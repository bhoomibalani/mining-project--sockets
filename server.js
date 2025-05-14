//imports
const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require("dotenv").config();


const connectDb = require("./config/db");
const { miningSessionSocketHandler  } = require("./sockets/miningSessionSockets.js");


const app = express()
const server = http.createServer(app);


// Socket.IO init
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});   

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: ["http://localhost:3000", "https://mining-project-sockets.onrender.com"], 
  credentials: true
}));

app.use(express.json());


// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "secretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  cookie: { maxAge: 3 * 60 * 60 * 1000 } // 3 hours
});
app.use(sessionMiddleware);

// Route
app.use('/api/v1/token', require('./routes/miningRoutes'));

app.get("/api/init-session", (req, res) => {
  if (!req.session.sessionId) {
    req.session.sessionId = `sess-${Date.now()}`;
    console.log(" New session initialized:", req.session.sessionId);
  }
  res.json({ sessionId: req.session.sessionId });
});

connectDb().then(() => {
  console.log(" MongoDB connected");


  const sharedSession = require("express-socket.io-session");
  io.use(sharedSession(sessionMiddleware, { autoSave: true }));

  io.on("connection", (socket) => {
    console.log(" New clientc");
    // console.log(socket)
    miningSessionSocketHandler(socket);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(` Server listening on http://localhost:${PORT}`);
  });
});



