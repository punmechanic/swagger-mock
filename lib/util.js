const http = require("http");

/**
 * A generator that infinitely yields undefined
 */
function* emptyGenerator() {
  yield undefined;
  yield* emptyGenerator();
}

function* cyclicGenerator(values) {
  yield* values;
  yield* cyclicGenerator(values);
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

exports.emptyGenerator = emptyGenerator;
exports.cyclicGenerator = cyclicGenerator;
exports.request = request;
