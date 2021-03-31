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

  // Ok so this is when do things like check if an email already exists
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
  // Already authorized, so just find and retrieve data.
  const _id = req.params.id;
  try {
    // Only give away information to a logged in user.
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

// export all route functions
module.exports = {
  test,
  register,
  login,
  profile,
};
