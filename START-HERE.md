# Open AERIS in Visual Studio Code

1. Extract the ZIP fully. Open `AERIS.code-workspace` in VS Code.
2. Install Node.js 22 or newer (Node 24 LTS recommended).
3. In the integrated terminal, run `npm ci` once.
4. Run `npm run dev -- --host 127.0.0.1 --port 4173` and open the printed local address.

The VS Code **Run and Debug → Start AERIS** configuration starts the same server. **Terminal → Run Task** includes install, dev, build and test tasks. The ZIP deliberately excludes `node_modules`, credentials, `.env.local`, `.vercel` and Git history. No API keys or database setup are required.

## Try the working options

- Launch the app. Choose **Cooler streets**, **Cloudburst** or **Sponge district**. A readable results report opens immediately; close it to inspect the changed 3D scene.
- Change the four sliders, then choose **View scenario results** for an explicit baseline/current comparison.
- **Appearance and colors** changes the interface and actual 3D materials between Midnight, Verdigris and Dune.
- Use rotate, zoom and reset camera buttons, or drag the model. Select a building to inspect the modeled height, use and storeys.
- Save a scenario; change its inputs; **Restore saved scenario** retrieves it. Sharing opens a visible link with a copy button and an open-link action. PDF report export includes inputs, computed results, scene and palette.

## Project map

- `src/App.jsx`: website, workspace, scenarios and dialogs.
- `src/Scene.jsx`: WebGL renderer, model interaction, materials, animation and camera.
- `src/Results.jsx`: comparison report.
- `src/domain.js`: documented synthetic response equations and presets.
- `public/models`: four detailed GLB scenes, ready for the web.
- `blender`: four editable Blender 5.2 source files.
- `scripts/create-models.py`, then `scripts/enhance-models.py`: rebuild all original models in two passes.
- `npm test`: input-boundary, preset, model-format and architectural-metadata checks.
- `npm run build`: production output in `dist/client`.

The opening artwork is a cinematic illustration. The explorer uses actual Blender geometry. All climate responses are invented demonstration values, not calibrated forecasts. See README and the Method dialog for the equations and limitations.

## New scenario library

In the workspace, open **Scenario library & comparison**. Name and save the current inputs, load a named option, or import a previously exported AERIS scenario JSON file. The comparison table and PDF report include baseline, current scenario and all library entries. Results reports also show land-cover changes at equal rainfall. All results remain synthetic demonstration values.

Report download buttons now generate PDF files directly in the browser. Existing version 1 JSON files can still be imported; PDF reports are intended for reading and sharing.
