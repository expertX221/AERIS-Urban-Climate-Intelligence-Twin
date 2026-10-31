import { useState } from "react";
import { defaults, evaluateScenario } from "./domain.js";
import {
  LIBRARY_KEY,
  readLibrary,
  importScenario,
  comparisonCsv,
} from "./library.js";
export function ScenarioLibrary({
  parameters,
  chapter,
  palette,
  onLoad,
  notify,
}) {
  const [rows, setRows] = useState(() => readLibrary(localStorage));
  const [name, setName] = useState("My district scenario");
  const [error, setError] = useState("");
  function persist(next) {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      setRows(next);
      setError("");
      return true;
    } catch {
      setError(
        "Device storage is unavailable. Export the current scenario from the workspace to keep it.",
      );
      return false;
    }
  }
  function save() {
    if (!name.trim()) {
      setError("Enter a scenario name.");
      return;
    }
    if (rows.length >= 8) {
      setError(
        "Your library holds eight scenarios. Remove one before saving another.",
      );
      return;
    }
    const row = {
      version: 1,
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 60),
      parameters: { ...parameters },
      chapter,
      palette,
      savedAt: new Date().toISOString(),
    };
    if (persist([...rows, row]))
      notify("Named scenario saved in your library.");
  }
  async function importFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 65536) {
      setError("Choose a scenario JSON file smaller than 64 KB.");
      return;
    }
    try {
      const data = importScenario(JSON.parse(await file.text()));
      onLoad(data, "Imported scenario");
      notify("Scenario imported. Save it to the library to keep a named copy.");
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "This file is not valid JSON."
          : err.message,
      );
    }
  }
  const comparisons = [
    { name: "Original baseline", parameters: defaults },
    { name: "Current scenario", parameters },
    ...rows,
  ];
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob(["\ufeff", comparisonCsv(comparisons)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "aeris-scenario-comparison.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="scenario-library">
      <p>
        Keep up to eight named scenarios on this device. Compare their inputs
        before interpreting the illustrative responses.
      </p>
      <label className="library-name">
        Scenario name
        <input
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="report-actions">
        <button className="primary-button" onClick={save}>
          Save current to library
        </button>
        <label className="import-scenario">
          Import scenario JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={importFile}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="library-error">
          {error}
        </p>
      ) : null}
      <p className="report-inputs">
        {rows.length} of 8 slots used · JSON imports restore inputs, scene and
        palette. Imported outputs are recalculated.
      </p>
      <div className="library-list">
        {rows.length ? (
          rows.map((row, i) => (
            <article key={row.id}>
              <div>
                <strong>{row.name}</strong>
                <small>
                  {row.parameters.canopy}% canopy · {row.parameters.rainfall} mm
                  rain
                </small>
              </div>
              <button
                className="text-button"
                onClick={() => onLoad(row, row.name)}
                aria-label={`Load ${row.name}`}
              >
                Load
              </button>
              <button
                className="text-button"
                onClick={() => persist(rows.filter((_, j) => i !== j))}
                aria-label={`Remove ${row.name}`}
              >
                Remove
              </button>
            </article>
          ))
        ) : (
          <p>
            No named scenarios yet. Adjust the workspace, then save your first
            option here.
          </p>
        )}
      </div>
      <h3>Scenario comparison</h3>
      <p className="report-inputs">
        Different rainfall inputs represent different storms. Compare at equal
        rainfall in the results report to isolate interventions.
      </p>
      <div
        className="library-table-wrap"
        tabIndex={0}
        aria-label="Scrollable scenario comparison"
      >
        <table className="library-table">
          <caption>Synthetic responses, recalculated from saved inputs</caption>
          <thead>
            <tr>
              {[
                "Scenario",
                "Canopy %",
                "Roofs %",
                "Permeable %",
                "Rain mm",
                "Surface °C",
                "Runoff index",
              ].map((x) => (
                <th key={x} scope="col">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => {
              const r = evaluateScenario(row.parameters);
              return (
                <tr key={i}>
                  <th scope="row">{row.name}</th>
                  {["canopy", "roofs", "drainage", "rainfall"].map((k) => (
                    <td key={k}>{row.parameters[k]}</td>
                  ))}
                  <td>{r.surface}</td>
                  <td>{r.runoff}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="primary-button" onClick={exportCsv}>
        Export comparison CSV
      </button>
      <p className="report-disclaimer">
        Invented demonstration equations. No measured climate data or validated
        forecasts. Library data stays in this browser.
      </p>
    </div>
  );
}
