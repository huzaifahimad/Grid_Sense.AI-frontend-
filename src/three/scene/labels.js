import * as THREE from "three";

export function makeLabelSprite(text, sub, channelColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 110;
  const ctx = canvas.getContext("2d");

  // Main label — tech display font
  ctx.font = "700 32px 'Chakra Petch', sans-serif";
  ctx.fillStyle = "#EAF0F5";
  ctx.textAlign = "center";
  ctx.fillText(text, 180, 46);

  // Subtitle — mono + channel color
  ctx.font = "500 17px 'Space Mono', monospace";
  ctx.fillStyle = "#" + channelColorHex.toString(16).padStart(6, "0");
  ctx.fillText(sub, 180, 74);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.0, 0.61, 1);
  return sprite;
}

export function makeGlowSprite(channelColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.2)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: channelColorHex,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.25, 1.25, 1);
  return sprite;
}
