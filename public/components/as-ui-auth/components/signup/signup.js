(function(exports, global) {

  global.fetch = global.fetch || require('node-fetch');

  /**
   * @class The Signupentication Model handles login and logout and
   *        authentication locally or remotely.
   *
   * @extends Object
   */
  class Signup {

    /**
     * @param {Object} json Serialized json from a previuos app load
     */
    constructor(json) {
      console.log('Constructing auth', json);

      if (json && json.server) {
        Signup.server = json.server;
      }
    }

    static signup(options) {
      let xhr;
      let opts = {
        method: 'POST'
      };

      if (!options || !options.username || !options.password) {
        throw new Error('Login requires username and password');
      }

      if (options.password !== options.confirmPassword) {
        throw new Error('Passwords don\'t match, try again.');
      }

      opts.username = options.username;
      opts.password = options.password;

      if (options.server) {
        Signup.server = {
          url: options.server
        };
      }

      return global.fetch(Signup.server.url + '/authentication/register', opts).then(function(response) {
        xhr = response;
        return response.json();
      }).then(function(data) {
        if (xhr.status >= 400) {
          data.status = xhr.status;
          data.statusText = xhr.statusText;
          data.url = xhr.url;
          throw data;
        }

        if (data) {
          return data;
        }
      });
    }
  }

  exports.Signup = Signup;
})(exports, global);
