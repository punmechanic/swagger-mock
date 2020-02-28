const { loadFixture } = require("./util");
const createServer = require("../");

test("responds 404 to paths that do not exist", async () => {
  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/does-not-exist");
    expect(resp.statusCode).toEqual(404);
  } finally {
    server.stop();
  }
});
