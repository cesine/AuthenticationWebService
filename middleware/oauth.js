var OAuthServer = require('express-oauth-server');
var OAuthClient = require('./../models/oauth-client');
var errorMiddleware = require('./error-handler').errorHandler;

var oauth = new OAuthServer({
  debug: /(oauth)/.test(process.env.DEBUG),
  // handleError: errorMiddleware,
  useErrorHandler: true,
  continueMiddleware: true,
  allowBearerTokensInQueryString: false,
  addAcceptedScopesHeader: true,
  addAuthorizedScopesHeader: true,
  model: OAuthClient // See https://github.com/thomseddon/node-oauth2-server for specification
});

console.log('oauth', oauth.server);

for (var att in oauth.server) {
  console.log('att', att);
}
module.exports = oauth;
