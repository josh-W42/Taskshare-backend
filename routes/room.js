const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get('/test', ctrl.room.test);
router.get(
  "/:id",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.readOne,
);

router.post(
  "/create",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.create,
);

router.put(
  "/:id/join",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.join,
);
router.put(
  "/:id/leave",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.leave,
);

router.delete(
  "/:id/delete",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.remove,
);

module.exports = router;