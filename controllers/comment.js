// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Comment endpoint OK!" });
}

// Make a comment
const create = async (req, res) => {
  const { textContent, postId } = req.body;

  try {
    // check post existence
    const post = await db.Post.findOne({ _id: postId });
    if (!post) throw new Error("Post Does Not Exist");

    // check if member and if in room
    const [type, token] = req.headers.authorization.split(" ");
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({
      userId: payload.id,
      [`rooms.${post.roomId}`]: { $exists: true },
    });
    if (!member) throw new Error("Forbidden");

    // create the comment.
    const comment = await db.Comment.create({
      poster: {
        firstName: member.firstName,
        lastName: member.lastName,
        nickName: member.nickName,
        imageUrl: member.imageUrl,
      },
      posterId: member.id,
      postId: post._id,
      roomId: post.roomId,
      workspaceId: post.workspaceId,
      content: {
        textContent,
        imgArray: [],
      },
      reactions: new Map(),
    });

    // Add comment to post
    post.comments.push(comment);
    await post.save();

    res.status(201).json({ success: true, message: "Comment Created Successfully." });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "Not A Member Of Room Or Workspace.",
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