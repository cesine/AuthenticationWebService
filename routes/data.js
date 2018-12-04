/* Load modules provided by $ npm install, see package.json for details */
var swagger = require('swagger-node-express');
var param = require('../node_modules/swagger-node-express/Common/node/paramTypes.js');
var appVersion = require('../package.json').version;

exports.getData = {
	'spec': {
		'path': '/corpora/{dbname}/data/{id}',
		'description': 'Operations about data',
		'notes': 'Requests data details if authenticated',
		'summary': 'Retrieve data in a corpus',
		'method': 'GET',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'User',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'getData'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.postData = {
	'spec': {
		'path': '/corpora/{dbname}/data/{id}',
		'description': 'Operations about data',
		'notes': 'Creates data in a given database',
		'summary': 'Creates data in a corpus',
		'method': 'POST',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'User',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'postData'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.putData = {
	'spec': {
		'path': '/corpora/{dbname}/data/{id}',
		'description': 'Operations about data',
		'notes': 'Updates corpora details if authenticated',
		'summary': 'Updates data in a corpus',
		'method': 'PUT',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'User',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'putData'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.deleteData = {
	'spec': {
		'path': '/corpora/{dbname}/data/{id}',
		'description': 'Operations about data',
		'notes': 'Deletes data from corpus if authenticated',
		'summary': 'Deletes data in a corpus',
		'method': 'DELETE',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'User',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'deleteData'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};
