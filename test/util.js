const fs = require("fs");
const util = require("util");
const path = require("path");
const readFile = util.promisify(fs.readFile);

async function loadFixture(name) {
  const fixturePath = path.resolve(__dirname, "./fixtures", name);
  return await readFile(fixturePath, { encoding: "ascii" });
}

function* cyclicGenerator(values) {
  yield* values;
  yield* cyclicGenerator(values);
}

exports.loadFixture = loadFixture;
exports.cyclicGenerator = cyclicGenerator;
