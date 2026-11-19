const express = require('express');
const path = require('path');
const Fetchr = require('../../libs/fetcher');
const { itemsService } = require('./resources/item');
const { errorsService } = require('./resources/error');
const { headersService } = require('./resources/headers');
const { alwaysSlowService } = require('./resources/alwaysSlow');
const { slowThenFastService } = require('./resources/slowThenFast');

Fetchr.registerService(itemsService);
Fetchr.registerService(errorsService);
Fetchr.registerService(headersService);
Fetchr.registerService(alwaysSlowService);
Fetchr.registerService(slowThenFastService);

const app = express();

app.use(express.json());

app.use('/static', express.static(path.join(__dirname, 'static')));

// Simulates a slow network: the response headers arrive right away,
// but the JSON body never finishes downloading. Used as xhrPath to
// test aborts that happen while the client reads the response body.
app.use('/stalled-body', (req, res) => {
    res.status(200).type('json');
    res.flushHeaders();
    res.write('{"data":');
    const timer = setTimeout(() => res.end('null}'), 5000);
    req.on('close', () => clearTimeout(timer));
});

app.use('/api', Fetchr.middleware(), (err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message });
});

app.get('/', (req, res) => {
    res.send(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <script src="/static/fetchr.umd.js"></script>
  </body>
</html>
`);
});

app.use(function (req, res) {
    res.status(404).send({ error: 'page not found' });
});

module.exports = app;
