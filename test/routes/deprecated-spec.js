var expect = require('chai').expect;
var supertest = require('supertest');

var authWebService = require('./../../auth_service');

describe.skip('Corpus REST API', function () {
  describe('login', function () {
    it('should handle invalid users', function () {
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

    it('should handle invalid passwords', function () {
      return supertest(authWebService)
        .post('/login')
        .send({
          username: 'testingprototype',
          password: 'wrongpassword'
        })
        .then(function (response) {
          expect(response.body.userFriendlyErrors).to.deep.equal(['You have tried to log in too many times and you dont seem to have a valid email so we cant send you a temporary password.']);
        });
    });

    it('should handle valid passwords', function () {
      return supertest(authWebService)
        .post('/login')
        .send({
          username: 'lingllama',
          password: 'phoneme'
        })
        .then(function (response) {
          expect(response.body.userFriendlyErrors).to.equal(undefined);
          expect(response.body.user._id).to.equal('lingllama');
          expect(response.body.user.username).to.equal('lingllama');
          expect(response.body.user.corpora).length(3);
        });
    });
  });
});
