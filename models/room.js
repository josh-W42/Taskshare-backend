const mongoose = require('mongoose');
const Member = require('./member');
const Post = require('./post');
const Task = require('./task');
const { Schema } = mongoose;

const roomSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: "Workspace",
  },
  description: {
    type: String,
  },
  createdByAdmin: {
    type: Boolean,
    default: false,
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
roomSchema.pre("remove", function (next) {
  Post.deleteMany({ roomId: this._id }).exec();
  Task.deleteMany({ roomId: this._id }).exec();
  next();
});

// This should auto-delete rooms if there are no members.
roomSchema.post("update", function () {
  console.log(this);
  // if (this.members.size < 1) {
  //   this.delete();
  // }
});

// Members will store object id as a key and just the name and image

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;