var expect = require('chai').expect;
var supertest = require('supertest');

var api = require('./../../auth_service');
var user = require('./../../models/user');
var fixtures = {
  user: require('./../fixtures/user.json')
};

describe('/v1/users', function () {
  beforeEach(function (done) {
    user
      .create(fixtures.user, function () {
        done();
      });
  });

  it('should list users', function () {
    return supertest(api)
      .get('/v1/users')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .then(function (res) {
        expect(res.body.length > 0).to.equal(true);

        var sampleUserMask = res.body[0];
        expect(sampleUserMask).to.deep.equal({
          id: sampleUserMask.id,
          gravatar: sampleUserMask.gravatar,
          username: sampleUserMask.username
        });
      });
  });

  it('should get a users details', function () {
    return supertest(api)
      .get('/v1/users/test-anonymouse')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)
      .then(function (res) {
        fixtures.user.createdAt = res.body.createdAt;
        fixtures.user.updatedAt = res.body.updatedAt;
        fixtures.user.revision = res.body.revision;
        fixtures.user.hash = res.body.hash;
        delete fixtures.user.password;

        expect(res.body).to.deep.equal(fixtures.user);
      });
  });
});
