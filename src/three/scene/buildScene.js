import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { C } from "../../config/tokens.js";

export function buildScene(mount) {
  const width = mount.clientWidth,
    height = mount.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.field);
  scene.fog = new THREE.FogExp2(C.field, 0.06);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 3.0, 8.5);

  const hemi = new THREE.HemisphereLight(0x8899bb, 0x112233, 0.8);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xeaf0f5, 1.6);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.002;
  scene.add(key);

  const rim = new THREE.PointLight(0x35d6e8, 1.2, 22);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const fill = new THREE.PointLight(0x445577, 0.5, 18);
  fill.position.set(3, -1, 5);
  scene.add(fill);

  const groundGeo = new THREE.PlaneGeometry(24, 24, 48, 48);
  groundGeo.rotateX(-Math.PI / 2);
  const posAttr = groundGeo.getAttribute("position");
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = Math.sin(x * 0.4) * Math.cos(z * 0.3) * 0.08 + (Math.random() - 0.5) * 0.02;
    posAttr.setY(i, y - 1.3);
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

  const grid = new THREE.GridHelper(20, 40, 0x1c2838, 0x10181f);
  grid.position.y = -1.28;
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);

  return { renderer, scene, camera };
}
