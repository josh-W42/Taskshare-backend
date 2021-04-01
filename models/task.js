const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
  },
  members: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, { timestamps: true });

// Members will have just the object id as a key and then the store
// the name and image url.

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;