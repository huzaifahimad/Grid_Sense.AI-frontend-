import * as THREE from "three";

/**
 * Selection reticle: three arc segments that counter-rotate around a node, plus
 * four tick marks. It gives the selected zone a shape-based cue that does not
 * depend on colour, which the ring alone does (all three rings differ only in
 * hue at low risk).
 */
export function makeReticle(color) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const arcs = new THREE.Group();
  const ARC = Math.PI / 3.4;
  const geometries = [];
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.TorusGeometry(0.78, 0.008, 6, 32, ARC);
    const arc = new THREE.Mesh(geometry, material);
    arc.rotation.z = (i / 3) * Math.PI * 2;
    arcs.add(arc);
    geometries.push(geometry);
  }
  arcs.rotation.x = Math.PI / 2;
  group.add(arcs);

  const ticks = new THREE.Group();
  const tickGeo = new THREE.BoxGeometry(0.07, 0.006, 0.012);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tick = new THREE.Mesh(tickGeo, material);
    tick.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    tick.rotation.y = -a;
    ticks.add(tick);
  }
  group.add(ticks);

  group.visible = false;

  return {
    group,
    arcs,
    ticks,
    update(t) {
      arcs.rotation.z = t * 0.55;
      ticks.rotation.y = -t * 0.22;
    },
    setColor(next) {
      material.color.set(next);
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      tickGeo.dispose();
      material.dispose();
    },
  };
}
