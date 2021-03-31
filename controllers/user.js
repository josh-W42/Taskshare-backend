// imports
require("dotenv").config();
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "User endpoint OK!" });
};

// Registering a new User. And Log in
const register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const user = await db.User.findOne({ email });
    // If found, throw an error.
    if (user) throw new Error("Email already exists");

    // Create a new user.
    const newUser = await db.User.create({
      email,
      password,
      firstName,
      lastName,
    });

    // Salt and hash the password.
    bcrypt.genSalt(12, (error, salt) => {
      if (error) throw new Error("Salt Generation Failed");

      bcrypt.hash(newUser.password, salt, async (error, hash) => {
        if (error) throw new Error("Hash Password Failure");

        newUser.password = hash;
        const createdUser = await newUser.save();

        // add the new username to autocomplete index
        // Trie.addWord(userName.toLowerCase(), "user");
        // Not yet.

        // We have to log in
        const payload = {
          id: createdUser._id,
          email: createdUser.email,
        };

        jwt.sign(payload, JWT_SECRET, (error, token) => {
          if (error) throw new Error("Session has ended, please log in again");

          const legit = jwt.verify(token, JWT_SECRET, { expiresIn: 60 });

          res.status(201).json({
            success: true,
            token: `Bearer ${token}`,
            data: legit,
            message: "User Created",
          });
        });
      });
    });
  } catch (error) {
    if (error.name === "MongoError") {
      const needToChange = error.keyPattern;
      res.status(409).json({
        success: false,
        message: "Database Error",
        needToChange,
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};

// User logging in.
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // First find user.
    const findUser = await db.User.findOne({ email });
    if (!findUser) throw new Error("User not found.");

    // Second compare the user password/
    const isValid = await bcrypt.compare(password, findUser.password);
    if (!isValid) throw new Error("Incorrect Password");

    // Log in
    const payload = {
      id: findUser.id,
      email: findUser.email,
    };

    jwt.sign(payload, JWT_SECRET, (error, token) => {
      if (error) throw new Error("Session has ended, please log in again");

      const legit = jwt.verify(token, JWT_SECRET, { expiresIn: 60 });

      res.json({ success: true, token: `Bearer ${token}`, userData: legit });
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Profile information
const profile = async (req, res) => {
  // Already authorized
  const _id = req.params.id;
  try {
    // Only give away information if logged in user id
    // is the same as the requested id.
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);
    if (payload.id !== _id) throw new Error("Forbidden");

    const user = await db.User.findOne({ _id }).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be logged In As That User To Do That.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }  
};

// Edit User Information
const edit = async (req, res) => {
  // Already Authorized
  const _id = req.params.id;
  try {
    // Only allow edits if logged in user id is the
    // same as the requested id.
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);
    if (payload.id !== _id) throw new Error("Forbidden");

    const { email, firstName, lastName, oldPassword, newPassword } = req.body;

    const user = await db.User.findOne({ _id });

    // We have to check the email, since they must be unique.
    if (email !== user.email) {
      const test = await db.User.findOne({ email });
      if (test) throw new Error("A User With That Email Already Exists.");
    }

    // if user submitted an oldPassword and newPassword
    if (oldPassword && newPassword) {
      // compare old password
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) throw new Error("Old Password Inccorect");

      const isOldPassword = await bcrypt.compare(newPassword, user.password);
      if (isOldPassword) throw new Error("New Password Cannot Be Old Password");

      // Salt and hash the password.
      bcrypt.genSalt(12, (error, salt) => {
        if (error) throw new Error("Salt Generation Failed");

        bcrypt.hash(newPassword, salt, async (error, hash) => {
          if (error) throw new Error("Hash Password Failure");

          // We can now save that new password.
          user.password = hash;
          await user.save();
        }); 
      });
    };

    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;

    // Save the user and the changes.
    await user.save();

    res.json({ success: true, message: "User Edit Successful." });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be logged In As That User To Do That",
      });
    } else if (error.name === 'MongoError') {
      const needToChange = error.keyPattern;
      res.status(409).json({
        success: false,
        message: "DataBase Error",
        needToChange
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Route to Delete a User
const remove = async (req, res) => {
  // id of user to delete
  const _id = req.params.id;
  try {
    // find the current user
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);
    // check if user is deleting only themselves
    if (payload.id !== _id) throw new Error("Forbidden");

    const user = await db.User.findOne({ _id });
    
    // then delete from db
    await user.delete();

    res.status(200).json({
      success: true,
      message: "User Deleted",
    });

  } catch (error) {
    console.error(error);
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be logged In As That User To Do That",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};

const addWorkspace = async (req, res) => {
  // When a user follows the invite link they have a choice to
  // join a workspace.. they must be logged in
  const userId = req.params.userId;
  const workspaceId = req.params.workId;
  try {
    // find the current user
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);
    // check if user is deleting only themselves
    if (payload.id !== userId) throw new Error("Forbidden");

    // find user and workspace
    const user = await db.User.findOne({ _id: userId });
    const workspace = await db.Workspace.findOne({ _id: workspaceId });

    // check if workspace exists.
    if (!worksapce) throw new Error('Workspace Does Not Exist!');

    // check if already in workspace.
    if (user.workSpaces.includes(workspace._id)) throw new Error('Already Joined That Workspace!');

    // After passing tests, add workspace and save.
    user.workSpaces.push(workspace);
    await user.save();

    res.json({ success: true, message: "Successfully Joined Workspace."});
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    }); 
  }
}

// export all route functions
module.exports = {
  test,
  register,
  login,
  profile,
  edit,
  remove,
  addWorkspace,
};
