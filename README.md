# AERIS — Urban Climate Intelligence Twin

An immersive ClimateTech & Sustainability hackathon prototype for THREWS ODYSSEY 2026. A cinematic website connects directly to a 3D climate scenario workspace.

## Version 0.2 refinements

Detailed architectural models now include facade framing, balconies, roof terraces, bridge cables, a park pavilion and riverside lighting. Three coordinated palettes (Midnight, Verdigris and Dune) change the actual 3D materials and interface. Water scenes include moving river tracers and rainfall for wetter scenarios. Motion remains optional.

Three working presets open explicit result reports: Cooler streets, Cloudburst and Sponge district. Sliders update the model and response; View scenario results shows a readable baseline/current/change table. Save/restore, visible share-link dialog, export, rotate, zoom and reset camera actions provide clear outcomes. Model selection can display geometry metadata.

For a portable VS Code setup, start with `START-HERE.md` and `AERIS.code-workspace`. The source ZIP includes editable Blender files and runtime assets but excludes credentials, dependencies and Git history.

## Problem

Urban climate information is often fragmented across maps, charts and reports. AERIS explores whether an interactive spatial story can help people understand the relationships between built form, vegetation, surface heat and water, and compare possible interventions with transparent assumptions.

## Working prototype

- Cinematic landing page following the selected dark city visual direction.
- Four original Blender models: City, Heat, Water and Regeneration. Native scrolling changes the model and camera; chapters remain directly navigable.
- Interactive Three.js explorer with orbit controls, object selection, keyboard-accessible inspection shortcuts and camera buttons.
- Canopy, cool-roof, permeability and rainfall controls. Baseline comparison, device-local saving, parameterised share links and JSON export.
- Optional original synthesized ambient audio and gentle click sounds. No autoplay. Audio mutes in background tabs.
- Motion pause, reduced-motion support, responsive layouts, readable semantic content and a 2D fallback when WebGL/assets fail.

## Stack and run

React 19, Vite 6, Three.js, Phosphor icons, Blender 5.2, Web Audio API and Vercel static hosting. No secrets or database are required. Neon is intentionally not provisioned: this version uses localStorage and shareable URL parameters instead of server persistence.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4173
npm run build
node --test tests/scenarios.test.mjs
```

Build output is `dist/client`. `vercel.json` configures Vercel. The retained Product Design template also emits a Sites-compatible worker; Vercel serves the static client.

Rebuild the assets using the installed Blender executable:

```sh
blender --background --python scripts/create-models.py
```

Editable sources: `blender/aeris-city.blend`, `aeris-heat.blend`, `aeris-water.blend`, `aeris-regeneration.blend`. Runtime geometry: `public/models/*.glb` (approximately 1.8–2.1 MB each). Geometry is deterministic, generated with seed 47 and detailed with seed 72. Run `scripts/enhance-models.py` in Blender after the base generation pass. No proprietary buildings or textures are imported.

## Data, equations and limitations

This is an **illustrative interaction prototype, not a validated climate model**. There are no live sensors, weather feeds, trained AI models, georeferenced buildings or measured evaluation results. All district geometry, thermal/flood layers, values and coefficients are synthetic. The cinematic opening is generated artwork; subsequent 3D scenes are actual exported meshes.

Baseline inputs: canopy 20%, roofs 15%, permeability 20%, rainfall 60 mm. Bounded inputs: 0–80% and 0–150 mm.

- Surface response = 41.8 − 0.055 × (canopy − 20) − 0.025 × (roofs − 15), rounded to one decimal.
- Runoff index = max(0, 1.2 × rainfall − 0.45 × (permeability − 20) − 0.18 × (canopy − 20)), rounded to an integer.

These invented relationships exist solely to make scenario comparison explorable. The runoff index is not runoff depth or flood probability. Outputs must not inform planning, medical, property or emergency decisions. Tree scaling, roof tint and flood extent scaling are visual encodings, not physical simulations. Air quality is a future research direction; no air-quality prediction is claimed in this version.

A research extension needs local terrain and building data, documented land cover, weather forcing, a calibrated heat/hydrology model, validation against withheld observations, uncertainty bounds and accessibility/usability evaluation. No empirical improvements or scalability results are claimed.

## Resources and attribution

- Original Blender geometry and generation script authored for this project with AI coding assistance.
- AI-generated cinematic city and orbital brand asset created through built-in ImageGen, following the user's selected design concept. They are illustrations, not real locations or measurements.
- React, Vite and Three.js: MIT licensed; Phosphor icons: MIT. Dependency versions are recorded in `package-lock.json`.
- DM Sans and Instrument Serif via Google Fonts, SIL Open Font License. The site falls back to system sans-serif and Georgia if those fonts cannot load.
- Ambient chord and button sounds are original Web Audio synthesis, with no third-party audio recordings.
- Scaffold: OpenAI Product Design prototype template, retained hosting runtime files.

See `docs/submission.md` for a submission-ready project summary and demo flow, and `design-qa.md` for verification status. AI tools were used for code and visual assets; participants must review and understand the implementation before submission.
