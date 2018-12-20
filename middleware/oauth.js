var OAuthServer = require('express-oauth-server');
var OAuthClient = require('./../models/oauth-client');

var oauth = new OAuthServer({
  debug: /(oauth)/.test(process.env.DEBUG),
  model: OAuthClient // See https://github.com/thomseddon/node-oauth2-server for specification
});

module.exports = oauth;
