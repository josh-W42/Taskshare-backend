const mongoose = require('mongoose');
const { Schema } = mongoose;

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