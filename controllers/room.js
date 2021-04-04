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
      members: memberMap,
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

// Get all posts
const allPosts = async (req, res) => {
  const _id = req.params.id;

  try {
    // Check room existence
    const room = await db.Room.findOne({ _id });
    if (!room) throw new Error("Room Does Not Exist");

    // check if member and if in room
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: room.workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");
    if (!member.rooms.has(room.id)) throw new Error("Forbidden - Not In Room");

    // Return data
    const posts = await db.Post.find({ roomId: _id });

    res.json({ success: true, count: posts.length, results: posts });
    
  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Workspace.",
      });
    } else if (error.message === "Forbidden - Not In Room") {
      res.status(403).json({
        success: false,
        message: "You Must First Join A Room Before You Access Data.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Joining a room.
const join = async (req, res) => {
  const _id = req.params.id;

  try {
    // check room existence
    const room = await db.Room.findOne({ _id });
    if (!room) throw new Error("Room Does Not Exist");

    // check if member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: room.workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");

    // check room privacy
    if (
      room.isPrivate &&
      room.allowedMembers.includes(member._id) &&
      !member.role.includes("admin")
    ) {
      throw new Error("Forbidden - No Invite");
    }

    // check if already joined room
    if (room.members.has(member.id)) throw new Error("You Already Joined This Room");

    // add room member's collection
    member.rooms.set(room.id, {
      name: room.name,
      isPrivate: room.isPrivate,
    });
    await member.save();

    // add member to room's collection
    room.members.set(member.id, {
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      imageUrl: member.imageUrl,
    });
    await room.save();

    res.json({ success: true, message: "Successfully Joined Room" });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Workspace.",
      });
    } else if (error.message === "Forbidden - No Invite") {
      res.status(403).json({
        success: false,
        message: "Private Rooms Require An Invite To Join",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Leave a Room
const leave = async (req, res) => {
  const _id = req.params.id;

  try {
    // check room existence
    const room = await db.Room.findOne({ _id });
    if (!room) throw new Error("Room Does Not Exist");

    // check if member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: room.workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");

    // check if already left
    if (!room.members.has(member.id)) throw new Error("You Have Not Joined That Room");

    // delete room entry in member
    member.rooms.delete(room.id);
    await member.save();

    // delete member entry in room
    room.members.delete(member.id);
    await room.save();

    // If a room has zero members, delete it MAYBE Not sure yet, this is good for Debugging.
    // if (room.members.size < 1) room.delete();

    res.json({ success: true, message: "Successfully Left Room" });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of This Workspace.",
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

    // Updates to models must occur here rather than in the model to avoid hierarchy errors.
    // This Basically searches for the room data in the Member and Workspace Models and deletes that room entry
    db.Member.updateMany(
      { [`rooms.${room._id}`]: { $exists: true } },
      { $unset: { [`rooms.${room._id}`]: 1 } }
    ).exec();
    db.Workspace.updateOne(
      { _id: room.workspaceId },
      { $unset: { [`rooms.${room._id}`]: 1 } }
    ).exec();

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
  allPosts,
  join,
  leave,
  remove,
}
