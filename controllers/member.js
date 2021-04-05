// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Members endpoint OK!" });
}

// member creation is handled in the user and workspace level.

// get member data if a member is searching
const readOneMember = async (req, res) => {
  const _id = req.params.id;

  try {
    // check member existence
    const foundMember = await db.Member.findOne({ _id }).select("-permissions -rooms -userId");
    if (!foundMember) throw new Error("Member Does Not Exist");

    // check if searcher is a member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const searchMember = await db.Member.findOne({ userId: payload.id, workspaceId: foundMember.workspaceId });
    if (!searchMember) throw new Error("Forbidden");

    // Return data
    res.json({ success: true, result: foundMember });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be a Member Of That Member's Workspace To Do That.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } 
}

// get member data if an admin is searching
const readOneAdmin = async (req, res) => {
  const _id = req.params.id;

  try {
    // check member existence
    const foundMember = await db.Member.findOne({ _id });
    if (!foundMember) throw new Error("Member Does Not Exist");

    // check if searcher is admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const searchMember = await db.Member.findOne({ userId: payload.id, workspaceId: foundMember.workspaceId });
    if (!searchMember || !searchMember.role.includes('admin')) throw new Error("Forbidden");

    // return the data
    res.json({ success: true, result: foundMember });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be An Admin Of That Member's Workspace To Do That.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// get member data if the searcher and member are the same person
// useful if member id is unknown
const readOneSelf = async (req, res) => {
  const _id = req.params.id;
  try {
    // Lookup the workspace
    const workspace = await db.Workspace.findOne({ _id });
    if (!workspace) throw new Error("Workspace does not exist");

    // Look up the member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member) throw new Error("Member Doesn't Exist");

    res.json({ success: true, result: member });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Edit member information
const edit = async (req, res) => {
  const _id = req.params.id;
  const { firstName, lastName, nickName, bio } = req.body;

  try {
    // Check Member Existence
    const member = await db.Member.findOne({ _id });
    if (!member) throw new Error("Member Does Not Exist");

    // check if editing self
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);
    if (member.userId.toString() !== payload.id) throw new Error("Forbidden");

    // Make changes
    member.firstName = firstName;
    member.lastName = lastName;
    member.nickName = nickName;
    member.bio = bio;
    await member.save();

    // Update All Rooms, Posts Workspaces
    db.Room.updateMany(
      { [`members.${member._id}`]: { $exists: true } },
      {
        [`members.${member._id}`]: {
          firstName: member.firstName,
          lastName: member.lastName,
          nickName: member.nickName,
          imageUrl: member.imageUrl,
        },
      }
    ).exec();

    db.Post.updateMany(
      { posterId: member.id },
      {
        poster: {
          firstName: member.firstName,
          lastName: member.lastName,
          nickName: member.nickName,
          imageUrl: member.imageUrl,
        },
      }
    ).exec();

    db.Comment.updateMany(
      { posterId: member.id },
      {
        poster: {
          firstName: member.firstName,
          lastName: member.lastName,
          nickName: member.nickName,
          imageUrl: member.imageUrl,
        },
      }
    ).exec();

    const workspace = await db.Workspace.findOne({ _id: member.workspaceId });
    workspace.members.set(member.id, {
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      imageUrl: member.imageUrl,
    });
    
    await workspace.save();

    res.json({ success: true, message: "Member Edit Successful" });
    
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Cannot Edit Someone Else's Profile.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Remove a member, thus removing them
const remove = async (req, res) => {
  const _id = req.params.id;

  try {
    // check member existence
    const foundMember = await db.Member.findOne({ _id });
    if (!foundMember) throw new Error("Member Does Not Exist.");

    // check if searcher either admin or is the foundMember
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const searchMember = await db.Member.findOne({ userId: payload.id, workspaceId: foundMember.workspaceId });
    if (!searchMember) throw new Error("Forbidden - Not A Member");
    if (!searchMember.role.includes('admin') && searchMember.id !== foundMember.id) throw new Error("Forbidden - Invalid Permissions");

    // delete the member

    // Updates to models must occur here rather than in the model to avoid hierarchy errors.
    // This searches for the Member data in the Room and Workspace Models and deletes that Member entry
    db.Room.updateMany(
      { [`members.${foundMember._id}`]: { $exists: true } },
      { $unset: { [`members.${foundMember._id}`]: 1 } }
    ).exec();

    const workspace = await db.Workspace.findOne({ _id: foundMember.workspaceId });
    workspace.members.delete(foundMember.id);
    await workspace.save();
    if (workspace.members.size < 1) workspace.delete();

    await foundMember.delete();

    res.json({ success: true, message: "Member Deleted Successfully" });
  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Must Be a Member Of That Member's Workspace To Do That.",
      });
    } else if (error.message === "Forbidden - Invalid Permissions") {
      res.status(403).json({
        success: false,
        message: "You Must Be An Admin Of That Member's Workspace To Do That.",
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
  readOneMember,
  readOneAdmin,
  readOneSelf,
  edit,
  remove,
}
