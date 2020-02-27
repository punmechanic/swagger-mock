const test = require("tape");
const { expandRef, resolveSpecification } = require("../specification");

test("throws if $ref format cannot be resolved", t => {
  // t.throws does not make it easy to assert on thrown error.
  // Use t.plan(); so we fail if catch branch is not reached.
  t.plan(1);
  try {
    expandRef({}, "#/bits/a");
  } catch (error) {
    t.equal(
      error.message,
      "could not resolve ref #/bits/a - it did not exist in the document"
    );
  }
});

test("should expand $refs inline", t => {
  const rootDoc = {
    bits: {
      a: {
        foo: "bar"
      }
    }
  };

  const resolved = expandRef(rootDoc, "#/bits/a");
  t.equal(resolved, rootDoc.bits.a);
  t.end();
});

test("should expand $refs inline - swagger spec", t => {
  const resolved = resolveSpecification({
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
  });

  t.equal(
    resolved.paths["/"].responses["200"],
    resolved.components.TestFormatResponse
  );

  t.equal(
    resolved.paths["/static"].responses["200"],
    resolved.components.StaticGreetingResponse
  );

  t.end();
});
