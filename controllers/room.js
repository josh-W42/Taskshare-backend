// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Room endpoint OK!" });
};

// create a room
const create = async (req, res) => {
  let { name, workspaceId, isPrivate } = req.body;
  isPrivate = isPrivate ? true : false;

  try {
    // check if admin or has permissions
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId });
    if (!member) throw new Error("Forbidden");
    
    if (!member.role.includes('admin')) {
      // determine privacy type
      const validPermissions = ['*'];
      validPermissions.push(isPrivate ? 'create-private-room' : 'create-public-room');
      // run test
      const test = member.permissions.filter((permission) => validPermissions.includes(permission));
      if (test.length === 0) throw new Error("Forbidden");
    }

    // room uniqueness test
    const test = await db.Room.findOne({ name, workspaceId });
    if (test) throw new Error("Room With That Name Already Exists");

    // make a member map
    const memberMap = new Map();
    memberMap.set(member.id, {
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      imageUrl: member.imageUrl,
    });

    // create room
    const room = await db.Room.create({
      name,
      workspaceId,
      isPrivate,
      posts: new Map(),
      members: memberMap,
      tasks: [],
    });

    res.status(201).json({
      success: true,
      message: "Room Creation Successfull.",
    })
    
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Admin Of This Workspace.",
      });
    } else if (error.name === "MongoError") {
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

// export all route functions
module.exports = {
  test,
  create,
};
