const http = require("http");
const url = require("url");
const express = require("express");
const yaml = require("js-yaml");
const { resolveSpecification } = require("./specification");
const generateResponse = require("./responses");
const { emptyGenerator, request } = require("./util");

class MockSwaggerServer {
  constructor(handler) {
    this._handler = handler;
  }

  start(port = 0, bindAddress = "127.0.0.1") {
    const handle = http.createServer(this._handler);
    return new Promise((resolve, reject) => {
      handle.once("error", reject);
      handle.once("listening", () => {
        this._handle = handle;
        resolve();
      });

      handle.listen(port, bindAddress);
    });
  }

  request(path) {
    if (this._handle === undefined) {
      return Promise.reject();
    }

    const addr = this._handle.address();
    const uri = url.format({
      protocol: "http",
      hostname: addr.address,
      port: addr.port,
      pathname: path
    });

    return request(uri);
  }

  stop() {
    if (this._handle === undefined) {
      return;
    }

    this._handle.close();
  }
}

function generateMiddleware(pattern, spec, generator) {
  // Generating an express app for all of these is probably quite wasteful, but it certainly works for an MVP
  const route = express();

  // We will also need to configure methods. The swagger spec gives the ability for you to use other verbs.
  route.get(pattern, (req, res) => {
    // By default, let's just assume we are always going to return a HTTP 200 response
    if ("200" in spec.responses === false) {
      // TODO: Utilize the next() parameter instead of this
      const payload = {
        message: `could not return a response for ${req.url} because there was no HTTP 200 response given in the specification`
      };
      const jsonified = JSON.stringify(payload);
      res.statusCode = 500;
      res.write(jsonified);
      res.end();
      return;
    }

    const responseSpec = spec.responses["200"];
    const data = generateResponse(responseSpec, generator);
    const jsonified = JSON.stringify(data);
    res.write(jsonified);
    res.end();
  });

  return route;
}

function generateHandler(spec, valueGenerator) {
  // Only one generator for now, which is obviously incorrect, but it should probably be app-wide.
  const generator = valueGenerator();
  const app = express();

  const patterns = Object.keys(spec.paths);
  const middlewares = patterns.map(pattern =>
    generateMiddleware(pattern, spec.paths[pattern], generator)
  );

  if (middlewares.length === 0) {
    throw new Error("there were no paths in your swagger spec");
  }

  app.use(...middlewares);
  app.use((_req, res, _next) => {
    res.writeHead(404);
    res.end();
  });

  return app;
}

function createServer(yamlDocString, valueGenerator = emptyGenerator) {
  const parsed = yaml.safeLoad(yamlDocString);
  const specification = resolveSpecification(parsed);
  const handler = generateHandler(specification, valueGenerator);
  return new MockSwaggerServer(handler);
}

exports.createServer = createServer;
