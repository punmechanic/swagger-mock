/**
 * A generator that infinitely yields undefined
 */
function* emptyGenerator() {
  yield undefined;
  yield* emptyGenerator();
}

exports.emptyGenerator = emptyGenerator;
