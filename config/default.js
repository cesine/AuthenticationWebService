var deploy_target = process.env.NODE_ENV || "localhost";
var Connection = require("fielddb/api/corpus/Connection").Connection;

exports.session_key = "uwotm8";

exports.httpsOptions = {
  "key": "fielddb_debug.key",
  "cert": "fielddb_debug.crt",
  "port": "3183",
  "protocol": "https://"
};

exports.usersDbConnection = {
  "protocol": "http://",
  "domain": "localhost",
  "port": "5984",
  "dbname": "theuserscouch",
  "path": ""
};

Connection.knownConnections.thisserver = Connection.knownConnections[deploy_target];
exports.externalOrigin = Connection.knownConnections.thisserver.authUrls[0];

Connection.knownConnections.testing = Connection.knownConnections.beta;

Connection.knownConnections.dyslexdisorth = Connection.knownConnections.thisserver.clone();
Connection.knownConnections.dyslexdisorth.userFriendlyServerName = "DyslexDisorth";
Connection.knownConnections.dyslexdisorth.brandLowerCase = "dyslexdisorth";
Connection.knownConnections.dyslexdisorth.serverLabel = "dyslexdisorth";

Connection.knownConnections.ilanguagecloud = Connection.knownConnections.thisserver.clone();
Connection.knownConnections.ilanguagecloud.userFriendlyServerName = "wordcloud.ca";
Connection.knownConnections.ilanguagecloud.brandLowerCase = "ilanguagecloud";
Connection.knownConnections.ilanguagecloud.serverLabel = "ilanguagecloud";

Connection.knownConnections.wordcloud = Connection.knownConnections.thisserver.clone();
Connection.knownConnections.wordcloud.userFriendlyServerName = "wordcloud.ca";
Connection.knownConnections.wordcloud.brandLowerCase = "wordcloud";
Connection.knownConnections.wordcloud.serverLabel = "wordcloud";

Connection.knownConnections.kartulispeechrecognition = Connection.knownConnections.thisserver.clone();
Connection.knownConnections.kartulispeechrecognition.userFriendlyServerName = "http://batumi.github.io";
Connection.knownConnections.kartulispeechrecognition.brandLowerCase = "kartulispeechrecognition";
Connection.knownConnections.kartulispeechrecognition.serverLabel = "kartulispeechrecognition";

Connection.knownConnections.georgiantogether = Connection.knownConnections.thisserver.clone();
Connection.knownConnections.georgiantogether.userFriendlyServerName = "Learn X";
Connection.knownConnections.georgiantogether.brandLowerCase = "georgiantogether";
Connection.knownConnections.georgiantogether.serverLabel = "georgiantogether";

exports.sampleUsers = {
  public: ["public"],
  fieldlinguist: ["lingllama", "teammatetiger"],
  gamified: ["alakazou", "valeriebilleentete"]
};

exports.mailConnection = {
  host: "smtp.gmail.com",
  port: 587,
  secure: true, // use TLS
  "service": "",
  "auth": {
    "user": "",
    "pass": ""
  }
};

exports.newUserMailOptions = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "Welcome to localhost!", // Subject line
    "text": "Your username is: ", // plaintext // body
    "html": "Your username is: "
  };
};
exports.welcomeToCorpusTeamMailOptions = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "[LingSync.org] Someone has granted you access to their corpus", // Subject line
    "text": "The new corpus's identifier is: ", // plaintext // body
    "html": "The new corpus's identifier is: "
  };
};
exports.suspendedUserMailOptions = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "New Temporary Password", // Subject line
    "text": "Your username is: ", // plaintext // body
    "html": "Your username is: "
  };
};

exports.newUserMailOptionsPhophlo = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "Welcome to localhost!", // Subject line
    "text": "Your username is: ", // plaintext // body
    "html": "Your username is: "
  };
};
exports.welcomeToCorpusTeamMailOptionsPhophlo = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "[LingSync.org] Someone has granted you access to their corpus", // Subject line
    "text": "The new corpus's identifier is: ", // plaintext // body
    "html": "The new corpus's identifier is: "
  };
};
exports.suspendedUserMailOptionsPhophlo = function() {
  return {
    "from": "none@localhost", // sender address
    "to": "", // list of receivers
    "subject": "New Temporary Password", // Subject line
    "text": "Your username is: ", // plaintext // body
    "html": "Your username is: "
  };
};
