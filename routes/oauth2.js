var debug = require('debug')('oauth:routes');
var param = require('swagger-node-express/Common/node/paramTypes.js');
var util = require('util');

var errorMiddleware = require('./../middleware/error-handler').errorHandler;
var oauth = require('./../middleware/oauth');

/**
 * Get authorization from a given user
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.getAuthorize = {
  spec: {
    path: '/oauth/authorize',
    description: 'Operations about authorization',
    notes: 'Requests authorization',
    summary: 'Retrieves authorization',
    method: 'GET',
    parameters: [
      param.query('client_id', 'client_id of the application', 'string'),
      param.query('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'Authorization',
    errorResponses: [],
    nickname: 'getAuthorize'
  },
  action: function getAuthorize(req, res) {
    debug('req.app.locals', req.app.locals);

    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      return res.redirect(util.format('/login?redirect=%s&client_id=%s&'
        + 'redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri));
    }

    // return res.json('authorize', {
    //   client_id: req.query.client_id,
    //   redirect_uri: req.query.redirect_uri
    // });
    res.send('TODO');
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
    path: '/oauth/authorize',
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
    debug('postAuthorize req.app.locals', req.app.locals);
    debug(req.headers);
    debug(req.user);

    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      debug(req.query, req.params);
      return res.redirect(util.format('/authentication/login?client_id=%s&redirect_uri=%s',
        req.query.client_id, req.query.redirect_uri));
    }

    var middleware = oauth.authorize({
      handleError: errorMiddleware
    });

    middleware(req, res, next);
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
    path: '/oauth/token',
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
    if (!req.app.locals.user) {
      return res.redirect(util.format('/authentication/login?client_id=%s&redirect_uri=%s',
        req.query.client_id, req.query.redirect_uri));
    }

    // return oauth.authorize();
    res.send('TODO');
  }
};
/**
 * Create an OAuth2 token
 *
 * @type {[type]}
 */
exports.postToken = {
  spec: {
    path: '/oauth/token',
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
