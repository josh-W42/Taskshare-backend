const router = require('express').Router();
const ctrl = require('../controllers');
const passport = require('passport');

router.get('/test', ctrl.user.test);
router.get('/:id/profile', passport.authenticate('jwt', { session: false }), ctrl.user.profile);

router.post('/register', ctrl.user.register);
router.post('/login', ctrl.user.login);

router.put('/:id/edit', passport.authenticate('jwt', { session: false }), ctrl.user.edit);
router.put('/:userId/addWorkSpace/:workId', passport.authenticate('jwt', { session: false }), ctrl.user.addWorkspace);

router.delete('/:id/delete', passport.authenticate('jwt', { session: false }), ctrl.user.remove);

module.exports = router;