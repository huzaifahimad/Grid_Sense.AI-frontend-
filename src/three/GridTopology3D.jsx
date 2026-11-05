import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ZONES, ZONE_COORDS, ZONE_CHANNEL_COLOR, ZONE_LABELS } from "../config/zones.js";
import { stateColor, toThreeColor } from "../config/tokens.js";
import { buildScene } from "./scene/buildScene.js";
import { makeTransformer, makeHub } from "./scene/transformer.js";
import { makeTransmissionLine } from "./scene/transmissionLine.js";
import { makeLabelSprite, makeGlowSprite } from "./scene/labels.js";
import { makeRadarSweep, makePulseRing } from "./scene/radarSweep.js";
import { makeReticle } from "./scene/reticle.js";

const NODE_POSITIONS = {
  HUB: new THREE.Vector3(0, -0.5, 0),
  ES: new THREE.Vector3(-3.3, -0.2, 1.1),
  GR: new THREE.Vector3(3.1, -0.3, -1.5),
  IT_SOUTH: new THREE.Vector3(1.5, -0.1, 2.5),
};

// Pointer travel below this stays a click on a node; above it the user was
// orbiting, and switching zones mid-drag would be wrong.
const CLICK_SLOP_PX = 6;
const CLICK_MAX_MS = 400;
const IDLE_BEFORE_RESUME_S = 2.5;
const IDLE_RAMP_S = 1.6;
const AUTO_ORBIT_RAD_S = 0.075;

const damp = (current, target, lambda, dt) =>
  dt <= 0 ? target : THREE.MathUtils.damp(current, target, lambda, dt);

export default function GridTopology3D({ assets, selectedZone, onSelectZone }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ assets: [], selectedZone: null });
  // Lets a data change trigger one repaint when motion is off and no loop runs.
  const repaintRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let built;
    try {
      built = buildScene(mount);
    } catch {
      const fallback = document.createElement("div");
      fallback.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "height:100%;color:var(--color-txt-muted);font-family:var(--font-mono);font-size:11px;" +
        "letter-spacing:0.14em;text-align:center;padding:24px;gap:8px;";
      fallback.innerHTML =
        "<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'" +
        " style='color:var(--color-cyan)' aria-hidden='true'>" +
        "<path d='M13.4 3 6.6 13.2h4.2L10.2 21l7.2-10.8h-4.4L13.4 3Z'/></svg>" +
        "<div style='color:var(--color-txt);font-weight:700;'>3D TOPOLOGY UNAVAILABLE</div>" +
        "<div>WebGL is not supported in this browser.<br/>All data panels remain fully functional.</div>";
      mount.appendChild(fallback);
      return () => {
        if (mount.contains(fallback)) mount.removeChild(fallback);
      };
    }

    const { renderer, scene, camera, compact } = built;
    const canvas = renderer.domElement;
    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // One time base for motion and idle detection: it advances only while the
    // loop runs, so a backgrounded tab does not fake a long user idle.
    let sceneTime = 0;

    /* ---------------- camera controls ---------------- */

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, -0.3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.rotateSpeed = compact ? 0.6 : 0.75;
    controls.zoomSpeed = 0.6;
    controls.minDistance = 5.2;
    controls.maxDistance = 15;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.42;
    // Touch: a vertical drag must keep scrolling the page, and pinch stays the
    // browser's page zoom. OrbitControls would set touch-action:none itself.
    if (compact) {
      canvas.style.touchAction = "pan-y pinch-zoom";
      controls.enableZoom = false;
    }
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.addEventListener("start", () => {
      userActive = true;
    });
    controls.addEventListener("end", () => {
      userActive = false;
      lastInteraction = sceneTime;
    });

    let userActive = false;
    let lastInteraction = 0;
    const spherical = new THREE.Spherical();
    const camOffset = new THREE.Vector3();

    function applyIdleOrbit(dt, t) {
      if (reducedMotion.matches || userActive) return;
      const idle = t - lastInteraction;
      if (idle < IDLE_BEFORE_RESUME_S) return;
      const ramp = Math.min((idle - IDLE_BEFORE_RESUME_S) / IDLE_RAMP_S, 1);
      camOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(camOffset);
      spherical.theta += AUTO_ORBIT_RAD_S * dt * ramp;
      spherical.phi += Math.sin(t * 0.18) * 0.0006 * ramp;
      spherical.makeSafe();
      camOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(camOffset);
    }

    // Keyboard equivalent for the drag gesture: arrows orbit, +/- dolly.
    function onKeyDown(event) {
      const step = 0.16;
      let handled = true;
      switch (event.key) {
        case "ArrowLeft":
          rotateBy(-step, 0);
          break;
        case "ArrowRight":
          rotateBy(step, 0);
          break;
        case "ArrowUp":
          rotateBy(0, -step * 0.6);
          break;
        case "ArrowDown":
          rotateBy(0, step * 0.6);
          break;
        case "+":
        case "=":
          dollyBy(0.9);
          break;
        case "-":
        case "_":
          dollyBy(1.1);
          break;
        default:
          handled = false;
      }
      if (handled) {
        event.preventDefault();
        lastInteraction = sceneTime;
        controls.update();
        requestRepaint();
      }
    }

    function rotateBy(dTheta, dPhi) {
      camOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(camOffset);
      spherical.theta += dTheta;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + dPhi,
        controls.minPolarAngle + 0.01,
        controls.maxPolarAngle - 0.01
      );
      spherical.makeSafe();
      camOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(camOffset);
      controls.update();
    }

    function dollyBy(factor) {
      camOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(camOffset);
      spherical.radius = THREE.MathUtils.clamp(
        spherical.radius * factor,
        controls.minDistance,
        controls.maxDistance
      );
      camOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(camOffset);
      controls.update();
    }

    canvas.addEventListener("keydown", onKeyDown);

    /* ---------------- scene contents ---------------- */

    const hub = makeHub();
    scene.add(hub);

    const hubLabel = makeLabelSprite("HUB", "CENTRAL DISPATCH", 0x35d6e8);
    hubLabel.position.set(0, 0.1, 0);
    scene.add(hubLabel);
    track(hubLabel.material.map);
    track(hubLabel.material);

    const hubGlow = makeGlowSprite(0x35d6e8);
    hubGlow.position.set(0, -0.5, 0);
    hubGlow.scale.setScalar(1.8);
    scene.add(hubGlow);
    track(hubGlow.material.map);
    track(hubGlow.material);

    const sweep = makeRadarSweep(0x35d6e8, compact ? 6.4 : 8.2);
    scene.add(sweep.mesh);
    track(sweep);

    const hubPulse = makePulseRing(0x35d6e8, compact ? 2.6 : 3.4);
    scene.add(hubPulse.mesh);
    track(hubPulse);

    const particleCount = compact ? 6 : 10;

    const nodeGroups = {};
    const ringMeshes = {};
    const glowSprites = {};
    const hitMeshes = {};
    const labels = {};
    const reticles = {};
    const nodePulses = {};
    const transmissionLines = [];

    ZONES.forEach((zone) => {
      const channelColor = ZONE_CHANNEL_COLOR[zone];

      const group = new THREE.Group();
      group.add(makeTransformer(0.8));
      group.position.copy(NODE_POSITIONS[zone]);
      group.userData.zone = zone;
      scene.add(group);
      nodeGroups[zone] = group;

      const hitGeo = new THREE.SphereGeometry(0.55, 10, 10);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.copy(NODE_POSITIONS[zone]);
      hit.userData.zone = zone;
      scene.add(hit);
      hitMeshes[zone] = hit;
      track({ dispose: () => { hitGeo.dispose(); hitMat.dispose(); } });

      const ringGeo = new THREE.TorusGeometry(0.52, 0.015, compact ? 6 : 8, compact ? 32 : 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: channelColor,
        emissive: channelColor,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
        metalness: 0.8,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(NODE_POSITIONS[zone]);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      ringMeshes[zone] = ring;
      track({ dispose: () => { ringGeo.dispose(); ringMat.dispose(); } });

      const glow = makeGlowSprite(channelColor);
      glow.position.copy(NODE_POSITIONS[zone]);
      scene.add(glow);
      glowSprites[zone] = glow;
      track({ dispose: () => { glow.material.map?.dispose(); glow.material.dispose(); } });

      const label = makeLabelSprite(zone.replace("_", "-"), ZONE_COORDS[zone], channelColor);
      label.position.copy(NODE_POSITIONS[zone].clone().add(new THREE.Vector3(0, 0.7, 0)));
      scene.add(label);
      labels[zone] = label;
      track({ dispose: () => { label.material.map?.dispose(); label.material.dispose(); } });

      const reticle = makeReticle(channelColor);
      reticle.group.position.copy(NODE_POSITIONS[zone]);
      scene.add(reticle.group);
      reticles[zone] = reticle;
      track(reticle);

      const pulse = makePulseRing(channelColor, 1.6);
      pulse.mesh.position.copy(NODE_POSITIONS[zone]).setY(NODE_POSITIONS[zone].y - 0.32);
      scene.add(pulse.mesh);
      nodePulses[zone] = { pulse, nextAt: 0 };
      track(pulse);

      const lineData = makeTransmissionLine(
        NODE_POSITIONS.HUB,
        NODE_POSITIONS[zone],
        channelColor,
        particleCount
      );
      scene.add(lineData.group);
      track(lineData);
      transmissionLines.push({ ...lineData, zone });
    });

    /* ---------------- picking ---------------- */

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitTargets = Object.values(hitMeshes);
    let pointerInside = false;
    let pointerDirty = false;
    let hoveredZone = null;
    let press = null;

    function toNdc(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerMove(event) {
      toNdc(event);
      pointerInside = true;
      pointerDirty = true;
    }

    function onPointerDown(event) {
      press = { x: event.clientX, y: event.clientY, at: performance.now() };
      lastInteraction = sceneTime;
    }

    function onPointerUp(event) {
      if (!press) return;
      const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      const held = performance.now() - press.at;
      press = null;
      if (moved > CLICK_SLOP_PX || held > CLICK_MAX_MS) return;
      toNdc(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length > 0) onSelectZone(hits[0].object.userData.zone);
    }

    function onPointerLeave() {
      pointerInside = false;
      hoveredZone = null;
      canvas.style.cursor = "default";
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    function pickHovered() {
      if (!pointerDirty || !pointerInside) return;
      pointerDirty = false;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      const next = hits.length > 0 ? hits[0].object.userData.zone : null;
      if (next !== hoveredZone) {
        hoveredZone = next;
        canvas.style.cursor = next ? "pointer" : "grab";
        requestRepaint();
      }
    }

    canvas.style.cursor = "grab";

    /* ---------------- aria summary ---------------- */

    function describe() {
      const list = stateRef.current.assets || [];
      if (!list.length) return "Grid topology loading.";
      const parts = list
        .map((a) => `${a.zone.replace("_", "-")} ${Math.round(a.risk_score * 100)} percent ${a.status}`)
        .join("; ");
      const sel = stateRef.current.selectedZone;
      return `Three-dimensional topology: central dispatch hub linked to ${list.length} interconnections. ${parts}.${sel ? ` Selected: ${sel.replace("_", "-")} — ${ZONE_LABELS[sel] || sel}.` : ""}`;
    }

    function syncAria() {
      canvas.setAttribute("aria-label", describe());
    }

    /* ---------------- animation ---------------- */

    const riskColor = new THREE.Color();
    let lastFrameMs = 0;
    const highlight = {};
    ZONES.forEach((z) => {
      highlight[z] = { amount: 0, risk: 0.3 };
    });
    let frameId;
    let inView = true;
    let pageVisible = !document.hidden;
    let repaintQueued = false;

    function requestRepaint() {
      syncAria();
      if (reducedMotion.matches) {
        if (repaintQueued) return;
        repaintQueued = true;
        requestAnimationFrame(() => {
          repaintQueued = false;
          draw(0);
          render();
        });
      }
    }
    repaintRef.current = requestRepaint;

    function render() {
      renderer.render(scene, camera);
    }

    function draw(dt) {
      sceneTime += dt;
      const t = sceneTime;
      const currentAssets = stateRef.current.assets || [];
      const currentSelected = stateRef.current.selectedZone;

      pickHovered();

      ZONES.forEach((zone) => {
        const asset = currentAssets.find((a) => a.zone === zone);
        const risk = asset ? asset.risk_score : 0;
        const h = highlight[zone];
        h.risk = damp(h.risk, risk, 3, dt);
        riskColor.set(toThreeColor(stateColor(asset ? asset.status : "normal")));

        const group = nodeGroups[zone];
        const ring = ringMeshes[zone];
        const glow = glowSprites[zone];
        const line = transmissionLines.find((l) => l.zone === zone);

        const isSelected = currentSelected === zone;
        const isHovered = hoveredZone === zone;
        const targetAmount = isSelected ? 1 : isHovered ? 0.55 : 0;
        h.amount = damp(h.amount, targetAmount, 8, dt);

        ring.material.color.lerp(riskColor, dt <= 0 ? 1 : 0.02 + h.risk * 0.06);
        ring.material.emissive.copy(ring.material.color);
        ring.material.emissiveIntensity = 0.45 + h.amount * 0.75;
        group.rotation.y = t * (0.1 + h.risk * 0.15);

        const pulseSpeed = 1.2 + h.risk * 3.5;
        const pulse = 0.5 + 0.5 * Math.sin(t * pulseSpeed);
        ring.scale.setScalar(1 + pulse * 0.07 * h.risk + h.amount * 0.06);
        ring.rotation.z = t * (0.3 + h.risk * 0.5);
        glow.material.opacity = 0.18 + h.risk * 0.3 + pulse * 0.1 * h.risk + h.amount * 0.2;
        glow.scale.setScalar(1 + h.risk * 0.75 + pulse * 0.16 * h.risk + h.amount * 0.18);

        group.scale.setScalar(1 + h.amount * 0.15);

        // Shape cue, not colour cue: only the selected node wears the reticle.
        const reticle = reticles[zone];
        reticle.group.visible = isSelected || isHovered;
        reticle.setColor(toThreeColor(stateColor(asset ? asset.status : "normal")));
        reticle.arcs.scale.setScalar(0.94 + h.amount * 0.08);
        if (isSelected || isHovered) reticle.update(t);

        labels[zone].material.opacity = 0.55 + h.amount * 0.45;

        if (line) {
          line.signalLine.material.opacity = 0.5 + h.amount * 0.45;
          line.particles.points.material.size = 0.06 + h.amount * 0.03;
        }

        // Critical nodes keep emitting an expanding alarm ring.
        const np = nodePulses[zone];
        if (asset && asset.status === "critical") {
          np.pulse.setColor(riskColor);
          if (t >= np.nextAt) {
            np.pulse.spawn();
            np.nextAt = t + 2.2;
          }
        } else {
          np.nextAt = 0;
        }
        np.pulse.update(dt);
      });

      hubPulse.update(dt);
      if (t >= hubPulseNext) {
        hubPulse.spawn();
        hubPulseNext = t + 4.4;
      }

      sweep.update(dt, 0.55);

      transmissionLines.forEach(({ particles, zone }) => {
        const asset = currentAssets.find((a) => a.zone === zone);
        const risk = asset ? asset.risk_score : 0.3;
        particles.update(0.5 + risk * 2.5 + highlight[zone].amount * 0.8);
      });
    }

    let hubPulseNext = 1.2;

    function loop(now = performance.now()) {
      if (!inView || !pageVisible) {
        frameId = undefined;
        return;
      }
      frameId = requestAnimationFrame(loop);
      // Clamped so a backgrounded tab resumes in place instead of jumping.
      const dt = lastFrameMs ? Math.min((now - lastFrameMs) / 1000, 0.05) : 0;
      lastFrameMs = now;
      applyIdleOrbit(dt, sceneTime);
      controls.update();
      draw(dt);
      render();
    }

    function startLoop() {
      if (frameId === undefined && inView && pageVisible) {
        lastFrameMs = 0;
        loop();
      }
    }

    function stopLoop() {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
        frameId = undefined;
      }
    }

    function applyMotionPreference() {
      if (reducedMotion.matches) {
        stopLoop();
        draw(0);
        controls.update();
        render();
      } else {
        startLoop();
      }
    }

    syncAria();
    applyMotionPreference();
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", applyMotionPreference);
    }

    function resume() {
      if (inView && pageVisible && !reducedMotion.matches) startLoop();
    }

    function handleVisibility() {
      pageVisible = !document.hidden;
      resume();
      if (reducedMotion.matches) requestRepaint();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // ResizeObserver tracks the panel itself, which a window listener misses
    // when the layout reflows without a window resize.
    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRepaint();
    });
    resizeObserver.observe(mount);

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      resume();
    });
    observer.observe(mount);

    return () => {
      stopLoop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (typeof reducedMotion.removeEventListener === "function") {
        reducedMotion.removeEventListener("change", applyMotionPreference);
      }
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("keydown", onKeyDown);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      if (mount.contains(canvas)) mount.removeChild(canvas);
      renderer.dispose();
      repaintRef.current = null;
    };
  }, [onSelectZone]);

  useEffect(() => {
    stateRef.current.assets = assets;
    stateRef.current.selectedZone = selectedZone;
    repaintRef.current?.();
  }, [assets, selectedZone]);

  return <div ref={mountRef} className="w-full h-full min-h-0 overflow-hidden" />;
}
