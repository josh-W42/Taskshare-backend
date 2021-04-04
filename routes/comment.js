const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get("/test", ctrl.comment.test);

router.post(
  "/create",
  passport.authenticate('jwt', { session: false }),
  ctrl.comment.create,
);

router.put(
  "/:id/edit",
  passport.authenticate('jwt', { session: false }),
  ctrl.comment.edit,
);

module.exports = router;