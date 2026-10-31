import test from "node:test";
import assert from "node:assert/strict";
import {
  importScenario,
  readLibrary,
  equalRainfallComparison,
  comparisonCsv,
} from "../src/library.js";
import { defaults, sanitize } from "../src/domain.js";
const valid = {
  version: 1,
  parameters: { ...defaults },
  chapter: "water",
  palette: "dune",
};
test("JSON import validates all inputs and ignores claimed outputs", () => {
  assert.deepEqual(importScenario({ ...valid, results: { runoff: -999 } }), {
    parameters: defaults,
    chapter: "water",
    palette: "dune",
  });
  for (const value of [
    null,
    [],
    { version: 2, parameters: defaults },
    { ...valid, parameters: { ...defaults, rainfall: "60" } },
    { ...valid, parameters: { ...defaults, canopy: 81 } },
    { ...valid, parameters: { ...defaults, roofs: NaN } },
  ])
    assert.throws(() => importScenario(value));
  assert.equal(
    importScenario({ ...valid, chapter: "unknown" }).chapter,
    "city",
  );
});
test("equal rainfall comparison separates a bigger storm from interventions", () => {
  const storm = equalRainfallComparison({ ...defaults, rainfall: 120 });
  assert.equal(storm.runoffDelta, 0);
  assert.equal(storm.reference.runoff, 144);
  const green = equalRainfallComparison({
    ...defaults,
    rainfall: 120,
    drainage: 70,
  });
  assert.equal(green.runoffDelta, -22);
  assert.equal(green.reference.runoff, 144);
});
test("library recovers from damaged storage and rejects invalid entries", () => {
  assert.deepEqual(readLibrary({ getItem: () => "{broken" }), []);
  assert.deepEqual(
    readLibrary({
      getItem: () =>
        JSON.stringify([null, { ...valid, id: "a", name: "Park option" }]),
    }).map((x) => x.name),
    ["Park option"],
  );
  assert.equal(
    readLibrary({
      getItem: () => {
        throw Error("blocked");
      },
    }).length,
    0,
  );
  assert.deepEqual(sanitize(null), defaults);
});
test("CSV recalculates outputs, escapes names and blocks formulas", () => {
  const csv = comparisonCsv([
    { name: '=SUM(1,2)"\nnew', parameters: defaults, results: { surface: 0 } },
  ]);
  assert.ok(csv.includes('"\'=SUM(1,2)""\nnew"'));
  assert.ok(csv.includes("41.8"));
  assert.ok(csv.includes("not a validated forecast"));
});
