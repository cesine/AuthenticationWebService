module.exports = {
  'httpsOptions': {
    'key': 'fielddb_debug.key',
    'cert': 'fielddb_debug.crt',
    'port': '3183',
    'domain': 'localhost',
    'method': 'POST'
  },
  'usersDbConnection': {
    'protocol': 'https://',
    'domain': 'localhost',
    'port': '6984',
    'dbname': 'zfielddbuserscouch',
    'path': ''
  },
  'usersDBExternalDomainName': 'localhost',
  'logger': {
    'api': '../logs/auth.log',
    'exception': '../logs/authexceptions.log'
  }
};
