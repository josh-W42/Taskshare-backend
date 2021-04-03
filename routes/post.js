const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get('/test', ctrl.post.test);

router.post(
  '/create',
  passport.authenticate('jwt', { session: false }),
  ctrl.post.create,
);

module.exports = router;