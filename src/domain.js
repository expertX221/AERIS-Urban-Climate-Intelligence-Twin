export const chapters = [
  {
    id: "city",
    n: "01",
    title: "City",
    eyebrow: "A LIVING SYSTEM",
    heading: ["Every street.", "Part of a bigger picture."],
    description:
      "A city is more than its buildings. Explore how streets, water, vegetation and people connect in one spatial story.",
    detail:
      "Select a building, a park or the river to inspect its role in the district.",
  },
  {
    id: "heat",
    n: "02",
    title: "Heat",
    eyebrow: "PEOPLE AND PLACES",
    heading: ["See where", "the city holds heat."],
    description:
      "Unshaded streets and hard surfaces shape how a neighbourhood feels. Reveal thermal stress, then explore a cooler alternative.",
    detail:
      "Amber buildings show an illustrative heat layer. Try cool roofs and additional canopy in the explorer.",
  },
  {
    id: "water",
    n: "03",
    title: "Water",
    eyebrow: "RISK AND RESILIENCE",
    heading: ["Follow the water.", "Find the possibilities."],
    description:
      "Trace the relationship between the river, paved streets and places that can hold rainfall. Explore a rainier scenario without waiting for a storm.",
    detail:
      "The blue extent is illustrative, not a flood prediction or an evacuation map.",
  },
  {
    id: "regeneration",
    n: "04",
    title: "Regeneration",
    eyebrow: "CLEANER, BRIGHTER FUTURES",
    heading: ["A different future.", "Designed together."],
    description:
      "Add shade, reflective roofs and rain gardens. Compare the same district before and after your choices, with every assumption in view.",
    detail:
      "Explore trade-offs using a transparent demonstration model. Save a scenario and share it with your team.",
  },
];
export const defaults = { canopy: 20, roofs: 15, drainage: 20, rainfall: 60 };
export const baseline = { surface: 41.8, runoff: 72 };
export const palettes = [
  {
    id: "midnight",
    name: "Midnight",
    description: "Ink, copper & glacier blue",
  },
  {
    id: "verdigris",
    name: "Verdigris",
    description: "Deep forest, jade & brass",
  },
  { id: "dune", name: "Dune", description: "Sandstone, terracotta & blue" },
];
export const presets = [
  {
    id: "cool",
    name: "Cooler streets",
    scene: "heat",
    icon: "heat",
    parameters: { canopy: 60, roofs: 45, drainage: 20, rainfall: 60 },
    description: "More canopy and reflective roofs.",
  },
  {
    id: "storm",
    name: "Cloudburst",
    scene: "water",
    icon: "water",
    parameters: { canopy: 20, roofs: 15, drainage: 20, rainfall: 120 },
    description: "Double the illustrative rainfall.",
  },
  {
    id: "sponge",
    name: "Sponge district",
    scene: "regeneration",
    icon: "leaf",
    parameters: { canopy: 60, roofs: 60, drainage: 70, rainfall: 60 },
    description: "A greener, more permeable district.",
  },
];
export function scenarioReport(input) {
  const result = evaluateScenario(input);
  return {
    ...result,
    temperatureDelta: +(result.surface - baseline.surface).toFixed(1),
    runoffDelta: result.runoff - baseline.runoff,
    runoffPercent: Math.round(
      ((result.runoff - baseline.runoff) / baseline.runoff) * 100,
    ),
  };
}
export function sanitize(input = {}) {
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [
      k,
      Math.max(
        0,
        Math.min(
          k === "rainfall" ? 150 : 80,
          Number.isFinite(Number(input[k])) ? Number(input[k]) : v,
        ),
      ),
    ]),
  );
}
export function evaluateScenario(input) {
  const p = sanitize(input);
  return {
    surface:
      Math.round((41800 - (p.canopy - 20) * 55 - (p.roofs - 15) * 25) / 100) /
      10,
    runoff: Math.round(
      Math.max(
        0,
        p.rainfall * 1.2 - (p.drainage - 20) * 0.45 - (p.canopy - 20) * 0.18,
      ),
    ),
  };
}
export function readSaved() {
  try {
    const d = JSON.parse(localStorage.getItem("aeris-scenario"));
    return d ? sanitize(d.parameters) : defaults;
  } catch {
    return defaults;
  }
}
export const places = {
  district: {
    title: "Riverside district",
    type: "DISTRICT OVERVIEW",
    body: "An original, illustrative urban district built for exploring climate relationships. Its river corridor, residential blocks and public park form the four AERIS scenes.",
    facts: [
      ["Scene", "Original Blender model"],
      ["Data", "Simulated · illustrative"],
      ["Purpose", "Explore design choices"],
    ],
  },
  park: {
    title: "Riverside park",
    type: "GREEN INFRASTRUCTURE",
    body: "Tree canopy provides shade and changes the local surface environment. Explore how adding vegetation changes the demonstration scenario.",
    facts: [
      ["Intervention", "Tree canopy"],
      ["Explore", "Shade and exposure"],
      ["Limitation", "No measured cooling data"],
    ],
  },
  river: {
    title: "River corridor",
    type: "BLUE INFRASTRUCTURE",
    body: "The river connects the district. Rain gardens and permeable ground represent interventions that retain a portion of illustrative runoff.",
    facts: [
      ["Intervention", "Rain gardens"],
      ["Explore", "Runoff response"],
      ["Limitation", "No hydraulic simulation"],
    ],
  },
  tower: {
    title: "North quarter",
    type: "BUILT ENVIRONMENT",
    body: "Explore how shade, reflective roofs and vegetation can be represented in an urban climate scenario. Inspect a block and adjust the controls in the workspace.",
    facts: [
      ["Intervention", "Cool roofs"],
      ["Explore", "Surface temperature"],
      ["Limitation", "No building energy model"],
    ],
  },
};
