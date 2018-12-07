var expect = require('chai').expect;
var supertest = require('supertest');

var authWebService = require('./../../auth_service');

describe('Corpus REST API', function () {
  describe('login', function () {
    it('should accept options', function () {
      return supertest(authWebService)
        .post('/login')
        .send({
          username: 'testinglogin',
          password: 'test'
        })
        .then(function (response) {
          expect(response.body.userFriendlyErrors).to.deep.equal(['Username or password is invalid. Please try again.']);
        });
    });
  });
});
