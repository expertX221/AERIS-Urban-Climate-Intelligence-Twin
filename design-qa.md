# AERIS visual and functional verification

final result: passed

## Target and evidence

- Source visual truth: `evidence/reference.png`, the user's selected first generated direction (original 1487 × 1058 pixels).
- Implementation: https://aeris-climate-twin-create-projects1.vercel.app/ and its `#app` workspace.
- Desktop CSS viewport: 1488 × 1058, device pixel ratio approximately 1. Screenshots returned 1473 × 1048 content pixels after browser cropping/scrollbar treatment. For comparison both source and implementation were normalized to 1488 × 1058; no findings derive from the density/crop difference.
- Mobile CSS viewport: 390 × 844; document width 375 content pixels, with no horizontal overflow.
- Hero state: website home, muted audio, reduced motion initially honored.
- Evidence: `evidence/hero-desktop.jpg`, `hero-mobile.jpg`, `explorer-desktop.jpg`, `explorer-mobile.jpg`, `story-heat-desktop.jpg`.
- Combined comparison input: `evidence/hero-comparison.jpg` (source left, implementation right), reviewed together. Focused typography/CTA/inspector comparison: `evidence/hero-focus-comparison.jpg`.
- Local preview could not be reached by the browser; browser QA was completed against the real Vercel deployment instead. Build success was not substituted for browser evidence.

## Findings and comparison history

1. **P2 — Hero title position and type width.** Initial Instrument Serif title was too narrow and approximately 60 pixels too low versus the selected target. Fixed the desktop hero to Georgia, 5.1vw sizing and a 14.7% top position. Revised title begins near x54/y203; combined full-view and focused comparisons show the intended two-line hierarchy and balanced city composition.
2. **P2 — Mobile final chapter wrapped inconsistently.** Regeneration wrapped below its number while the other labels stayed in one row. Fixed all mobile chapter buttons to a consistent two-row number/title layout with 16px titles. Revised mobile screenshot confirms consistent navigation.
3. **P2 — Mobile district edges clipped.** Initial portrait framing cut off the terrain edges. Increased the portrait camera distance; revised mobile explorer screenshot includes the complete district.
4. **P1 — Stale lazy chunk after deployment.** An already-open tab requested an old Scene chunk during a live update and produced a blank page. Added a bounded Vite preload-error refresh and a scene-only React error boundary preserving the semantic app and controls. Reloaded the current deployment and retested website → animated heat chapter and all scene entry controls. This was a deployment-version issue, not a GLB asset failure.
5. **P2 — Unnamed sliders in accessibility snapshot.** Added explicit accessible names. Final snapshots expose Tree canopy, Cool roofs, Permeable ground and Rainfall scenario; keyboard Home/End interaction works.

No actionable P0/P1/P2 visual findings remain in the observed states.

## Required fidelity surfaces

- **Fonts and typography:** Georgia desktop hero closely follows the selected broad editorial serif; DM Sans supports navigation/body copy. Instrument Serif remains for smaller chapter/workspace titles. Main headline wrap and hierarchy match the target. Text is semantic DOM content.
- **Spacing and rhythm:** Hero copy, right-hand contextual inspector, negative space and bottom four-chapter navigation follow the selected composition. The app intentionally uses a workspace layout because the source image only defines the website hero. Mobile is deliberately recomposed.
- **Colors and tokens:** Midnight navy, cyan interaction accents, off-white type and warm city lighting retained. Controls have focus outlines and distinguishable active states.
- **Image/asset quality:** Original generated city artwork matches the selected atmosphere; no generated text is baked into UI. The orbital asset is a generated PNG; icons use Phosphor. The city illustration is clearly identified as a cinematic preview. The subsequent four scenes use real original Blender geometry, intentionally lighter and less detailed than the cinematic artwork.
- **Copy/content:** Primary headline and CTA match the selected direction. Added transparent simulated-data notices, equations and limitations. No fabricated sensor feeds, forecasts or measured climate improvements are claimed.

## Functional checks observed in the browser

- Landing page → explorer; story chapter navigation → live heat scene; optional motion enabled/paused.
- City, Heat, Water and Regeneration GLBs load and render.
- Canvas click changes the contextual inspector; semantic building/park/river shortcuts work.
- Keyboard slider controls update outputs. An illustrative 80/80/80/60 scenario returns 36.9°C and runoff index 34; baseline comparison returns 41.8°C and 72. These are invented demonstration values, not research results.
- Scenario saving shows confirmation and restores parameters across reload.
- Detail dialog opens/closes, preserves contextual text and returns to the workspace.
- Ambient sound enable/mute states toggle without browser errors; audio is off initially. No acoustic quality or volume measurement is claimed.
- JSON export downloaded successfully; inspected JSON contains the four inputs, results, scene, version and simulation limitations.
- Copy link reports success. Reopening a clipboard-derived URL was blocked by browser URL security policy, so the complete copy → new-tab restoration path was not verified. The parameter parser's finite/bounded/allowlist behavior is covered by automated checks.
- Current mobile browser logs: no warning/error entries. A historic stale-chunk error was observed and addressed as described above.

## Automated and deployment evidence

- `node --test tests/scenarios.test.mjs`: 3 passing tests, including a bounded parameter grid, intervention direction, all four GLB headers, distinct geometry and expected heat/water/regeneration content.
- `npm run build`: successful. Main application approximately 276 KB (84 KB gzip); deferred 3D chunk approximately 661 KB (167 KB gzip). A Vite advisory remains for the large deferred renderer chunk; it is not a build failure.
- Vercel project: `create-projects1/aeris-climate-twin`, connected to `expertX221/AERIS-`, production branch `main`. Native deployment status is READY and browser rendering has been observed.
- Four GLBs approximately 1.2–1.5 MB each. No FPS, low-end device, scientific accuracy or scalability benchmark is claimed.

## Follow-up polish and limits

- P3: Inspector thumbnail uses a city crop rather than the source concept's close-up architecture image. The function and visual hierarchy are preserved.
- The original cinematic artwork and functional 3D district are separate representations, openly disclosed; they are not a georeferenced twin of a real city.
- WebGL-unavailable and network-failure fallback branches were reviewed, but a forced context-loss test was not performed.
- No live data, calibrated climate model, native mobile binary, authentication, collaborative backend or Neon persistence is included. This is a connected website/web-app prototype.
