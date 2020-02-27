const http = require("http");
const url = require("url");
const express = require("express");
const yaml = require("js-yaml");
const { resolveSpecification } = require("./specification");
const { emptyGenerator } = require("./util");
const warning = require("warning");

const TEST = process.env.NODE_ENV === "test";

function warnIfNotInTest(format, ...args) {
  warning(!TEST, format, ...args);
}

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

// We definitely need a new prefix, x- is used by a lot of things
const SPEC_PREFIX = "x-";
const UNION_TYPES = new Set(["anyOf", "allOf", "oneOf"]);

function isUnionType(typeSpec) {
  if (typeof typeSpec !== "object") {
    return false;
  }

  const keys = Object.keys(typeSpec);
  return keys.some(key => UNION_TYPES.has(key));
}

function generateResponse(spec, generator = emptyGenerator) {
  if (isUnionType(spec.type)) {
    throw new Error("union types are not supported");
  }

  const expansionProps = Object.keys(spec)
    .filter(key => key.startsWith(SPEC_PREFIX))
    .map(key => [key.replace(SPEC_PREFIX, ""), spec[key]]);

  if (expansionProps.length === 0) {
    // No expansion props, let's fall back to the type
    switch (spec.type) {
      case "string":
        return "";
      case "array":
        return [];
      case "number":
      case "integer":
        return 0;
      case "object":
        return {};
      case "boolean":
        return false;
      default:
        throw new Error(`${spec.type} is not a valid schema type`);
    }
  }

  // TODO: How do we deal with users specifying multiple expansion props per key?
  // I think we just take the first one. :D
  const [name, value] = expansionProps[0];
  if (name.startsWith("internal:")) {
    warnIfNotInTest(
      "you should not be using internal:* flags outside of tests"
    );
  }

  switch (name) {
    case "static-value":
      return value;

    case "internal:generated":
      return generator.next().value;
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

// I'm not a fan of CommonJS exports but tape cli doesn't let us use ES6 ones.
module.exports = createServer;
module.exports.resolveSpecification = resolveSpecification;
module.exports.emptyGenerator = emptyGenerator;
module.exports.generateResponse = generateResponse;
