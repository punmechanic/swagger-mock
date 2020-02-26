const test = require("tape");
const fs = require("fs");
const util = require("util");
const path = require("path");
const createServer = require("../");

const readFile = util.promisify(fs.readFile);

test("generates strings", async t => {
  t.plan(4);

  function* generator() {
    yield "foo";
    yield "bar";
    yield "baz";
    yield* generator();
  }

  const fixturePath = path.resolve(__dirname, "./doc.yml");
  const fixture = await readFile(fixturePath, { encoding: "ascii" });
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
