import * as THREE from "three";

export function makeLabelSprite(text, sub, channelColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 340;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  ctx.font = "700 30px 'Rajdhani', sans-serif";
  ctx.fillStyle = "#EAF0F5";
  ctx.textAlign = "center";
  ctx.fillText(text, 170, 42);

  ctx.font = "500 18px 'Space Mono', monospace";
  ctx.fillStyle =
    "#" + channelColorHex.toString(16).padStart(6, "0");
  ctx.fillText(sub, 170, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.9, 0.56, 1);
  return sprite;
}

export function makeGlowSprite(channelColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: channelColorHex,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.15, 1.15, 1);
  return sprite;
}
