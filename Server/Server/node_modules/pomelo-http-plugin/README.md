pomelo-http-plugin
==================

Wrap express module as pomelo http plugin.


[wiki][]
[wiki]: https://github.com/pipi32167/pomelo-http-plugin/wiki

###How to use pomelo-http-plugin:

###Single server

For example, your http server name is gamehttp.

#####1. Create config/http.json, configure your http server
```js
{
  "development": {
    "gamehttp": {
      "host": "127.0.0.1",
      "port": 3001
    }
  }
}
```
If you want to support https, you should add more keys to config/http.json
```js
{
  "development": {
    "gamehttp": {
      "useSSL": true,
      "keyFile": "config/key.pem",
      "certFile": "config/cert.pem",
      "host": "127.0.0.1",
      "port": 3001
    }
  }
}
```
#####2. Change servers.json, add gamehttp config
```js
"gamehttp": [{
  "id": "gamehttp",
  "port": 3002,
  "host": "127.0.0.1"
}]
```
#####3. Change adminServer.json, add server type config
```js
{
  "type": "gamehttp",
  "token": "agarxhqb98rpajloaxn34ga8xrunpagkjwlaw3ruxnpaagl29w4rxn"
}
```
#####4. Change app.js
```js
var httpPlugin = require('pomelo-http-plugin');
var path = require('path');
app.configure('development', 'gamehttp', function() {
  app.loadConfig('httpConfig', path.join(app.getBase(), 'config/http.json'));
  app.use(httpPlugin, {
    http: app.get('httpConfig')[app.getServerId()]
  });
});
```
#####5. Create app/servers/gamehttp/route/testRoute.js
```js
module.exports = function(app, http) {

  http.get('/test', function(req, res) {
    res.send('test success')
  });
};
```
#####6. Run your app and open url http://127.0.0.1:3001/test

###Server cluster

This example, we configure our http server as a server cluster, just have a little difference with the before example.

#####1. Create config/http.json, configure your http server
```js
{
  "development": {
    "gamehttp": {
      "isCluster": true,
      "host": "127.0.0.1",
      "port": "3001++"
    }
  }
}
```
If you want to support https, you should add more keys to config/http.json
```js
{
  "development": {
    "gamehttp": {
      "useSSL": true,
      "keyFile": "config/key.pem",
      "certFile": "config/cert.pem",
      "isCluster": true,
      "host": "127.0.0.1",
      "port": "3001++"
    }
  }
}
```
#####2. Change servers.json, add gamehttp config
```js
"gamehttp": [{
  "id": "gamehttp",
  "clusterCount": 2,
  "port": "3101++",
  "host": "127.0.0.1"
}]
```
#####3. Change adminServer.json, add server type config
```js
{
  "type": "gamehttp",
  "token": "agarxhqb98rpajloaxn34ga8xrunpagkjwlaw3ruxnpaagl29w4rxn"
}
```
#####4. Change app.js
```js
var httpPlugin = require('pomelo-http-plugin');
var path = require('path');

app.configure('development', 'gamehttp', function() {
  app.loadConfig('httpConfig', path.join(app.getBase(), 'config/http.json'));
  app.use(httpPlugin, {
    http: app.get('httpConfig')[app.getServerType()]
  });
});
```
#####5. Create app/servers/gamehttp/route/testRoute.js
```js
module.exports = function(app, http) {

  http.get('/test', function(req, res) {
    res.send('test success')
  });
};
```
#####6. Run your app and open urls: http://127.0.0.1:3001/test, http://127.0.0.1:3002/test
#####7. Optional, you can use nginx or any other similar program to reverse proxy the http port, just google it!


## License

The MIT License (MIT)

Copyright (c) 2014 pipi32167

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.