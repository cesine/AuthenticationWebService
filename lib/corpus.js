var deploy_target = process.env.NODE_DEPLOY_TARGET || "local";
var couch_keys = require("./couchkeys_" + deploy_target);
var node_config = require("./nodeconfig_" + deploy_target);
var util = require('util'),
  url = require('url'),
  md5 = require('MD5'),
  private_corpus_default_template = require('../templates/private_corpus_template'),
  public_corpus_default_template = require('../templates/public_corpus_template'),
  datalist_default_template = require('../templates/datalist_template'),
  session_default_template = require('../templates/session_template'),
  uuid = require('uuid');

/* variable for permissions */
var commenter = "commenter";
var collaborator = "reader";
var contributor = "writer";
var admin = "admin";


/*

{ protocol: 'http:',
  slashes: true,
  auth: null,
  host: 'localhost:5984',
  port: '5984',
  hostname: 'localhost',
  hash: null,
  search: null,
  query: null,
  pathname: '/',
  path: '/',
  href: 'http://localhost:5984/' }

 */

//Only create users on the same server.
var parsed = url.parse("http://localhost:5984");
var couchConnectUrl = parsed.protocol + "//" + couch_keys.username + ":" + couch_keys.password + "@" + parsed.host;
console.log("Using corpus url: ", parsed);

var createNewCorpus = function(req, done) {
  /* TODO not sure if where the serverCode is coming from, it theoretically should be in the body... */
  var serverLabel = req.body.serverCode || req.serverCode;
  if (!serverLabel) {
    serverLabel = req.body.serverLabel;
  }
  var username = req.body.username;
  var connection = this.getConnectionFromServerCode(serverLabel);
  connection.dbname = username + "-" + req.body.newCorpusName.trim().toLowerCase().replace(
    /[!@#$^&%*()+=-\[\]\/{}|:<>?,."'`; ]/g, "_");
  console.log(new Date() + " Creating new database " + connection.dbname);

  var connect = couchConnectUrl;

  var server = require('nano')(connect);

  server.db.create(connection.dbname, function(err, body) {
    if (err) {
      console.log(err);
      err.status = err.status || 500;
      if (err.status_code === 412) {
        err.status = 302;
        return done(err, false, {
          message: "Your corpus " + connection.dbname + " already exists, no need to create it."
        });
      } else {
        return done(err, false, {
          message: "The server was unable to complete this request. Please report this."
        });
      }

    }
    /*
     * Upon success of db creation, set up the collaborator, contributor
     * and admin roles for this corpus
     */
    addRoleToUserInfo(connection, username, [
      connection.dbname + "_" + admin,
      connection.dbname + "_" + contributor,
      connection.dbname + "_" + collaborator,
      connection.dbname + "_" + commenter
    ]);

    var securityParamsforNewDB = {
      "admins": {
        "names": [],
        "roles": ["fielddbadmin", connection.dbname + "_" + admin]
      },
      "members": {
        "names": [],
        "roles": [
          connection.dbname + "_" + collaborator,
          connection.dbname + "_" + contributor,
          connection.dbname + "_" + commenter
        ]
      }
    };

    var newDbConnect = connect + "/" + connection.dbname;

    var db = require('nano')(newDbConnect);

    db.insert(securityParamsforNewDB, "_security", function(err, body) {
      if (!err) {
        console.log(new Date() + " Added user security roles to new db.");
      } else {
        console.log(new Date() + " Did not add user security roles.");
        console.log(err);
      }
    });

    // Replicate template databases to new database
    server.db.replicate('new_corpus', newDbConnect, function(err, body) {
      if (!err) {
        console.log(new Date() + " Corpus successfully replicated.");
      } else {
        console.log(new Date() + " Corpus replication failed.");
      }
    });

    // Add empty docs to new database
    var private_corpus_template = createPrivateCorpusDoc(username, req.body.newCorpusName, connection, connection.dbname);
    var public_corpus_template = createPublicCorpusDoc(connection, connection.dbname);
    var datalist_template = createDatalistDoc(connection.dbname);
    var session_template = createSessionDoc(connection.dbname);
    var team = {
      "_id": "team",
      "gravatar": md5(connection.dbname),
      "username": username,
      "collection": "users",
      "firstname": "",
      "lastname": "",
      "subtitle": "",
      "email": "",
      "researchInterest": "No public information available",
      "affiliation": "No public information available",
      "description": "No public information available"
    };
    var docsNeededForAProperFieldDBCorpus = [team, public_corpus_template, private_corpus_template, datalist_template, session_template];

    db.bulk({
      "docs": docsNeededForAProperFieldDBCorpus
    }, function(err, body) {
      if (err) {
        console.log(new Date() + " There was an error in creating the docs for the user\'s new corpus: " + util.inspect(err) + "\n");
        // undoCorpusCreation(user, private_corpus_template.connection, docsNeededForAProperFieldDBCorpus);
      } else {
        console.log(new Date() + " Created corpus for " + private_corpus_template.dbname + "\n");
      }
    });

    // Replicate activity feed template to new activity feed database
    var newActivityFeedConnect = connect + "/" + connection.dbname + "-activity_feed";
    server.db.replicate('new_corpus_activity_feed', newActivityFeedConnect, {
      create_target: true
    }, function(err, body) {
      if (!err) {
        console.log(new Date() + " Corpus activity feed successfully replicated.");
        // Set up security on new corpus activity feed
        var activityDb = require('nano')(newActivityFeedConnect);

        activityDb.insert(securityParamsforNewDB, "_security", function(err, body) {
          if (!err) {
            console.log(new Date() + " Added user security roles to new activity feed.");
          } else {
            console.log(new Date() + " Did not add user security roles to new activity feed.");
            console.log(err);
          }
        });

      } else {
        console.log(new Date() + " Corpus activity feed replication failed.");
      }
    });
    // TODO Add corpus created activity to activity feeds
    return done(null, private_corpus_template, {});
  });
};

module.exports.createNewCorpus = createNewCorpus;

// Update user roles on existing corpus
/* 
TODO: Does this function require that the requesting user 
actually have the permission (be admin on that corpus) to modify roles? (like in addRoleToUser in userauthentication.js)

*/
var updateRoles = function(req, done) {
  return done({
    status: 404,
    error: "Method not supported. Please report this error."
  }, null, {
    message: "Method not supported. Please report this error."
  });
  /* the rest of the function has not been reviewed, for now turning it off so we can deploy the spreadsheet app for fieldmethods course prep */

  // TODO Add/Remove corpora from zfielddbuserscouch?

  /* TODO not sure where the serverCode is coming from, it theoretically should be in the body not in the req... */
  var serverLabel = req.body.serverCode || req.serverCode;
  if (!serverLabel) {
    serverLabel = req.body.serverLabel;
  }
  var connection = this.getConnectionFromServerCode(serverLabel);
  connection.dbname = req.body.userRoleInfo.dbname;

  var username = req.body.userRoleInfo.usernameToModify;

  // Check to make sure requesting user is admin; if not, abort
  var requestingUser = req.body.username;
  isRequestingUserAnAdminOnCorpus(req, requestingUser, connection, function(error, result, messages) {
    if (error) {
      console.log("ERROR");
      console.log(error);
      error.status = error.status || 500;
      return done(error, username, {
        "message": "You do not have permission to update user roles for this corpus. You must be an admin."
      });
    } else {
      console.log(new Date() + " User " + requestingUser + " is admin and can modify permissions on " + connection.dbname);

      if (req.body.userRoleInfo.removeUser && req.body.userRoleInfo.removeUser == true) {
        console.log("Removing permissions for " + username + " from " + connection.dbname);
        removeUserFromDb(connection, username);
        return done(false, username, {});
      }

      var roles = [];
      if (req.body.userRoleInfo.admin == true) {
        roles.push(connection.dbname + "_" + admin);
      }
      if (req.body.userRoleInfo.reader == true) {
        roles.push(connection.dbname + "_" + collaborator);
      }
      if (req.body.userRoleInfo.writer == true) {
        roles.push(connection.dbname + "_" + contributor);
      }
      if (req.body.userRoleInfo.commenter == true) {
        roles.push(connection.dbname + "_" + commenter);
      }

      // Check to see if user exists before adding roles
      var connect = couchConnectUrl + "/_users";

      var db = require('nano')(connect);
      var userid = 'org.couchdb.user:' + username;

      db.get(userid, function(err, body) {
        if (!err) {
          // User exists on server, so adding new user roles
          addRoleToUserInfo(connection, username, roles);

          // Add user doc in corpus if it does not already exist
          var corpusConnect = couchConnectUrl + "/" + connection.dbname;

          var corpusDb = require('nano')(corpusConnect);
          corpusDb.get(username, function(err, body) {
            if (!err) {
              // Do nothing if user already exists
            } else {
              // Add new user to DB
              // Get gravatar hash
              var zUserInfoDbConnect = couchConnectUrl + "/zfielddbuserscouch";

              var zUserInfoDb = require('nano')(zUserInfoDbConnect);

              zUserInfoDb.get(username, function(err, body) {
                if (!err) {
                  var userDoc = {
                    "gravatar": body.gravatar,
                    "username": username,
                    "authUrl": connection.authUrl,
                    "id": username,
                    "collection": "users"
                  };

                  // Save new user record to corpus
                  corpusDb.insert(userDoc, username, function(err, body) {
                    if (!err) {
                      console.log("Successfully added new user doc to corpus.");
                    } else {
                      console.log(err);
                    }
                  });
                } else {
                  console.log(err);
                }
              });
            }
          });

          return done(false, username, {});
        } else {
          return done(true, username, {});
        }
      });
    }
  });
};

module.exports.updateRoles = updateRoles;

var addRoleToUserInfo = function(connection, username, roles,
  successdone, errordone) {
  console.log(new Date() + " In addRoleToUser " + util.inspect(roles) + " to " + username + " on " + connection.dbname);

  var connect = couchConnectUrl + "/_users";

  var db = require('nano')(connect);
  var userid = 'org.couchdb.user:' + username,
    _ = require('underscore');

  db.get(userid, function(err, body) {
    if (!err) {
      var userold = body;
      console.log(new Date() + " These are the users's roles before adding a role." + util.inspect(userold.roles));

      for (var r in roles) {
        userold.roles.push(roles[r]);
      }
      var uniqueroles = _.unique(userold.roles);
      userold.roles = uniqueroles;

      db.insert(userold, function(err, body) {
        if (!err) {
          console.log(new Date() + " User roles updated.");
        } else {
          console.log(new Date() + " User roles failed to update.");
        }
      });
    } else {
      console.log(err);
    }
  });
};

var removeUserFromDb = function(connection, username) {
  var connect = couchConnectUrl + "/_users";

  var db = require('nano')(connect);
  var userid = 'org.couchdb.user:' + username;

  db.get(userid, function(err, body) {
    if (!err) {
      var i = body.roles.length - 1;
      do {
        if (body.roles[i].indexOf(connection.dbname) > -1) {
          body.roles.splice(i, i);
        }
        i--;
      } while (i != -1);

      db.insert(body, body._id, function(err, response) {
        if (!err) {
          console.log("Successfully removed " + connection.dbname + " from org.couchdb.user:" + username);
        }
      });

      // Delete user doc from corpus
      var corpusConnect = couchConnectUrl + "/" + connection.dbname;

      var corpusDb = require('nano')(corpusConnect);
      corpusDb.get(username, function(err, body) {
        if (!err) {
          corpusDb.destroy(username, body._rev, function(err, body) {
            if (!err) {
              console.log("Successfully removed user doc from corpus.");
            }
          });
        }
      });

    }
  });
};

/*
 * Ensures the requesting user to make the permissions
 * modificaitons, can be used for any corpus operations which require admin privildages.
 */
var isRequestingUserAnAdminOnCorpus = function(req, requestingUser, dbConn, done) {
  if (!dbConn) {
    return done({
      status: 412,
      error: "Client didn't define the database connection."
    }, null, {
      message: "This app has made an invalid request. Please notify its developer. missing: serverCode or connection"
    });
  }

  /*
   * Check to see if the user is an admin on the corpus
   */
  var nanoforpermissions = require('nano')(couchConnectUrl);

  var usersdb = nanoforpermissions.db.use("_users");
  usersdb.get("org.couchdb.user:" + requestingUser, function(error, result) {
    if (error) {
      error.status = error.status || 401.
      error.error = error.error || "User " + requestingUser + " couldn't be found on this server";
      return done(error, null, {
        message: "There was a problem deciding if you have permission to do this."
      });

    } else {
      var userIsAdminOnTeam = false;

      if (result) {
        var userroles = result.roles;

        for (var i = 0; i < userroles.length; i++) {
          (function(index) {
            if (userroles.indexOf(dbConn.dbname + "_" + admin) > -1) {
              userIsAdminOnTeam = true;
            }
            if (index == (userroles.length - 1)) {
              if (userIsAdminOnTeam == false) {
                return done({
                  status: 401,
                  error: "User " + requestingUser + " found but didnt have permission on " + dbConn.dbname
                }, null, {
                  info: "User does not have permission to perform this action.",
                  message: "You don't not have permission to perform this action."
                });
              } else {
                return done(null, requestingUser, null);
              }
            }

          })(i);
        }
      }
    }
  });
};

module.exports.isRequestingUserAnAdminOnCorpus = isRequestingUserAnAdminOnCorpus;


var getConnectionFromServerCode = function(serverCode) {
  if (!serverCode) {
    serverCode = "production";
  }
  serverCode = serverCode.toLowerCase();
  var connection = {};
  if (serverCode == "localhost") {
    connection = {
      "protocol": "https://",
      "domain": "localhost",
      "port": "6984",
      "dbname": "firstcorpus",
      "path": "",
      "authUrl": "https://localhost:3183",
      "userFriendlyServerName": "Localhost"
    };
  } else if (serverCode == "testing") {
    connection = {
      "protocol": "https://",
      "domain": "corpusdev.lingsync.org",
      "port": "",
      "dbname": "default",
      "path": "",
      "authUrl": "https://authdev.lingsync.org",
      "userFriendlyServerName": "LingSync Beta"
    };
  } else if (serverCode == "beta") {
    connection = {
      "protocol": "https://",
      "domain": "corpusdev.lingsync.org",
      "port": "",
      "dbname": "default",
      "path": "",
      "authUrl": "https://authdev.lingsync.org",
      "userFriendlyServerName": "LingSync Beta"
    };
  } else if (serverCode == "production") {
    connection = {
      "protocol": "https://",
      "domain": "corpus.lingsync.org",
      "port": "",
      "dbname": "default",
      "path": "",
      "authUrl": "https://auth.lingsync.org",
      "userFriendlyServerName": "LingSync.org"
    };
  } else if (serverCode == "mcgill") {
    connection = {
      "protocol": "https://",
      "domain": "prosody.linguistics.mcgill.ca",
      "port": "443",
      "dbname": "default",
      "path": "corpus",
      "authUrl": "https://prosody.linguistics.mcgill.ca/auth",
      "userFriendlyServerName": "McGill ProsodyLab"
    };
  } else if (serverCode == "concordia") {
    connection = {
      "protocol": "https://",
      "domain": "auth.modlang-phoneticd.concordia.ca",
      "port": "443",
      "dbname": "default",
      "path": "",
      "authUrl": "https://auth.modlang-phoneticd.concordia.ca",
      "userFriendlyServerName": "Concordia"
    };
  } else if (serverCode == "phophlo") {
    //TODO dont error silently and return a default, return an error so the user can choose a known server?
    connection = {
      "protocol": "https://",
      "domain": "corpus.lingsync.org",
      "port": "",
      "dbname": "default",
      "path": "",
      "authUrl": "https://auth.lingsync.org",
      "userFriendlyServerName": "Phophlo.ca"
    };
  } else {
    //TODO dont error silently and return a default, return an error so the user can choose a known server?
    connection = {
      "protocol": "https://",
      "domain": "corpus.lingsync.org",
      "port": "",
      "dbname": "default",
      "path": "",
      "authUrl": "https://auth.lingsync.org",
      "userFriendlyServerName": "LingSync.org"
    };
  }
  return connection;
};

module.exports.getConnectionFromServerCode = getConnectionFromServerCode;

/* Prepare a corpus doc for the user's new corpus */
var createPrivateCorpusDoc = function(username, corpusTitle, connection, dbname) {
  var newPrivateCorpus = JSON.parse(JSON.stringify(private_corpus_default_template));
  newPrivateCorpus.title = corpusTitle;
  newPrivateCorpus.titleAsUrl = newPrivateCorpus.title.toLowerCase().replace(/ /g, "_");
  newPrivateCorpus.connection = connection;
  newPrivateCorpus.dbname = dbname;
  newPrivateCorpus.dateOfLastDatumModifiedToCheckForOldSession = JSON.parse(JSON.stringify(new Date()));
  newPrivateCorpus.confidential.secretkey = uuid.v4();
  newPrivateCorpus.timestamp = Date.now();
  newPrivateCorpus.sessionFields = JSON.parse(JSON.stringify(session_default_template)).sessionFields;
  for (var field in newPrivateCorpus.sessionFields) {
    newPrivateCorpus.sessionFields[field].value = "";
    newPrivateCorpus.sessionFields[field].mask = "";
  }
  return newPrivateCorpus;
};

module.exports.createPrivateCorpusDoc = createPrivateCorpusDoc;

var createPublicCorpusDoc = function(connection, dbname) {
  var newPublicCorpus = JSON.parse(JSON.stringify(public_corpus_default_template));
  newPublicCorpus.connection = connection;
  newPublicCorpus.dbname = dbname;
  newPublicCorpus.timestamp = Date.now();
  return newPublicCorpus;
};

module.exports.createPublicCorpusDoc = createPublicCorpusDoc;

/* Prepare an empty datalist doc for the user's new corpus */
var createDatalistDoc = function(dbname) {
  var newDatalist = JSON.parse(JSON.stringify(datalist_default_template));
  newDatalist.dbname = dbname;
  newDatalist.dateCreated = JSON.parse(JSON.stringify(new Date()));
  newDatalist.dateModified = JSON.parse(JSON.stringify(new Date()));
  newDatalist.timestamp = Date.now();
  return newDatalist;
};

module.exports.createDatalistDoc = createDatalistDoc;

/* Prepare an empty session doc for the user's new corpus */
var createSessionDoc = function(dbname) {
  var newSession = JSON.parse(JSON.stringify(session_default_template));
  newSession.dbname = dbname;
  newSession.dateCreated = JSON.parse(JSON.stringify(new Date()));
  newSession.dateModified = JSON.parse(JSON.stringify(new Date()));
  newSession.timestamp = Date.now();
  return newSession;
};

module.exports.createSessionDoc = createSessionDoc;
