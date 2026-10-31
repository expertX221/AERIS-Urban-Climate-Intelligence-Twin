import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  defaults,
  baseline,
  evaluateScenario,
  sanitize,
} from "../src/domain.js";
import { presets, scenarioReport, palettes } from "../src/domain.js";
test("each scenario preset returns a distinct explainable result", () => {
  const cool = scenarioReport(presets.find((p) => p.id === "cool").parameters);
  const storm = scenarioReport(
    presets.find((p) => p.id === "storm").parameters,
  );
  const sponge = scenarioReport(
    presets.find((p) => p.id === "sponge").parameters,
  );
  assert.equal(cool.surface, 38.9);
  assert.equal(cool.runoff, 65);
  assert.equal(storm.surface, 41.8);
  assert.equal(storm.runoff, 144);
  assert.equal(storm.runoffPercent, 100);
  assert.equal(sponge.surface, 38.5);
  assert.equal(sponge.runoff, 42);
  assert.equal(sponge.runoffPercent, -42);
  assert.equal(palettes.length, 3);
  assert.equal(new Set(palettes.map((p) => p.id)).size, 3);
});
test("baseline and intervention direction remain consistent", () => {
  assert.deepEqual(evaluateScenario(defaults), baseline);
  const improved = evaluateScenario({
    ...defaults,
    canopy: 60,
    roofs: 60,
    drainage: 60,
  });
  assert.ok(improved.surface < baseline.surface);
  assert.ok(improved.runoff < baseline.runoff);
  assert.ok(
    evaluateScenario({ ...defaults, rainfall: 120 }).runoff > baseline.runoff,
  );
});
test("untrusted share parameters are finite, bounded and allowlisted", () => {
  assert.deepEqual(
    sanitize({
      canopy: "bad",
      roofs: Infinity,
      drainage: -100,
      rainfall: 999,
      token: "ignored",
    }),
    { canopy: 20, roofs: 15, drainage: 0, rainfall: 150 },
  );
  for (const canopy of [0, 40, 80])
    for (const roofs of [0, 40, 80])
      for (const drainage of [0, 40, 80])
        for (const rainfall of [0, 75, 150]) {
          const r = evaluateScenario({ canopy, roofs, drainage, rainfall });
          assert.ok(Number.isFinite(r.surface));
          assert.ok(r.runoff >= 0 && r.runoff <= 200);
        }
});
test("all four GLBs contain actual distinct geometry and materials", async () => {
  const shapes = [];
  for (const id of ["city", "heat", "water", "regeneration"]) {
    const b = await readFile(
      new URL(`../public/models/${id}.glb`, import.meta.url),
    );
    assert.equal(b.toString("ascii", 0, 4), "glTF");
    assert.equal(b.readUInt32LE(4), 2);
    assert.equal(b.readUInt32LE(8), b.length);
    const len = b.readUInt32LE(12),
      g = JSON.parse(b.toString("utf8", 20, 20 + len));
    assert.ok(g.meshes.length > 50);
    assert.ok(g.nodes.some((n) => n.name.startsWith("Building_")));
    assert.ok(g.nodes.some((n) => n.name.startsWith("Tree_canopy")));
    assert.ok(g.nodes.some((n) => n.name.startsWith("Detail_")));
    assert.ok(
      g.nodes.some((n) => n.extras?.height_units > 0 && n.extras?.floors > 0),
    );
    if (id === "heat")
      assert.ok(
        g.materials.some((m) =>
          m.name.startsWith("Illustrative thermal overlay"),
        ),
      );
    if (id === "water")
      assert.ok(g.nodes.some((n) => n.name === "Flood extent"));
    if (id === "regeneration")
      assert.ok(g.nodes.some((n) => n.name.startsWith("Rain garden")));
    shapes.push(b.length);
  }
  assert.equal(new Set(shapes).size, 4);
});
