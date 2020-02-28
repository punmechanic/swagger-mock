const { loadFixture } = require("./util");
const cyclicGenerator = require("../util");
const createServer = require("../");

test("/ returns one of a fixed value of strings", async () => {
  const generator = () => cyclicGenerator(["foo", "bar"]);
  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture, generator);
  await server.start();

  try {
    // We await each of these because otherwise there's no guarantee on ordering
    const first = await server.request("/");
    const second = await server.request("/");
    const third = await server.request("/");

    expect(await first.data()).toEqual("foo");
    expect(await second.data()).toEqual("bar");
    expect(await third.data()).toEqual("foo");
  } finally {
    server.stop();
  }
});

test("/x-static-value returns a static value", async () => {
  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/x-static-value");
    expect(resp.statusCode).toEqual(200);
    expect(await resp.data()).toEqual("Hello, world!");
  } finally {
    server.stop();
  }
});

test("/no-200-response will return a HTTP 500 error", async () => {
  // We don't currently support non-200 responses.
  // A HTTP 500 error is probably the best error code because these do not usually end up being exposed in API documents and are by definition unexpected.
  const fixture = await loadFixture("doc-1.yml");
  const server = createServer(fixture);
  await server.start();

  try {
    const resp = await server.request("/no-200-response");
    expect(resp.statusCode).toEqual(500);
    const data = await resp.data();
    expect(data.message).toEqual(
      "could not return a response for /no-200-response because there was no HTTP 200 response given in the specification"
    );
  } finally {
    server.stop();
  }
});
