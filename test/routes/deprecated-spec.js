var expect = require('chai').expect;
var supertest = require("supertest");

var authWebService = require('./../../auth_service');

describe("Corpus REST API", function() {

  describe("login", function() {

    it("should accept options", function() {

      return supertest(authWebService)
      .post('/login')
      .send({
        username: 'testinglogin',
        password: 'test'
      })
      .then(function(response) {
        if (process.env.TRAVIS) {
          expect(response.body.userFriendlyErrors).to.deep.equal(['Server is not responding to request. Please report this error 8913.']);
        } else {
          expect(response.body.userFriendlyErrors).to.deep.equal(['Username or password is invalid. Please try again.']);
        }
      });

    });

  });
});
