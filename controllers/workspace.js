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
        imageUrl = result.secure_url;
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

    // create workspace
    const workspace = await db.Workspace.create({
      name,
      imageUrl,
      inviteLink: "",
      rooms: new Map(),
      members: new Map(),
    });

    // Add invite Link:
    workspace.inviteLink = `<PublicDomain>/join/${workspace.id}`;
    
    // Make a member
    const member = await db.Member.create({
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: "",
      bio: "",
      userId: user._id,
      workspaceId: workspace._id,
      imageUrl: "default Img",
      role: ['admin', 'member'],
      permissions: ['*'],
      rooms: new Map(),
    });
    
    // Add the new member to the workspace.
    workspace.members.set(member.id, {
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      imageUrl: member.imageUrl,
    });

    await workspace.save();

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

// Get Workspace data for one workspace.
const readOne = async (req, res) => {
  const _id = req.params.id;

  try {
    // First find the data base
    const workspace = await db.Workspace.findOne({ _id }).select("-allowedEmails");
    if (!workspace) throw new Error("Workspace Does Not Exist");

    // Check if member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member) throw new Error("Forbidden");

    res.json({ success: true, result: workspace });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be a Member Of That Workspace To Access Data",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Get all Workspaces
const readMany = async (req, res) => {
  // This route isn't protected, but I do limit the data returned
  try {
    // Get all
    const results = await db.Workspace.find({}).select(
      "-rooms -members -inviteLink -allowedEmails -newMemberPermissions"
    );

    res.json({success: true, count: results.length, results })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Change Workspace Name
const changeName = async (req, res) => {
  const workspaceId = req.params.id;
  const { name } = req.body;
  try {
    // check the name
    const test = await db.Workspace.findOne({ name });
    if (test) throw new Error("Workspace With That Name Already Exists");

    // find the workspace
    const workspace = await db.Workspace.findOne({ _id: workspaceId });
    if (!workspace) throw new Error("Workspace Does Not Exist");

    // check if admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member || !member.role.includes('admin')) throw new Error("Forbidden");

    // change the name
    workspace.name = name;
    await workspace.save();

    res.json({ success: true, message: "Workspace Name Changed" });
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Admin Of This Workspace.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// change workspace picture
const changePicture = async (req, res) => {
  const _id = req.params.id;

  try {
    // check if workspace exists
    const workspace = await db.Workspace.findOne({ _id });
    if (!workspace) throw new Error("Workspace Does Not Exists");

    // Upload
    let imageUrl = workspace.imageUrl;
    if (req.file) {
      let image = req.file.path;
      try {
        const result = await cloudinary.uploader.upload(image);
        imageUrl = result.secure_url;
      } catch (error) {
        throw new Error("Could Not Upload To Cloudinary");
      }
    }

    // check if admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member || !member.role.includes('admin')) throw new Error("Forbidden");

    // save
    workspace.imageUrl = imageUrl;
    await workspace.save();

    res.json({ success: true, message: "Profile Picture Changed" });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Admin Of This Workspace.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Delete Workspace
const remove = async (req, res) => {
  const _id = req.params.id;

  try {
    // Check if workspace exists.
    const workspace = await db.Workspace.findOne({ _id });
    if (!workspace) throw new Error("Workspace Does Not Exist");

    // check if admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member || !member.role.includes('admin')) throw new Error("Forbidden");

    // Delete the workspace
    await workspace.delete();

    res.json({ success: true, message: "Workspace Deleted" });
    
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Admin Of This Workspace.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// export all route functions
module.exports = {
  test,
  create,
  readOne,
  readMany,
  changeName,
  changePicture,
  remove,
};
