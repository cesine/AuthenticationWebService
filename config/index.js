var fs = require('fs');
var AsToken = require('as-token');

var config = {
  url: 'https://localhost:8010',
  ssl: {
    key: fs.readFileSync(__dirname + '/ssl_debug.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/ssl_debug.crt', 'utf8')
  }
};

AsToken.config.jwt.private = fs.readFileSync(__dirname + '/jwt_debug.pem', 'utf8');

module.exports = config;
