const test = require("tape");
const loadFixture = require("./util").loadFixture;
const createServer = require("../");

test("generates strings", async t => {
  t.plan(4);

  function* generator() {
    yield "foo";
    yield "bar";
    yield "baz";
    yield* generator();
  }

  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture, generator);
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
