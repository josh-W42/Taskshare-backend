const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');
const multer = require("multer");
const uploads = multer({ dest: "./uploads" });

router.get('/test', ctrl.workspace.test);

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  uploads.single("workspaceImg"),
  ctrl.workspace.create
);

module.exports = router;