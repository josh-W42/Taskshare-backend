const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');
const multer = require("multer");
const uploads = multer({ dest: "./uploads" });

router.get('/test', ctrl.workspace.test);
router.get("/all", ctrl.workspace.readMany);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.readOne,
);
router.get(
  "/:id/rooms",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.findRooms,
);
router.get(
  "/:id/members",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.findMembers,
);

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  uploads.single("workspaceImg"),
  ctrl.workspace.create,
);

router.put(
  "/:id/changeName",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.changeName,
);
router.put(
  "/:id/changePicture",
  passport.authenticate("jwt", { session: false }),
  uploads.single("workspaceImg"),
  ctrl.workspace.changePicture,
);
router.put(
  "/:id/addEmail",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.addEmail,
);
router.put(
  "/:id/toggleAllowAll",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.toggleAllEmails,
)

router.delete(
  "/:id/delete",
  passport.authenticate("jwt", { session: false }),
  ctrl.workspace.remove,
);

module.exports = router;