var AsToken = require('as-token');
var expect = require('chai').expect;
var supertest = require('supertest');
var https = require('https');
var express = require('express');
var passport = require('passport');
var session = require('express-session');
var OAuth2Strategy = require('passport-oauth2');

var OauthClient = require('./../../models/oauth-client');
var OauthToken = require('./../../models/oauth-token');
var user = require('./../../models/user');
var fixtures = {
  client: require('./../fixtures/client.json'),
  user: require('./../fixtures/user.json')
};

describe('/oauth2', function () {
  var access_token;
  var server;
  var clientApp;
  var jsonToken = {
    access_token: 'test-' + Date.now(),
    access_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
    refresh_token: '23waejsowj4wejsrd',
    refresh_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
    client_id: fixtures.client.client_id,
    user_id: fixtures.user.id
  };

  before(function setUpService() {
    agent = supertest(process.env.URL);
    return agent
      .get('/v1/healtcheck');
  });

  before(function setUpClientApp(done) {
    clientApp = new express();
    clientApp.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'justtestingasanoauthclientapp'
    }));

    // TODO use port of agent
    // console.log('agent', agent.serverAddress(service));
    // console.log('service ', service.address());
    passport.use(new OAuth2Strategy({
      authorizationURL: 'https://localhost:3183/oauth2/authorize',
      tokenURL: 'https://localhost:3183/oauth2/token',
      clientID: fixtures.client.client_id,
      clientSecret: fixtures.client.client_secret,
      callbackURL: 'http://localhost:8011/auth/example/callback'
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({
        exampleId: profile.id
      }, function (err, user) {
        return cb(err, user);
      });
    }));

    clientApp.get('/auth/example',
      passport.authenticate('oauth2'));

    clientApp.get('/auth/example/callback',
      passport.authenticate('oauth2', {
        failureRedirect: '/login'
      }),
      function (req, res) {
        console.log('auth/example/callback got called back', req.headers, req.body, req.query);
        // Successful authentication, redirect home.
        res.redirect('/');
      });

    clientApp.use(function(err, req, res, next) {
      console.log('Error in the clientApp', err);
      res.status(err.status || 500);
      res.json(err);
    });
    server = clientApp.listen(8011, function () {
      console.log('HTTP clientApp listening on http://localhost:' + server.address().port);
      done();
    });
  });

  after(function setUpClientApp() {
    if (!server) {
      return;
    }
    server.close();
  });

  before(function (done) {
    OauthClient.init();
    OauthToken.init();
    OauthClient
      .create(fixtures.client, function () {
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

  describe('GET /oauth2/authorize', function () {
    it.only('should perform oauth2 dance', function () {
      var loginUrl;

      return supertest('http://localhost:8011')
        .get('/auth/example') // Trigger the dance
        // .get('/oauth2/authorize')
        .send({
          client_id: fixtures.client.client_id,
          response_type: 'code',
          state: '123'
          // access_token: jsonToken.access_token // 'Bearer ' + access_token,
        })
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .expect(302)
        .then(function (res) {
          console.log(' client app redirect res.headers', res.headers);
          expect(res.headers.location).to.contain('/oauth2/authorize');
          // expect(res.headers.location).to.contain('state');

          return supertest(process.env.URL)
            .get(res.headers.location.replace('https://localhost:3183', ''))
            .expect(302);
        })
        .then(function (res) {
          console.log(' service redirect res.headers', res.headers);
          loginUrl = res.headers.location;
          expect(loginUrl).to.contain('/authentication/login');
          expect(loginUrl).not.to.contain('undefined');
          expect(loginUrl).to.contain('state');

          return supertest(process.env.URL)
            .get(loginUrl.replace('https://localhost:3183', ''))
            .expect(200);
        })
        .then(function (res) {
          expect(res.text).to.contain('Login');
          expect(res.text).to.contain('button');
          expect(res.text).to.contain('Password');

          console.log('redirect res.body', res.body);
          console.log('redirect res.headers', res.headers);

          // simulate user logging in
          var test = supertest(process.env.URL)
            .post(loginUrl.replace('https://localhost:3183', ''))
            .send({
              client_id: fixtures.client.client_id,
              redirect_uri: 'http://localhost:8011/auth/example/callback',
              username: fixtures.user.username,
              password: fixtures.user.password,
              code: 'abc',
              state: 123
            })
            .expect(302)

          // console.log('test', test.serverAddress(service));
          return test;
        })
        .then(function (res) {
          console.log('logged in res.body', res.body);
          console.log('logged in res.headers', res.headers);
          expect(res.headers.location).to.contain('/auth/example/callback');
          expect(res.headers.authorization).to.contain('Bearer');

          return supertest(clientApp)
            .get(res.headers.location.replace('http://localhost:8011', ''))
            .set('Authorization', res.headers.authorization)
            .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
            .send({
              // client_id: fixtures.client.client_id,
              // response_type: 'code',
              // state: '123',
              // redirect_uri: 'https://localhost:3183/oauth2/token',
              // TODO where does this come from?
              access_token: jsonToken.access_token
            })
            // .expect(200);
        })
        .then(function (res) {
          console.log('after app callback res.status', res.status);
          console.log('after app callback res.body', res.body);
          console.log('after app callback res.headers', res.headers);
        });
    });
  });

  describe('POST /oauth2/authorize', function () {
    it('should redirect to login if user is not present', function () {
      return supertest(process.env.URL)
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

    it.skip('should perform oauth2 dance', function () {
      return supertest(process.env.URL)
        .post('/oauth2/authorize')
        .send({
          client_id: 'test-client',
          client_secret: 'test-secret',
          // grant_type: 'authorization_code',
          response_type: 'code',
          // code: 'ABC',
          state: '123',
          // redirect_uri: 'https://localhost:3183/oauth2/token',
          access_token: jsonToken.access_token// 'Bearer ' + access_token,
        })
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .set('Authorization', 'Bearer v1/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjp7ImdpdmVuTmFtZSI6IiIsImZhbWlseU5hbWUiOiIifSwiaWQiOiJ0ZXN0LXVzZXItZWZnX3JhbmRvbV91dWlkIiwicmV2aXNpb24iOiIxLTE0NjgyMDUzMDkwNjkiLCJkZWxldGVkQXQiOm51bGwsImRlbGV0ZWRSZWFzb24iOiIiLCJ1c2VybmFtZSI6InRlc3QtdXNlciIsImVtYWlsIjoiIiwiZ3JhdmF0YXIiOiI5Y2I0Nzk4ODc0NTkzNTI5MjhkNDEyNmY4OTg0NTRjZiIsImRlc2NyaXB0aW9uIjoiIiwibGFuZ3VhZ2UiOiIiLCJoYXNoIjoiJDJhJDEwJDUxOWkxeW5lQkw0cEgzaVRNdG51b09hRjZkbnFDV041QmgxRDh1bzY4S3pRWTdEcklHeFlxIiwiY3JlYXRlZEF0IjoiMjAxNi0wNy0xMVQwMjo0ODoyOS4xNTVaIiwidXBkYXRlZEF0IjoiMjAxNi0wNy0xMVQwMjo0ODoyOS4xNTVaIiwiaWF0IjoxNDY4MjEyMTY3fQ.HCOkTzqR4v-vSSmoXqTS6vHnZPbgWaEDEL2T6iqzwTdnF58sm_ufnFMDmWfxWzBMc15Y--2oCSEhAPdTVfMqh_h4CSkqDNH10MSCrF346OKHLugFT3BUSuvE6NMszBnItBX8P2r7lc6hhLnpbI4lvslCfQNI3PCoQssbmT1IZ3k') // jshint ignore:line
        .expect(302)
        // .expect('Content-Type', 'application/json; charset=utf-8')
        // .expect({
        //   access_token: 'foobar',
        //   token_type: 'bearer'
        // })
        .then(function (res) {
          console.log('res.headers', res.headers);
          return supertest(process.env.URL)
            .get(res.headers.location.replace('https://localhost:3183', ''))
            .set('Authorization', res.headers.authorization)
            .expect(200);
        })
        .then(function (res) {
          console.log('res.body', res.body);

          expect(res.body).to.deep.equal({
            clientId: 'test-client',
            code: 'ddbf9e3f-ac88-4759-a514-81a6d126fba9',
            grants: [
              'authorization_code'
            ],
            redirectUris: [
              'https://localhost:3183/oauth2/token'
            ]
          });
        });
    });
  });

  describe('POST /oauth2/token', function () {
    it('should validate the authorization code', function () {
      return supertest(process.env.URL)
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
