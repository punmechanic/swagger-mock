const path = require("path");
const { promises: fs } = require("fs");
const { createServer, parseSpecificationFromFormat } = require("../lib");

let server;

beforeAll(async done => {
  const doc = await fs.readFile(
    path.resolve(__dirname, "../examples/petstore.json"),
    { encoding: "ascii" }
  );

  const spec = parseSpecificationFromFormat(doc, "json");
  server = createServer(await spec);
  await server.start();
  done();
});

afterAll(() => {
  server.stop();
});

describe("/store/inventory", () => {
  it("responds with a list of pets", async () => {
    const response = await server.request("/store/inventory");
    expect(response.statusCode).toEqual(200);
    const data = await response.data();
    expect(data).toEqual({});
  });
});
