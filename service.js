'use strict';

var bodyParser = require('body-parser');
var cors = require('cors');
var debug = require('debug')('service');
var express = require('express');
var morgan = require('morgan');

var authenticationRoutes = require('./routes/authentication').router;
var oauthRoutes = require('./routes/oauth').router;
var authenticationMiddleware = require('./middleware/authentication');
var errorsMiddleware = require('./middleware/error');
var routes = require('./routes/index').router;
var userRoutes = require('./routes/user').router;

var service = express();

/**
 * Config
 */
service.use(morgan('combined'));

/**
 * Body parsers
 */
service.use(bodyParser.json());
service.use(bodyParser.urlencoded({
  extended: true
}));

/**
 * Cross Origin Resource Sharing
 * (permits client sides which are not hosted on the same domain)
 */
service.use(cors());

/**
 * Middleware
 */
// The example attaches it to the express
// https://github.com/oauthjs/express-oauth-server#quick-start
// service.oauth = oauthMiddleware;
service.use(authenticationMiddleware.jwt);

/**
 * Routes
 */
service.use('/bower_components', express.static(__dirname +
  '/public/components/as-ui-auth/bower_components'));
service.use('/authentication', authenticationRoutes);
service.use('/oauth', oauthRoutes);
service.use('/v1/users', userRoutes);
service.use('/', routes);

/**
 * Not found
 */
service.use(function(req, res, next) {
  debug(req.url + ' was not found');
  var err = new Error('Not Found');
  err.status = 404;
  next(err, req, res, next);
});

/**
 * Attach error handler
 */
service.use(errorsMiddleware);

module.exports = service;
