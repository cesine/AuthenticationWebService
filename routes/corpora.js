/* Load modules provided by $ npm install, see package.json for details */
var swagger = require('swagger-node-express');
var param = require('../node_modules/swagger-node-express/Common/node/paramTypes.js');
var appVersion = require('../package.json').version;

exports.getCorpora = {
  'spec': {
    'path': '/corpora/{dbname}',
    'description': 'Operations about corpora',
    'notes': 'Requests corpora details if authenticated',
    'summary': 'Retrieves corpus(s)',
    'method': 'GET',
    'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
    'responseClass': 'User',
    'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
    'nickname': 'getCorpora'
  },
  'action': function(req, res, next) {
    res.send({});
  }
};

exports.postCorpora = {
  'spec': {
    'path': '/corpora/{dbname}',
    'description': 'Operations about corpora',
    'notes': 'Creates a corpus for a given dbname',
    'summary': 'Creates a corpus(s)',
    'method': 'POST',
    'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
    'responseClass': 'User',
    'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
    'nickname': 'postCorpora'
  },
  'action': function(req, res, next) {
    res.send({});
  }
};

exports.putCorpora = {
  'spec': {
    'path': '/corpora/{dbname}',
    'description': 'Operations about corpora',
    'notes': 'Updates corpora details if authenticated',
    'summary': 'Updates a corpus detail(s)',
    'method': 'PUT',
    'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
    'responseClass': 'User',
    'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
    'nickname': 'putCorpora'
  },
  'action': function(req, res, next) {
    res.send({});
  }
};

exports.deleteCorpora = {
  'spec': {
    'path': '/corpora/{dbname}',
    'description': 'Operations about corpora',
    'notes': 'Deletes corpus if authenticated',
    'summary': 'Deletes corpus(s)',
    'method': 'DELETE',
    'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
    'responseClass': 'User',
    'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
    'nickname': 'deleteCorpora'
  },
  'action': function(req, res, next) {
    res.send({});
  }
};

exports.searchCorpora = {
  'spec': {
    'path': '/corpora/{dbname}',
    'description': 'Operations about corpora',
    'notes': 'Search corpus if authenticated',
    'summary': 'Deletes corpus(s)',
    'method': 'SEARCH',
    'parameters': [param.path('dbname', 'requested dbname of the corpus', 'string')],
    'responseClass': 'User',
    'errorResponses': [swagger.errors.invalid('dbname'), swagger.errors.notFound('corpus')],
    'nickname': 'searchCorpora'
  },
  'action': function(req, res, next) {
    res.send({});
  }
};
