import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";
import { baseline, scenarioReport } from "./domain.js";
export function Results({ parameters, name, onMethod, compact = false }) {
  const r = scenarioReport(parameters);
  return (
    <section
      className={`scenario-results ${compact ? "compact-results" : ""}`}
      aria-label="Scenario results"
      aria-live="polite"
    >
      <div className="report-kicker">
        <CheckCircle size={16} />
        <span>ILLUSTRATIVE SCENARIO RESULTS</span>
      </div>
      <h3>{name || "Your district, reimagined."}</h3>
      <p className="result-summary">
        {r.temperatureDelta < 0
          ? `${Math.abs(r.temperatureDelta).toFixed(1)}°C lower surface response`
          : r.temperatureDelta > 0
            ? `${r.temperatureDelta.toFixed(1)}°C higher surface response`
            : "Surface response matches the baseline"}{" "}
        ·{" "}
        {r.runoffPercent < 0
          ? `${Math.abs(r.runoffPercent)}% lower runoff index`
          : r.runoffPercent > 0
            ? `${r.runoffPercent}% higher runoff index`
            : "runoff matches the baseline"}
        .
      </p>
      <div
        className="report-table"
        role="table"
        aria-label="Baseline and scenario comparison"
      >
        <div className="report-row report-table-head" role="row">
          <span role="columnheader">Indicator</span>
          <span role="columnheader">Baseline</span>
          <span role="columnheader">Scenario</span>
          <span role="columnheader">Change</span>
        </div>
        <div className="report-row" role="row">
          <span role="cell">Surface °C</span>
          <span role="cell">{baseline.surface}</span>
          <strong role="cell">{r.surface}</strong>
          <span
            role="cell"
            className={r.temperatureDelta <= 0 ? "positive" : "negative"}
          >
            {r.temperatureDelta > 0 ? "+" : ""}
            {r.temperatureDelta.toFixed(1)}°
          </span>
        </div>
        <div className="report-row" role="row">
          <span role="cell">Runoff index</span>
          <span role="cell">{baseline.runoff}</span>
          <strong role="cell">{r.runoff}</strong>
          <span
            role="cell"
            className={r.runoffDelta <= 0 ? "positive" : "negative"}
          >
            {r.runoffDelta > 0 ? "+" : ""}
            {r.runoffDelta}
          </span>
        </div>
      </div>
      <div className="response-meter">
        <span>
          Runoff response <small>0–200 illustrative index</small>
        </span>
        <meter
          min="0"
          max="200"
          value={r.runoff}
          aria-label="Illustrative runoff response"
        >
          {r.runoff}
        </meter>
      </div>
      <p className="report-inputs">
        {parameters.canopy}% canopy · {parameters.roofs}% cool roofs ·{" "}
        {parameters.drainage}% permeable · {parameters.rainfall} mm rain
      </p>
      <button className="text-button" onClick={onMethod}>
        <Info size={14} /> How this is calculated
      </button>
    </section>
  );
}
