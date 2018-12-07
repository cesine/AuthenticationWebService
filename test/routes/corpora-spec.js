var expect = require('chai').expect;
var supertest = require('supertest');

var authWebService = require('./../../auth_service');

describe.skip('Corpus REST API', function () {
  describe('delete', function () {
    it('should accept no options', function () {
      return supertest(authWebService)
        .delete('/corpora/testingprototype-testdeletecorpus')
        .send({
          username: 'testingprototype',
          password: 'test'
        })
        .then(function (response) {
          expect(response.body).to.deep.equal({
            message: 'Internal server error',
            stack: response.body.stack,
            status: 500,
            userFriendlyErrors: ['Server erred, please report this 816']
          });
          expect(response.body.stack).to.contain('corpusData.deleteCorpus is not a function');
        });
    });
  });
});
