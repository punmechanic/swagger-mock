const test = require("tape");
const generateResponse = require("../responses");
const { cyclicGenerator } = require("./util");

test("x-internal:generated uses provided generator", t => {
  const generator = cyclicGenerator(["foo", "bar"]);
  const spec = {
    type: "string",
    "x-internal:generated": true
  };

  t.equal(generateResponse(spec, generator), "foo");
  t.equal(generateResponse(spec, generator), "bar");
  t.equal(generateResponse(spec, generator), "foo");
  t.equal(generateResponse(spec, generator), "bar");
  t.end();
});

test("x-static-value returns provided static value", t => {
  const spec = {
    type: "string",
    "x-static-value": "Hello, world!"
  };

  const response = generateResponse(spec);
  t.equal(response, "Hello, world!");
  t.end();
});

test("defaults to zero value of type if no expanded response possible", t => {
  const TYPE_STRING = { type: "string" };
  const TYPE_NUMBER = { type: "number" };
  const TYPE_BOOL = { type: "boolean" };
  const TYPE_ARRAY = { type: "array" };
  const TYPE_OBJECT = { type: "object" };
  const TYPE_INTEGER = { type: "integer" };
  const TYPE_UNKNOWN = { type: "foobarbaz" };

  t.equal(generateResponse(TYPE_STRING), "");
  t.equal(generateResponse(TYPE_NUMBER), 0);
  t.equal(generateResponse(TYPE_BOOL), false);
  t.equal(generateResponse(TYPE_INTEGER), 0);
  t.deepEqual(generateResponse(TYPE_ARRAY), []);
  t.deepEqual(generateResponse(TYPE_OBJECT), {});
  t.throws(
    () => generateResponse(TYPE_UNKNOWN),
    new Error("foobarbaz is not a valid schema type")
  );
  t.end();
});

test("throws an error if using union types", t => {
  // Not going to support these yet.
  const unionTypes = ["oneOf", "anyOf", "allOf"];

  unionTypes.forEach(keyword => {
    const spec = {
      type: {
        [keyword]: []
      }
    };

    t.throws(
      () => generateResponse(spec),
      new Error("union types are not supported")
    );
  });

  t.end();
});
