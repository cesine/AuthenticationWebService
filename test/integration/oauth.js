var AsToken = require('as-token');
var debug = require('debug')('test:integration:oauth');
var expect = require('chai').expect;
var Express = require('express');
var OAuth2Strategy = require('passport-oauth2');
var passport = require('passport');
var querystring = require('querystring');
var session = require('express-session');
var supertest = require('supertest');
var url = require('url');

var service = require('../../auth_service');
var OauthClient = require('./../../models/oauth-client');
var UserModel = require('./../../models/user');
var fixtures = {
  client: require('./../fixtures/client.json'), // eslint-disable-line global-require
  user: require('./../fixtures/user.json') // eslint-disable-line global-require
};

describe('/oauth2', function () {
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
    UserModel
      .create(fixtures.user, function (err, result) {
        debug('created user', result);
        done();
      });
  });

  describe('GET /oauth2/authorize', function () {
    it('should redirect to login if user is not present', function () {
      return supertest(service)
        .get('/oauth2/authorize')
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
          expect(res.text).to.equal('Found. Redirecting to /authentication/login/?client_id=test-client&grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%3A8011%2Fv1%2Fusers'); // jshint ignore:line
        });
    });
  });

  describe('Oauth Dance', function () {
    var clientApp;
    var clientServer;
    var oauthOpts = {
      authorizationURL: 'http://localhost:3183/oauth2/authorize',
      tokenURL: 'http://localhost:3183/oauth2/token',
      clientID: fixtures.client.client_id,
      clientSecret: fixtures.client.client_secret,
      state: true,
      callbackURL: 'http://localhost:8011/auth/example/callback'
    };
    var port;
    var server;

    before(function (done) {
      server = service.listen(0, function () {
        port = server.address().port;
        debug('Listening on http port %d', port);
        done();
      });
    });

    after(function () {
      server.close();
    });

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
      oauthOpts.authorizationURL = oauthOpts.authorizationURL.replace('3183', port);
      oauthOpts.tokenURL = oauthOpts.tokenURL.replace('3183', port);
      debug('port', port, oauthOpts);
      passport.use(new OAuth2Strategy(oauthOpts,
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
    it('should perform oauth2 dance', function () {
      var loginUrl;
      var clientAppSessionCookies;

      // Trigger the dance
      return supertest('http://localhost:8011')
        .get('/auth/example')
        .send({
          client_id: fixtures.client.client_id
        })
        .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .then(function (res) {
          debug(' client app redirect res.headers', res.headers);
          expect(res.status).to.equal(302, res.text);
          expect(res.headers.location).to.contain('/oauth2/authorize');
          expect(res.headers.location).to.contain('state=');
          clientAppSessionCookies = res.headers['set-cookie'];

          // Request authorization
          return supertest(server)
            .get(res.headers.location.replace('http://localhost:' + port, ''));
        })
        .then(function (res) {
          debug(' service redirect res.headers', res.headers);
          expect(res.status).to.equal(302, res.text);
          loginUrl = url.parse(res.headers.location);
          loginUrl.params = querystring.parse(loginUrl.query);
          debug('loginUrl', loginUrl);
          expect(loginUrl.pathname).to.equal('/authentication/login/');
          expect(loginUrl.query).to.not.contain('undefined');
          expect(loginUrl.query).to.contain('state');

          // Simulate User Requests login page
          return supertest(server)
            .get(loginUrl.pathname)
            .query(loginUrl.params);
        })
        .then(function (res) {
          expect(res.status).to.equal(200, res.text);
          expect(res.text).to.contain('Login');
          expect(res.text).to.contain('button');
          expect(res.text).to.contain('Password');

          debug('redirect res.body', res.body);
          debug('redirect res.headers', res.headers);

          loginUrl.params.redirect = '/oauth2/authorize?' + querystring.stringify(loginUrl.params);
          loginUrl.params.username = fixtures.user.username;
          loginUrl.params.password = 'phonemes';

          // Simulate User Logs in
          return supertest(server)
            .post(loginUrl.pathname)
            .send(loginUrl.params);
        })
        .then(function (res) {
          debug('logged in res.body', res.body);
          debug('logged in res.headers', res.headers);
          expect(res.status).to.equal(302, res.text);
          expect(res.headers.location).to.contain('/oauth2/authorize');
          expect(res.headers.location).to.contain('state=');

          // Request authorization now that User is logged in
          return supertest(server)
            .get(res.headers.location)
            .set('Authorization', res.headers.authorization);
        })
        .then(function (res) {
          var callbackUrl;
          debug('after authorize in res.body', res.body);
          debug('after authorize in res.headers', res.headers);
          expect(res.status).to.equal(302, res.text);
          expect(res.headers.location).to.contain('/auth/example/callback');
          expect(res.headers.authorization).to.contain('Bearer');

          var token = res.headers.authorization.replace(/Bearer v1\//, '');
          var decoded = AsToken.verify(token);
          expect(decoded).to.deep.equal({
            name: {
              givenName: 'Anony',
              familyName: 'Mouse'
            },
            id: '6e6017b0-4235-11e6-afb5-8d78a35b2f79',
            revision: decoded.revision,
            // deletedAt: null,
            // deletedReason: '',
            username: 'test-anonymouse',
            email: '',
            gravatar: decoded.gravatar,
            description: 'Friendly',
            language: 'zh',
            // hash: decoded.hash,
            createdAt: decoded.createdAt,
            updatedAt: decoded.updatedAt,
            iat: decoded.iat,
            exp: decoded.exp
          });

          // Follow redirect back to client
          callbackUrl = res.headers.location.replace('http://localhost:8011', '');
          debug('callbackUrl', callbackUrl);
          return supertest(clientServer)
            .get(callbackUrl)
            .set('Authorization', res.headers.authorization)
            .set('Cookie', clientAppSessionCookies);
        })
        .then(function (res) {
          debug('after app callback res.status', res.status);
          debug('after app callback res.body', res.body);
          debug('after app callback res.headers', res.headers);

          // Expect client succesfully got user profile and token
          expect(res.status).to.equal(200, res.text);
          expect(res.body.query.code).length(40);
          expect(res.body.query.state).length(24);
          expect(res.body.headers.authorization).to.contain('Bearer v1');

          var token = res.body.headers.authorization.replace(/Bearer v1\//, '');
          var decoded = AsToken.verify(token);
          expect(decoded).to.deep.equal({
            name: {
              givenName: 'Anony',
              familyName: 'Mouse'
            },
            id: '6e6017b0-4235-11e6-afb5-8d78a35b2f79',
            revision: decoded.revision,
            // deletedAt: null,
            // deletedReason: '',
            username: 'test-anonymouse',
            email: '',
            gravatar: decoded.gravatar,
            description: 'Friendly',
            language: 'zh',
            // hash: decoded.hash,
            createdAt: decoded.createdAt,
            updatedAt: decoded.updatedAt,
            iat: decoded.iat,
            exp: decoded.exp
          });

          expect(res.body.headers.cookie).to.contain('connect.sid=');
          expect(res.body).to.deep.equal({
            success: 'called back',
            headers: {
              host: '127.0.0.1:8011',
              'accept-encoding': 'gzip, deflate',
              'user-agent': 'node-superagent/3.8.3',
              authorization: res.body.headers.authorization,
              connection: 'close',
              cookie: res.body.headers.cookie
            },
            query: {
              code: res.body.query.code,
              state: res.body.query.state
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
    it('should be not found', function () {
      return supertest(service)
        .post('/oauth2/authorize')
        .type('form')
        .send({
          client_id: 'test-client',
          client_secret: 'test-secret',
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:8011/v1/users'
        })
        .expect(404)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .then(function (res) {
          expect(res.body).to.deep.equal({
            status: 404,
            userFriendlyErrors: ['Not Found']
          });
        });
    });
  });

  describe('GET /oauth2/token', function () {
    it('should be not found', function () {
      return supertest(service)
        .get('/oauth2/token')
        .send({
          client_id: 'test-client',
          client_secret: 'test-secret',
          grant_type: 'authorization_code',
          username: 'test-user',
          code: 'ABC'
        })
        .expect(404)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .then(function (res) {
          expect(res.body).to.deep.equal({
            status: 404,
            message: 'Not Found',
            stack: res.body.stack,
            userFriendlyErrors: ['Not Found']
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
            userFriendlyErrors: ['Code is not authorized']
          });
        });
    });
  });
});
