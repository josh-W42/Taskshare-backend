require('dotenv').config();

const { Strategy, ExtractJwt }  = require('passport-jwt');
const mongoose = require('mongoose');

const { User } = require('../models');

const options = {};
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
options.secretOrKey = process.env.JWT_SECRET;

module.exports = passport => {
    passport.use(new Strategy(options, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.id);
            if (!user) throw new Error('User Not Found');

            return done(null, user);
        } catch (error) {
            return done(null, false);
        }
    }))
}