var httpsOptions = {
  "key": 'fielddb_debug.key',
  "cert": 'fielddb_debug.crt',
  "port": "3183",
  "protocol": 'https://'
};
exports.usersDbConnection = {
  "protocol": 'http://',
  "domain": 'localhost',
  "port": '5984',
  "dbname": 'zfielddbuserscouch',
  "path": ""
};
exports.httpsOptions = httpsOptions;
exports.externalOrigin = "https://localhost:" + httpsOptions.port;
exports.userFriendlyServerName = "Localhost";
exports.servers = {
  localhost: {
    auth: "https://localhost:3183",
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

exports.apps = {
  example: {
    brand: 'Example',
    brandLowerCase: 'example',
    website: 'http://example.org',
    faq: 'http://app.example.org/#/faq',
    tagline: 'A Free Tool for Creating and Maintaining a Shared Database For Communities, Linguists and Language Learners',
    sampleUsers: ["lingllama", "teammatetiger"],
    sampleCorpus: "lingllama-communitycorpus"
  },
  dislexdisorth: {
    brand: 'DyslexDisorth',
    brandLowerCase: 'dislexdisorth',
    website: 'http://get.dislexdisorth.ca',
    faq: 'http://get.dislexdisorth.ca/faq',
    tagline: 'Prédiction des Habiletés Orthographiques Par des Habiletés Langage Oral',
    sampleUsers: ["alakazou","valeriebilleentete"],
    sampleCorpus: "walkervilleprimare-dislexdisorth"//"poudlardprimaire-dislexdisorth"  //Walkerville  for magic bus, hogwarts in french http://fr.wikipedia.org/wiki/Poudlard École internationale de Montréal (primaire)
  },
  learnx: {
    brand: 'Learn X',
    brandLowerCase: 'learnx',
    website: 'http://example.org',
    faq: 'http://app.example.org/#/faq',
    tagline: 'A Free Tool for Creating and Maintaining a Shared Database For Communities, Linguists and Language Learners',
    sampleUsers: ["lingllama", "teammatetiger"],
    sampleCorpus: "lingllama-communitycorpus"
  }
};
exports.apps.production = exports.apps.example;
