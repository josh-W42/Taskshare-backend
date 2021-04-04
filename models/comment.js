const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  poster: {
    type: Schema.Types.Mixed,
  },
  posterId: {
    type: Schema.Types.ObjectId,
    ref: "Member",
  },
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
  content: {
    type: Schema.Types.Mixed,
  },
  reactions: {
    type: Map,
    of: Schema.Types.Mixed, 
  },
}, { timestamps: true });

// poster will store user id as key and then store image url and name.

// content will have text information but also image information depending
//  on if an image were uploaded.

// reactions will have object id as the key and then store the emoji
//  string data, and count, and reactor name.

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;