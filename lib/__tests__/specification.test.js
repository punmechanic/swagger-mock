const { expandRef, resolveSpecification } = require("../specification");

describe("expandRef()", () => {
  test("throws if $ref format cannot be resolved", () => {
    expect(() => expandRef({}, "#/bits/a")).toThrow(
      "could not resolve ref #/bits/a - it did not exist in the document"
    );
  });

  test("should expand $refs inline", () => {
    const rootDoc = {
      bits: {
        a: {
          foo: "bar"
        }
      }
    };

    expect(expandRef(rootDoc, "#/bits/a")).toEqual(rootDoc.bits.a);
  });
});

describe("resolveSpecification()", () => {
  test("should expand $refs inline - swagger spec", () => {
    const spec = {
      swagger: "2.0",
      paths: {
        "/": {
          responses: {
            200: {
              $ref: "#/components/TestFormatResponse"
            }
          }
        },
        "/static": {
          responses: {
            200: {
              $ref: "#/components/StaticGreetingResponse"
            }
          }
        }
      },
      components: {
        TestFormatResponse: {
          type: "string",
          "x-internal:generated": true
        },
        StaticGreetingResponse: {
          type: "string",
          "x-static-value": "Hello, world!"
        }
      }
    };

    const resolved = resolveSpecification(spec);
    expect(resolved.paths["/"].responses["200"]).toEqual(
      resolved.components.TestFormatResponse
    );

    expect(resolved.paths["/static"].responses["200"]).toEqual(
      resolved.components.StaticGreetingResponse
    );
  });
});
