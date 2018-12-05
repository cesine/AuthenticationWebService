var expect = require('chai').expect;
var supertest = require("supertest");

var authWebService = require('./../../auth_service');

describe("Corpus REST API", function() {

  describe("delete", function() {

    it("should accept no options", function() {
      return supertest(authWebService)
      .delete('/corpora/testingprototype-testdeletecorpus')
      .send({
        username: 'testingprototype',
        password: 'test'
      })
      .then(function(response) {
        expect(response.body.message).to.equal('unknown error');
      });

    });

  });
});
