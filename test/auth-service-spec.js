'use strict';

var http = require('http'),
  https = require('https');
// https://github.com/Zugwalt/nodeunit-async
//
var palindrode = require('../lib/fielddb-auth.js');

var makeJSONRequest = function(options, data, onResult) {

  var httpOrHttps = http;
  if (options.protocol == 'https://') {
    httpOrHttps = https;
  }
  delete options.protocol;

  var req = httpOrHttps.request(options, function(res) {
    var output = '';
    res.setEncoding('utf8');

    res.on('data', function(chunk) {
      output += chunk;
    });

    res.on('end', function() {
      var obj = JSON.parse(output);
      onResult(res.statusCode, obj);
    });
  });

  req.on('error', function(err) {
    console.log('Error searching for ' + JSON.stringify(data));
    console.log(options);
    console.log(err);
  });

  if (data) {
    req.write(data, 'utf8');
    req.end();
  } else {
    req.end();
  }

};

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/
exports['test'] = {
  'correctly matches palindrome string': function(test) {
    test.expect(1);
    test.ok(palindrode.test('Was it a car or a cat I saw?'));
    test.done();
  },
  'correctly matches non-palindrome strings': function(test) {
    test.expect(1);
    test.equal(palindrode.test('This is not a palindrome'), false);
    test.done();
  },
  'returns false when passed blank strings': function(test) {
    test.expect(1);
    test.equal(palindrode.test(''), false);
    test.done();
  },
  'returns false when passed only punctuation/spaces': function(test) {
    test.expect(1);
    test.equal(palindrode.test(' ?., '), false);
    test.done();
  },
  'returns false when passed non-string values': function(test) {
    test.expect(2);
    test.equal(palindrode.test(1234), false, 'should not accept numbers');
    test.equal(palindrode.test(), false, 'should not accept undefined');
    test.done();
  }
};
