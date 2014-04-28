var sw = require("swagger-node-express/Common/node/swagger.js");
var param = require("swagger-node-express/Common/node/paramTypes.js");
var url = require("url");
var swe = sw.errors;

var corpusData = require("./../lib/corpusData.js");

function writeResponse (res, data) {
  sw.setHeaders(res);
  res.send(JSON.stringify(data));
}

exports.addCorpus = {
  'spec': {
    path : "/corpus",
    notes : "adds a corpus to the store",
    summary : "Add a new corpus to the store",
    method: "POST",
    parameters : [param.body("Corpus", "Corpus object that needs to be added to the store", "Corpus")],
    responseMessages : [swe.invalid('input')],
    nickname : "addCorpus"
  },  
  'action': function(req, res) {
    var body = req.body;
    if(!body || !body.id){
      throw swe.invalid('corpus');
    }
    else{
      corpusData.addCorpus(body);
      res.send(200);
    }  
  }
};

exports.updateCorpus = {
  'spec': {
    path : "/corpus",
    notes : "updates a corpus in the store",
    method: "PUT",    
    summary : "Update an existing corpus",
    parameters : [param.body("Corpus", "Corpus object that needs to be updated in the store", "Corpus")],
    responseMessages : [swe.invalid('id'), swe.notFound('corpus'), swe.invalid('input')],
    nickname : "addCorpus"
  },  
  'action': function(req, res) {
    var body = req.body;
    if(!body || !body.id){
      throw swe.invalid('corpus');
    }
    else {
      corpusData.addCorpus(body);
      res.send(200);
    }
  }
};

exports.deleteCorpus = {
  'spec': {
    path : "/corpus/{id}",
    notes : "removes a corpus from the store",
    method: "DELETE",
    summary : "Remove an existing corpus",
    parameters : [param.path("id", "ID of corpus that needs to be removed", "string")],
    responseMessages : [swe.invalid('id'), swe.notFound('corpus')],
    nickname : "deleteCorpus" 
  },  
  'action': function(req, res) {
    var id = parseInt(req.params.id);
    corpusData.deleteCorpus(id)
    res.send(204);
  }
};
