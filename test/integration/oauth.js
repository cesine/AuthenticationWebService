var debug = require('debug')('test:integration:oauth');
var expect = require('chai').expect;
var Express = require('express');
var OAuth2Strategy = require('passport-oauth2');
var passport = require('passport');
var querystring = require('querystring');
var session = require('express-session');
var supertest = require('supertest');
var url = require('url');

var OauthClient = require('./../../models/oauth-client');
var UserModel = require('./../../models/user');
var fixtures = {
  client: require('./../fixtures/client.json'), // eslint-disable-line global-require
  user: require('./../fixtures/user.json') // eslint-disable-line global-require
};

describe('/oauth2', function () {
  var clientApp;
  var clientServer;

  before(function setUpClientApp(done) {
    clientApp = new Express();
    clientApp.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'justtestingasanoauthclientapp'
    }));
    clientApp.use(passport.initialize());
    clientApp.use(passport.session());
    passport.serializeUser(function (passportUser, callback) {
      callback(null, passportUser);
    });
    passport.deserializeUser(function (passportUser, callback) {
      callback(null, passportUser);
    });
    passport.use(new OAuth2Strategy({
      authorizationURL: 'https://localhost:3183/oauth2/authorize',
      tokenURL: 'https://localhost:3183/oauth2/token',
      clientID: fixtures.client.client_id,
      clientSecret: fixtures.client.client_secret,
      callbackURL: 'http://localhost:8011/auth/example/callback'
    },
    function (accessToken, refreshToken, profile, cb) {
      debug('in the clientApp oauth OAuth2Strategy', accessToken, refreshToken, profile, cb);
      return cb(null, {
        id: fixtures.user.id,
        username: 'somebody'
      }, { info: 'goes here' });
    }));
    clientApp.get('/auth/example', function (req, res, next) {
      var x = passport.authenticate('oauth2');
      debug('/auth/example will call passport.authenticate', x);
      debug('headers', req.headers);
      // res.set('Authorization', req.headers.authorization);
      return x(req, res, next);
    });
    clientApp.get('/auth/example/callback',
      passport.authenticate('oauth2', {
        failureRedirect: '/login'
      }),
      function (req, res) {
        debug('auth/example/callback got called back', req.headers, req.body, req.query);
        // Successful authentication
        res.json({
          success: 'called back',
          headers: req.headers,
          body: req.body,
          query: req.query,
          session: req.session
        });
      });
    // eslint-disable-next-line no-unused-vars
    clientApp.use(function (err, req, res, next) {
      debug('Error in the clientApp', err);
      res.status(err.status || 500);
      res.json(err);
    });
    clientServer = clientApp.listen(8011, function () {
      debug('HTTP clientApp listening on http://localhost:' + clientServer.address().port);
      done();
    });
  });

  after(function setUpClientApp() {
    if (!clientServer) {
      return null;
    }
    debug('turning off client server');
    return clientServer.close();
  });

  /**
   * Register the client app

      participant User
      participant 3183
      participant 8011

      8011->3183: POST /v1/client { name, redirect_uri }
   */
  before(function (done) {
    OauthClient.init()
      .then((function () {
        OauthClient
          .create(fixtures.client, function (err, result) {
            debug('created client', result);
            done();
          });
      }));
  });

  before(function (done) {
    return UserModel
      .create(fixtures.user, function (err, result) {
        debug('created user', result);
        done();
      });
  });

  describe('GET /oauth2/authorize', function () {
    /**
     * Login to client app via auth provider

      participant User
      participant 3183
      participant 8011

      User->8011: Login with: 3183 provider
      8011->3183: /oauth2/authorize { state }
      3183->User: Authorize 8011 to access your profile?
      User-->3183: Yes
      3183->User: Redirect to 8011 { code, state }
      User->8011: /callback { code, state }
      8011->3183: POST /oauth2/token { code, state }
      3183-->8011: { token, profile }
      8011-->User: Welcome anonymous!
     */
    it.only('should perform oauth2 dance', function () {
      var loginUrl;
      // Trigger the dance
      return supertest('http://localhost:8011')
        .get('/auth/example')
        .send({
          client_id: fixtures.client.client_id
        })
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .expect(302)
        .then(function (res) {
          debug(' client app redirect res.headers', res.headers);
          expect(res.headers.location).to.contain('/oauth2/authorize');

          // Request authorization
          return supertest(process.env.URL)
            .get(res.headers.location.replace('https://localhost:3183', ''))
            .expect(302);
        })
        .then(function (res) {
          debug(' service redirect res.headers', res.headers);
          loginUrl = url.parse(res.headers.location);
          loginUrl.params = querystring.parse(loginUrl.query);
          debug('loginUrl', loginUrl);
          expect(loginUrl.pathname).to.equal('/authentication/login/');
          expect(loginUrl.query).to.not.contain('undefined');
          expect(loginUrl.query).to.not.contain('state');

          // Simulate User Requests login page
          return supertest(process.env.URL)
            .get(loginUrl.pathname)
            .query(loginUrl.params)
            .expect(200);
        })
        .then(function (res) {
          expect(res.text).to.contain('Login');
          expect(res.text).to.contain('button');
          expect(res.text).to.contain('Password');

          debug('redirect res.body', res.body);
          debug('redirect res.headers', res.headers);

          loginUrl.params.redirect = '/oauth2/authorize?' + querystring.stringify(loginUrl.params);
          loginUrl.params.username = fixtures.user.username;
          loginUrl.params.password = fixtures.user.password;

          // Simulate User Logs in
          return supertest(process.env.URL)
            .post(loginUrl.pathname)
            .send(loginUrl.params)
            .expect(302);
        })
        .then(function (res) {
          debug('logged in res.body', res.body);
          debug('logged in res.headers', res.headers);
          expect(res.headers.location).to.contain('/oauth2/authorize');

          // Request authorization now that User is logged in
          return supertest(process.env.URL)
            .get(res.headers.location)
            .set('Authorization', res.headers.authorization)
            // .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
            .send({
              // client_id: fixtures.client.client_id,
              // response_type: 'code',
              // state: '123',
              // redirect_uri: 'https://localhost:3183/oauth2/token',
              // TODO where does this come from?
              // access_token: jsonToken.access_token
            })
            .expect(302);
        })
        .then(function (res) {
          debug('after authorize in res.body', res.body);
          debug('after authorize in res.headers', res.headers);
          expect(res.headers.location).to.contain('/auth/example/callback');
          expect(res.headers.authorization).to.contain('Bearer');

          // Follow redirect back to client
          return supertest(clientServer)
            .get(res.headers.location.replace('http://localhost:8011', ''))
            .set('Authorization', res.headers.authorization)
            .expect(200);
        })
        .then(function (res) {
          debug('after app callback res.status', res.status);
          debug('after app callback res.body', res.body);
          debug('after app callback res.headers', res.headers);

          // Expect client succesfully got user profile and token
          expect(res.body.query.code).length(40);
          expect(res.body.headers.authorization).to.contain('Bearer v1');
          expect(res.body).to.deep.equal({
            success: 'called back',
            headers: {
              host: '127.0.0.1:8011',
              'accept-encoding': 'gzip, deflate',
              'user-agent': 'node-superagent/3.8.3',
              authorization: res.body.headers.authorization,
              connection: 'close'
            },
            query: {
              code: res.body.query.code
            },
            session: {
              cookie: {
                originalMaxAge: null,
                expires: null,
                httpOnly: true,
                path: '/'
              },
              passport: {
                user: {
                  id: fixtures.user.id,
                  username: 'somebody'
                }
              }
            }
          });
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
          state: '123'
          // redirect_uri: 'https://localhost:3183/oauth2/token',
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
          debug('res.headers', res.headers);
          return supertest(process.env.URL)
            .get(res.headers.location.replace('https://localhost:3183', ''))
            .set('Authorization', res.headers.authorization)
            .expect(200);
        })
        .then(function (res) {
          debug('res.body', res.body);

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
