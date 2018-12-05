'use strict';
var expect = require('chai').expect;

process.env.NODE_ENV = 'localhost';
var service = require('../auth_service');

describe('service', function() {
  it('should load', function() {
    expect(process.env.NODE_ENV).to.equal('localhost');
    expect(service).to.not.equal(undefined);
  });

  it('should be an express app', function() {
    expect(typeof service.listen).to.equal("function");
  });
});