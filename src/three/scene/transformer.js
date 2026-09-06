import * as THREE from "three";

const STEEL = new THREE.MeshStandardMaterial({
  color: 0x556677,
  roughness: 0.35,
  metalness: 0.7,
});
const DARK_STEEL = new THREE.MeshStandardMaterial({
  color: 0x334455,
  roughness: 0.4,
  metalness: 0.8,
});
const PORCELAIN = new THREE.MeshStandardMaterial({
  color: 0xc8b89a,
  roughness: 0.15,
  metalness: 0.05,
});
const COPPER = new THREE.MeshStandardMaterial({
  color: 0xcc7733,
  roughness: 0.3,
  metalness: 0.9,
});
const CONCRETE = new THREE.MeshStandardMaterial({
  color: 0x556666,
  roughness: 0.9,
  metalness: 0.0,
});

function makeBushing(height = 0.35) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, height, 8),
    PORCELAIN
  );
  stem.position.y = height / 2;
  g.add(stem);

  const skirtCount = Math.floor(height / 0.07);
  for (let i = 0; i < skirtCount; i++) {
    const skirt = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.006, 6, 12),
      PORCELAIN
    );
    skirt.rotation.x = Math.PI / 2;
    skirt.position.y = 0.04 + i * 0.07;
    g.add(skirt);
  }

  const terminal = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 6),
    COPPER
  );
  terminal.position.y = height + 0.01;
  g.add(terminal);

  return g;
}

export function makeTransformer(scale = 1) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.32 * scale, 0.28 * scale, 0.22 * scale),
    STEEL
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const finCount = 4;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < finCount; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.008 * scale, 0.2 * scale, 0.18 * scale),
        DARK_STEEL
      );
      fin.position.x = side * (0.17 * scale + i * 0.015 * scale);
      fin.castShadow = true;
      group.add(fin);
    }
  }

  const bushingPositions = [
    { x: -0.08, z: 0, h: 0.3 },
    { x: 0.0, z: 0, h: 0.35 },
    { x: 0.08, z: 0, h: 0.3 },
  ];
  bushingPositions.forEach(({ x, z, h }) => {
    const b = makeBushing(h * scale);
    b.position.set(x * scale, 0.14 * scale, z * scale);
    group.add(b);
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.36 * scale, 0.03 * scale, 0.26 * scale),
    CONCRETE
  );
  base.position.y = -0.155 * scale;
  base.receiveShadow = true;
  group.add(base);

  return group;
}

export function makeHub() {
  const group = new THREE.Group();

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.04, 1.0),
    CONCRETE
  );
  pad.position.y = -1.28;
  pad.receiveShadow = true;
  group.add(pad);

  const mainTransformer = makeTransformer(1.3);
  mainTransformer.position.set(0, -0.95, 0);
  group.add(mainTransformer);

  const busbarGeo = new THREE.TorusGeometry(0.5, 0.012, 8, 32);
  const busbar = new THREE.Mesh(busbarGeo, COPPER);
  busbar.rotation.x = Math.PI / 2;
  busbar.position.y = -0.5;
  group.add(busbar);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
      DARK_STEEL
    );
    post.position.set(
      Math.cos(angle) * 0.55,
      -1.03,
      Math.sin(angle) * 0.45
    );
    post.castShadow = true;
    group.add(post);

    const insulator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6),
      PORCELAIN
    );
    insulator.position.set(
      Math.cos(angle) * 0.55,
      -0.71,
      Math.sin(angle) * 0.45
    );
    group.add(insulator);
  }

  return group;
}
