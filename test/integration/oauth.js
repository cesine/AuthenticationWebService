var AsToken = require('as-token');
var expect = require('chai').expect;
var supertest = require('supertest');

var service = require('./../../auth_service');
var OauthClient = require('./../../models/oauth-client');
var OauthToken = require('./../../models/oauth-token');
var user = require('./../../models/user');
var fixtures = {
  client: require('./../fixtures/client.json'),
  user: require('./../fixtures/user.json')
};

describe('/oauth2', function () {
  var access_token;
  var jsonToken = {
    access_token: 'test-' + Date.now(),
    access_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
    refresh_token: '23waejsowj4wejsrd',
    refresh_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
    client_id: fixtures.client.client_id,
    user_id: fixtures.user.id,
  };

  before(function (done) {
    OauthClient.init();
    OauthToken.init();
    OauthClient
      .create(fixtures.client, function() {

        OauthToken.create(jsonToken, function (err, token) {
          if (err) {
            return done(err);
          }

          expect(token.id).length(36);
          expect(token).to.deep.equal({
            id: token.id,
            access_token: jsonToken.access_token,
            access_token_expires_on: jsonToken.access_token_expires_on,
            client_id: jsonToken.client_id,
            refresh_token: jsonToken.refresh_token,
            refresh_token_expires_on: jsonToken.refresh_token_expires_on,
            user_id: jsonToken.user_id,
            updatedAt: token.updatedAt,
            createdAt: token.createdAt
          });

          access_token = AsToken.sign(token, 60 * 24);

          user
          .create(fixtures.user, function () {
            done();
          });
        });
      });
  });

  describe('POST /oauth2/authorize', function () {
    it('should redirect to login if user is not present', function () {
      return supertest(service)
        .post('/oauth2/authorize')
        .query({
          client_id: 'test-client',
          client_secret: 'test-secret',
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:8011/v1/users'
        })
        .expect(302)
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .then(function (res) {
          expect(res.text).to.contain('Found. Redirecting to');
          expect(res.text).to.contain('to /authentication/login?client_id=test-client&redirect_uri=http://localhost:8011/users'); // jshint ignore:line
        });
    });

    it.only('should return 401 if no authentication is given', function () {
      return supertest(service)
        .post('/oauth2/authorize')
        .send({
          client_id: 'test-client',
          client_secret: 'test-secret',
          grant_type: 'authorization_code',
          response_type: 'code',
          code: 'ABC',
          state: '123',
          redirect_uri: 'https://localhost:3183/oauth2/token',
          access_token: jsonToken.access_token,// 'Bearer ' + access_token,
        })
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .set('Authorization', 'Bearer v1/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjp7ImdpdmVuTmFtZSI6IiIsImZhbWlseU5hbWUiOiIifSwiaWQiOiJ0ZXN0LXVzZXItZWZnX3JhbmRvbV91dWlkIiwicmV2aXNpb24iOiIxLTE0NjgyMDUzMDkwNjkiLCJkZWxldGVkQXQiOm51bGwsImRlbGV0ZWRSZWFzb24iOiIiLCJ1c2VybmFtZSI6InRlc3QtdXNlciIsImVtYWlsIjoiIiwiZ3JhdmF0YXIiOiI5Y2I0Nzk4ODc0NTkzNTI5MjhkNDEyNmY4OTg0NTRjZiIsImRlc2NyaXB0aW9uIjoiIiwibGFuZ3VhZ2UiOiIiLCJoYXNoIjoiJDJhJDEwJDUxOWkxeW5lQkw0cEgzaVRNdG51b09hRjZkbnFDV041QmgxRDh1bzY4S3pRWTdEcklHeFlxIiwiY3JlYXRlZEF0IjoiMjAxNi0wNy0xMVQwMjo0ODoyOS4xNTVaIiwidXBkYXRlZEF0IjoiMjAxNi0wNy0xMVQwMjo0ODoyOS4xNTVaIiwiaWF0IjoxNDY4MjEyMTY3fQ.HCOkTzqR4v-vSSmoXqTS6vHnZPbgWaEDEL2T6iqzwTdnF58sm_ufnFMDmWfxWzBMc15Y--2oCSEhAPdTVfMqh_h4CSkqDNH10MSCrF346OKHLugFT3BUSuvE6NMszBnItBX8P2r7lc6hhLnpbI4lvslCfQNI3PCoQssbmT1IZ3k') // jshint ignore:line
        .expect(302)
        .expect('Content-Type', 'application/json; charset=utf-8')
        // .expect({
        //   access_token: 'foobar',
        //   token_type: 'bearer'
        // })
        .then(function (res) {
          console.log('res.headers', res.headers);
          return supertest(service)
            .get(res.headers.location.replace('https://localhost:3183', ''))
            .set('Authorization', res.headers.authorization)
            .expect(200);
        })
        .then(function (res) {
          console.log('res.body', res.body);

          expect(res.body).to.deep.equal({
            status: 401,
            userFriendlyErrors: ['Unauthorized request: no authentication given']
          });
        });
    });
  });

  describe('POST /oauth2/token', function () {
    it('should validate the authorization code', function () {
      return supertest(service)
        .post('/oauth2/token')
        .type('form') // content must be application/x-www-form-urlencoded
        .send({
          client_id: 'test-client',
          client_secret: 'test-secret',
          grant_type: 'authorization_code',
          username: 'test-user',
          code: 'ABC'
        })
        .expect(403)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .then(function (res) {
          expect(res.body).to.deep.equal({
            status: 403,
            userFriendlyErrors: ['Client id or Client Secret is invalid']
          });
        });
    });
  });
});
