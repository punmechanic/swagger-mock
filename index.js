const yargs = require("yargs");
const fs = require("fs").promises;
const path = require("path");
const { createServer, cyclicGenerator } = require("./lib");

yargs
  .number("port")
  .string("host")
  .string("specification")
  .describe(
    "specification",
    "The path to the YAML specification file for your Swagger API"
  )
  .demandOption(["port", "host", "specification"]);

const argv = yargs.argv;

async function main(port, host, specification) {
  const spec = await fs.readFile(path.resolve(process.cwd(), specification));

  const placeholderGenerator = cyclicGenerator(["foo", "bar", "baz"]);
  const server = createServer(
    spec.toString("ascii"),
    () => placeholderGenerator
  );
  server.start(port, host);
}

main(argv.port, argv.host, argv.specification);
