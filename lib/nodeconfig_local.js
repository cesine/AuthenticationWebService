var deploy_target = process.env.NODE_DEPLOY_TARGET || "localhost";
var Connection = require("fielddb/api/corpus/Connection").Connection;

exports.httpsOptions = {
  "key": 'fielddb_debug.key',
  "cert": 'fielddb_debug.crt',
  "port": "3183",
  "protocol": 'https://'
};

exports.usersDbConnection = {
  "protocol": 'http://',
  "domain": 'localhost',
  "port": '5984',
  "dbname": 'theuserscouch',
  "path": ""
};

Connection.knownConnections.thisserver = Connection.knownConnections[deploy_target];
exports.externalOrigin = Connection.knownConnections.thisserver.authUrls[0];

Connection.knownConnections.testing = Connection.knownConnections.beta;

Connection.knownConnections.dyslexdisorth = JSON.parse(JSON.stringify(Connection.knownConnections.thisserver));
Connection.knownConnections.dyslexdisorth.userFriendlyServerName = "DyslexDisorth";
Connection.knownConnections.dyslexdisorth.brandLowerCase = "dyslexdisorth";
Connection.knownConnections.dyslexdisorth.serverLabel = "dyslexdisorth";

Connection.knownConnections.kartulispeechrecognition = JSON.parse(JSON.stringify(Connection.knownConnections.thisserver));
Connection.knownConnections.kartulispeechrecognition.userFriendlyServerName = "http://batumi.github.io";
Connection.knownConnections.kartulispeechrecognition.brandLowerCase = "kartulispeechrecognition";
Connection.knownConnections.kartulispeechrecognition.serverLabel = "kartulispeechrecognition";

Connection.knownConnections.georgiantogether = JSON.parse(JSON.stringify(Connection.knownConnections.thisserver));
Connection.knownConnections.georgiantogether.userFriendlyServerName = "Learn X";
Connection.knownConnections.georgiantogether.brandLowerCase = "georgiantogether";
Connection.knownConnections.georgiantogether.serverLabel = "georgiantogether";

exports.sampleUsers = {
  public: ["public"],
  fieldlinguist: ["lingllama", "teammatetiger"],
  gamified: ["alakazou", "valeriebilleentete"]
};

