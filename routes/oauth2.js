var debug = require('debug')('oauth:routes');
var param = require('swagger-node-express/Common/node/paramTypes.js');
var util = require('util');

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

    // Redirect anonymous users to login page.
    if (!res.locals.user) {
      return res.redirect(util.format('/authentication/login/?redirect=%s&client_id=%s&'
        + 'redirect_uri=%s', req.path, req.body.client_id, req.body.redirect_uri));
    }

    console.log('res.locals.user', res.locals.user);
    return res.redirect(req.body.redirect_uri);
  }
};
/**
 * Authorize an app to a given user's account
 *
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.postAuthorize = {
  spec: {
    path: '/oauth2/authorize',
    description: 'Operations about authorization',
    notes: 'Requests authorize',
    summary: 'Retrieves authorize',
    method: 'POST',
    parameters: [
      param.query('client_id', 'client_id of the application', 'string'),
      param.query('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'Token',
    errorResponses: [],
    nickname: 'postAuthorize'
  },
  action: function postAuthorize(req, res, next) {
    console.log('postAuthorize res.locals', res.locals);
    console.log('req.headers', req.headers);
    console.log('req.session', req.session);
    console.log('req.body', req.body);
    debug(req.user);

    // Redirect anonymous users to login page.
    if (!res.locals.user) {
      debug(req.body, req.params);
      return res.redirect(util.format('/authentication/login?client_id=%s&redirect_uri=%s',
        req.body.client_id, req.body.redirect_uri));
    }

    var middleware = oauth.authorize({
      handleError: errorMiddleware
    });
    console.log('There is a user res.locals.user', res.locals.user, middleware);

    middleware(req, res, function (err) {
      console.log('done the authorize middleware', err, req.user, res.locals);
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
 * Get an OAuth2 Token
 *
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.getToken = {
  spec: {
    path: '/oauth2/token',
    description: 'Operations about tokens',
    notes: 'Requests a token',
    summary: 'Retrieves a token',
    method: 'GET',
    parameters: [
      param.query('client_id', 'client_id of the application', 'string'),
      param.query('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'Token',
    errorResponses: [],
    nickname: 'getToken'
  },
  action: function getToken(req, res) {
    // Redirect anonymous users to login page.
    if (!res.locals.user) {
      return res.redirect(util.format('/authentication/login?client_id=%s&redirect_uri=%s',
        req.query.client_id, req.query.redirect_uri));
    }

    OAuthClient.getTokenFromCode(req.query.code, function (err, token) {
      if (err) {
        return next(err);
      }
      console.log('token', token);
      // return oauth.authorize();
      res.send(token);
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
    debug('postToken', req.query, res.headers);

    var middleware = oauth.token({
      handleError: errorMiddleware
    });

    return middleware(req, res, next);
  }
};
// comes from https://github.com/oauthjs/express-oauth-server/blob/master/index.js#L64
// service.use(service.oauth.authorise()); // service.oauth.authorise is not a function

// Comes from https://github.com/oauthjs/node-oauth2-server#quick-start
// Invalid argument: `response` must be an instance of Response
// service.use(service.oauth.authenticate());
