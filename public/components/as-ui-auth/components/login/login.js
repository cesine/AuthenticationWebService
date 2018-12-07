(function(exports, global) {
  'use strict';

  global.fetch = global.fetch || require('node-fetch');

  /**
   * @class The Login Model handles login and logout and
   *        Login locally or remotely.
   *
   * @extends Object
   */
  class Login {

    /**
     * @param {Object} json Serialized json from a previuos app load
     */
    constructor(json) {
      console.log('Constructing Login', json);

      if (json && json.server) {
        Login.server = json.server;
      }
    }

    static login(options) {
      let xhr;
      let opts = {
        method: 'POST',
        'content-type': 'application/json; charset=utf-8',
        body: new FormData(document.getElementById('login'))
      };

      if (!options || !options.username || !options.password) {
        options = {};
        options.username = options.username || document.getElementById('username');
        options.password = options.password || document.getElementById('password');
      }

      if (!options || !options.username || !options.password) {
        throw new Error('Login requires username and password');
      }

      opts.username = options.username;
      opts.password = options.password;

      if (options.server) {
        Login.server = {
          url: options.server
        };
      }

      return global.fetch(Login.server.url + '/authentication/login', opts).then(function(response) {
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

  exports.Login = Login;
})(exports, global);
