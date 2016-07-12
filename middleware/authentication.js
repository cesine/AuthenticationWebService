'use strict';
var debug = require('debug')('middleware:authentication');
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jsonwebtoken = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy;
var passport = require('passport');

var config = require('./../config');
var user = require('./../models/user');

var opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: config.jwt.private,
  issuer: config.url,
  audience: 'anythings.net'
};

passport.use(new JwtStrategy(opts, function(jwtPayload, done) {
  debug(' ', jwtPayload);

  user.read({
    username: jwtPayload.sub
  }, function(err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      done(null, user);
    } else {
      done(null, false);
      // or you could create a new account
    }
  });
}));

function jwt(req, res, next) {
  var tokenString;
  if (req && req.headers && req.headers.authorization && req.headers.authorization.indexOf('Bearer ' + config.jwt.prefix) > -1) {
    tokenString = req.headers.authorization;
    debug('used header', req.headers.authorization);
  } else if (req && req.headers && req.headers.cookie && req.headers.cookie.indexOf('Authorization=Bearer ' + config.jwt.prefix) > -1) {
    debug(req.headers.cookie);
    tokenString = req.headers.cookie.split(';').filter(function(cookie) {
      return cookie.indexOf('Authorization') > -1;
    }).map(function(cookie) {
      return cookie.replace('Authorization=', '').trim();
    }).join('');
    debug('used cookie', req.headers.cookie);
  }
  if (tokenString) {
    var token = tokenString.replace(new RegExp('Bearer ' + config.jwt.prefix), '');
    var decoded = jsonwebtoken.decode(token);

    debug('public key', config.jwt.public);
    try {
      var verified = jsonwebtoken.verify(token, config.jwt.public, {
        algorithm: config.jwt.algorithm
      });

      if (verified.expiration && verified.expiration < Date.now()) {
        var err = new Error('Authorization has expired');
        err.satus = 403;
        return next(err, req, res, next);
      }

      req.app.locals.user = req.user = decoded;
      req.app.locals.token = 'Bearer ' + config.jwt.prefix + token;
      // Oauth2 is trying to use this token
      delete req.headers.authorization;

      res.set('Authorization', req.app.locals.token);
    } catch (err) {
      err.status = 403;
      return next(err, req, res, next);
    }
  }

  debug('req.user', req.user);
  debug('req.app.locals', req.app.locals);
  next();
}

function requireAuthentication(req, res, next) {
  if (!req.app.locals.user) {
    var err = new Error('You must login to access this data');
    err.status = 403;
    return next(err, req, res, next);
  }

  next();
}

function requireAuthenticationPassportJWT(req, res, next) {
  debug('requireAuthentication', req.user);
  debug('requireAuthentication', req.app.locals);
  debug('requireAuthentication', req.headers);

  var middleware = passport.authenticate('jwt', {
    session: false
  });

  middleware(req, res, next);

  // next();
}

module.exports.jwt = jwt;
// https: //github.com/themikenicholson/passport-jwt/blob/master/test/extrators-test.js#L8
module.exports.extractor = opts.jwtFromRequest;
module.exports.requireAuthentication = requireAuthentication;
