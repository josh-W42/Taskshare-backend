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

    // check if member and if in room
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: room.workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");
    if (!member.rooms.has(room.id)) throw new Error("Forbidden - Not In Room");

    // make a new post
    const post = await db.Post.create({
      poster: {
        firstName: member.firstName,
        lastName: member.lastName,
        nickName: member.nickName,
        imageUrl: member.imageUrl,
      },
      workspaceId: room.workspaceId,
      content: {
        textContent,
        imgArray: []
      },
      posterId: member._id,
      roomId: room._id,
      reactions: new Map(),
    });

    // Add post to room
    room.posts.push(post);
    await room.save();

    res.json({ success: true, message: "Post Created Successfully" });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of The Workspace That Houses The Room.",
      });
    } else if (error.message === "Forbidden - Not In Room") {
      res.status(403).json({
        success: false,
        message: "You Must First Join A Room Before You Can Post.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// get all comments
const allComments = async (req, res) => {
  const _id = req.params.id;
  try {
    // check post existence
    const post = await db.Post.findOne({ _id });
    if (!post) throw new Error("Post Does Not Exist.");

    // check if member and if in room
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: post.workspaceId });
    if (!member) throw new Error("Forbidden - Not A Member");
    if (!member.rooms.has(post.roomId.toString())) throw new Error("Forbidden - Not In Room");

    // fetch and return data
    const comments = await db.Comment.find({ postId: _id });

    // Return data
    res.json({ success: true, count: comments.length, results: comments });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not An Member Of The Workspace That Houses The Room.",
      });
    } else if (error.message === "Forbidden - Not In Room") {
      res.status(403).json({
        success: false,
        message: "You Must First Join A Room Before You Can Post.",
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
  allComments,
}
