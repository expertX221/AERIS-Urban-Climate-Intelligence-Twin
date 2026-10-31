import { defaults, sanitize, evaluateScenario } from "./domain.js";
export const LIBRARY_KEY = "aeris-library-v1";
export function importScenario(data) {
  if (
    !data ||
    typeof data !== "object" ||
    data.version !== 1 ||
    !data.parameters ||
    typeof data.parameters !== "object"
  )
    throw new Error("Choose an AERIS version 1 scenario JSON file.");
  for (const key of Object.keys(defaults)) {
    const value = data.parameters[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > (key === "rainfall" ? 150 : 80)
    )
      throw new Error(
        "Scenario inputs must be numbers within the slider limits.",
      );
  }
  return {
    parameters: sanitize(data.parameters),
    chapter: ["city", "heat", "water", "regeneration"].includes(data.chapter)
      ? data.chapter
      : "city",
    palette: ["midnight", "verdigris", "dune"].includes(data.palette)
      ? data.palette
      : "midnight",
  };
}
export function readLibrary(storage) {
  try {
    const rows = JSON.parse(storage.getItem(LIBRARY_KEY) || "[]");
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 8).flatMap((row) => {
      try {
        if (typeof row.id !== "string" || typeof row.name !== "string")
          return [];
        return [
          {
            ...importScenario(row),
            version: 1,
            id: row.id,
            name: row.name.slice(0, 60),
            savedAt: typeof row.savedAt === "string" ? row.savedAt : "",
          },
        ];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
export function equalRainfallComparison(input) {
  const parameters = sanitize(input);
  const reference = evaluateScenario({
    ...defaults,
    rainfall: parameters.rainfall,
  });
  const current = evaluateScenario(parameters);
  return {
    reference,
    current,
    runoffDelta: current.runoff - reference.runoff,
    temperatureDelta: +(current.surface - reference.surface).toFixed(1),
  };
}
