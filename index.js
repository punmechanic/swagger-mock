const http = require("http");
const url = require("url");
const express = require("express");
const yaml = require("js-yaml");
const resolveSpecification = require("./specification").resolveSpecification;

function request(uri) {
  return new Promise((resolve, reject) => {
    const req = http.request(uri);
    const buffers = [];

    req.on("response", response => {
      const body = new Promise(resolve => {
        response.on("data", data => buffers.push(data));
        response.on("end", () => {
          const buffer = Buffer.concat(buffers);
          resolve(buffer);
        });
      });

      const resp = {
        ...response,
        async data() {
          const blob = await body;
          return JSON.parse(blob.toString("ascii"));
        }
      };

      resolve(resp);
    });

    req.on("error", reject);
    req.end();
  });
}

class MockSwaggerServer {
  constructor(handler) {
    this._handler = handler;
  }

  start() {
    const handle = http.createServer(this._handler);
    return new Promise((resolve, reject) => {
      handle.once("error", reject);
      handle.once("listening", () => {
        this._handle = handle;
        resolve();
      });
      handle.listen(0, "127.0.0.1");
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

function generateHandler(_spec, valueGenerator) {
  const generator = valueGenerator();
  const app = express();

  app.get("/", (_req, res) => {
    const nextValue = generator.next().value;
    res.write(JSON.stringify(nextValue));
    res.end();
  });

  app.use((_req, res, _next) => {
    res.writeHead(404);
    res.end();
  });

  return app;
}

function* emptyGenerator() {
  yield undefined;
  yield* emptyGenerator();
}

function createServer(yamlDocString, valueGenerator = emptyGenerator) {
  const parsed = yaml.safeLoad(yamlDocString);
  const specification = resolveSpecification(parsed);
  const handler = generateHandler(specification, valueGenerator);
  return new MockSwaggerServer(handler);
}

// I'm not a fan of CommonJS exports but tape cli doesn't let us use ES6 ones.
module.exports = createServer;
module.exports.resolveSpecification = resolveSpecification;
