var expect = require('chai').expect;

var user = require('./../../routes/user');

describe('routes/user', function () {
  it('should load', function () {
    expect(user).to.be.a('object');
    expect(user.getUser).to.be.a('object');
    expect(user.getList).to.be.a('object');
  });
});
