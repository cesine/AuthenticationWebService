var sessionTemplate = require("fielddb/api/datum/session.json");

sessionTemplate.fields = require("fielddb/api/corpus/corpus.json").sessionFields
module.exports = sessionTemplate;

// console.log("Loaded session", sessionTemplate);
