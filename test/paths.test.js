const test = require("tape");
const { loadFixture } = require("./util");
const createServer = require("../");

test("responds 404 to paths that do not exist", async t => {
  t.plan(1);

  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/does-not-exist");
    t.equal(resp.statusCode, 404);
  } catch (e) {
    t.fail(e);
  } finally {
    server.stop();
    t.end();
  }
});
