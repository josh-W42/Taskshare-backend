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

// edit a comment
const edit = async (req, res) => {
  const _id = req.params.id;
  const { textContent } = req.body;
  try {
    // check comment existence
    const comment = await db.Comment.findOne({ _id });
    if (!comment) throw new Error("Comment Does Not Exist");

    // check if poster
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({
      userId: payload.id,
      workspaceId: comment.workspaceId,
    });
    if (!member || !member.rooms.has(comment.roomId.toString())) throw new Error("Forbidden - Not A Member");
    if (member.id !== comment.posterId.toString())
      throw new Error("Forbidden - Didn't Post This");

    // edit the content
    const oldContent = comment.content;
    const newContent = {
      textContent,
      imgArray: [],
    }
    // Change for later when images are implemented.
    comment.content = newContent;
    await comment.save();

    res.json({ success: true, message: "Post Edit Successful" });

  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not A Member Of The Workspace This Comment is Apart Of",
      });
    } else if (error.message === "Forbidden - Didn't Post This") {
      res.status(403).json({
        success: false,
        message: "You Can Only Edit Comments That You Create",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Delete comment
const remove = async (req, res) => {
  const _id = req.params.id;

  try {
    // check comment existence
    const comment = await db.Comment.findOne({ _id });
    if (!comment) throw new Error("Comment Does Not Exist");

    // check if poster
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({
      userId: payload.id,
      workspaceId: comment.workspaceId,
    });
    if (!member) throw new Error("Forbidden - Not A Member");
    if (
      member.id !== comment.posterId.toString() &&
      !member.role.includes("admin")
    )
      throw new Error("Forbidden - Didn't Post This And Not Admin");

    // delete comment
    await comment.delete();

    res.json({ success: true, message: "Comment Deleted Successfully" });
  } catch (error) {
    if (error.message === "Forbidden - Not A Member") {
      res.status(403).json({
        success: false,
        message: "You Are Not A Member Of The Workspace This Comment is Apart Of",
      });
    } else if (error.message === "Forbidden - Didn't Post This And Not Admin") {
      res.status(403).json({
        success: false,
        message: "You Can Only Delete Comments If You Created Them Or If You're An Admin",
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
  edit,
  remove,
}