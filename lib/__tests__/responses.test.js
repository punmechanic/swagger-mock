const generateResponse = require("../responses");
const { cyclicGenerator } = require("../util");

describe("generateResponse", () => {
  test("x-internal:generated uses provided generator", () => {
    const generator = cyclicGenerator(["foo", "bar"]);
    const spec = {
      type: "string",
      "x-internal:generated": true
    };

    expect(generateResponse(spec, generator)).toEqual("foo");
    expect(generateResponse(spec, generator)).toEqual("bar");
    expect(generateResponse(spec, generator)).toEqual("foo");
    expect(generateResponse(spec, generator)).toEqual("bar");
  });

  test("x-static-value returns provided static value", () => {
    const spec = {
      type: "string",
      "x-static-value": "Hello, world!"
    };

    expect(generateResponse(spec)).toEqual("Hello, world!");
  });

  test("defaults to zero value of type if no expanded response possible", () => {
    const TYPE_STRING = { type: "string" };
    const TYPE_NUMBER = { type: "number" };
    const TYPE_BOOL = { type: "boolean" };
    const TYPE_ARRAY = { type: "array" };
    const TYPE_OBJECT = { type: "object" };
    const TYPE_INTEGER = { type: "integer" };
    const TYPE_UNKNOWN = { type: "foobarbaz" };

    expect(generateResponse(TYPE_STRING)).toEqual("");
    expect(generateResponse(TYPE_NUMBER)).toEqual(0);
    expect(generateResponse(TYPE_BOOL)).toEqual(false);
    expect(generateResponse(TYPE_INTEGER)).toEqual(0);
    expect(generateResponse(TYPE_ARRAY)).toEqual([]);
    expect(generateResponse(TYPE_OBJECT)).toEqual({});
    expect(() => generateResponse(TYPE_UNKNOWN)).toThrow(
      "foobarbaz is not a valid schema type"
    );
  });

  test("throws an error if using union types", () => {
    // Not going to support these yet.
    const unionTypes = ["oneOf", "anyOf", "allOf"];

    unionTypes.forEach(keyword => {
      const spec = {
        type: {
          [keyword]: []
        }
      };

      expect(() => generateResponse(spec)).toThrow(
        "union types are not supported"
      );
    });
  });
});
