/* Load modules provided by $ npm install, see package.json for details */
var swagger = require('swagger-node-express');
var param = require('../node_modules/swagger-node-express/Common/node/paramTypes.js');
var appVersion = require('../package.json').version;

exports.getUtterances = {
	'spec': {
		'path': '/corpora/{dbname}/utterances/{filename}',
		'description': 'Operations about utterances',
		'notes': 'Requests utterances details if authenticated',
		'summary': 'Retrieves utterances(s)',
		'method': 'GET',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'Utterance',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'getUtterances'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.postUtterances = {
	'spec': {
		'path': '/corpora/{dbname}/utterances/{filename}',
		'description': 'Operations about utterances',
		'notes': 'Detects utterances for a set of audio/video files',
		'summary': 'Detects utterances',
		'method': 'POST',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'Utterance',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'postUtterances'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.putUtterances = {
	'spec': {
		'path': '/corpora/{dbname}/utterances/{filename}',
		'description': 'Operations about utterances',
		'notes': 'Updates utterances if authenticated',
		'summary': 'Updates utterances',
		'method': 'PUT',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'Utterance',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'putUtterances'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};

exports.deleteUtterances = {
	'spec': {
		'path': '/corpora/{dbname}/utterances/{filename}',
		'description': 'Operations about utterances',
		'notes': 'Deletes utterances if authenticated',
		'summary': 'Deletes utterances',
		'method': 'DELETE',
		'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
		'responseClass': 'Utterance',
		'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
		'nickname': 'deleteUtterances'
	},
	'action': function(req, res, next) {
		res.send({});
	}
};
