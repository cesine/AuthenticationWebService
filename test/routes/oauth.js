var expect = require('chai').expect;

var oauth = require('./../../routes/oauth2');

describe('oauth routes', function () {
  it('should load', function () {
    expect(oauth).to.be.a('object');
    expect(oauth.getAuthorize).to.be.a('object');
    expect(oauth.getToken).to.be.a('object');
    expect(oauth.postAuthorize).to.be.a('object');
    expect(oauth.postToken).to.be.a('object');
  });

  it('should postToken', function () {
    oauth.postToken.action({
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      query: {},
      log: {
        fields: {}
      }
    }, {
      headers: {},
      set: function () {},
      status: function () {
        return this;
      },
      json: function () {
        return this;
      },
      send: function () {
        return this;
      }
    }, function (err, res) {
      expect(true).to.equal(true);
      expect(err).to.equal(undefined);
      expect(res).to.equal(undefined);
    });
  });
});
