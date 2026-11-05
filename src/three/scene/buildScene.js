import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const FIELD_COLOR = 0x070b11;

// Phones and tablets report 2-3x device pixel ratios; rendering the scene at
// full DPR with soft shadows costs battery there and buys no readable detail.
const isCompactScreen = () =>
  window.matchMedia("(max-width: 767px)").matches ||
  (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1100);

export function buildScene(mount) {
  const width = mount.clientWidth,
    height = mount.clientHeight;
  const compact = isCompactScreen();

  const renderer = new THREE.WebGLRenderer({ antialias: !compact, alpha: true });
  renderer.setSize(width, height);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "Three-dimensional grid topology: a central dispatch hub connected to three monitored interconnections."
  );
  renderer.domElement.tabIndex = 0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FIELD_COLOR);
  renderer.setClearColor(FIELD_COLOR, 1);
  scene.fog = new THREE.FogExp2(FIELD_COLOR, 0.055);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 3.2, 8.8);

  // Hemisphere fill
  const hemi = new THREE.HemisphereLight(0x90a0b8, 0x0d141c, 0.75);
  scene.add(hemi);

  // Key directional sun
  const key = new THREE.DirectionalLight(0xeaf0f5, 1.7);
  key.position.set(5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.bias = -0.002;
  scene.add(key);

  // Cyan rim light for atmosphere
  const rim = new THREE.PointLight(0x35d6e8, 1.4, 24);
  rim.position.set(-6, 2.5, -5);
  scene.add(rim);

  // Soft fill
  const fill = new THREE.PointLight(0x3a4a5e, 0.55, 20);
  fill.position.set(4, -1, 6);
  scene.add(fill);

  // Ground plane with subtle wave displacement. Deterministic so remounting the
  // scene never shifts the terrain under the viewer.
  const seedRandom = (() => {
    let s = 0x2f6e2b1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 1000) / 1000 - 0.5;
    };
  })();
  const groundSegs = compact ? 28 : 56;
  const groundGeo = new THREE.PlaneGeometry(26, 26, groundSegs, groundSegs);
  groundGeo.rotateX(-Math.PI / 2);
  const posAttr = groundGeo.getAttribute("position");
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y =
      Math.sin(x * 0.35) * Math.cos(z * 0.28) * 0.08 + seedRandom() * 0.03;
    posAttr.setY(i, y - 1.35);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a1018,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper
  const grid = new THREE.GridHelper(22, 44, 0x1e2a38, 0x121c26);
  grid.position.y = -1.32;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  return { renderer, scene, camera, compact };
}
