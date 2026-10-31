import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SceneBoundary } from "./SceneBoundary.jsx";
import { Results } from "./Results.jsx";
import {
  ArrowRight,
  ArrowUpRight,
  SpeakerSlash,
  SpeakerHigh,
  Pause,
  Play,
  X,
  Database,
  Tree,
  Drop,
  Buildings,
  Thermometer,
  Leaf,
  SlidersHorizontal,
  DownloadSimple,
  Check,
  Copy,
  ArrowLeft,
  Info,
  CaretDown,
  GithubLogo,
  Palette,
  FloppyDisk,
} from "@phosphor-icons/react";
const Scene = lazy(() =>
  import("./Scene.jsx").then((m) => ({ default: m.Scene })),
);
import {
  chapters,
  defaults,
  baseline,
  evaluateScenario,
  readSaved,
  places,
  sanitize,
  palettes,
  presets,
} from "./domain.js";
import { setSound, clickSound } from "./audio.js";
const icons = [Buildings, Thermometer, Drop, Leaf];
const getRoute = () => (location.hash.startsWith("#app") ? "app" : "site");
function initialParameters() {
  try {
    const q = new URLSearchParams(location.hash.split("?")[1]);
    return q.has("canopy") ? sanitize(Object.fromEntries(q)) : readSaved();
  } catch {
    return defaults;
  }
}
function initialChapter() {
  const q = new URLSearchParams(location.hash.split("?")[1]);
  if (chapters.some((c) => c.id === q.get("scene"))) return q.get("scene");
  try {
    const d = JSON.parse(localStorage.getItem("aeris-scenario"));
    if (chapters.some((c) => c.id === d?.chapter)) return d.chapter;
  } catch {}
  return "city";
}
function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const n = ref.current.querySelectorAll(
            'button,a,input,select,[tabindex="0"]',
          ),
          first = n[0],
          last = n[n.length - 1];
        if (!first) return;
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        <span className="eyebrow">AERIS / FIELD NOTES</span>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
export function App() {
  const [route, setRoute] = useState(getRoute),
    [chapter, setChapter] = useState(initialChapter),
    [scroll, setScroll] = useState(0),
    [sound, soundState] = useState(false),
    [motion, setMotion] = useState(
      () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [parameters, setParameters] = useState(initialParameters),
    [selection, setSelection] = useState("district"),
    [modal, setModal] = useState(null),
    [comparison, setComparison] = useState(false),
    [toast, setToast] = useState(""),
    [saved, setSaved] = useState(false),
    [sceneStatus, setSceneStatus] = useState("loading");
  const app = route === "app",
    results = evaluateScenario(parameters),
    index = chapters.findIndex((c) => c.id === chapter),
    selected = typeof selection === "string" ? places[selection] : selection,
    timeout = useRef();
  const [sceneStarted, setSceneStarted] = useState(app);
  const [palette, setPalette] = useState(() => {
    try {
      const requested = new URLSearchParams(location.hash.split("?")[1]).get(
        "palette",
      );
      if (palettes.some((p) => p.id === requested)) return requested;
      return palettes.some(
        (p) => p.id === localStorage.getItem("aeris-palette"),
      )
        ? localStorage.getItem("aeris-palette")
        : "midnight";
    } catch {
      return "midnight";
    }
  });
  const [presetName, setPresetName] = useState("Custom scenario");
  const [shareCopied, setShareCopied] = useState(false);
  const choosePalette = (id) => {
    setPalette(id);
    try {
      localStorage.setItem("aeris-palette", id);
    } catch {}
  };
  const notify = (text) => {
    setToast(text);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setToast(""), 4000);
  };
  useEffect(() => {
    const update = () => {
      setRoute(getRoute());
      const q = new URLSearchParams(location.hash.split("?")[1]);
      if (q.has("canopy")) setParameters(sanitize(Object.fromEntries(q)));
      if (chapters.some((c) => c.id === q.get("scene")))
        setChapter(q.get("scene"));
      if (palettes.some((p) => p.id === q.get("palette")))
        setPalette(q.get("palette"));
    };
    addEventListener("hashchange", update);
    return () => removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (app) return;
    const update = () => {
      const first = document.getElementById("city"),
        last = document.getElementById("regeneration");
      const p = scrollY / innerHeight;
      setScroll(p);
      if (
        first &&
        last &&
        first.getBoundingClientRect().top < innerHeight * 0.5 &&
        last.getBoundingClientRect().bottom > innerHeight * 0.3
      ) {
        let best = "city";
        for (const c of chapters) {
          if (
            document.getElementById(c.id).getBoundingClientRect().top <
            innerHeight * 0.5
          )
            best = c.id;
        }
        setChapter(best);
      }
    };
    addEventListener("scroll", update, { passive: true });
    update();
    return () => removeEventListener("scroll", update);
  }, [app]);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      f = () => setMotion(!q.matches);
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    const f = () => {
      if (document.hidden) setSound(false);
      else if (sound) setSound(true).catch(() => soundState(false));
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [sound]);
  useEffect(
    () => () => {
      clearTimeout(timeout.current);
      setSound(false);
    },
    [],
  );
  const navigate = (id) => {
    setChapter(id);
    if (!app)
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: motion ? "smooth" : "instant" });
    else {
      setComparison(false);
      setSaved(false);
    }
  };
  const launch = () => {
    location.hash = "app";
    setRoute("app");
    window.scrollTo(0, 0);
  };
  const home = () => {
    location.hash = "";
    setRoute("site");
    window.scrollTo(0, 0);
  };
  const inspect = (item) => {
    const name = typeof item === "string" ? item : item.name;
    if (/Tree|park/i.test(name)) setSelection("park");
    else if (/River|Flood|Rain|Retention|bridge|promenade/i.test(name))
      setSelection("river");
    else if (/Building/i.test(name))
      setSelection({
        ...places.tower,
        title: name.replaceAll("_", " ").replace(/ roof| windows|lights/g, ""),
        ...(typeof item === "object" && item.height
          ? {
              body: `${item.use || "Mixed-use"} block in the illustrative Riverside district. Select a scenario to see how canopy and roof choices change the district response.`,
              facts: [
                ["Model height", `${item.height} units`],
                ["Storeys", `${item.floors} · illustrative`],
                ["Use", item.use || "Mixed-use"],
                ["Data", "Synthetic district geometry"],
              ],
            }
          : {}),
      });
    else setSelection("district");
    clickSound(sound);
  };
  const save = () => {
    try {
      localStorage.setItem(
        "aeris-scenario",
        JSON.stringify({
          version: 1,
          parameters,
          chapter,
          palette,
          savedAt: new Date().toISOString(),
          data: "simulated",
        }),
      );
      setSaved(true);
      notify("Scenario saved on this device.");
    } catch {
      notify("Device storage is unavailable. Export your scenario instead.");
    }
  };
  const scenarioLink = () =>
    `${location.origin}${location.pathname}#app?${new URLSearchParams({ ...parameters, scene: chapter, palette })}`;
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(scenarioLink());
      notify("Scenario link copied.");
      setShareCopied(true);
    } catch {
      notify("Copy the link from the field below.");
    }
  };
  const share = () => {
    setShareCopied(false);
    setModal("share");
  };
  const loadSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem("aeris-scenario"));
      if (!data) {
        notify("No saved scenario yet. Save one first.");
        return;
      }
      setParameters(sanitize(data.parameters));
      if (chapters.some((c) => c.id === data.chapter)) setChapter(data.chapter);
      if (palettes.some((p) => p.id === data.palette))
        choosePalette(data.palette);
      setComparison(false);
      setSaved(true);
      setPresetName("Saved scenario");
      notify("Saved scenario restored.");
    } catch {
      notify("Saved scenario could not be restored.");
    }
  };
  const applyPreset = (preset) => {
    setParameters({ ...preset.parameters });
    setChapter(preset.scene);
    setComparison(false);
    setSaved(false);
    setPresetName(preset.name);
    setModal("results");
  };
  const exportScenario = () => {
    const data = {
        project: "AERIS — Urban Climate Intelligence Twin",
        version: 1,
        dataType: "illustrative-simulated",
        parameters,
        results,
        chapter,
        palette,
        limitations:
          "Heuristic demonstration only. Not a validated forecast. No calibrated measurements.",
        createdAt: new Date().toISOString(),
      },
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "aeris-scenario.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    notify("Scenario exported.");
  };
  const setParam = (k, v) => {
    setSaved(false);
    setParameters((p) => ({ ...p, [k]: Number(v) }));
    setComparison(false);
    setPresetName("Custom scenario");
  };
  const firstSection = document.getElementById("city"),
    lastSection = document.getElementById("regeneration");
  const show3d =
    app ||
    (!app &&
      firstSection &&
      lastSection &&
      firstSection.getBoundingClientRect().top < innerHeight * 0.5 &&
      lastSection.getBoundingClientRect().bottom > innerHeight * 0.3);
  useEffect(() => {
    if (show3d) setSceneStarted(true);
  }, [show3d]);
  return (
    <div
      className={app ? "app-shell" : "site-shell"}
      data-palette={palette}
      onClick={(e) => {
        if (e.target.closest("button,a")) clickSound(sound);
      }}
    >
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="header">
        <button className="brand" onClick={home} aria-label="AERIS home">
          <img src="/assets/brand-orbit.png" alt="" />
          <span>AERIS</span>
        </button>
        {!app ? (
          <nav aria-label="Main navigation">
            <button onClick={() => navigate("city")}>The twin</button>
            <button onClick={() => navigate("regeneration")}>Scenarios</button>
            <button onClick={() => setModal("research")}>Research</button>
          </nav>
        ) : (
          <div className="workspace-label">
            <span className="live-dot" /> URBAN CLIMATE WORKSPACE <span>/</span>{" "}
            Riverside district
          </div>
        )}
        <div className="header-actions">
          <button
            className="round-button appearance-button"
            aria-label="Appearance and colors"
            onClick={() => setModal("appearance")}
          >
            <Palette size={20} />
          </button>
          {app ? (
            <button className="text-button back-site" onClick={home}>
              <ArrowLeft size={16} /> Back to story
            </button>
          ) : (
            <button className="outline-button" onClick={launch}>
              Launch app <ArrowRight size={18} />
            </button>
          )}
          <button
            className="round-button"
            aria-label={sound ? "Mute ambient sound" : "Enable ambient sound"}
            aria-pressed={sound}
            onClick={async () => {
              try {
                await setSound(!sound);
                soundState(!sound);
              } catch {
                notify("Audio is unavailable in this browser.");
              }
            }}
          >
            {sound ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
          </button>
        </div>
      </header>
      <div
        className={`twin-stage ${show3d ? "visible" : ""} ${app ? "workspace-stage" : ""}`}
        aria-hidden={!show3d}
        inert={!show3d ? true : undefined}
      >
        <div className="stage-caption">
          <span className="live-dot" /> {chapters[index].title.toUpperCase()} /
          ORIGINAL 3D DISTRICT{" "}
          <span className="stage-caption-detail">
            RIVERSIDE / SPATIAL EXPLORER
          </span>
        </div>
        <SceneBoundary onError={setSceneStatus}>
          <Suspense
            fallback={
              <div className="scene-status" role="status">
                Preparing 3D explorer…
              </div>
            }
          >
            {(show3d || sceneStarted) && (
              <Scene
                chapter={chapter}
                progress={Math.max(0, scroll - 1)}
                active={show3d}
                app={app}
                motion={motion}
                parameters={comparison ? defaults : parameters}
                palette={palette}
                onSelect={inspect}
                onStatus={setSceneStatus}
              />
            )}
          </Suspense>
        </SceneBoundary>
        <div className="stage-footer">
          <span>ILLUSTRATIVE DISTRICT · SIMULATED SCENARIO</span>
          <button
            onClick={() => setMotion(!motion)}
            className="text-button"
            aria-pressed={!motion}
          >
            {motion ? <Pause size={14} /> : <Play size={14} />}{" "}
            {motion ? "Pause motion" : "Resume motion"}
          </button>
        </div>
      </div>
      {!app ? (
        <main id="main" tabIndex={-1}>
          <section className="hero" aria-labelledby="hero-title">
            <img
              className="hero-image"
              src="/assets/city-atmosphere.webp"
              alt="Cinematic illustration of a river city at dusk with green parks and illuminated buildings"
              style={{
                transform: motion
                  ? `scale(${1 + Math.min(scroll, 0.9) * 0.045}) translateY(${Math.min(scroll, 1) * -18}px)`
                  : undefined,
              }}
            />
            <div className="hero-shade" />
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> URBAN CLIMATE INTELLIGENCE TWIN
              </div>
              <h1 id="hero-title">
                A city you
                <br />
                can <em>understand.</em>
              </h1>
              <p>
                Explore urban heat, flooding
                <br className="desktop-break" /> and cleaner futures.
              </p>
              <button
                className="primary-button"
                onClick={() => navigate("city")}
              >
                Explore the twin <ArrowRight size={23} />
              </button>
            </div>
            <button
              className="map-label park-label"
              onClick={() => setSelection("park")}
            >
              <span /> RIVERSIDE PARK
            </button>
            <button
              className="map-label quarter-label"
              onClick={() => setSelection("tower")}
            >
              <span /> NORTH QUARTER
            </button>
            <button
              className="map-label river-label"
              onClick={() => setSelection("river")}
            >
              <span /> RIVER CORRIDOR
            </button>
            <button
              className="map-label central-label"
              onClick={() => setSelection("park")}
            >
              <span /> CENTRAL PARK
            </button>
            <aside className="hero-inspector" aria-live="polite">
              <img src="/assets/city-atmosphere.webp" alt="" />
              <div>
                <h3>{selected.title}</h3>
                <span>
                  <Database size={12} /> Simulated scenario
                </span>
                <p>{selected.body.slice(0, 100)}…</p>
              </div>
              <button
                className="round-button"
                aria-label={`Read about ${selected.title}`}
                onClick={() => setModal("place")}
              >
                <ArrowRight size={18} />
              </button>
            </aside>
            <button className="data-note" onClick={() => setModal("research")}>
              <span className="eyebrow">
                <Database size={16} /> SIMULATED SCENARIO
              </span>
              <span>
                Explore possibilities, with assumptions
                <br />
                in view. Not a validated forecast.
              </span>
              <span className="cinematic-note">
                Cinematic preview · scroll to enter 3D <CaretDown size={13} />
              </span>
            </button>
          </section>
          {chapters.map((c, i) => {
            const Icon = icons[i];
            return (
              <section
                className="chapter-section"
                id={c.id}
                key={c.id}
                aria-labelledby={`${c.id}-title`}
              >
                <div className="chapter-copy">
                  <span className="eyebrow">
                    <Icon size={19} /> {c.n} / {c.eyebrow}
                  </span>
                  <h2 id={`${c.id}-title`}>
                    {c.heading.map((s, j) => (
                      <span key={j}>
                        {s}
                        <br />
                      </span>
                    ))}
                  </h2>
                  <p>{c.description}</p>
                  <p className="chapter-detail">{c.detail}</p>
                  <button className="primary-button" onClick={launch}>
                    Open{" "}
                    {i === 0
                      ? "the explorer"
                      : `${c.title.toLowerCase()} scenario`}{" "}
                    <ArrowUpRight size={21} />
                  </button>
                  <div className="semantic-hotspots">
                    <button
                      onClick={() => {
                        setSelection("tower");
                        setModal("place");
                      }}
                    >
                      <Buildings size={15} /> Buildings
                    </button>
                    <button
                      onClick={() => {
                        setSelection("park");
                        setModal("place");
                      }}
                    >
                      <Tree size={15} /> Park
                    </button>
                    <button
                      onClick={() => {
                        setSelection("river");
                        setModal("place");
                      }}
                    >
                      <Drop size={15} /> River
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
          <section className="closing">
            <div className="eyebrow">FROM UNDERSTANDING TO ACTION</div>
            <h2>
              What could your
              <br />
              city become?
            </h2>
            <p>
              Explore the district. Change an assumption.
              <br />
              Make the possibilities visible.
            </p>
            <button className="primary-button" onClick={launch}>
              Create a scenario <ArrowRight size={22} />
            </button>
            <div className="closing-bottom">
              <span>AERIS — Urban Climate Intelligence Twin</span>
              <button onClick={() => setModal("research")}>
                Methodology & limitations <ArrowUpRight size={15} />
              </button>
              <a
                href="https://github.com/expertX221/AERIS-"
                target="_blank"
                rel="noreferrer"
              >
                <GithubLogo size={17} /> Source code
              </a>
            </div>
          </section>
        </main>
      ) : (
        <main className="workspace" id="main" tabIndex={-1}>
          <nav className="workspace-nav" aria-label="Climate scene">
            {chapters.map((c, i) => {
              const Icon = icons[i];
              return (
                <button
                  className={chapter === c.id ? "active" : ""}
                  key={c.id}
                  aria-pressed={chapter === c.id}
                  onClick={() => navigate(c.id)}
                >
                  <Icon size={24} />
                  <span>{c.title}</span>
                </button>
              );
            })}
            <button onClick={() => setModal("research")}>
              <Info size={23} />
              <span>Method</span>
            </button>
          </nav>
          <aside className="scenario-panel">
            <div className="eyebrow">
              <SlidersHorizontal size={16} /> SCENARIO LAB
            </div>
            <h1>
              Imagine a<br />
              <em>more resilient city.</em>
            </h1>
            <p className="muted">
              Adjust the district. Explore the trade-offs.
            </p>
            <div className="preset-heading">
              <span>START WITH A POSSIBILITY</span>
              <span>01—03</span>
            </div>
            <div className="preset-list">
              {presets.map((preset, i) => {
                const Icon = [Thermometer, Drop, Leaf][i];
                return (
                  <button key={preset.id} onClick={() => applyPreset(preset)}>
                    <Icon size={18} />
                    <span>
                      <strong>{preset.name}</strong>
                      <small>{preset.description}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                );
              })}
            </div>
            <div className="workspace-mode" role="status">
              <span className="live-dot" />
              {comparison
                ? "BASELINE VIEW · original parameters"
                : "SCENARIO VIEW · your parameters"}
            </div>
            <div className="parameters">
              {[
                ["canopy", "Tree canopy", Tree, "%"],
                ["roofs", "Cool roofs", Buildings, "%"],
                ["drainage", "Permeable ground", Drop, "%"],
                ["rainfall", "Rainfall scenario", Drop, "mm"],
              ].map(([k, label, Icon, unit]) => (
                <label className="parameter" key={k}>
                  <span>
                    <Icon size={17} />
                    {label}
                    <output htmlFor={`param-${k}`}>
                      {parameters[k]}
                      <small>{unit}</small>
                    </output>
                  </span>
                  <input
                    id={`param-${k}`}
                    aria-label={label}
                    type="range"
                    min="0"
                    max={k === "rainfall" ? 150 : 80}
                    step="5"
                    value={parameters[k]}
                    onChange={(e) => setParam(k, e.target.value)}
                  />
                  <span className="range-ends">
                    <small>0{unit}</small>
                    <small>
                      {k === "rainfall" ? 150 : 80}
                      {unit}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <div className="result-heading">
              <span>ILLUSTRATIVE RESPONSE</span>
              <button
                aria-label="Explain scenario calculation"
                onClick={() => setModal("research")}
              >
                <Info size={16} />
              </button>
            </div>
            <div className="results" aria-live="polite">
              <div>
                <span>Surface temperature</span>
                <strong>
                  {comparison ? baseline.surface : results.surface}
                  <small>°C</small>
                </strong>
                <span className="result-change">
                  {comparison
                    ? "Baseline parameters"
                    : `${(results.surface - baseline.surface).toFixed(1)}°C vs baseline`}
                </span>
              </div>
              <div>
                <span>Runoff index</span>
                <strong>
                  {comparison ? baseline.runoff : results.runoff}
                  <small>/ 200</small>
                </strong>
                <span className="result-change">
                  Relative demonstration index
                </span>
              </div>
            </div>
            <button
              className="primary-button run-scenario"
              onClick={() => setModal("results")}
            >
              View scenario results <ArrowRight size={18} />
            </button>
            <button
              className={`compare-button ${comparison ? "comparing" : ""}`}
              aria-pressed={comparison}
              onClick={() => setComparison(!comparison)}
            >
              {comparison
                ? "Viewing baseline · show scenario"
                : "Compare with baseline"}{" "}
              <ArrowRight size={18} />
            </button>
            <button className="load-saved text-button" onClick={loadSaved}>
              <FloppyDisk size={15} /> Restore saved scenario
            </button>
            <div className="save-row">
              <button className="primary-button" onClick={save}>
                <Check size={17} />{" "}
                {saved ? "Saved on device" : "Save scenario"}
              </button>
              <button
                className="round-button"
                onClick={share}
                aria-label="Share scenario"
              >
                <Copy size={18} />
              </button>
              <button
                className="round-button"
                onClick={exportScenario}
                aria-label="Export scenario JSON"
              >
                <DownloadSimple size={18} />
              </button>
            </div>
            <div className="model-disclaimer">
              <Database size={14} />
              <p>
                Simulated data. Transparent heuristic model.
                <br />
                For exploration, not planning or emergency decisions.{" "}
                <button onClick={() => setModal("research")}>
                  Read methodology.
                </button>
              </p>
            </div>
          </aside>
          <aside className="selection-panel" aria-live="polite">
            <span className="eyebrow">{selected.type}</span>
            <h2>{selected.title}</h2>
            <p>{selected.body}</p>
            <button className="text-button" onClick={() => setModal("place")}>
              Inspect details <ArrowUpRight size={16} />
            </button>
            <div className="selection-shortcuts">
              <button
                onClick={() => setSelection("tower")}
                aria-label="Inspect building"
              >
                <Buildings size={17} />
              </button>
              <button
                onClick={() => setSelection("park")}
                aria-label="Inspect park"
              >
                <Tree size={17} />
              </button>
              <button
                onClick={() => setSelection("river")}
                aria-label="Inspect river"
              >
                <Drop size={17} />
              </button>
            </div>
          </aside>
          <div className="workspace-bottom">
            <span>
              <span className="live-dot" />{" "}
              {sceneStatus === "ready"
                ? "3D GEOMETRY READY"
                : sceneStatus === "error"
                  ? "2D EXPLORER AVAILABLE"
                  : "LOADING 3D"}{" "}
              · {chapters[index].title}
            </span>
            <button
              onClick={() => {
                setParameters(defaults);
                setSaved(false);
                setComparison(false);
                setPresetName("Baseline scenario");
                notify("Baseline parameters restored.");
              }}
            >
              Reset scenario
            </button>
          </div>
        </main>
      )}
      {!app && (
        <nav className="chapter-nav" aria-label="Story chapters">
          {chapters.map((c) => (
            <button
              key={c.id}
              className={chapter === c.id && scroll > 0.5 ? "active" : ""}
              onClick={() => navigate(c.id)}
            >
              <span className="chapter-number">{c.n}</span>
              <span className="chapter-rule" />
              <span>
                <strong>{c.title}</strong>
                <small>{c.eyebrow}</small>
              </span>
            </button>
          ))}
        </nav>
      )}
      {!app && (
        <button
          className="motion-control"
          aria-label={motion ? "Pause animation" : "Resume animation"}
          aria-pressed={!motion}
          onClick={() => setMotion(!motion)}
        >
          {motion ? <Pause size={15} /> : <Play size={15} />}
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <Modal
          key={modal}
          title={
            modal === "research"
              ? "Possibilities, with assumptions in view."
              : modal === "share"
                ? "Share this scenario"
                : modal === "results"
                  ? "Make the difference visible."
                  : modal === "appearance"
                    ? "A different light on your city."
                    : selected.title
          }
          onClose={() => setModal(null)}
        >
          {modal === "results" ? (
            <>
              <Results
                parameters={parameters}
                name={presetName}
                onMethod={() => setModal("research")}
              />
              <div className="report-actions">
                <button
                  className="primary-button"
                  onClick={() => setModal(null)}
                >
                  Explore this scenario <ArrowRight size={18} />
                </button>
                <button className="text-button" onClick={exportScenario}>
                  Export results <DownloadSimple size={16} />
                </button>
              </div>
              <p className="report-disclaimer">
                Demonstration values from an invented heuristic. Baseline uses
                20% canopy, 15% roofs, 20% permeability and 60 mm rainfall.
                These are not validated climate estimates.
              </p>
            </>
          ) : modal === "appearance" ? (
            <>
              <p>
                Choose a coordinated material and interface palette. The
                district stays interactive in every view.
              </p>
              <div className="palette-choices">
                {palettes.map((p) => (
                  <button
                    key={p.id}
                    className={`palette-choice palette-${p.id}`}
                    aria-pressed={palette === p.id}
                    onClick={() => choosePalette(p.id)}
                  >
                    <span className="palette-swatches">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.description}</small>
                    </span>
                    {palette === p.id ? (
                      <Check size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                ))}
              </div>
              <button className="primary-button" onClick={() => setModal(null)}>
                Return to the city <ArrowRight size={18} />
              </button>
            </>
          ) : modal === "research" ? (
            <>
              <p>
                AERIS is a hackathon research prototype in ClimateTech &
                Sustainability. It connects a cinematic website to an
                interactive, original 3D district and a transparent scenario
                workspace.
              </p>
              <h3>What you are exploring</h3>
              <p>
                The city, thermal layer and flood extent are illustrative. No
                live sensors, calibrated forecasts, CFD, hydraulic simulation or
                trained AI models are used. The opening city is an AI-generated
                cinematic illustration; the explorer uses four original editable
                Blender models.
              </p>
              <h3>How the demonstration works</h3>
              <p>
                Baseline: 20% canopy, 15% cool roofs, 20% permeable ground and
                60 mm rainfall. Sliders use deliberately simple, uncalibrated
                relationships:
              </p>
              <ul>
                <li>
                  Surface °C = 41.8 − 0.055 × (canopy − 20) − 0.025 × (roofs −
                  15).
                </li>
                <li>
                  Runoff index = max(0, 1.2 × rainfall − 0.45 × (permeable
                  ground − 20) − 0.18 × (canopy − 20)), rounded.
                </li>
              </ul>
              <p>
                Coefficients and outputs are invented to demonstrate the
                interaction. They are not scientific estimates. Geometry scaling
                visualises interventions; it is not a physical simulation.
              </p>
              <h3>Research path</h3>
              <p>
                A validated version needs georeferenced terrain and building
                data, local observations, a calibrated model, uncertainty
                analysis and independent evaluation. Saved scenarios stay on
                your device; share links encode parameters without accounts.
              </p>
              <a
                className="text-button"
                href="https://github.com/expertX221/AERIS-"
                target="_blank"
                rel="noreferrer"
              >
                Explore implementation and limitations{" "}
                <ArrowUpRight size={17} />
              </a>
            </>
          ) : modal === "share" ? (
            <>
              <p>Copy this link to reopen the same scenario parameters.</p>
              <input
                className="share-input"
                aria-label="Scenario link"
                readOnly
                value={scenarioLink()}
                onFocus={(e) => e.target.select()}
              />
              <div className="report-actions">
                <button className="primary-button" onClick={copyShareLink}>
                  {shareCopied ? <Check size={17} /> : <Copy size={17} />}{" "}
                  {shareCopied ? "Copied" : "Copy scenario link"}
                </button>
                <a
                  className="text-button"
                  href={scenarioLink()}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open shared scenario <ArrowUpRight size={16} />
                </a>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">{selected.type}</span>
              <p>{selected.body}</p>
              <dl>
                {selected.facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                className="primary-button"
                onClick={() => {
                  setModal(null);
                  launch();
                }}
              >
                Explore in the twin <ArrowRight size={18} />
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
