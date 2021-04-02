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
        message: "You Are Not a Member Of This Workspace.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } 
}

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
  readOneMember,
  readOneAdmin,
}
