const warning = require("warning");
const { emptyGenerator } = require("./util");

const TEST = process.env.NODE_ENV === "test";

function warnIfNotInTest(format, ...args) {
  warning(!TEST, format, ...args);
}

// We definitely need a new prefix, x- is used by a lot of things
const SPEC_PREFIX = "x-";
const UNION_TYPES = new Set(["anyOf", "allOf", "oneOf"]);

function isUnionType(typeSpec) {
  if (typeof typeSpec !== "object") {
    return false;
  }

  const keys = Object.keys(typeSpec);
  return keys.some(key => UNION_TYPES.has(key));
}

function generateResponse(spec, generator = emptyGenerator) {
  if (isUnionType(spec.type)) {
    throw new Error("union types are not supported");
  }

  const expansionProps = Object.keys(spec)
    .filter(key => key.startsWith(SPEC_PREFIX))
    .map(key => [key.replace(SPEC_PREFIX, ""), spec[key]]);

  if (expansionProps.length === 0) {
    // No expansion props, let's fall back to the type
    switch (spec.type) {
      case "string":
        return "";
      case "array":
        return [];
      case "number":
      case "integer":
        return 0;
      case "object":
        return {};
      case "boolean":
        return false;
      default:
        throw new Error(`${spec.type} is not a valid schema type`);
    }
  }

  // TODO: How do we deal with users specifying multiple expansion props per key?
  // I think we just take the first one. :D
  const [name, value] = expansionProps[0];
  if (name.startsWith("internal:")) {
    warnIfNotInTest(
      "you should not be using internal:* flags outside of tests"
    );
  }

  switch (name) {
    case "static-value":
      return value;

    case "internal:generated":
      return generator.next().value;
  }
}

module.exports = generateResponse;
