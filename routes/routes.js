/* Load modules provided by $ npm install, see package.json for details */
var swagger = require('swagger-node-express');
var config = require('config');

/* Load modules provided by this codebase */
var userRoutes = require('./user');
var corporaRoutes = require('./corpora');
var utterancesRoutes = require('./utterances');
var filesRoutes = require('./files');
var dataRoutes = require('./data');
var eLanguagesRoutes = require('./elanguages');
var morphologicalParsesRoutes = require('./morphologicalparses');


var setup = function(api, apiVersion) {

	swagger.configureSwaggerPaths('', '/api', '');
	swagger.setAppHandler(api);

	/* Prepare models for the API Schema info using the info the routes provide */
	var APIModelShema = {};
	APIModelShema.models = {
		'User': userRoutes.UserSchema,
		'Connection': userRoutes.ConnectionSchema
	};
	swagger.addModels(APIModelShema);

	/* Declare available APIs */
	swagger.addGet(userRoutes.getUsers);
	swagger.addPost(userRoutes.postUsers);
	swagger.addPut(userRoutes.putUsers);
	swagger.addDelete(userRoutes.deleteUsers);

	swagger.addGet(corporaRoutes.getCorpora);
	swagger.addPost(corporaRoutes.postCorpora);
	swagger.addPut(corporaRoutes.putCorpora);
	swagger.addDelete(corporaRoutes.deleteCorpora);
	swagger.addSearch(corporaRoutes.searchCorpora);

	// api.delete('/corpus/:corpusid', corporaRoutes.deleteCorpora.action);

	swagger.addGet(dataRoutes.getData);
	swagger.addPost(dataRoutes.postData);
	swagger.addPut(dataRoutes.putData);
	swagger.addDelete(dataRoutes.deleteData);

	swagger.addGet(utterancesRoutes.getUtterances);
	swagger.addPost(utterancesRoutes.postUtterances);
	swagger.addPut(utterancesRoutes.putUtterances);
	swagger.addDelete(utterancesRoutes.deleteUtterances);

	swagger.addGet(filesRoutes.getFiles);
	swagger.addPost(filesRoutes.postFiles);
	swagger.addPut(filesRoutes.putFiles);
	swagger.addDelete(filesRoutes.deleteFiles);

	swagger.addGet(eLanguagesRoutes.getELanguages);
	swagger.addPost(eLanguagesRoutes.postELanguages);
	swagger.addPut(eLanguagesRoutes.putELanguages);
	swagger.addDelete(eLanguagesRoutes.deleteELanguages);

	swagger.addGet(morphologicalParsesRoutes.getMorphologicalParses);
	swagger.addPost(morphologicalParsesRoutes.postMorphologicalParses);
	swagger.addPut(morphologicalParsesRoutes.putMorphologicalParses);
	swagger.addDelete(morphologicalParsesRoutes.deleteMorphologicalParses);

	swagger.configure(config.externalOrigin + '/' + apiVersion, apiVersion.replace("v", ""));
};
exports.setup = setup;
