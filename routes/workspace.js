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

module.exports = router;