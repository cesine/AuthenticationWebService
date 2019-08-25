var publicKey = require('./jwt_debug.pub');

// Include a smaple debugging key for tests
var testPrivateKey = require('./jwt_debug.pem');
var testPublicKey = require('./jwt_debug.pub');

var config = {
  jwt: {
    algorithm: 'RS256',
    prefix: 'v1/',
    public: publicKey
  },
  test: {
    private: testPrivateKey,
    public: testPublicKey
  }
};

module.exports = config;
