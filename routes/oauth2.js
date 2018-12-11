var debug = require('debug')('oauth:routes');
var param = require('swagger-node-express/Common/node/paramTypes.js');
var util = require('util');
var querystring = require('querystring');

var errorMiddleware = require('../middleware/error-handler').errorHandler;
var oauth = require('../middleware/oauth');
var OAuthClient = require('../models/oauth-client');

/**
 * Get authorization from a given user
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.getAuthorize = {
  spec: {
    path: '/oauth2/authorize',
    description: 'Operations about authorization',
    notes: 'Requests authorization',
    summary: 'Retrieves authorization',
    method: 'GET',
    parameters: [
      param.body('client_id', 'client_id of the application', 'string'),
      param.body('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'Authorization',
    errorResponses: [],
    nickname: 'getAuthorize'
  },
  action: function getAuthorize(req, res) {
    debug('getAuthorize res.locals', res.locals);
    debug('req.path', req.path);
    debug('req.query', req.query);
    debug('req.body', req.body);

    // Redirect anonymous users to login page.
    if (!res.locals.user) {
      delete req.query.client_secret;
      return res.redirect('/authentication/login/?'+ querystring.stringify(req.query));
    }

    var middleware = oauth.authorize({
      handleError: errorMiddleware
      // allowEmptyState: true,
    });
    debug('There is a user res.locals.user', res.locals.user, middleware);
    debug('req.headers', req.headers);

    return middleware(req, res, function (err) {
      debug('done the authorize middleware', err, req.user, res.locals);
      // if (err) {
      //   debug('error authorizing client', err, req.query);
      //   // the error handler will send cleaned json which can be displayed to the user
      //   return next(err);
      // }

      // res.json({ something: true });
    });
  }
};

/**
 * Create an OAuth2 token
 *
 * @type {[type]}
 */
exports.postToken = {
  spec: {
    path: '/oauth2/token',
    description: 'Operations about tokens',
    notes: 'Requests a token',
    summary: 'Retrieves a token',
    method: 'POST',
    parameters: [
      param.form('client_id', 'client_id of the application', 'string'),
      param.form('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'Token',
    errorResponses: [],
    nickname: 'postToken'
  },
  action: function postToken(req, res, next) {
    debug('postToken', req.query, req.body, res.headers);

    var middleware = oauth.token({
      handleError: errorMiddleware
    });

    middleware(req, res, function (err) {
      debug('done the token middleware', err, req.user, res.locals);
      // if (err) {
      //   debug('error authorizing client', err, req.query);
      //   // the error handler will send cleaned json which can be displayed to the user
      //   return next(err);
      // }

      // res.json({ something: true });
    });
  }
};
// comes from https://github.com/oauthjs/express-oauth-server/blob/master/index.js#L64
// service.use(service.oauth.authorise()); // service.oauth.authorise is not a function

// Comes from https://github.com/oauthjs/node-oauth2-server#quick-start
// Invalid argument: `response` must be an instance of Response
// service.use(service.oauth.authenticate());
