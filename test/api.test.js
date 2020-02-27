const test = require("tape");
const { loadFixture, cyclicGenerator } = require("./util");
const createServer = require("../");

test("/ returns one of a fixed value of strings", async t => {
  t.plan(3);

  const generator = () => cyclicGenerator(["foo", "bar"]);
  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture, generator);
  await server.start();

  try {
    // We await each of these because otherwise there's no guarantee on ordering
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

test("/x-static-value returns a static value", async t => {
  t.plan(2);

  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/x-static-value");
    t.equal(resp.statusCode, 200);
    const data = await resp.data();
    t.equal(data, "Hello, world!");
  } catch (e) {
    t.fail(e);
  } finally {
    server.stop();
    t.end();
  }
});

test("/no-200-response will return a HTTP 500 error", async t => {
  // We don't currently support non-200 responses.
  // A HTTP 500 error is probably the best error code because these do not usually end up being exposed in API documents and are by definition unexpected.
  t.plan(2);

  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/no-200-response");
    t.equal(resp.statusCode, 500);
    const data = await resp.data();
    t.equal(
      data.message,
      "could not return a response for /no-200-response because there was no HTTP 200 response given in the specification"
    );
  } catch (e) {
    t.fail(e);
  } finally {
    server.stop();
    t.end();
  }
});
