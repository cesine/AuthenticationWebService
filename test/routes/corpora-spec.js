var AuthWebService = require('./../../auth_service').AuthWebService;
var CORS = require("fielddb/api/CORSNode").CORS;
var maxSpecTime = 5000;

var SERVER = "https://localhost:3183";
if (process.env.NODE_DEPLOY_TARGET === "production") {
  SERVER = "http://localhost:3183";
}

describe("Corpus REST API", function() {

  it("should load", function() {
    expect(AuthWebService).toBeDefined();
  });

  describe("delete", function() {

    it("should accept no options", function(done) {

      CORS.makeCORSRequest({
        url: SERVER + '/corpora/testingprototype-testdeletecorpus',
        method: 'DELETE',
        dataType: 'json',
        data: {
          username: 'testingprototype',
          password: 'test'
        }
      }).then(function(response) {
        expect(response).toBeDefined();
        return response;
      }, function(reason) {
        console.log(reason);
        expect(reason).toBeUndefined();
        return reason;
      }).fail(function(error) {
        console.log(error);
        expect(excpetion).toBeUndefined();
        return error;
      }).done(done);

    }, maxSpecTime);

  });
});
