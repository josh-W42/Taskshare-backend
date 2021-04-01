const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get('/test', ctrl.room.test);

router.post(
  "/create",
  passport.authenticate('jwt', { session: false }),
  ctrl.room.create
);

module.exports = router;