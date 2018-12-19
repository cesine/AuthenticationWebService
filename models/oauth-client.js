/* global Promise */

var debug = require('debug')('oauth:model');
var Sequelize = require('sequelize');
var lodash = require('lodash');
var AsToken = require('as-token');

var OAuthError = require('oauth2-server/lib/errors/oauth-error');
var OAuthToken = require('./oauth-token');
var User = require('./user');

var YEAR = 1000 * 60 * 60 * 24 * 365;
var AUTHORIZATION_CODE_TRANSIENT_STORE = {};
var sequelize = new Sequelize('database', 'id', 'password', {
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: 'db/oauth_clients.sqlite'
});

var oauthClient = sequelize.define('oauth_clients', {
  client_id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  client_secret: Sequelize.TEXT,
  title: Sequelize.TEXT,
  description: Sequelize.TEXT,
  contact: Sequelize.TEXT,
  redirect_uri: Sequelize.TEXT,
  hour_limit: Sequelize.BIGINT, // requests per hour
  day_limit: Sequelize.BIGINT, // requests per calendar day
  throttle: Sequelize.INTEGER, // miliseconds
  expiresAt: Sequelize.DATE, // expiry date
  deletedAt: Sequelize.DATE,
  deletedReason: Sequelize.TEXT
});

function signUserAsToken(user, client) {
  var tokenJson = lodash.omit(user, ['hash', 'deletedAt', 'deletedReason', 'exp']);
  if (client) {
    tokenJson.clientId = client.client_id;
  }
  debug('signUserAsToken', tokenJson);
  return AsToken.sign(tokenJson, 60 * 24);
}

/**
 * Create a oauth client in the database
 * @param  {oauthClient}   client
 * @param callback
 */
function create(options, callback) {
  var opts = lodash.clone(options);
  if (!options) {
    return callback(new Error('Invalid Options'));
  }
  opts.expiresAt = Date.now() + 5 * YEAR;
  opts.hour_limit = 600;
  opts.day_limit = 6000;
  opts.throttle = 500;

  return oauthClient
    .create(opts)
    .then(function whenCreateClient(dbModel) {
      return callback(null, dbModel.toJSON());
    })
    .catch(callback);
}

/**
 * Read an oauth client from the database
 * @param  {oauthClient}   client
 * @param callback
 */
function read(client, callback) {
  var options = {
    where: client
  };

  oauthClient
    .find(options)
    .then(function whenReadDB(dbModel) {
      if (!dbModel) {
        return callback(null, null);
      }
      return callback(null, dbModel.toJSON());
    })
    .catch(callback);
}

/**
 * List oauth client matching the options
 * @param  {String} options [description]
 * @param callback        [description]
 */
function list(opts, callback) {
  var options = lodash.clone(opts || {});
  options.limit = options.limit || 10;
  options.offset = options.offset || 0;
  options.where = options.where || {
    deletedAt: null
  };

  options.attributes = [
    'client_id',
    'title',
    'redirect_uri',
    'description',
    'contact',
    'createdAt',
    'deletedReason'
  ];

  oauthClient
    .findAll(options)
    .then(function whenList(oauth_clients) {
      if (!oauth_clients) {
        return callback(new Error('Unable to fetch oauthClient collection'));
      }

      return callback(null, oauth_clients.map(function mapToJson(dbModel) {
        return dbModel.toJSON();
      }));
    })
    .catch(callback);
}

/**
 * Delete oauth_clients matching the options
 * @param  {String} options [description]
 * @param callback        [description]
 */
function flagAsDeleted() {
  throw new Error('Unimplemented');
}

/**
 * Initialize the table if not already present
 * @param callback        [description]
 */
function init() {
  return OAuthToken.init().then(function whenInit() {
    return sequelize.sync();
  });
}

/*
 * OAuth2 Provider Model
 * https://github.com/oauthjs/node-oauth2-server/wiki/Model-specification
 */

/*
 * https://oauth2-server.readthedocs.io/en/latest/misc/migrating-v2-to-v3.html?highlight=getAccessToken
 * TODO should read or create token?
 * getAccessToken(token) should return an object with:
 *    accessToken (String)
 *    accessTokenExpiresAt (Date)
 *    client (Object), containing at least an id property that matches the supplied client
 *    scope (optional String)
 *    user (Object)
 */
function getAccessToken(bearerToken) {
  return new Promise(function whenPromise(resolve, reject) {
    var user = AsToken.verify(bearerToken);
    var client = {
      client_id: 'test-client' // TODO hard coded
    };
    var access_token;

    debug('getAccessToken for user', user);
    debug('getAccessToken access_token', access_token);

    access_token = signUserAsToken(user, client);
    console.log('access_token', access_token);

    OAuthToken.create({
      access_token: access_token,
      access_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
      refresh_token: '23waejsowj4wejsrd', // TODO hard coded
      refresh_token_expires_on: new Date(Date.now() + 1 * 60 * 60 * 1000),
      client_id: client.client_id,
      user_id: user.id
    }, function whenCreated(err, token) {
      if (err) {
        return reject(err);
      }
      if (!token) {
        return reject(new Error('Unable to get access token, please report this'));
      }

      return resolve({
        accessToken: token.access_token,
        expires: token.access_token_expires_on,
        client: {
          id: token.client_id
        },
        user: {
          id: token.user_id
        }
      });
    });
  });
}

/**
 * Get client.
 * Only seems to support a promise
 * https://github.com/oauthjs/node-oauth2-server/issues/277
 * Despite saying others are possible
 * https://github.com/oauthjs/node-oauth2-server#upgrading-from-2x
 */
function getClient(clientId, clientSecret) {
  debug('getClient arguments', arguments);

  return oauthClient.find({
    client_id: clientId,
    client_secret: clientSecret,
    deletedAt: null
  }).then(function whenClientFound(client) {
    var json;
    if (!client) {
      throw new Error('Client id or secret is invalid');
    }

    // https://github.com/oauthjs/express-oauth-server/blob/master/test/integration/index_test.js#L144
    // Seems to require a grants
    // { grants: ['password'] }
    // { grants: ['authorization_code'], redirectUris: ['http://example.com'] };
    json = {
      client: client.toJSON(),
      id: clientId,
      grants: ['authorization_code'],
      redirectUris: client.redirect_uri ? client.redirect_uri.split(',') : []
    };
    json.client.id = client.client_id;

    return json;
  });
}

function getAuthorizationCode(code) {
  debug('getAuthorizationCode', arguments, AUTHORIZATION_CODE_TRANSIENT_STORE);
  debug('AUTHORIZATION_CODE_TRANSIENT_STORE', AUTHORIZATION_CODE_TRANSIENT_STORE);

  return new Promise(function whenPromise(resolve, reject) {
    var client = AUTHORIZATION_CODE_TRANSIENT_STORE[code];
    var err;
    if (client) {
      // delete AUTHORIZATION_CODE_TRANSIENT_STORE[code];
      client.expiresAt = new Date(client.expiresAt);
      client.user = {
        id: client.user_id
      };
      return resolve(client);
    }
    err = new OAuthError('Code is not authorized', {
      code: 403
    });
    err.status = 403;

    return reject(err);
  });
}

function revokeAuthorizationCode(code) {
  debug('revokeAuthorizationCode', arguments);

  return new Promise(function whenPromise(resolve) {
    var revokedCode = lodash.clone(code);
    var itWas = AUTHORIZATION_CODE_TRANSIENT_STORE[code.code];
    debug('revoked ', itWas);

    revokedCode.expiresAt = new Date(Date.now() - 1000);
    delete AUTHORIZATION_CODE_TRANSIENT_STORE[code.code];

    resolve(revokedCode);
  });
}

function saveAuthorizationCode(authorizationCode, value, client) {
  debug('saveAuthorizationCode authorizationCode', authorizationCode);
  debug('saveAuthorizationCode value', value);
  debug('saveAuthorizationCode client', client);

  return new Promise(function whenPromise(resolve) {
    AUTHORIZATION_CODE_TRANSIENT_STORE[authorizationCode.authorizationCode] = value;
    debug('AUTHORIZATION_CODE_TRANSIENT_STORE', AUTHORIZATION_CODE_TRANSIENT_STORE);

    resolve({ authorizationCode: authorizationCode.authorizationCode });
  });
}

/**
 * Get refresh token.
 */

function getRefreshToken(bearerToken, callback) {
  OAuthToken.read({
    refresh_token: bearerToken
  }, function whenRead(err, token) {
    if (err) {
      return callback(err);
    }
    if (!token) {
      return callback(null);
    }

    return callback(null, {
      accessToken: token.access_token,
      clientId: token.client_id,
      expires: token.access_token_expires_on,
      userId: token.user_id
    });
  });
}

/**
 * Get token for code
 *
 * @param  {[type]}   bearerToken [description]
 * @param  {Function} callback    [description]
 * @return {[type]}               [description]
 */
function getTokenFromCode(code, callback) {
  debug('getTokenFromCode', code);
  getAuthorizationCode(code).then(function whenCode(result) {
    debug('done getAuthorizationCode', result);
    return callback(null, result);
  }).catch(callback);
}

/*
 * Get user.
 */

function getUser(username, password, callback) {
  User.verifyPassword({
    username: username,
    password: password
  }, function whenVerified(err, profile) {
    if (err) {
      return callback(err);
    }
    if (!profile) {
      return callback(null);
    }

    return callback(null, profile.id);
  });
}

function validateScope() {
  debug('validateScope', arguments);
  return true;
}

/**
 * Save token.
 */

function saveToken(token, client, user) {
  debug('saveToken ', arguments);
  return new Promise(function whenPromise(resolve, reject) {
    if (!token || !client || !user) {
      return reject(new Error('Invalid Options'));
    }

    return OAuthToken.create({
      access_token: token.accessToken,
      access_token_expires_on: token.accessTokenExpiresOn,
      client_id: client.id,
      refresh_token: token.refreshToken,
      refresh_token_expires_on: token.refreshTokenExpiresOn,
      user_id: user.id
    }, function whenCreated(err, result) {
      if (err) {
        return reject(err);
      }
      if (!result) {
        return reject(new OAuthError('Unable to create token, please report this.'));
      }

      // https://github.com/oauthjs/express-oauth-server/blob/master/test/integration/index_test.js#L238
      // {
      //   accessToken: 'foobar',
      //   client: {},
      //   user: {}
      // };
      //
      debug('saveToken saved result', result.id);

      return resolve({
        accessToken: result.access_token,
        accessTokenExpiresOn: result.access_token_expires_on,
        clientId: result.client_id,
        client: {
          id: result.client_id
        },
        user: {
          id: result.user_id
        },
        refreshToken: result.refresh_token,
        refreshTokenExpiresOn: result.refresh_token_expires_on,
        userId: result.user_id
      });
    });
  });
}

module.exports.create = create;
module.exports.flagAsDeleted = flagAsDeleted;
module.exports.init = init;
module.exports.list = list;
module.exports.read = read;

module.exports.signUserAsToken = signUserAsToken;
module.exports.getAccessToken = getAccessToken;
module.exports.getAuthorizationCode = getAuthorizationCode;
module.exports.saveAuthorizationCode = saveAuthorizationCode;
module.exports.revokeAuthorizationCode = revokeAuthorizationCode;
module.exports.getClient = getClient;
module.exports.getRefreshToken = getRefreshToken;
module.exports.getTokenFromCode = getTokenFromCode;
module.exports.getUser = getUser;
module.exports.saveToken = saveToken;
module.exports.saveAccessToken = saveToken;
module.exports.validateScope = validateScope;
