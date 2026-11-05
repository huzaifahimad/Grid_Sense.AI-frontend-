import * as THREE from "three";

/**
 * Hub radar sweep: a fading sector that rotates over the ground plane, plus a
 * pulse ring that expands and dies on a fixed cadence. Both are pure
 * transform/opacity animation — no geometry is rebuilt per frame.
 */

const SWEEP_TEXTURE_SIZE = 512;

function makeSweepTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SWEEP_TEXTURE_SIZE;
  canvas.height = SWEEP_TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  const c = SWEEP_TEXTURE_SIZE / 2;
  const r = c - 4;

  // Fake a conic trail with a fan of wedges whose alpha falls off behind the
  // leading edge. 48 steps is smooth enough and is drawn exactly once.
  const STEPS = 48;
  const SPAN = Math.PI / 2.4;
  for (let i = 0; i < STEPS; i++) {
    const t = i / STEPS;
    const a0 = -SPAN * (1 - t);
    const a1 = -SPAN * (1 - (i + 1) / STEPS);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, r, a0, a1, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${(0.015 + 0.3 * t * t).toFixed(4)})`;
    ctx.fill();
  }

  // Leading edge is a hard bright line.
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c, c);
  ctx.lineTo(c, c + r);
  ctx.stroke();

  // Radial falloff. Without it the wedge fan reads as a lit disc resting on the
  // terrain rather than a beam that dies away from the hub and at the rim.
  const fade = ctx.createRadialGradient(c, c, r * 0.1, c, c, r);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(0.22, "rgba(0,0,0,1)");
  fade.addColorStop(0.72, "rgba(0,0,0,0.62)");
  fade.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = fade;
  ctx.beginPath();
  ctx.arc(c, c, r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // Range rings so the sweep reads as radar rather than a spotlight. Drawn
  // after the falloff, so they keep their own brightness at the rim.
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  [0.34, 0.67, 1].forEach((k) => {
    ctx.beginPath();
    ctx.arc(c, c, r * k, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeRadarSweep(color, radius = 8.2) {
  const texture = makeSweepTexture();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -1.26;
  mesh.renderOrder = 1;

  let angle = 0;

  return {
    mesh,
    update(dt, speed = 0.55) {
      angle += speed * dt;
      mesh.rotation.y = angle;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

/**
 * One reusable expanding ring. `spawn()` restarts it; the caller decides when.
 */
export function makePulseRing(color, maxRadius = 2.4) {
  const geometry = new THREE.RingGeometry(0.94, 1, 64);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.renderOrder = 2;

  let life = 0;
  let active = false;
  const duration = 2.2;

  return {
    mesh,
    spawn() {
      life = 0;
      active = true;
      mesh.visible = true;
    },
    update(dt) {
      if (!active) return false;
      life += dt;
      const t = life / duration;
      if (t >= 1) {
        active = false;
        mesh.visible = false;
        material.opacity = 0;
        return false;
      }
      const eased = 1 - Math.pow(1 - t, 2);
      mesh.scale.setScalar(0.35 + eased * maxRadius);
      // Fast in, slow out: the ring is loudest the moment it is born.
      material.opacity = (1 - t) * (1 - t) * 0.75;
      return true;
    },
    get active() {
      return active;
    },
    setColor(color) {
      material.color.set(color);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
