import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowsOut,
  Cube,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
} from "@phosphor-icons/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export function Scene({
  chapter,
  progress,
  active,
  app,
  motion,
  parameters,
  palette = "midnight",
  onSelect,
  onStatus,
}) {
  const hostRef = useRef(),
    runtime = useRef(),
    latest = useRef({});
  const [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  latest.current = {
    chapter,
    progress,
    active,
    app,
    motion,
    parameters,
    palette,
    onSelect,
    onStatus,
  };
  useEffect(() => {
    const host = hostRef.current;
    let renderer,
      dead = false,
      frame,
      observer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute(
        "aria-label",
        "Interactive 3D district. Drag to orbit; select buildings for details.",
      );
      renderer.domElement.setAttribute("role", "img");
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(37, 1, 0.1, 180);
      const pmrem = new THREE.PMREMGenerator(renderer),
        environment = new RoomEnvironment(),
        environmentMap = pmrem.fromScene(environment, 0.04);
      scene.environment = environmentMap.texture;
      scene.environmentIntensity = 0.3;
      environment.dispose();
      pmrem.dispose();
      camera.position.set(...(innerWidth < 760 ? [36, 30, 38] : [29, 25, 31]));
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = 0.4;
      controls.maxPolarAngle = 1.35;
      controls.target.set(0, 1, 0);
      scene.add(new THREE.HemisphereLight(0x9bd9ee, 0x182e2c, 1.3));
      const key = new THREE.DirectionalLight(0xffd7ad, 2.4);
      key.position.set(-8, 20, 12);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, {
        left: -24,
        right: 24,
        top: 24,
        bottom: -24,
        near: 0.1,
        far: 65,
      });
      key.shadow.bias = -0.0003;
      key.shadow.normalBias = 0.04;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x65bfdb, 1.6);
      fill.position.set(12, 9, -12);
      scene.add(fill);
      const flow = new THREE.Group();
      scene.add(flow);
      const flowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8bdce5,
        transparent: true,
        opacity: 0.4,
      });
      const flowPaths = [],
        flowBeads = [];
      for (let lane = -1; lane <= 1; lane++) {
        const curve = new THREE.CatmullRomCurve3(
          Array.from(
            { length: 17 },
            (_, i) =>
              new THREE.Vector3(
                -14 + i * 1.75,
                0.22 + Math.sin(i * 0.3) * 0.03,
                lane * 0.62 + Math.sin(i * 0.45) * 0.12,
              ),
          ),
        );
        flowPaths.push(curve);
        flow.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(curve, 64, 0.012, 4, false),
            flowMaterial,
          ),
        );
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xb2eeee }),
        );
        flow.add(bead);
        flowBeads.push(bead);
      }
      const rainCount = 100,
        rainPositions = new Float32Array(rainCount * 6);
      for (let i = 0; i < rainCount; i++) {
        const x = Math.sin(i * 47.1) * 13,
          y = (i * 0.731) % 9,
          z = Math.cos(i * 13.7) * 9;
        rainPositions.set([x, y, z, x + 0.025, y - 0.25, z], i * 6);
      }
      const rainGeometry = new THREE.BufferGeometry();
      rainGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(rainPositions, 3),
      );
      const rain = new THREE.LineSegments(
        rainGeometry,
        new THREE.LineBasicMaterial({
          color: 0x99ddec,
          transparent: true,
          opacity: 0.4,
        }),
      );
      scene.add(rain);
      const materialPalettes = {
        midnight: {
          stone: 0x183444,
          glass: 0x0b2533,
          trim: 0x527079,
          ground: 0x112d32,
          water: 0x0a788a,
          foliage: 0x24705b,
          bronze: 0x9b7249,
          hot: 0xe68343,
          cool: 0x92bdc1,
        },
        verdigris: {
          stone: 0x254a44,
          glass: 0x113a38,
          trim: 0x6a8872,
          ground: 0x163831,
          water: 0x1c8c79,
          foliage: 0x4f8c4a,
          bronze: 0xbb965e,
          hot: 0xe29e49,
          cool: 0xb2c8a1,
        },
        dune: {
          stone: 0x9c8a74,
          glass: 0x3c626b,
          trim: 0xc1b6a0,
          ground: 0x625b4b,
          water: 0x268a9d,
          foliage: 0x527a59,
          bronze: 0xa66342,
          hot: 0xd96745,
          cool: 0xd8d4bc,
        },
      };
      const groups = new Map(),
        pending = new Map();
      let current,
        old,
        transition = 1,
        wanted = "",
        selected;
      const originals = new Map(),
        ray = new THREE.Raycaster(),
        pointer = new THREE.Vector2();
      const load = (id) => {
        if (groups.has(id)) return Promise.resolve(groups.get(id));
        if (pending.has(id)) return pending.get(id);
        const p = new GLTFLoader()
          .loadAsync(`/models/${id}.glb`)
          .then((g) => {
            if (dead) return g.scene;
            g.scene.traverse((o) => {
              if (o.isMesh) {
                o.material = o.material.clone();
                o.userData.baseColor = o.material.color?.clone();
                o.userData.baseScale = o.scale.clone();
                o.userData.baseEmission = o.material.emissive?.clone();
                o.castShadow = /^Building_\d+$|^Tree_canopy/.test(o.name);
                o.receiveShadow = true;
              }
            });
            groups.set(id, g.scene);
            return g.scene;
          })
          .finally(() => pending.delete(id));
        pending.set(id, p);
        return p;
      };
      const change = async (id) => {
        wanted = id;
        setStatus("loading");
        latest.current.onStatus?.("loading");
        try {
          const g = await load(id);
          if (dead || wanted !== id) return;
          if (old) scene.remove(old);
          old = current;
          current = g;
          transition = latest.current.motion ? 0 : 1;
          paramKey = "";
          current.scale.setScalar(latest.current.motion ? 0.96 : 1);
          scene.add(current);
          setStatus("ready");
          latest.current.onStatus?.("ready");
        } catch {
          if (!dead) {
            setStatus("error");
            latest.current.onStatus?.("error");
          }
        }
      };
      const reset = () => {
        camera.position.set(
          ...(innerWidth < 760 ? [36, 30, 38] : [29, 25, 31]),
        );
        controls.target.set(0, 1, 0);
        controls.update();
      };
      const rotate = (n) => {
        const v = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), n);
        camera.position.copy(v.add(controls.target));
        controls.update();
      };
      const zoom = (factor) => {
        const vector = camera.position.clone().sub(controls.target);
        const distance = THREE.MathUtils.clamp(
          vector.length() * factor,
          25,
          75,
        );
        camera.position.copy(vector.setLength(distance).add(controls.target));
        controls.update();
      };
      runtime.current = { change, reset, rotate, zoom };
      let down;
      const start = (e) => (down = [e.clientX, e.clientY]);
      const click = (e) => {
        if (
          !current ||
          !down ||
          Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5
        )
          return;
        const r = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        const hits = ray.intersectObject(current, true);
        const nearest = hits[0];
        // Decorative frame batches sit just above the building faces.
        // Resolve the underlying semantic object rather than selecting the trim.
        const hit =
          hits.find(
            (h) =>
              h.distance <= (nearest?.distance ?? 0) + 0.4 &&
              /^(Building_\d+|Tree_canopy|River_corridor|Flood_extent|Rain_garden)/.test(
                h.object.name,
              ),
          ) || nearest;
        if (!hit) return;
        if (selected && originals.has(selected))
          selected.material.emissive.copy(originals.get(selected));
        selected = hit.object;
        if (selected.material.emissive) {
          originals.set(selected, selected.material.emissive.clone());
          selected.material.emissive.set(0x215653);
        }
        const match = selected.name.match(/Building_(\d+)/),
          building = match
            ? current.getObjectByName(`Building_${match[1]}`)
            : null;
        latest.current.onSelect(
          building
            ? {
                name: building.name,
                height: building.userData.height_units,
                floors: building.userData.floors,
                use: building.userData.use_type,
              }
            : selected.name,
        );
      };
      renderer.domElement.addEventListener("pointerdown", start);
      renderer.domElement.addEventListener("click", click);
      observer = new ResizeObserver(() => {
        const r = host.getBoundingClientRect();
        renderer.setSize(r.width, r.height);
        camera.aspect = r.width / Math.max(r.height, 1);
        camera.updateProjectionMatrix();
      });
      observer.observe(host);
      let last = 0,
        paramKey = "";
      const tick = (now) => {
        if (dead) return;
        frame = requestAnimationFrame(tick);
        if (document.hidden || !latest.current.active) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        flow.visible =
          latest.current.chapter === "water" ||
          latest.current.chapter === "regeneration" ||
          latest.current.chapter === "city";
        flowBeads.forEach((bead, i) =>
          bead.position.copy(
            flowPaths[i].getPointAt(
              latest.current.motion ? (now * 0.000025 + i * 0.32) % 1 : 0.4,
            ),
          ),
        );
        rain.visible =
          latest.current.chapter === "water" &&
          latest.current.parameters.rainfall > 70;
        if (rain.visible && latest.current.motion) {
          for (let i = 0; i < rainCount; i++) {
            const k = i * 6;
            rainPositions[k + 1] -= dt * 3;
            if (rainPositions[k + 1] < 0.3) rainPositions[k + 1] = 9;
            rainPositions[k + 4] = rainPositions[k + 1] - 0.25;
          }
          rainGeometry.attributes.position.needsUpdate = true;
        }
        if (current) {
          transition = latest.current.motion
            ? Math.min(1, transition + dt * 2.4)
            : 1;
          if (old) {
            current.traverse((o) => {
              if (o.isMesh) {
                o.material.transparent = transition < 1;
                o.material.opacity = transition;
                o.material.depthWrite = transition === 1;
              }
            });
            old.traverse((o) => {
              if (o.isMesh) {
                o.material.transparent = true;
                o.material.opacity = 1 - transition;
                o.material.depthWrite = false;
              }
            });
          }
          current.scale.setScalar(
            THREE.MathUtils.lerp(current.scale.x, 1, 0.09),
          );
          if (old && transition === 1) {
            scene.remove(old);
            old = null;
          }
          const { canopy, roofs, rainfall, drainage } =
              latest.current.parameters,
            k = `${wanted}/${canopy}/${roofs}/${rainfall}/${drainage}/${latest.current.palette}`;
          if (k !== paramKey) {
            paramKey = k;
            const scheme =
              materialPalettes[latest.current.palette] ||
              materialPalettes.midnight;
            const coolColor = new THREE.Color(scheme.cool);
            current.traverse((o) => {
              if (o.isMesh && o.userData.baseColor) {
                const m = o.material.name.toLowerCase();
                o.material.color.copy(o.userData.baseColor);
                const key = m.startsWith("midnight limestone")
                  ? "stone"
                  : m.startsWith("blue smoked")
                    ? "glass"
                    : m.startsWith("detail architectural")
                      ? "trim"
                      : m.startsWith("district terrain")
                        ? "ground"
                        : m.startsWith("river") ||
                            m.startsWith("illustrative inundation")
                          ? "water"
                          : m.startsWith("canopy") ||
                              m.startsWith("living ground") ||
                              m.includes("roof gardens")
                            ? "foliage"
                            : m.startsWith("detail brushed")
                              ? "bronze"
                              : null;
                if (key) o.material.color.set(scheme[key]);
                if (m.startsWith("illustrative thermal"))
                  o.material.color
                    .set(scheme.hot)
                    .lerp(
                      new THREE.Color(scheme.cool),
                      Math.max(0, (canopy - 20) * 0.006 + (roofs - 15) * 0.003),
                    );
              }
              if (o.name.startsWith("Tree_canopy") && o.userData.baseScale)
                o.scale
                  .copy(o.userData.baseScale)
                  .multiplyScalar(0.65 + canopy / 90);
              if (o.name.startsWith("Tree_canopy")) o.visible = canopy > 0;
              if (
                o.name.includes("_roof") &&
                o.material?.color &&
                o.userData.baseColor
              )
                o.material.color.lerp(coolColor, roofs / 100);
              if (o.name.startsWith("Rain_garden") && o.userData.baseScale)
                o.scale
                  .copy(o.userData.baseScale)
                  .multiplyScalar(0.65 + drainage / 100);
              if (o.name === "Flood_extent" && o.userData.baseScale) {
                o.scale.copy(o.userData.baseScale);
                o.scale.z *= Math.max(
                  0.2,
                  rainfall / 60 - (drainage - 20) / 120,
                );
              }
            });
          }
          if (!latest.current.app) {
            const p = latest.current.motion ? latest.current.progress : 0,
              a = 0.74 + p * 0.3,
              r = innerWidth < 760 ? 48 : 42,
              t = new THREE.Vector3(
                Math.sin(a) * r,
                24 - p * 2,
                Math.cos(a) * r,
              );
            if (latest.current.motion) camera.position.lerp(t, 0.035);
            else camera.position.copy(t);
          }
        }
        controls.enabled = latest.current.app;
        controls.autoRotate = latest.current.app && latest.current.motion;
        controls.autoRotateSpeed = 0.18;
        controls.update();
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);
      renderer.domElement.addEventListener("webglcontextlost", () => {
        setStatus("error");
        latest.current.onStatus?.("error");
      });
      return () => {
        dead = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        groups.forEach((g) =>
          g.traverse((o) => {
            o.geometry?.dispose();
            o.material?.dispose();
          }),
        );
        renderer.dispose();
        environmentMap.dispose();
        flow.traverse((o) => {
          o.geometry?.dispose();
          o.material?.dispose();
        });
        rainGeometry.dispose();
        rain.material.dispose();
        renderer.domElement.remove();
        runtime.current = null;
      };
    } catch {
      setStatus("error");
      latest.current.onStatus?.("error");
      renderer?.dispose();
    }
  }, [retry]);
  useEffect(() => {
    runtime.current?.change(chapter);
  }, [chapter, retry]);
  return (
    <>
      <div ref={hostRef} className="canvas-mount" />
      {status === "loading" && (
        <div role="status" className="scene-status">
          <Cube size={18} /> Loading district geometry…
        </div>
      )}
      {status === "error" && (
        <div className="scene-error">
          <Cube size={32} />
          <h3>Explore without 3D</h3>
          <p>
            The 3D view is unavailable. All district information and scenarios
            remain available using the controls.
          </p>
          <button
            className="text-button"
            onClick={() => setRetry((x) => x + 1)}
          >
            Retry 3D <ArrowCounterClockwise />
          </button>
        </div>
      )}
      {app && status === "ready" && (
        <div className="scene-tools">
          <button
            aria-label="Rotate city left"
            onClick={() => runtime.current?.rotate(-0.3)}
          >
            <ArrowLeft />
          </button>
          <button
            aria-label="Reset camera"
            onClick={() => runtime.current?.reset()}
          >
            <ArrowsOut />
          </button>
          <button
            aria-label="Rotate city right"
            onClick={() => runtime.current?.rotate(0.3)}
          >
            <ArrowRight />
          </button>
          <span>Drag to orbit · click to inspect</span>
          <button
            aria-label="Zoom in"
            onClick={() => runtime.current?.zoom(0.86)}
          >
            <Plus />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => runtime.current?.zoom(1.16)}
          >
            <Minus />
          </button>
        </div>
      )}
    </>
  );
}
