#!/usr/local/bin/node
/* Load modules provided by Node */
var debug = require('debug')('auth:service');
var https = require('https');
var FileSystem = require('fs');
var path = require('path');
/* Load modules provided by $ npm install, see package.json for details */
var crossOriginResourceSharing = require('cors');
var expressWebServer = require('express');
var favicon = require('serve-favicon');
var bunyan = require('express-bunyan-logger');
var session = require('express-session');
var bodyParser = require('body-parser');

/* Load modules provided by this codebase */
var errorHandler = require('./middleware/error-handler').errorHandler;
var authWebServiceRoutes = require('./routes/routes');
var deprecatedRoutes = require('./routes/deprecated');
/**
 * You can control aspects of the deployment by using Environment Variables
 *
 * Examples:
 * $ NODE_ENV=production        # uses config/production.js
 * $ NODE_ENV=test              # uses config/test.js
 * $ NODE_ENV=development       # uses config/development.js
 * $ NODE_ENV=local             # uses config/local.js
 * $ NODE_ENV=yoursecretconfig  # uses config/yoursecretconfig.js
 */
debug('process.env.NODE_ENV', process.env.NODE_ENV);
var config = require('config');
var apiVersion = 'v' + parseInt(require('./package.json').version, 10);
debug('Accepting api version ' + apiVersion);
var corsOptions = {
  credentials: true,
  maxAge: 86400,
  methods: 'HEAD, POST, GET, PUT, PATCH, DELETE',
  allowedHeaders: 'Access-Control-Allow-Origin, access-control-request-headers, accept, accept-charset, accept-encoding, accept-language, authorization, content-length, content-type, host, origin, proxy-connection, referer, user-agent, x-requested-with',
  origin: function origin(origin, callback) {
    var originIsWhitelisted = false;
    if (/* permit curl */ origin === undefined || /* permit android */ origin === 'null' || origin === null || !origin) {
      originIsWhitelisted = true;
    } else if (origin.search(/^https?:\/\/.*\.lingsync.org$/) > -1
      || origin.search(/^https?:\/\/.*\.phophlo.ca$/) > -1
      || origin.search(/^https?:\/\/(localhost|127.0.0.1):[0-9]*$/) > -1
      || origin.search(/^chrome-extension:\/\/[^\/]*$/) > -1
      || origin.search(/^https?:\/\/.*\.jrwdunham.com$/) > -1) {
      originIsWhitelisted = true;
    }
    // debug(new Date() + " Responding with CORS options for " + origin + " accept as whitelisted is: " + originIsWhitelisted);
    callback(null, originIsWhitelisted);
  }
};
/**
 * Use Express to create the authWebService see http://expressjs.com/ for more details
 */
var authWebService = expressWebServer();
authWebService.use(errorHandler);
authWebService.use(crossOriginResourceSharing(corsOptions));
// Accept versions
authWebService.use(function versionMiddleware(req, res, next) {
  if (req.url.indexOf('/' + apiVersion) === 0) {
    req.url = req.url.replace('/' + apiVersion, '');
  }
  next();
});
authWebService.use(favicon(__dirname + '/public/favicon.ico'));
authWebService.use(bunyan({
  name: 'fielddb-auth',
  streams: [{
    level: process.env.BUNYAN_LOG_LEVEL || 'warn',
    stream: process.stdout
  }]
}));
authWebService.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.sessionKey
}));
authWebService.use(bodyParser.json());
authWebService.use(bodyParser.urlencoded({
  extended: true
}));
// authWebService.use(methodOverride());
// authWebService.use(authWebService.router);
/*
 * Although this is mostly a webservice used by machines (not a websserver used by humans)
 * we are still serving a user interface for the api sandbox in the public folder
 */
authWebService.use(expressWebServer.static(path.join(__dirname, 'public')));
authWebService.options('*', function options(req, res) {
  if (req.method === 'OPTIONS') {
    debug('responding to OPTIONS request');
    res.send(204);
  }
});
/**
 * Set up all the available URL authWebServiceRoutes see routes/routes.js for more details
 */
authWebServiceRoutes.setup(authWebService, apiVersion);
/**
 * Set up all the old routes until all client apps have migrated to the v2+ api
 */
deprecatedRoutes.addDeprecatedRoutes(authWebService, config);
/**
 * Read in the specified filenames for this config's security key and certificates,
 * and then ask https to turn on the webservice
 */
if (!module.parent) {
  if (process.env.NODE_ENV === 'production') {
    authWebService.listen(config.httpsOptions.port);
    debug('Running in production mode behind an Nginx proxy, Listening on http port %d', config.httpsOptions.port);
  } else {
    config.httpsOptions.key = FileSystem.readFileSync(config.httpsOptions.key);
    config.httpsOptions.cert = FileSystem.readFileSync(config.httpsOptions.cert);
    https.createServer(config.httpsOptions, authWebService).listen(config.httpsOptions.port, function afterListen() {
      debug('Listening on https port %d', config.httpsOptions.port);
    });
  }
} else {
  module.exports = authWebService;
}
