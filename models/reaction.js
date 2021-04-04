const mongoose = require('mongoose');
const { Schema } = mongoose;

const reactionSchema = new Schema({
  data: {
    type: String,
    required: true,
  },
  workspaceId: { 
    type: String,
    default: "Base",
  },
}, { timestamps: true });

const Reaction = mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;