const mongoose = require('mongoose');
const Comment = require('./comment');
const { Schema } = mongoose;

const postSchema = new Schema({
  poster: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  comments: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
  },
  content: {
    type: Schema.Types.Mixed,
  },
  reactions: {
    type: Map,
    of: Schema.Types.Mixed, 
  },
}, { timestamps: true });

// Upon delete, remove all posts and tasks.
postSchema.pre('remove', function(next) {
  Comment.deleteMany({postId: this._id}).exec();
  next();
});

// poster will store user id as key and then store image url and name.

// comments will store comment id as key then store commenter id,
//  image url and name.

// content will have text information but also image information depending
//  on if an image were uploaded.

// reactions will have the emoji id as the key and then store the emoji
//  string data, and count, and reactor name.

const Post = mongoose.model('Post', postSchema);

module.exports = Post;