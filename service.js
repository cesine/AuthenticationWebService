#!/usr/local/bin/node

/* Load modules provided by Node */
var https = require('https');
var FileSystem = require('fs');

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

/**
 * Use Express to create the AuthWebService see http://expressjs.com/ for more details
 */
var express = require("express");
  url = require("url"),
  cors = require("cors"),
  bodyParser = require('body-parser'),
  swagger = require("swagger-node-express/Common/node/swagger");

var corpusResources = require("./routes/corpora.js");

var app = express();

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());


// Set the main handler in swagger to the express app
swagger.setAppHandler(app);


// This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT
// methods, the header `api_key` OR query param `api_key` must be equal
// to the string literal `special-key`.  All other HTTP ops are A-OK
swagger.addValidator(
  function validate(req, path, httpMethod) {
    //  example, only allow POST for api_key="special-key"
    if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
      var apiKey = req.headers["api_key"];
      if (!apiKey) {
        apiKey = url.parse(req.url, true).query["api_key"];
      }
      if ("special-key" == apiKey) {
        return true;
      }
      return false;
    }
    return true;
  }
);

var models = require("./lib/About.js").FieldDB().getApiDocs().models;

// Add models and methods to swagger
swagger.addModels(models)
  .addPost(corpusResources.addCorpus)
  .addPut(corpusResources.updateCorpus)
  .addDelete(corpusResources.deleteCorpus);

swagger.configureDeclaration("corpus", {
  description: "Operations about Corpora",
  authorizations: ["oauth2"],
  produces: ["application/json"]
});

// set api info
swagger.setApiInfo({
  title: "Swagger Sample App",
  description: "This is a sample server Corporatore server. You can find out more about Swagger at <a href=\"http://swagger.wordnik.com\">http://swagger.wordnik.com</a> or on irc.freenode.net, #swagger.  For this sample, you can use the api key \"special-key\" to test the authorization filters",
  termsOfServiceUrl: "http://helloreverb.com/terms/",
  contact: "apiteam@wordnik.com",
  license: "Apache 2.0",
  licenseUrl: "http://www.apache.org/licenses/LICENSE-2.0.html"
});

swagger.setAuthorizations({
  apiKey: {
    type: "apiKey",
    passAs: "header"
  }
});

// Configures the app's base path and api version.
swagger.configureSwaggerPaths("", "api-docs", "")
swagger.configure(config.httpsOptions.protocol + config.httpsOptions.host + ":" + config.httpsOptions.port, "1.0.0");

// Serve up swagger ui at /docs via static route
var docs_handler = express.static(__dirname + '/node_modules/swagger-node-express/swagger-ui/');
app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
  if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
    res.writeHead(302, {
      'Location': req.url + '/'
    });
    res.end();
    return;
  }
  // take off leading /docs so that connect locates file correctly
  req.url = req.url.substr('/docs'.length);
  return docs_handler(req, res, next);
});


/**
 * Read in the specified filenames for this config's security key and certificates,
 * and then ask https to turn on the webservice
 */
if (config.httpsOptions.protocol === "https://") {
  config.httpsOptions.key = FileSystem.readFileSync(config.httpsOptions.key);
  config.httpsOptions.cert = FileSystem.readFileSync(config.httpsOptions.cert);

  https.createServer(config.httpsOptions, app).listen(config.httpsOptions.port, function() {
    console.log("Listening on port %d", config.httpsOptions.port);
  });
} else {
  app.listen(config.httpsOptions.port);
}
