const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  workSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
  password: {
    type: String,
    required: true,
    minLength: 8
  },
  prefersDarkMode: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;