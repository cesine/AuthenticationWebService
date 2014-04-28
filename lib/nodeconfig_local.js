exports.httpsOptions = {
  "key": 'fielddb_debug.key',
  "cert": 'fielddb_debug.crt',
  "port": "3181",
  "host": "localhost",
  "method": 'POST',
  "protocol":'https://'
};
exports.userFriendlyServerName = "Localhost";
exports.servers = {
  localhost: {
    auth: "https://localhost:3182",
    corpus: "https://localhost:6984",
    serverCode: "localhost",
    userFriendlyServerName: "Localhost"
  },
  testing: {
    auth: "https://authdev.example.com",
    corpus: "https://corpusdev.example.com",
    serverCode: "testing",
    userFriendlyServerName: "Example Beta"
  },
  production: {
    auth: "https://auth.example.com",
    corpus: "https://corpus.example.com",
    serverCode: "production",
    userFriendlyServerName: "Example"
  }
};
