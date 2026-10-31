import { jsPDF } from "jspdf";
import { defaults, evaluateScenario, sanitize } from "./domain.js";
import { equalRainfallComparison } from "./library.js";
const clean = (value) =>
  String(value ?? "")
    .replace(/[^\x20-\x7e]/g, " ")
    .trim();
function documentBase(title, landscape = false) {
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait" });
  const width = doc.internal.pageSize.getWidth();
  doc.setProperties({
    title: "AERIS - " + title,
    subject: "Illustrative urban climate scenario report",
    author: "AERIS",
  });
  doc.setFillColor(10, 28, 36);
  doc.rect(0, 0, width, 43, "F");
  doc.setTextColor(100, 220, 209);
  doc.setFontSize(12);
  doc.text("AERIS / URBAN CLIMATE INTELLIGENCE TWIN", 16, 17);
  doc.setTextColor(255);
  doc.setFontSize(21);
  doc.text(title, 16, 31);
  doc.setTextColor(50, 65, 73);
  doc.setFontSize(9);
  doc.text(
    "Generated " +
      new Date().toISOString().replace("T", " ").slice(0, 19) +
      " UTC",
    16,
    52,
  );
  return doc;
}
function footer(doc) {
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(190, 205, 211);
  doc.line(16, h - 27, doc.internal.pageSize.getWidth() - 16, h - 27);
  doc.setFontSize(8);
  doc.setTextColor(75, 89, 96);
  doc.text(
    "Synthetic data and invented heuristic equations. Not a validated climate forecast.",
    16,
    h - 20,
  );
  doc.text(
    "For exploration only. Do not use for planning or emergency decisions.",
    16,
    h - 15,
  );
  doc.text("https://aeris-climate-twin.vercel.app", 16, h - 10);
}
export function createScenarioPdf({
  parameters,
  name = "Current scenario",
  chapter = "city",
  palette = "midnight",
}) {
  const doc = documentBase("Scenario report"),
    p = sanitize(parameters),
    r = evaluateScenario(p),
    b = evaluateScenario(defaults),
    equal = equalRainfallComparison(p);
  doc.setFontSize(16);
  doc.setTextColor(15, 80, 90);
  doc.text(doc.splitTextToSize(clean(name).slice(0, 60), 175), 16, 65);
  doc.setFontSize(10);
  doc.setTextColor(50, 65, 73);
  doc.text(
    "Scene: " + clean(chapter) + "   |   Palette: " + clean(palette),
    16,
    82,
  );
  const inputs = [
    ["INPUT", "ORIGINAL BASELINE", "SCENARIO"],
    ["Tree canopy", defaults.canopy + "%", p.canopy + "%"],
    ["Cool roofs", defaults.roofs + "%", p.roofs + "%"],
    ["Permeable ground", defaults.drainage + "%", p.drainage + "%"],
    ["Rainfall", defaults.rainfall + " mm", p.rainfall + " mm"],
  ];
  table(doc, inputs, [16, 87, 143], 96, 12);
  const delta = r.surface - b.surface;
  table(
    doc,
    [
      ["ILLUSTRATIVE RESPONSE", "BASELINE", "SCENARIO"],
      ["Surface response (deg C)", b.surface.toFixed(1), r.surface.toFixed(1)],
      ["Runoff index", String(b.runoff), String(r.runoff)],
    ],
    [16, 87, 143],
    168,
    12,
  );
  doc.setFontSize(11);
  doc.setTextColor(15, 80, 90);
  doc.text("Equal-rainfall comparison", 16, 218);
  doc.setFontSize(10);
  doc.setTextColor(50, 65, 73);
  doc.text(
    doc.splitTextToSize(
      "At " +
        p.rainfall +
        " mm rain, original land cover gives a runoff index of " +
        equal.reference.runoff +
        "; the scenario gives " +
        r.runoff +
        ". Land-cover change: " +
        (equal.runoffDelta > 0 ? "+" : "") +
        equal.runoffDelta +
        " index points. Surface change from baseline: " +
        (delta > 0 ? "+" : "") +
        delta.toFixed(1) +
        " deg C.",
      175,
    ),
    16,
    228,
  );
  footer(doc);
  return doc;
}
function table(doc, rows, columns, y, height) {
  rows.forEach((row, i) => {
    if (i === 0) {
      doc.setFillColor(225, 239, 239);
      doc.rect(16, y - 8, doc.internal.pageSize.getWidth() - 32, height, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
      doc.setDrawColor(220, 228, 230);
      doc.line(
        16,
        y + height - 4,
        doc.internal.pageSize.getWidth() - 16,
        y + height - 4,
      );
    }
    doc.setFontSize(i === 0 ? 8 : 10);
    doc.setTextColor(35, 58, 66);
    row.forEach((cell, j) => doc.text(clean(cell), columns[j], y));
    y += height;
  });
  doc.setFont("helvetica", "normal");
}
export function createComparisonPdf(rows) {
  const doc = documentBase("Scenario comparison", true);
  doc.setFontSize(10);
  doc.text(
    "Compare rainfall inputs before interpreting differences in runoff response.",
    16,
    65,
  );
  const data = [
    [
      "SCENARIO",
      "CANOPY %",
      "ROOFS %",
      "PERMEABLE %",
      "RAIN mm",
      "SURFACE deg C",
      "RUNOFF INDEX",
    ],
    ...rows.slice(0, 10).map((row) => {
      const p = sanitize(row.parameters),
        r = evaluateScenario(p);
      return [
        clean(row.name).slice(0, 27),
        p.canopy,
        p.roofs,
        p.drainage,
        p.rainfall,
        r.surface,
        r.runoff,
      ];
    }),
  ];
  table(doc, data, [16, 83, 111, 139, 177, 208, 251], 80, 8);
  footer(doc);
  return doc;
}
