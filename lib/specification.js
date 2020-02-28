const yaml = require("js-yaml");

function expandRef(rootDoc, ref) {
  // A valid ref will have a # as the first argument, let's ignore it.
  const path = ref.split("/").splice(1);
  return path.reduce((acc, key) => {
    if (acc === undefined) {
      throw new Error(
        `could not resolve ref ${ref} - it did not exist in the document`
      );
    }

    return acc[key];
  }, rootDoc);
}

function isRef(key) {
  return key === "$ref";
}

function cannotUpdateRootNode() {
  // This will almost certainly never be called except in exceptionally buggy code
  throw new Error("cannot perform an update on the root node of the document");
}

function expandAllRefs(
  rootDoc,
  currentValue = rootDoc,
  update = cannotUpdateRootNode
) {
  // This is definitely a sin
  // Boy, I would hate to find out the performance of this in deeply nested code
  for (const key of Object.keys(currentValue)) {
    const value = currentValue[key];

    if (isRef(key)) {
      update(expandRef(rootDoc, value));
      continue;
    }

    // We do not attempt to resolve values for non-objects.
    if (typeof value !== "object") {
      continue;
    }

    const nextUpdate = nextValue => {
      currentValue[key] = nextValue;
    };

    expandAllRefs(rootDoc, value, nextUpdate);
  }

  return rootDoc;
}

function resolveSpecification(parsedYamlDoc) {
  return expandAllRefs(parsedYamlDoc);
}

function parseSpecificationFromJSON(json) {
  const doc = JSON.parse(json);
  return resolveSpecification(doc);
}

function parseSpecificationFromYAML(yamlString) {
  const doc = yaml.safeLoad(yamlString);
  return resolveSpecification(doc);
}

function parseSpecificationFromFormat(doc, format) {
  switch (format) {
    case "yaml":
      return parseSpecificationFromYAML(doc);
    case "json":
      return parseSpecificationFromJSON(doc);
    default:
      throw new Error(`unsupported format ${format}`);
  }
}

exports.expandRef = expandRef;
exports.resolveSpecification = resolveSpecification;
exports.parseSpecificationFromFormat = parseSpecificationFromFormat;
