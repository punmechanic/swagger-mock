const http = require("http");
const url = require("url");
const express = require("express");

function request(uri) {
  return new Promise((resolve, reject) => {
    const req = http.request(uri);
    const buffers = [];

    req.on("response", response => {
      response.on("data", data => buffers.push(data));
      response.on("end", () => {
        const buffer = Buffer.concat(buffers);
        const str = buffer.toString("ascii");
        try {
          const json = JSON.parse(str);
          resolve(json);
        } catch (error) {
          return reject(error);
        }
      });
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
      path
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
  return app;
}

module.exports = function createServer(specification, valueGenerator) {
  const handler = generateHandler(specification, valueGenerator);
  return new MockSwaggerServer(handler);
};
