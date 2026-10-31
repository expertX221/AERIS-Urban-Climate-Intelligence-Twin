import test from "node:test";
import assert from "node:assert/strict";
import {
  importScenario,
  readLibrary,
  equalRainfallComparison,
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
test("PDF reports contain recalculated results and model limitations", async () => {
  const { createScenarioPdf, createComparisonPdf } = await import(
    "../src/pdf.js"
  );
  const report = createScenarioPdf({
    parameters: { ...defaults, rainfall: 120 },
    name: "Cloudburst",
  });
  const pdf = report.output();
  assert.ok(pdf.startsWith("%PDF-"));
  assert.ok(pdf.includes("Equal-rainfall comparison"));
  assert.ok(pdf.includes("144"));
  assert.ok(pdf.includes("Not a validated climate forecast"));
  assert.equal(report.getNumberOfPages(), 1);
  const comparison = createComparisonPdf(
    Array.from({ length: 10 }, (_, i) => ({
      name: "Option " + i,
      parameters: defaults,
    })),
  );
  assert.equal(comparison.getNumberOfPages(), 1);
  assert.ok(comparison.output().includes("Option 9"));
  assert.ok(
    comparison.internal.pageSize.getWidth() >
      comparison.internal.pageSize.getHeight(),
  );
});
