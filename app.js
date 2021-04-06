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
app.use('/api/comments', routes.comment);

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
  
  // All rooms are found with their mongo ids
  // so a socket can join a workspace, room, or Direct message
  // room just by referencing the id.
  socket.on('join room', (data) => {
    const id = data.id;
    socket.join(id);
  });
  
  socket.on('leave room', (data) => {
    const id = data.id;
    socket.leave(id);
  });
  
  // We want to emit to all sockets that are in the room
  //  So that way we can add a post
  socket.on('new post', (data) => {
    if (data.isComment) {
      io.to(`${data.newPost.postId}-room`).emit('newContent', data.newPost);
      socket.to(`${data.newPost.postId}-notification`).emit('newNotification', data.newPost);
    } else {
      io.to(`${data.newPost.roomId}-room`).emit('newContent', data.newPost);
      socket.to(`${data.newPost.roomId}-notification`).emit('newNotification', data.newPost);
    }
  });

  socket.on('delete post', (data) => {
    io.to(`${data.roomId}-room`).emit('deleteContent', data._id);
  });
  
  socket.on('disconnect', () => {
    console.log(`disconnect: ${socket.id}`);
  });
});

// setInterval(() => {
//   io.emit('message', new Date().toTimeString());
// }, 5000);


module.exports = server;
