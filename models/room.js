const mongoose = require('mongoose');
const Comment = require('./comment');
const Post = require('./post');
const Task = require('./task');
const { Schema } = mongoose;

const roomSchema = new Schema(
  {
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
    isAMessageRoom: {
      type: Boolean,
      default: false,
    },
    allowedMembers: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    members: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  { timestamps: true }
);

// Upon delete, remove all posts and tasks.
roomSchema.pre("remove", function (next) {
  Post.deleteMany({ roomId: this._id }).exec();
  Task.deleteMany({ roomId: this._id }).exec();
  Comment.deleteMany({ roomId: this._id }).exec();
  next();
});

// Members will store object id as a key and just the name and image

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;