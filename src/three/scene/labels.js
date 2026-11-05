import * as THREE from "three";

const LABEL_FONT = "'JetBrains Mono', monospace";

/**
 * Canvas textures bake glyphs at draw time: drawing before the webfont settles
 * would permanently keep the fallback face, so redraw once it is ready.
 */
function redrawWhenFontReady(texture, draw) {
  if (!document.fonts || typeof document.fonts.load !== "function") {
    draw();
    return;
  }
  draw();
  document.fonts
    .load(`500 17px ${LABEL_FONT}`, "ES-GR01 0123456789")
    .then(() => {
      draw();
      texture.needsUpdate = true;
    })
    .catch(() => {});
}

export function makeLabelSprite(text, sub, channelColorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 110;
  const ctx = canvas.getContext("2d");
  const hex = "#" + channelColorHex.toString(16).padStart(6, "0");

  const draw = () => {
    ctx.clearRect(0, 0, 360, 110);

    // Main label — tech display font
    ctx.font = "700 32px 'Chakra Petch', sans-serif";
    ctx.fillStyle = "#EAF0F5";
    ctx.textAlign = "center";
    ctx.fillText(text, 180, 46);

    // Subtitle — mono + channel color
    ctx.font = `500 17px ${LABEL_FONT}`;
    ctx.fillStyle = hex;
    ctx.fillText(sub, 180, 74);
  };

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.0, 0.61, 1);

  redrawWhenFontReady(texture, draw);
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
