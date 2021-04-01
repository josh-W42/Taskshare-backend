const mongoose = require('mongoose');
const Post = require('./post');
const Task = require('./task');
const { Schema } = mongoose;

const roomSchema = new Schema({
  name: {
    type: String,
    required: true,
    unqiue: true,
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: "Workspace",
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  posts: {
    type: Map,
    of: Schema.Types.Mixed,
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

// Upon delete, remove all posts and tasks.
roomSchema.pre('remove', function(next) {
  Post.remove({roomId: this._id}).exec();
  Task.remove({roomId: this._id}).exec();
  next();
});

// Members will store object id as a key and just the name and image

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;