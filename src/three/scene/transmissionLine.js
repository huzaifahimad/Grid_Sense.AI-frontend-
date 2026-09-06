import * as THREE from "three";

const PYLON_STEEL = new THREE.MeshStandardMaterial({
  color: 0x556677,
  roughness: 0.5,
  metalness: 0.6,
});

function makePylon(height = 0.9) {
  const g = new THREE.Group();

  const legSpread = 0.12;
  const legPositions = [
    [-legSpread, -legSpread],
    [legSpread, -legSpread],
    [legSpread, legSpread],
    [-legSpread, legSpread],
  ];

  legPositions.forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, height, 6),
      PYLON_STEEL
    );
    leg.position.set(x * (1 - 0.3), height / 2 - 1.28, z * (1 - 0.3));
    leg.castShadow = true;
    g.add(leg);
  });

  const crossHeights = [0.35, 0.6, 0.8];
  crossHeights.forEach((h) => {
    const y = h * height - 1.28;
    const shrink = 1 - h * 0.3;
    const w = legSpread * 2 * shrink;

    const crossX = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, w * 2, 4),
      PYLON_STEEL
    );
    crossX.rotation.z = Math.PI / 2;
    crossX.position.y = y;
    g.add(crossX);

    const crossZ = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, w * 2, 4),
      PYLON_STEEL
    );
    crossZ.rotation.x = Math.PI / 2;
    crossZ.position.y = y;
    g.add(crossZ);
  });

  const armGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.35, 4);
  const armL = new THREE.Mesh(armGeo, PYLON_STEEL);
  armL.rotation.z = Math.PI / 2;
  armL.position.set(-0.18, height * 0.85 - 1.28, 0);
  g.add(armL);

  const armR = new THREE.Mesh(armGeo, PYLON_STEEL);
  armR.rotation.z = Math.PI / 2;
  armR.position.set(0.18, height * 0.85 - 1.28, 0);
  g.add(armR);

  return g;
}

function catenaryPoints(start, end, segments = 30, sag = 0.15) {
  const points = [];
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const span = start.distanceTo(end);
  const actualSag = span * sag;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = start.x + (end.x - start.x) * t;
    const z = start.z + (end.z - start.z) * t;
    const baseY = start.y + (end.y - start.y) * t;
    const sagY = -4 * actualSag * t * (1 - t);
    points.push(new THREE.Vector3(x, baseY + sagY, z));
  }
  return points;
}

export function makeTransmissionLine(
  startPos,
  endPos,
  channelColor,
  particleCount = 12
) {
  const group = new THREE.Group();

  const dir = new THREE.Vector3().subVectors(endPos, startPos);
  const span = dir.length();

  if (span > 1.8) {
    const pylonPositions = [];
    const pylonCount = Math.max(1, Math.floor(span / 2.0));
    for (let i = 1; i <= pylonCount; i++) {
      const t = i / (pylonCount + 1);
      const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      pos.y = -1.28;
      pylonPositions.push(pos);
    }
    pylonPositions.forEach((pos) => {
      const pylon = makePylon(0.85);
      pylon.position.copy(pos);
      pylon.lookAt(
        pos.x + dir.x,
        pos.y,
        pos.z + dir.z
      );
      group.add(pylon);
    });
  }

  const wireHeights = [0.05, 0.0, -0.05];
  wireHeights.forEach((offset) => {
    const s = startPos.clone();
    s.y += offset;
    const e = endPos.clone();
    e.y += offset;
    const pts = catenaryPoints(s, e, 32, 0.12);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x556677,
      transparent: true,
      opacity: 0.4,
    });
    const wire = new THREE.Line(geo, mat);
    group.add(wire);
  });

  const signalPts = catenaryPoints(startPos, endPos, 60, 0.12);
  const signalGeo = new THREE.BufferGeometry().setFromPoints(signalPts);
  const signalMat = new THREE.LineDashedMaterial({
    color: channelColor,
    dashSize: 0.1,
    gapSize: 0.06,
    transparent: true,
    opacity: 0.7,
  });
  const signalLine = new THREE.Line(signalGeo, signalMat);
  signalLine.computeLineDistances();
  group.add(signalLine);

  const particles = makeParticles(signalPts, channelColor, particleCount);
  group.add(particles.points);

  return {
    group,
    signalLine,
    particles,
  };
}

function makeParticles(pathPoints, color, count) {
  const positions = new Float32Array(count * 3);
  const offsets = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    offsets[i] = Math.random();
    const idx = Math.floor(offsets[i] * (pathPoints.length - 1));
    const pt = pathPoints[idx];
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y;
    positions[i * 3 + 2] = pt.z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: color,
    size: 0.06,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  return {
    points,
    offsets,
    path: pathPoints,
    update(speed = 1) {
      const posAttr = geo.getAttribute("position");
      for (let i = 0; i < count; i++) {
        offsets[i] = (offsets[i] + 0.003 * speed) % 1;
        const pathIdx = Math.floor(offsets[i] * (pathPoints.length - 1));
        const pt = pathPoints[pathIdx];
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
    },
  };
}
