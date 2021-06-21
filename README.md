[![Build Status][travis-image]][travis-url]
[![Coverage Status][coverage-image]][coverage-url]

# fieldb-auth

Authentication web services for FieldDB

## Getting Started
Install the module with: `npm install fieldb-auth`

```javascript
var fieldb_auth = require('fieldb-auth');
```

## Documentation & Dev Sandbox
* https://authdev.fielddb.org

## Examples
* https://authdev.fielddb.org

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using the scipts in package.json.

### Recording tests

Edit your /etc/hosts to add an entry for example.org:

```bash
127.0.0.1       localhost
127.0.0.1       corpusdev.example.org
```

Turn on your local couchdb and make sure it is running on http://127.0.0.1:5984/_utils Record tests by adding `.only` on the tests you wish to record:

```bash
$ DEBUG=*user*,*nock*,*replay* REPLAY=record npm test
```

As a result you should see a directory corresponding to the server, and files with-in it representing the requests:

```bash
$ tree test/fixtures/
test/fixtures/
└── corpusdev.example.org-5984
    └── 154417467505825257
```

## End to End Testing

Docker Boilerplate base on git@github.com:Producters/docker-node-react-starter.git empty backend and frontend application

### get started

Get latest docker (1.11+) & docker-compose (1.7+):
https://www.docker.com/
https://docs.docker.com/compose/

Pull seed to your project:

```sh
git init
git remote add starter git@github.com:hugominas/APINodeCouchDBContainer.git
git pull starter master
```

Start dev server:
```sh
./bin/develop.sh
```
Wait for docker to set up dev env, then open [http://localhost:8000](http://localhost:8000)

### production mode

```sh
# build production images, create db backup & start
./bin/deploy.sh

# stop server
./bin/stop_production.sh

# start srever
./bin/start_production.sh
```

In prod mode sources are added to docker image rather than mounted from host. Nginx serves static files, proxy pass to node for app. Logs in `logs` dir.

#### enable ssl
Copy your .key and .crt files to `nginx/ssl` and run `./bin/deploy.sh`.

## install dependencies

```sh
# auth-service
./bin/npm_auth-service.sh install [package] --save
```

## Release History
* v1.16  mongoose auth & everyauth
* v1.32  switched to couchdb
* v1.62  gravatars
* v1.72  server side support for user creation for spreadsheet (without the offline prototype)
* v1.102 support for Learn X users
* v2.12.0 support for psycholinguistics dashboard users and branded emails depending on the client side
* v2.44.22 updated architecture from nodejs 0.6 to 0.12 to build consitent api for v2


## License
Licensed under the Apache, 2.0 licenses.


[travis-image]: https://travis-ci.org/FieldDB/AuthenticationWebService.svg?branch=master
[travis-url]: https://travis-ci.org/FieldDB/AuthenticationWebService
[coverage-image]: https://coveralls.io/repos/github/FieldDB/AuthenticationWebService/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/FieldDB/AuthenticationWebService?branch=master
