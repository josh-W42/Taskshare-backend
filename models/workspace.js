const mongoose = require('mongoose');
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
  members: [
    [
      { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ]
  ],
}, { timestamps: true });

// Rooms will be stored as a map with the key being the id,
// and the value being some data about it, but not everything.

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;