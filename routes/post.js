const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get("/test", ctrl.post.test);
router.get(
  "/:id/allComments",
  passport.authenticate("jwt", { session: false }),
  ctrl.post.allComments,
);

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  ctrl.post.create,
);

router.put(
  "/:id/edit",
  passport.authenticate("jwt", { session: false }),
  ctrl.post.edit,
);

router.delete(
  "/:id/delete",
  passport.authenticate("jwt", { session: false }),
  ctrl.post.remove,
);

module.exports = router;