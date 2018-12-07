'use strict';

var expect = require('chai').expect;

var service = require('../service');

describe('service', function() {
  it('should load', function() {
    expect(service).to.be.a('function');
  });
});
