const test = require("tape");
const http = require("http");
const util = require("util");
const url = require("url");

const doc = {
  swagger: "2.0",
  paths: {
    "/": {
      responses: {
        200: {
          type: "string",
          "x-format": "testformat"
        }
      }
    }
  }
};

class TestServer {
  constructor(specification, valueGenerator) {
    this._valueGenerator = valueGenerator();
    this._specification = specification;
  }

  /**
   * @param {http.IncomingMessage} request
   * @param {http.ServerResponse} response
   * @private
   */
  _requestHandler(_request, response) {
    const { value } = this._valueGenerator.next();
    response.write(JSON.stringify(value));
    response.end();
  }

  start() {
    const handler = this._requestHandler.bind(this);
    const handle = http.createServer(handler);
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

  stop() {
    if (this._handle === undefined) {
      return;
    }

    this._handle.close();
  }
}

test("generates strings", async t => {
  t.plan(4);

  function* generator() {
    yield "foo";
    yield "bar";
    yield "baz";
    yield* generator();
  }

  const server = new TestServer(doc, generator);
  await server.start();
  try {
    const first = await server.request("/");
    const second = await server.request("/");
    const third = await server.request("/");
    const fourth = await server.request("/");

    t.equal(first, "foo");
    t.equal(second, "bar");
    t.equal(third, "baz");
    t.equal(fourth, "foo");
  } catch (e) {
    t.fail(e);
  } finally {
    server.stop();
    t.end();
  }
});
