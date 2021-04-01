const mongoose = require('mongoose');
const Member = require('./member');
const Room = require('./room');
const { Schema } = mongoose;

const workspaceSchema = new Schema({
  name: {
    type: String,
    required: true,
    unqiue: true,
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
}, { timestamps: true });

// Upon delete, remove all rooms and members.
workspaceSchema.pre('remove', function(next) {
  Room.remove({workspaceId: this._id}).exec();
  Member.remove({workspaceId: this._id}).exec();
  next();
});

// Rooms will be stored as a map with the key being the id,
// and the value being some data about it, but not everything.

// Members will also stored as a map, with the member id as key and 
// the value containing the member name,

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;