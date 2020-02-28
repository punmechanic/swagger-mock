const yargs = require("yargs");
const fs = require("fs").promises;
const path = require("path");
const {
  createServer,
  cyclicGenerator,
  parseSpecificationFromFormat
} = require("./lib");

yargs
  .number("port")
  .default("port", 8080)
  .string("host")
  .default("host", "127.0.0.1")
  .string("specification")
  .string("format")
  .choices("format", ["json", "yaml"])
  .describe(
    "format",
    "The format of the specification file; swagger-mock will try to guess this based on the extension of the filename if this flag is not specified"
  )
  .describe(
    "specification",
    "The path to the YAML specification file for your Swagger API"
  )
  .demandOption(["specification"]);

const argv = yargs.argv;

function tryGuessFormat(specificationPath, format) {
  if (format !== undefined) {
    return format;
  }

  const extname = path.extname(specificationPath).replace(".", "");
  switch (extname) {
    case "yml":
    case "yaml":
      return "yaml";
    case "json":
      return "json";
    default:
      return extname;
  }
}

async function main(port, host, specification, formatOverride) {
  const specPath = path.resolve(process.cwd(), specification);
  const format = tryGuessFormat(specPath, formatOverride);
  const doc = await fs.readFile(specPath, { encoding: "ascii" });
  const spec = parseSpecificationFromFormat(doc, format);
  const placeholderGenerator = () => cyclicGenerator(["foo", "bar", "baz"]);
  const server = createServer(spec, placeholderGenerator);
  server.start(port, host);
}

main(argv.port, argv.host, argv.specification, argv.format).catch(error => {
  console.error(error);
  process.exit(1);
});
