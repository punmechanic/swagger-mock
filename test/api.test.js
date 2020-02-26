const test = require("tape");
const loadFixture = require("./util").loadFixture;
const createServer = require("../");

test("generates strings", async t => {
  t.plan(3);

  function* generator() {
    yield "foo";
    yield "bar";
    yield* generator();
  }

  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture, generator);
  await server.start();

  try {
    const first = await server.request("/");
    const second = await server.request("/");
    const third = await server.request("/");

    t.equal(await first.data(), "foo");
    t.equal(await second.data(), "bar");
    t.equal(await third.data(), "foo");
  } catch (e) {
    t.fail(e);
  } finally {
    server.stop();
    t.end();
  }
});
