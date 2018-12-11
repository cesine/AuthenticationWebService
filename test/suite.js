var config = require('config');
var expect = require('chai').expect;
var path = require('path');
var replay = require('replay');
var supertest = require('supertest');

var server = require('../bin/www').server;

replay.fixtures = path.join(__dirname, '/fixtures/replay');

before(function setUpService() {
  if (process.env.URL) {
    return;
  }

  // keep the port constant for oauth testing
  var test = supertest(server)
    .get('/v1/healthcheck');

  expect(test.url).to.contain(config.httpsOptions.port)
  process.env.URL = test.url.replace('/v1/healthcheck', '');

  return test
    .expect(200);
});


after(function turnOffService() {
  if (process.env.URL) {
    return;
  }

  return server.close();
});
