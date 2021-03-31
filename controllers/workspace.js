// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// Cloudinary
const cloudinary = require('cloudinary');

// basic test
const test = async (req, res) => {
  res.json({ message: "Workspace endpoint OK!" });
};

// create workspace
const create = async (req, res) => {
  const { name } = req.body;

  try {
    // Check name uniqueness
    const test = await db.Workspace.findOne({ name });
    if (test) throw new Error("Workspace Name Taken");

    let imageUrl;
    if (req.file) {
      let image = req.file.path;
      try {
        const result = await cloudinary.uploader.upload(image);
        coverUrl = result.secure_url;
      } catch (error) {
        throw new Error("Could Not Upload To Cloudinary");
        imageUrl = ""
      }
    } else {
      imageUrl = ""
    }

    // The user that intialized the create is the first member and admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    // Find the user
    const user = await db.User.findOne({ _id: payload.id });   

    // Make a member
    const member = await db.Member.create({
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: "",
      bio: "",
      userId: user._id,
      imageUrl: "default Img",
      role: ['admin', 'member'],
      permissions: ['*'],
      rooms: new Map(),
    });

    // create workspace
    const workspace = await db.Workspace.create({
      name,
      imageUrl,
      rooms: new Map(),
      members: [member._id]
    });

    res.status(201).json({ success: true, message: "Workspace created" });
    
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
}

// Get Workspace data

// Edit Workspace

// Delete Workspace

// export all route functions
module.exports = {
  test,
  create,
};
