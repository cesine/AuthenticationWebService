'use strict';

process.env.NODE_ENV = 'localhost';
var service = require('../auth_service');

describe('service', function() {
  it('should load', function() {
    expect(process.env.NODE_ENV).toEqual('localhost');
    expect(service).toBeDefined();
  });

  it('should be an express app', function() {
    expect(typeof service.listen).toEqual("function");
  });
});
