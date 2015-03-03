#!/usr/local/bin/node

/* Load modules provided by Node */
var https = require('https');
var FileSystem = require('fs');

/* Load modules provided by $ npm install, see package.json for details */
var CrossOriginResourceSharing = require('cors');
var ExpressWebServer = require('express');

/* Load modules provided by this codebase */
var AuthWebServiceRoutes = require('./routes/routes');
var deprecatedRoutes = require('./routes/deprecated');
/** 
 * You can control aspects of the deployment by using Environment Variables
 *
 * Examples:
 * $ NODE_DEPLOY_TARGET=production        # uses lib/nodeconfig_production.js
 * $ NODE_DEPLOY_TARGET=devserver         # uses lib/nodeconfig_devserver.js
 * $ NODE_DEPLOY_TARGET=local             # uses lib/nodeconfig_local.js
 * $ NODE_DEPLOY_TARGET=yoursecretconfig  # uses lib/nodeconfig_yoursecretconfig.js
 */
var deploy_target = process.env.NODE_DEPLOY_TARGET || "local";
var config = require('./lib/nodeconfig_' + deploy_target);
var apiVersion = "v" + parseInt(require("./package.json").version, 10);
console.log("Accepting api version " + apiVersion);

var corsOptions = {
  credentials: true,
  maxAge: 86400,
  methods: 'HEAD, POST, GET, PUT, PATCH, DELETE',
  allowedHeaders: 'Access-Control-Allow-Origin, access-control-request-headers, accept, accept-charset, accept-encoding, accept-language, authorization, content-length, content-type, host, origin, proxy-connection, referer, user-agent, x-requested-with',
  origin: function(origin, callback) {
    var originIsWhitelisted = false;
    if ( /* permit curl */ origin === undefined || /* permit android */ origin === "null" || origin === null || !origin) {
      originIsWhitelisted = true;
    } else if (origin.search(/^https?:\/\/.*\.lingsync.org$/) > -1 || origin.search(/^https?:\/\/.*\.phophlo.ca$/) > -1 || origin.search(/^https?:\/\/localhost:[0-9]*$/) > -1 || origin.search(/^chrome-extension:\/\/[^\/]*$/) > -1) {
      originIsWhitelisted = true;
    }
    console.log(new Date() + " Responding with CORS options for " + origin + " accept as whitelisted is: " + originIsWhitelisted);
    callback(null, originIsWhitelisted);
  }
};

/**
 * Use Express to create the AuthWebService see http://expressjs.com/ for more details
 */
var AuthWebService = ExpressWebServer();
AuthWebService.configure(function() {

  AuthWebService.use(CrossOriginResourceSharing(corsOptions));
  // Accept versions 
  AuthWebService.use(function(req, res, next) {
    if (req.url.indexOf("/" + apiVersion) === 0) {
      req.url = req.url.replace("/" + apiVersion, "");
    }
    next();
  });
  AuthWebService.use(ExpressWebServer.logger());
  AuthWebService.use(ExpressWebServer.cookieParser());
  AuthWebService.use(ExpressWebServer.bodyParser());
  AuthWebService.use(ExpressWebServer.methodOverride());
  AuthWebService.use(AuthWebService.router);
  /*
   * Although this is mostly a webservice used by machines (not a websserver used by humans)
   * we are still serving a user interface for the api sandbox in the public folder
   */
  AuthWebService.use(ExpressWebServer.static(__dirname + '/public'));
});

AuthWebService.configure('development', function() {
  AuthWebService.use(ExpressWebServer.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

AuthWebService.configure('production', function() {
  AuthWebService.use(ExpressWebServer.errorHandler());
});

AuthWebService.options('*', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    console.log('responding to OPTIONS request');
    res.send(204);
  }
});

/**
 * Set up all the available URL AuthWebServiceRoutes see routes/routes.js for more details
 */
AuthWebServiceRoutes.setup(AuthWebService, apiVersion);

/**
 * Set up all the old routes until all client apps have migrated to the v2+ api
 */
deprecatedRoutes.addDeprecatedRoutes(AuthWebService, config);

/**
 * Read in the specified filenames for this config's security key and certificates,
 * and then ask https to turn on the webservice
 */

if (process.env.NODE_DEPLOY_TARGET === "production") {
  AuthWebService.listen(config.httpsOptions.port);
  console.log("Running in production mode behind an Nginx proxy, Listening on http port %d", config.httpsOptions.port);
} else {
  config.httpsOptions.key = FileSystem.readFileSync(config.httpsOptions.key);
  config.httpsOptions.cert = FileSystem.readFileSync(config.httpsOptions.cert);

  https.createServer(config.httpsOptions, AuthWebService).listen(config.httpsOptions.port, function() {
    console.log("Listening on https port %d", config.httpsOptions.port);
  });
}
