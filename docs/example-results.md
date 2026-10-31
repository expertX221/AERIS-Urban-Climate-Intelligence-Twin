# AERIS example results

These are synthetic outputs of the documented demonstration equations. They are not measured outcomes or validated climate predictions.

| Option | Canopy / roofs / permeability | Rainfall | Surface response | Runoff index | Change vs original baseline |
|---|---|---:|---:|---:|---|
| Baseline | 20% / 15% / 20% | 60 mm | 41.8°C | 72 | Reference |
| Cooler streets | 60% / 45% / 20% | 60 mm | 38.9°C | 65 | −2.9°C; −10% runoff index |
| Cloudburst | 20% / 15% / 20% | 120 mm | 41.8°C | 144 | Same surface response; +100% runoff index |
| Sponge district | 60% / 60% / 70% | 60 mm | 38.5°C | 42 | −3.3°C; −42% runoff index |

Select a named option in the app to open its results report. Close the report to inspect the affected model. Cloudburst activates the Water scene and visible rain; Cooler streets activates Heat; Sponge district activates Regeneration. Appearance changes material colors without changing calculated values.

The baseline comparison always uses the original 60 mm rainfall baseline, including when comparing the wetter Cloudburst example. Surface response is rounded to one decimal with deterministic decimal arithmetic. The runoff index is dimensionless, not flood depth or discharge.
