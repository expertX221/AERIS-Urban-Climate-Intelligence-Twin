import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowsOut,
  Cube,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function Scene({
  chapter,
  progress,
  active,
  app,
  motion,
  parameters,
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
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute(
        "aria-label",
        "Interactive 3D district. Drag to orbit; select buildings for details.",
      );
      renderer.domElement.setAttribute("role", "img");
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(37, 1, 0.1, 180);
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
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x65bfdb, 1.6);
      fill.position.set(12, 9, -12);
      scene.add(fill);
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
      runtime.current = { change, reset, rotate };
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
        const hit = ray.intersectObject(current, true)[0];
        if (!hit) return;
        if (selected && originals.has(selected))
          selected.material.emissive.copy(originals.get(selected));
        selected = hit.object;
        if (selected.material.emissive) {
          originals.set(selected, selected.material.emissive.clone());
          selected.material.emissive.set(0x215653);
        }
        latest.current.onSelect(selected.name);
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
            k = `${wanted}/${canopy}/${roofs}/${rainfall}/${drainage}`;
          if (k !== paramKey) {
            paramKey = k;
            const coolColor = new THREE.Color(0xb2d3c9);
            current.traverse((o) => {
              if (o.name.startsWith("Tree_canopy") && o.userData.baseScale)
                o.scale
                  .copy(o.userData.baseScale)
                  .multiplyScalar(0.8 + canopy / 100);
              if (
                o.name.includes("_roof") &&
                o.material?.color &&
                o.userData.baseColor
              )
                o.material.color
                  .copy(o.userData.baseColor)
                  .lerp(coolColor, roofs / 100);
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
        </div>
      )}
    </>
  );
}
