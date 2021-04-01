const mongoose = require('mongoose');
const { Schema } = mongoose;

/*
  Possible Member Permissions:
    * -
      Can Do All Except Workspace Modification / Deletion.

    add-workspace-members -
      Has access to the workspace invite link and 
      can add an email to the list of accepted emails.

    create-public-room -
      Can create public rooms in workspace.

    create-private-room -
      Can create private rooms
*/

const memberSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  nickName: {
    type: String,
  },
  bio: {
    type: String,    
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
  },
  imageUrl: {
    type: String,
  },
  role: {
    type: [String],
  },
  permissions: {
    type: [String],
  },
  rooms: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, { timestamps: true });

// Rooms will be stored as a map with the key being the id,
// and the value being some data about it, but not everything.

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;