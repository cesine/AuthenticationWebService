var exec = require('child_process').exec;
module.exports = function FieldDB(args) {
	var config = args.config;
	var couch_keys = args.couchkeys;
	var status = "";

	this.getApiDocs = function(req, res, next) {
		res.send("getApiDocs");
	};

	this.getVersion = function(req, res, next) {
		res.send("getVersion");
	};


	this.installFieldDB = function(req, res, next) {

		var installStatus = "";
		var connectionUrl = config.usersDbConnection.protocol  + config.usersDbConnection.domain + ":" + config.usersDbConnection.port;
		// var connectionUrl = config.usersDbConnection.protocol + couch_keys.username + ":" + couch_keys.password + "@" + config.usersDbConnection.domain + ":" + config.usersDbConnection.port;
		var couchServer = require('nano')(connectionUrl);
		next = function(info, result, error){
			if(error){
				res.send(info);
			}else{
				res.send(result);
			}
		};
		var pushTemplateDatabases = function(err, body) {
			if (err) {
				console.log(err);
				return next({
					'info': installStatus
				}, false, err);
			} else {
				var command = 'sh ../FieldDB/scripts/build_template_databases_using_fielddb.sh ' + connectionUrl;
				console.log(command);
				var child = exec(command, function(err, stdout, stderr) {
					if (err) {
						return next({
							'info': installStatus
						}, false, err);
					} else {
						console.log("stdout", stdout);
						console.log("stderr", stderr);
						installStatus += " ::: build_template_databases_using_fielddb";
						console.log("all done " + installStatus);
						return next(null, {
							'ok': 'sucess',
							'info': installStatus,
							'stdout': stdout
						}, null);
					}
				});
			}
		};
		var createUsersViewInFielddbUsersDB = function(err, body) {
			if (err) {
				console.log(err);
				return next({
					'info': installStatus
				}, false, err);
			} else {
				installStatus += " ::: _users/_design/users";
				var usersView = {
					"_id": "_design/users",
					"language": "javascript",
					"views": {
						"usermasks": {
							"map": "function(doc) {\n  emit(doc.username, {username: doc.username, gravatar: doc.gravatar, gravatar_email: doc.email});\n}"
						}
					}
				};
				couchServer.db.use(config.usersDbConnection.dbname).insert(usersView, '_design/users', pushTemplateDatabases);
			}
		};
		var createUsersView = function(err, body) {
			if (err) {
				console.log(err);
				return next({
					'info': installStatus
				}, false, err);
			} else {
				installStatus += " ::: new_user_activity_feed";
				var usersView = {
					"_id": "_design/users",
					"language": "javascript",
					"views": {
						"userroles": {
							"map": "function(doc) {\n  var username = doc._id.replace(/org.couchdb.user:/,\"\");\n  if(doc.password_sha || doc.password_scheme)\n    emit(username,doc.roles);\n}"
						}
					}
				};
				couchServer.db.use('_users').insert(usersView, '_design/users', createUsersViewInFielddbUsersDB);
			}
		};
		var createUserActivityFeed = function(err, body) {
			if (err) {
				console.log(err);
				return next({
					'info': installStatus
				}, false, err);
			} else {
				installStatus += " ::: new_corpus_activity_feed";
				couchServer.db.create("new_user_activity_feed", createUsersView);
			}
		};
		var createCorpusActivityFeed = function(err, body) {
			if (err) {
				console.log(err);
				return next({
					'info': installStatus
				}, false, err);
			} else {
				installStatus += " ::: new_corpus";
				couchServer.db.create("new_corpus_activity_feed", createUserActivityFeed);
			}
		};

		couchServer.db.create(config.usersDbConnection.dbname, createCorpusActivityFeed);

		// res.send("installFieldDB");
	};
	return this;
};