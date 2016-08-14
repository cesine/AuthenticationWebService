var deploy_target = process.env.NODE_ENV || "localhost";
var couch_keys = require("./couchkeys_" + deploy_target);
var util = require('util');
var url = require('url');
var Corpus = require('fielddb/api/corpus/Corpus').Corpus;
var CorpusMask = require('fielddb/api/corpus/CorpusMask').CorpusMask;
var DataList = require('fielddb/api/data_list/DataList').DataList;
var Team = require('fielddb/api/user/Team').Team;
var uuid = require('uuid');

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

// Add docs to new database
var createPlaceholderDocsForCorpus = function(corpusObject) {
  var corpusDetails = new Corpus(Corpus.prototype.defaults);
  corpusDetails.merge("self", new Corpus(corpusObject), "overwrite");
  corpusDetails.connection.corpusid = corpusDetails.id;
  corpusDetails.dateCreated = Date.now();

  var corpusMaskDetails = new CorpusMask({
    dbname: corpusObject.dbname,
    connection: corpusDetails.connection,
    corpusid: corpusDetails.id,
    dateCreated: Date.now()
  });
  corpusDetails.corpusMask = corpusMaskDetails;

  var datalistDetails = new DataList({
    title: "Default Datalist - Empty",
    description: "The app comes with a default datalist which is empty. Once you have data in your corpus, you can create a datalist using search. Imported data will also show up as a datalist. Datalists are lists of data which can be used to create handouts, export to LaTeX, or share with collaborators.",
    dbname: corpusObject.dbname,
    dateCreated: Date.now()
  });

  var sessionDetails = corpusDetails.newSession({
    goal: "Practice collecting linguistic utterances or words",
    dateCreated: Date.now()
  });

  var team = new Team({
    username: corpusDetails.dbname.split("-")[0],
    researchInterest: "No public information available",
    affiliation: "No public information available",
    description: "No public information available",
    dateCreated: Date.now()
  });
  corpusDetails.team = team;
  return [team, corpusMaskDetails, corpusDetails, datalistDetails, sessionDetails];
};
exports.createPlaceholderDocsForCorpus = createPlaceholderDocsForCorpus;

//Only create users on the same server.
var parsed = url.parse("http://localhost:5984");
var couchConnectUrl = parsed.protocol + "//" + couch_keys.username + ":" + couch_keys.password + "@" + parsed.host;
console.log("Using corpus url: ", parsed);

var createNewCorpus = function(corpusObject, done) {
  var username = corpusObject.username;
  delete corpusObject.username;

  if (corpusObject.dbname) {
    corpusObject.connection.dbname = corpusObject.dbname;
  } else {
    corpusObject.dbname = corpusObject.connection.dbname;
  }

  if (!corpusObject.id && !corpusObject._id) {
    corpusObject.id = uuid.v4();
  }

  console.log(new Date() + " Creating new database " + corpusObject.dbname);

  var server = require('nano')(couchConnectUrl);
  server.db.create(corpusObject.dbname, function(err, response) {
    if (err) {
      console.log(err);
      err.status = err.statusCode || 500;
      if (err.status === 412) {
        err.status = 302;
        return done(err, false, {
          message: "Your corpus " + corpusObject.dbname + " already exists, no need to create it."
        });
      } else {
        return done(err, false, {
          message: "The server was unable to complete this request. Please report this."
        });
      }
    }
    console.log("Created db " + corpusObject.dbname, response);
    /*
     * Upon success of db creation, set up the collaborator, contributor
     * and admin roles for this corpus
     */
    addRoleToUserInfo(corpusObject.connection, username, [
      corpusObject.dbname + "_" + admin,
      corpusObject.dbname + "_" + contributor,
      corpusObject.dbname + "_" + collaborator,
      corpusObject.dbname + "_" + commenter
    ]);

    var securityParamsforNewDB = {
      "admins": {
        "names": [],
        "roles": ["fielddbadmin", corpusObject.dbname + "_" + admin]
      },
      "members": {
        "names": [],
        "roles": [
          corpusObject.dbname + "_" + collaborator,
          corpusObject.dbname + "_" + contributor,
          corpusObject.dbname + "_" + commenter
        ]
      }
    };

    var newDatabase = require('nano')(couchConnectUrl + "/" + corpusObject.dbname);

    newDatabase.insert(securityParamsforNewDB, "_security", function(err, couchResponse) {
      if (!err) {
        console.log(new Date() + " Added user security roles to new db.", couchResponse);
      } else {
        console.log(new Date() + " Did not add user security roles.");
        console.log(err);
      }
    });

    // Replicate template databases to new database
    server.db.replicate('new_corpus', corpusObject.dbname, function(err, couchResponse) {
      if (!err) {
        console.log(new Date() + " Corpus successfully replicated.", couchResponse);
      } else {
        console.log(new Date() + " Corpus replication failed.");
      }
    });
    server.db.replicate('new_lexicon', corpusObject.dbname, function(err, couchResponse) {
      if (!err) {
        console.log(new Date() + " Lexicon successfully replicated.", couchResponse);
      } else {
        console.log(new Date() + " Lexicon replication failed.");
      }
    });
    // server.db.replicate('new_export', corpusObject.dbname, function(err, couchResponse) {
    //   if (!err) {
    //     console.log(new Date() + " Export successfully replicated.", couchResponse);
    //   } else {
    //     console.log(new Date() + " Export replication failed.");
    //   }
    // });

    var docsNeededForAProperFieldDBCorpus = createPlaceholderDocsForCorpus(corpusObject);

    newDatabase.bulk({
      "docs": docsNeededForAProperFieldDBCorpus
    }, function(err, couchResponse) {
      if (err) {
        console.log(new Date() + " There was an error in creating the docs for the user\'s new corpus: " + util.inspect(err) + "\n");
        // undoCorpusCreation(user, corpusDetails.corpusObject.connection, docsNeededForAProperFieldDBCorpus);
      } else {
        console.log(new Date() + " Created starter docs for " + corpusObject.dbname + "\n", couchResponse);
      }
    });

    // Replicate activity feed template to new activity feed database
    server.db.replicate('new_corpus_activity_feed', corpusObject.dbname + "-activity_feed", {
      create_target: true
    }, function(err, couchActivityFeedResponse) {
      if (!err) {
        console.log(new Date() + " Corpus activity feed successfully replicated.", couchActivityFeedResponse);
        // Set up security on new corpus activity feed
        var activityDb = require('nano')(couchConnectUrl + "/" + corpusObject.dbname + "-activity_feed");
        activityDb.insert(securityParamsforNewDB, "_security", function(err, couchResponse) {
          if (!err) {
            console.log(new Date() + " Added user security roles to new activity feed.", couchResponse);
          } else {
            console.log(new Date() + " Did not add user security roles to new activity feed.");
            console.log(err);
          }
        });

      } else {
        console.log(new Date() + " Corpus activity feed replication failed.", couchActivityFeedResponse);
      }
    });
    // TODO Add corpus created activity to activity feeds
    return done(null, docsNeededForAProperFieldDBCorpus[2], {});
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
};

module.exports.updateRoles = updateRoles;

var addRoleToUserInfo = function(connection, username, roles, successdone, errordone) {
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

      db.insert(userold, function(err, couchresponsetochangingusersroles) {
        if (!err) {
          console.log(new Date() + " User roles updated.");
        } else {
          console.log(new Date() + " User roles " + userid + "failed to update.", err, couchresponsetochangingusersroles);
        }
      });
    } else {
      console.log(err);
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
      error.status = error.statusCode || 401;
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
            if (index === (userroles.length - 1)) {
              if (userIsAdminOnTeam === false) {
                return done({
                  status: 401,
                  error: "User " + requestingUser + " found but didnt have permission on " + dbConn.dbname
                }, null, {
                  info: "User does not have permission to perform this action.",
                  message: "You don't have permission to perform this action."
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
