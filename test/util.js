const fs = require("fs");
const util = require("util");
const path = require("path");
const readFile = util.promisify(fs.readFile);

async function loadFixture(name) {
  const fixturePath = path.resolve(__dirname, "./fixtures", name);
  return await readFile(fixturePath, { encoding: "ascii" });
}

exports.loadFixture = loadFixture;
