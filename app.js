// Imports
require('dotenv').config()
const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const passport = require('passport');
require('./config/passport')(passport);

// App Set up
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(require("morgan")("dev"));
app.use(express.json()); // JSON parsing
app.use(cors()); // allow all CORS requests
app.use(passport.initialize());

// API Routes
app.get("/api/", (req, res) => {
  res.json({
    name: "TaskShare API",
    greeting: "Welcome to the TS API",
    author: "Joshua Wilson",
    message: "You made it!",
  });
});

app.use('/api/users', routes.user);
app.use('/api/workspaces', routes.workspace);
app.use('/api/rooms', routes.room);
app.use('/api/members', routes.member);
app.use('/api/posts', routes.post);

// Server
const server = app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));

// Socket.io stuff
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', socket => {
  console.log(`connect: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`disconnect: ${socket.id}`);
  });
});

setInterval(() => {
  io.emit('message', new Date().toTimeString());
}, 5000);


module.exports = server;
