const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomSchema = new Schema({
  name: {
    type: String,
    required: true,
    unqiue: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  posts: {
    type: Map,
    ref: "Post",
  },
  members: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  }],
}, { timestamps: true });

// Members will store object id as a key and just the name and image

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;