var config = require('./config');
var jsonwebtoken = require('jsonwebtoken');

var AsToken = {
  config: config,
  jsonwebtoken: jsonwebtoken,
  sign: function(json, expiresIn) {
    if (!json) {
      throw new Error('Cannot sign empty value');
    }

    return this.config.jwt.prefix + jsonwebtoken.sign(json, this.config.jwt.private, {
      algorithm: this.config.jwt.algorithm,
      expiresIn: expiresIn === undefined ? 60 : expiresIn // minutes
    });
  },
  verify: function(token) {
    token = token.replace(/bearer +/i, '');
    token = token.replace(this.config.jwt.prefix, '');

    return jsonwebtoken.verify(token, this.config.test.public, {
      algorithm: this.config.jwt.algorithm
    });
  },
  decode: function(token) {
    token = token.replace(/bearer +/i, '');
    token = token.replace(this.config.jwt.prefix, '');

    return jsonwebtoken.decode(token, this.config.test.public, {
      algorithm: this.config.jwt.algorithm
    });
  }
};

module.exports = AsToken;
