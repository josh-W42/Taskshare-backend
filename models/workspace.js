const mongoose = require('mongoose');
const Comment = require('./comment');
const Member = require('./member');
const Post = require('./post');
const Room = require('./room');
const { Schema } = mongoose;

const workspaceSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  inviteLink: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  rooms: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  members: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  allowedEmails: [String],
  allowsAllEmails: {
    type: Boolean,
    default: false,
  },
  newMemberPermissions: {
    type: [String],
    default: ['create-public-room', 'add-workspace-members']
  },
}, { timestamps: true });

// Upon delete, remove all rooms, members, and update users
workspaceSchema.pre('remove', function(next) {
  Room.deleteMany({ workspaceId: this._id }).exec();
  Member.deleteMany({ workspaceId: this._id }).exec();
  Post.deleteMany({ workspaceId: this._id }).exec();
  Comment.deleteMany({ workspaceId: this._id }).exec();
  next();
});

// Rooms will be stored as a map with the key being the id,
// and the value being some data about it, but not everything.

// Members will also stored as a map, with the member id as key and 
// the value containing the member name,

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;