var supertest = require("supertest");

var authWebService = require('./../../auth_service');

describe("Corpus REST API", function() {

  describe("login", function() {

    it("should accept options", function(done) {

      return supertest(authWebService)
      .post('/login')
      .send({
        username: 'testinglogin',
        password: 'test'
      })
      .then(function(response) {
        expect(response.body.userFriendlyErrors).toEqual(['Username or password is invalid. Please try again.']);
        done();
      })
      .catch(done);

    });

  });
});
