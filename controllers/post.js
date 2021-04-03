// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Post endpoint OK!" });
}

// create new post
const create = async (req, res) => {
  const { textContent, roomId } = req.body;
  try {
    // check room existence
    const room = await db.Room.findOne({ _id: roomId });
    if (!room) throw new Error("Room Does Not Exist");

    // check if poster is a member of room
    const [type, token] = req.headers.authorization.split(" ");
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({
      userId: payload.id,
      workspaceId: room.workspaceId,
    });
    if (!member || !room.members.has(member.id)) throw new Error("Forbidden");

    // make a new post
    const post = await db.Post.create({
      poster: {
        firstName: member.firstName,
        lastName: member.lastName,
        nickName: member.nickName,
        imageUrl: member.imageUrl,
      },
      content: {
        textContent,
        imgArray: []
      },
      posterId: member._id,
      roomId: room._id,
      comments: new Map(),
      reactions: new Map(),
    });

    // Add post to room
    room.posts.push(post);
    await room.save();

    res.json({ success: true, message: "Post Created Successfully" });

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

// export all route functions
module.exports = {
  test,
  create,
}
