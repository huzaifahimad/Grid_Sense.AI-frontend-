import { useRef, useEffect } from "react";
import * as THREE from "three";
import { ZONES, ZONE_COORDS, ZONE_CHANNEL_COLOR } from "../config/zones.js";
import { stateColor } from "../config/tokens.js";
import { buildScene } from "./scene/buildScene.js";
import { makeTransformer, makeHub } from "./scene/transformer.js";
import { makeTransmissionLine } from "./scene/transmissionLine.js";
import { makeLabelSprite, makeGlowSprite } from "./scene/labels.js";

export default function GridTopology3D({ assets, selectedZone, onSelectZone }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer, scene, camera;
    try {
      const result = buildScene(mount);
      renderer = result.renderer;
      scene = result.scene;
      camera = result.camera;
    } catch {
      const fallback = document.createElement("div");
      fallback.style.cssText =
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "height:100%;color:#4E6076;font-family:'Space Mono',monospace;font-size:11px;" +
        "letter-spacing:0.08em;text-align:center;padding:24px;gap:8px;";
      fallback.innerHTML =
        "<div style='font-size:22px;color:#35D6E8;'>&#9889;</div>" +
        "<div style='color:#EAF0F5;font-weight:700;'>3D TOPOLOGY UNAVAILABLE</div>" +
        "<div>WebGL is not supported in this browser.<br/>All data panels remain fully functional.</div>";
      mount.appendChild(fallback);
      return () => {
        if (mount.contains(fallback)) mount.removeChild(fallback);
      };
    }

    const hub = makeHub();
    scene.add(hub);

    const hubLabel = makeLabelSprite("HUB", "CENTRAL DISPATCH", 0x35d6e8);
    hubLabel.position.set(0, 0.1, 0);
    scene.add(hubLabel);

    const hubGlow = makeGlowSprite(0x35d6e8);
    hubGlow.position.set(0, -0.5, 0);
    hubGlow.scale.setScalar(1.8);
    scene.add(hubGlow);

    const nodePositions = {
      HUB: new THREE.Vector3(0, -0.5, 0),
      ES: new THREE.Vector3(-3.3, -0.2, 1.1),
      GR: new THREE.Vector3(3.1, -0.3, -1.5),
      IT_SOUTH: new THREE.Vector3(1.5, -0.1, 2.5),
    };

    const nodeGroups = {};
    const ringMeshes = {};
    const glowSprites = {};
    const hitMeshes = {};
    const transmissionLines = [];

    ZONES.forEach((zone) => {
      const channelColor = ZONE_CHANNEL_COLOR[zone];
      const group = new THREE.Group();

      const transformer = makeTransformer(0.8);
      group.add(transformer);

      group.position.copy(nodePositions[zone]);
      group.userData.zone = zone;
      scene.add(group);
      nodeGroups[zone] = group;

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.copy(nodePositions[zone]);
      hit.userData.zone = zone;
      scene.add(hit);
      hitMeshes[zone] = hit;

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.015, 8, 48),
        new THREE.MeshStandardMaterial({
          color: channelColor,
          emissive: channelColor,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      ring.position.copy(nodePositions[zone]);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      ringMeshes[zone] = ring;

      const glow = makeGlowSprite(channelColor);
      glow.position.copy(nodePositions[zone]);
      scene.add(glow);
      glowSprites[zone] = glow;

      const label = makeLabelSprite(
        zone.replace("_", "-"),
        ZONE_COORDS[zone],
        channelColor
      );
      label.position.copy(
        nodePositions[zone].clone().add(new THREE.Vector3(0, 0.7, 0))
      );
      scene.add(label);

      const lineData = makeTransmissionLine(
        nodePositions.HUB,
        nodePositions[zone],
        channelColor,
        10
      );
      scene.add(lineData.group);
      transmissionLines.push({ ...lineData, zone });
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    function onClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(hitMeshes));
      if (hits.length > 0) onSelectZone(hits[0].object.userData.zone);
    }
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.style.cursor = "pointer";

    let angle = 0;
    let frameId;
    const timer = new THREE.Timer();

    function animate() {
      frameId = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed();
      angle += 0.0012;

      camera.position.x = Math.sin(angle) * 8.3;
      camera.position.z = Math.cos(angle) * 8.3;
      camera.position.y = 2.8 + Math.sin(t * 0.1) * 0.3;
      camera.lookAt(0, -0.3, 0);

      const currentAssets = stateRef.current.assets || [];
      const currentSelected = stateRef.current.selectedZone;

      ZONES.forEach((zone) => {
        const asset = currentAssets.find((a) => a.zone === zone);
        const risk = asset ? asset.risk_score : 0;
        const riskColor = new THREE.Color(
          stateColor(asset ? asset.status : "normal")
        );

        const group = nodeGroups[zone];
        const ring = ringMeshes[zone];
        const glow = glowSprites[zone];

        ring.material.color.lerp(riskColor, 0.02 + risk * 0.06);
        ring.material.emissive.lerp(riskColor, 0.02 + risk * 0.06);
        group.rotation.y = t * (0.1 + risk * 0.15);

        const pulseSpeed = 1.2 + risk * 3.5;
        const pulse = 0.5 + 0.5 * Math.sin(t * pulseSpeed);
        ring.scale.setScalar(1 + pulse * 0.07 * risk);
        glow.material.opacity = 0.18 + risk * 0.3 + pulse * 0.1 * risk;
        glow.scale.setScalar(1 + risk * 0.75 + pulse * 0.16 * risk);

        const isSelected = currentSelected === zone;
        group.scale.setScalar(isSelected ? 1.15 : 1);
        ring.rotation.z = t * (0.3 + risk * 0.5);
      });

      transmissionLines.forEach(({ particles, zone }) => {
        const asset = currentAssets.find((a) => a.zone === zone);
        const risk = asset ? asset.risk_score : 0.3;
        const speed = 0.5 + risk * 2.5;
        particles.update(speed);
      });

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", onClick);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectZone]);

  useEffect(() => {
    stateRef.current.assets = assets;
    stateRef.current.selectedZone = selectedZone;
  }, [assets, selectedZone]);

  return <div ref={mountRef} className="w-full h-full min-h-0 overflow-hidden" />;
}
