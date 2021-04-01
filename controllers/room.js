// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Room endpoint OK!" });
}

// create a room
const create = async (req, res) => {
  let { name, workspaceId, isPrivate } = req.body;
  isPrivate = isPrivate ? true : false;

  try {
    // check if admin or has permissions
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");
    
    if (!member.role.includes('admin')) {
      // determine privacy type
      const validPermissions = ['*'];
      validPermissions.push(isPrivate ? 'create-private-room' : 'create-public-room');
      // run test
      const test = member.permissions.filter((permission) => validPermissions.includes(permission));
      if (test.length === 0) throw new Error("Forbidden - Invalid Permissions");
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
      createdByAdmin: member.role.includes("admin"),
    });

    // add room to member instance
    member.rooms.set(room.id, {
      name: room.name,
      isPrivate: room.isPrivate,
    });

    await member.save();

    // add room to workspace instance.
    const workspace = await db.Workspace.findOne({ _id: workspaceId });
    workspace.rooms.set(room.id, {
      name: room.name,
      isPrivate: room.isPrivate,
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      message: "Room Creation Successful.",
    });
    
  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Workspace.",
      });
    } else if (error.message === "Forbidden - Invalid Permissions") {
      res.status(403).json({
        success: false,
        message: "Invalid Permissions",
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
}

// Get data for one Room
const readOne = async (req, res) => {
  const _id = req.params.id;
  try {
    // find the room
    const room = await db.Room.findOne({ _id });
    if (!room) throw new Error("Room Does Not Exist");

    // check if member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: room.workspaceId });
    if (!member) throw new Error("Forbidden");

    // return room data

    res.json({ success: true, result: room });
  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Room.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

const remove = async (req, res) => {
  const _id = req.params.id;

  try {
    // check room existence
    const room = await db.Room.findOne({ _id });
    if (!room) throw new Error("Room Does Not Exist");

    // check if member
    const [type, token] = req.headers.authorization.split(" ");
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({
      userId: payload.id,
      workspaceId: room.workspaceId,
    });
    if (!member) throw new Error("Forbidden - Not A Member");
    // check room properties. if created by an admin, only an admin can delete it.
    if (room.createdByAdmin && !member.role.includes("admin"))
      throw new Error("Forbidden - Invalid Permissions");

    // proceed with delete
    await room.delete();

    res.json({ success: true, message: "Room Deleted Successfully" });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Workspace.",
      });
    } else if (error.message === "Forbidden - Invalid Permissions") {
      res.status(403).json({
        success: false,
        message: "Invalid Permissions",
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
  remove,
}
