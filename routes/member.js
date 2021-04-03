const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get('/test', ctrl.member.test);
router.get(
  "/:id/member",
  passport.authenticate('jwt', { session: false }),
  ctrl.member.readOneMember,
);
router.get(
  "/:id/admin",
  passport.authenticate('jwt', { session: false }),
  ctrl.member.readOneAdmin,
);

router.put(
  "/:id/edit",
  passport.authenticate('jwt', { session: false }),
  ctrl.member.edit,
);

router.delete(
  "/:id/remove",
  passport.authenticate('jwt', { session: false }),
  ctrl.member.remove,
);

module.exports = router;