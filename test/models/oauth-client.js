var expect = require('chai').expect;
var AsToken = require('as-token');

var OAuthClient = require('./../../models/oauth-client');
var OAuthToken = require('./../../models/oauth-token');
var User = require('./../../models/user');
var fixtures = {
  client: require('./../fixtures/client.json'), // eslint-disable-line global-require
  user: require('./../fixtures/user.json') // eslint-disable-line global-require
};

describe('oauth client model', function () {
  var token = {
    access_token: 'test-token',
    access_token_expires_on: new Date(1468108856432),
    refresh_token: 'test-refresh',
    refresh_token_expires_on: new Date(1468108856432),
    client_id: fixtures.client.client_id,
    user_id: fixtures.user.id
  };

  before(function (done) {
    OAuthClient.init();
    User.init();
    OAuthToken.init();

    setTimeout(function () {
      OAuthClient.create(fixtures.client, function () {
        User.create(fixtures.user, function () {
          OAuthToken.create(token, function () {
            done();
          });
        });
      });
    }, 300);
  });

  describe('persistance', function () {
    it('should create a OAuthClient', function (done) {
      var json = {
        client_secret: '29j3werd',
        extranious: 123
      };

      OAuthClient.create(json, function (err, client) {
        if (err) {
          return done(err);
        }

        expect(client.client_id).length(36);
        expect(client).to.deep.equal({
          client_id: client.client_id,
          client_secret: '29j3werd',
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          expiresAt: client.expiresAt,
          throttle: 500,
          hour_limit: 600,
          day_limit: 6000
        });

        done();
      });
    });

    it('should return null if client not found', function (done) {
      OAuthClient
        .read({
          client_id: 'test-nonexistant-client'
        }, function (err, client) {
          if (err) {
            return done(err);
          }

          expect(client).to.equal(null);

          done();
        });
    });

    describe('existing OAuthClients', function () {
      it('should look up a client using id and secret', function (done) {
        OAuthClient
          .read({
            client_id: 'test-client',
            client_secret: 'test-secret'
          }, function (err, client) {
            if (err) {
              return done(err);
            }

            expect(client).not.to.equal(null);

            expect(client).to.deep.equal({
              client_id: 'test-client',
              client_secret: 'test-secret',
              contact: 'Joe Smoe <joe@smoe.ca>',
              title: 'Testing Client',
              description: 'Client used for testing the oauth flow',
              hour_limit: 600,
              day_limit: 6000,
              throttle: 500,
              redirect_uri: 'http://localhost:8011/auth/example/callback',
              deletedAt: null,
              deletedReason: null,
              expiresAt: client.expiresAt,
              createdAt: client.createdAt,
              updatedAt: client.updatedAt
            });

            done();
          });
      });

      it('should look up using id', function (done) {
        OAuthClient
          .read({
            client_id: 'test-client'
          }, function (err, client) {
            if (err) {
              return done(err);
            }

            expect(client).not.to.equal(null);
            expect(client.client_id).equal('test-client');

            done();
          });
      });
    });
  });

  describe('collection', function () {
    beforeEach(function (done) {
      OAuthClient
        .create({
          client_id: 'testm-abc',
          title: 'Puppies app'
        }, function () {
          OAuthClient
            .create({
              client_id: 'testm-hij',
              deletedAt: new Date(1341967961140),
              deletedReason: 'spidering on July 9 2012'
            }, function () {
              done();
            });
        });
    });

    it('should list an admin view of all clients', function (done) {
      OAuthClient.list({
        where: {
          client_id: {
            $like: 'testm-%'
          }
        },
        limit: 1000
      }, function (err, clients) {
        if (err) {
          return done(err);
        }

        expect(clients).not.to.deep.equal([]);
        expect(clients).length(2);

        var client = clients[0];
        expect(client.client_id).to.not.equal(undefined);
        expect(client.title).to.not.equal(undefined);
        expect(client.deletedReason).to.equal(null);

        done();
      });
    });

    it('should list an admin view of deactivated clients', function (done) {
      OAuthClient.list({
        where: {
          deletedReason: {
            $like: '%spider%'
          }
        },
        limit: 1000
      }, function (err, clients) {
        if (err) {
          return done(err);
        }

        expect(clients).not.to.deep.equal([]);
        expect(clients).length(1);

        var client = clients[0];
        expect(client.client_id).to.not.equal(undefined);
        expect(client.deletedReason).to.not.equal(undefined);

        done();
      });
    });
  });

  // https://github.com/oauthjs/node-oauth2-server/wiki/Model-specification
  describe('express-oauth-server support', function () {
    describe('tokens', function () {
      it('should save an access token', function () {
        return OAuthClient
          .saveAccessToken('test-token', fixtures.client, fixtures.user)
          .then(function (token) {
            expect(token).not.to.equal(null);
            expect(token).deep.equal({
              accessToken: undefined,
              client: {
                id: 'test-client'
              },
              clientId: 'test-client',
              accessTokenExpiresOn: undefined,
              refreshToken: undefined,
              refreshTokenExpiresOn: undefined,
              userId: fixtures.user.id,
              user: {
                id: fixtures.user.id
              }
            });
          });
      });

      it('should get an access token', function () {
        var bearerToken = AsToken.sign({ id: '123' }, 60 * 24);
        return OAuthClient
          .getAccessToken(bearerToken)
          .then(function (token) {
            expect(token).not.to.equal(null);
            expect(token).deep.equal({
              accessToken: bearerToken,
              client: {
                id: 'test-client'
              },
              expires: token.expires,
              user: {
                id: '123'
              }
            });
          });
      });

      it('should get an refresh token', function (done) {
        OAuthClient.getRefreshToken('test-refresh', function (err, token) {
          if (err) {
            return done(err);
          }

          expect(token).not.to.equal(null);
          expect(token).deep.equal({
            accessToken: 'test-token',
            clientId: 'test-client',
            expires: token.expires,
            userId: '6e6017b0-4235-11e6-afb5-8d78a35b2f79'
          });

          done();
        });
      });
    });

    describe('clients', function () {
      it('should get a client', function () {
        return OAuthClient
          .getClient('test-client', 'test-secret')
          .then(function (client_info) {
            expect(client_info).not.to.equal(null);
            console.log(JSON.stringify(client_info));
            expect(client_info).deep.equal({
              id: 'test-client',
              grants: ['authorization_code'],
              redirectUris: ['http://localhost:8011/auth/example/callback'],
              client: {
                client_id: 'test-client',
                client_secret: 'test-secret',
                title: 'Testing Client',
                description: 'Client used for testing the oauth flow',
                contact: 'Joe Smoe <joe@smoe.ca>',
                redirect_uri: 'http://localhost:8011/auth/example/callback',
                hour_limit: 600,
                day_limit: 6000,
                throttle: 500,
                expiresAt: client_info.client.expiresAt,
                deletedAt: null,
                deletedReason: null,
                createdAt: client_info.client.createdAt,
                updatedAt: client_info.client.updatedAt,
                id: 'test-client'
              }
            });
          });
      });
    });

    describe('users', function () {
      it('should get a user', function (done) {
        OAuthClient.getUser('test-user', 'aje24wersdfgs324rfe+woe', function (err, userId) {
          if (err) {
            return done(err);
          }

          expect(userId).not.to.equal(null);
          expect(userId).equal('test-user-efg_random_uuid');

          done();
        });
      });
    });
  });
});
