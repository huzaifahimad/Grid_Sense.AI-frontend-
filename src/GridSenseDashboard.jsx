import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ============================================================================
// API CONFIG — reads from Vercel env var VITE_API_BASE_URL in production,
// falls back to localhost for local dev. Set USE_MOCK_DATA via
// VITE_USE_MOCK_DATA=false once your Render backend is live and trained.
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";
// ============================================================================

const ZONES = ["ES", "GR", "IT_SOUTH"];
const ZONE_LABELS = { ES: "SPAIN / MADRID", GR: "GREECE / ATHENS", IT_SOUTH: "ITALY-S / NAPLES" };
const ZONE_COORDS = { ES: "40.42N 3.70W", GR: "37.98N 23.73E", IT_SOUTH: "40.85N 14.27E" };
// Each zone gets its own static "channel" color, like a telemetry line —
// independent of the dynamic risk-state color layered on top of it
const ZONE_CHANNEL_COLOR = { ES: 0x35D6E8, GR: 0xB478F5, IT_SOUTH: 0xFFD54A };

function generateMockAssets() {
  return ZONES.map((zone, i) => {
    const risk = [0.82, 0.34, 0.58][i];
    return { asset_id: `${zone}-FEEDER-01`, zone, risk_score: risk, status: risk > 0.7 ? "critical" : risk > 0.4 ? "elevated" : "normal" };
  });
}
function generateMockForecast(zone) {
  const now = Date.now();
  const points = [];
  for (let h = 0; h < 24; h++) {
    const base = 4200 + Math.sin(h / 3.8) * 900 + (zone === "ES" ? 300 : 0);
    points.push({ timestamp: new Date(now + h * 3600000).toISOString(), hour: h, p10: Math.round(base * 0.9), p50: Math.round(base), p90: Math.round(base * 1.1) });
  }
  return points;
}
function generateMockRisk(zone) {
  const factors = {
    ES: [{ feature: "temperature_c", contribution: 0.31 }, { feature: "load_to_capacity_ratio", contribution: 0.24 }, { feature: "load_roll_std_24h", contribution: 0.11 }],
    GR: [{ feature: "hour_sin", contribution: 0.08 }, { feature: "temperature_c", contribution: 0.06 }, { feature: "load_lag_24h", contribution: 0.04 }],
    IT_SOUTH: [{ feature: "temperature_c", contribution: 0.19 }, { feature: "wind_speed_ms", contribution: 0.09 }, { feature: "load_roll_mean_168h", contribution: 0.07 }],
  };
  const scores = { ES: 0.82, GR: 0.34, IT_SOUTH: 0.58 };
  const caps = { ES: 5400, GR: 3100, IT_SOUTH: 4000 };
  const loads = { ES: 5050, GR: 2100, IT_SOUTH: 3350 };
  return { zone, asset_id: `${zone}-FEEDER-01`, risk_score: scores[zone], predicted_load_mw: loads[zone], capacity_mw: caps[zone], top_factors: factors[zone], is_proxy_capacity: true };
}

function generateMockShedSchedule(zone) {
  const risk = generateMockRisk(zone);
  const margin = risk.capacity_mw - risk.predicted_load_mw;
  return [{
    zone,
    asset_id: risk.asset_id,
    priority: risk.risk_score > 0.7 ? 1 : 2,
    reasoning: `Predicted load ${risk.predicted_load_mw.toFixed(0)}MW against estimated (proxy) capacity ${risk.capacity_mw.toFixed(0)}MW — margin ${margin.toFixed(0)}MW, risk score ${risk.risk_score.toFixed(2)}`,
    predicted_margin_mw: margin,
  }];
}

async function fetchAssets() {
  if (USE_MOCK_DATA) return generateMockAssets();
  const res = await fetch(`${API_BASE_URL}/assets`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}
async function fetchForecast(zone) {
  if (USE_MOCK_DATA) return generateMockForecast(zone);
  const res = await fetch(`${API_BASE_URL}/forecast/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();
  return data.points.map((p, i) => ({ ...p, hour: i }));
}
async function fetchRisk(zone) {
  if (USE_MOCK_DATA) return generateMockRisk(zone);
  const res = await fetch(`${API_BASE_URL}/risk/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch risk");
  return res.json();
}
async function fetchShedSchedule(zone) {
  if (USE_MOCK_DATA) return generateMockShedSchedule(zone);
  const res = await fetch(`${API_BASE_URL}/shed-schedule/${zone}`);
  if (!res.ok) throw new Error("Failed to fetch shed schedule");
  return res.json();
}

// ============================================================================
// DESIGN TOKENS — mission-control telemetry: near-black field, each data
// channel gets its own bright, distinct hue. Alarm colors stay reserved
// strictly for status; everything else gets its own identity color.
// ============================================================================
const C = {
  field: "#080B10",
  panel: "#0E141C",
  panelRaised: "#141C27",
  line: "#232D3A",
  lineBright: "#37475C",
  text: "#EAF0F5",
  textDim: "#94A6BA",
  textFaint: "#4E6076",
  safe: "#3ED67D",
  caution: "#FFB238",
  critical: "#FF5A4A",
  cyan: "#35D6E8",
  violet: "#B478F5",
  gold: "#FFD54A",
};
const FONT_HERO = "'Orbitron', sans-serif";
const FONT_HEADER = "'Rajdhani', sans-serif";
const FONT_BODY = "'Work Sans', -apple-system, sans-serif";
const FONT_MONO = "'Space Mono', monospace";

function stateColor(status) {
  if (status === "critical") return C.critical;
  if (status === "elevated") return C.caution;
  return C.safe;
}

// ============================================================================
// 3D Grid Topology
// ============================================================================
function GridTopology3D({ assets, selectedZone, onSelectZone }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth, height = mount.clientHeight;

    // WebGL may be unavailable (VMs, remote desktops, locked-down browsers).
    // Without this guard the constructor throws and, with no error boundary,
    // React unmounts the entire dashboard to a blank page.
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
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
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.field);
    scene.fog = new THREE.Fog(C.field, 9, 21);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.0, 8.5);

    const floorGrid = new THREE.GridHelper(18, 36, 0x1C2838, 0x121A24);
    floorGrid.position.y = -1.3;
    scene.add(floorGrid);

    const ambient = new THREE.AmbientLight(0x556275, 1.4);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0xEAF0F5, 1.1, 22);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x35D6E8, 0.6, 20);
    rimLight.position.set(-4, -1, -3);
    scene.add(rimLight);

    const nodePositions = {
      HUB: new THREE.Vector3(0, 0, 0),
      ES: new THREE.Vector3(-3.3, 0.3, 1.1),
      GR: new THREE.Vector3(3.1, -0.2, -1.5),
      IT_SOUTH: new THREE.Vector3(1.5, 0.6, 2.5),
    };

    function makeLabelSprite(text, sub, channelColorHex) {
      const canvas = document.createElement("canvas");
      canvas.width = 340; canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.font = "700 30px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#EAF0F5";
      ctx.textAlign = "center";
      ctx.fillText(text, 170, 42);
      ctx.font = "500 18px 'Space Mono', monospace";
      ctx.fillStyle = "#" + channelColorHex.toString(16).padStart(6, "0");
      ctx.fillText(sub, 170, 68);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.9, 0.56, 1);
      return sprite;
    }

    const hubGeo = new THREE.IcosahedronGeometry(0.16, 1);
    const hubEdges = new THREE.EdgesGeometry(hubGeo);
    const hub = new THREE.LineSegments(hubEdges, new THREE.LineBasicMaterial({ color: 0xEAF0F5, transparent: true, opacity: 0.8 }));
    hub.position.copy(nodePositions.HUB);
    scene.add(hub);

    const nodeGroups = {}, ringMeshes = {}, glowSprites = {}, hitMeshes = {};

    function makeGlowSprite(channelColorHex) {
      const canvas = document.createElement("canvas");
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, color: channelColorHex, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.15, 1.15, 1);
      return sprite;
    }

    ZONES.forEach((zone) => {
      const channelColor = ZONE_CHANNEL_COLOR[zone];
      const group = new THREE.Group();

      const geo = new THREE.IcosahedronGeometry(0.3, 1);
      const edges = new THREE.EdgesGeometry(geo);
      const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xEAF0F5, transparent: true, opacity: 0.9 }));
      group.add(wireframe);

      const fillMat = new THREE.MeshBasicMaterial({ color: channelColor, transparent: true, opacity: 0.16 });
      const fill = new THREE.Mesh(geo, fillMat);
      group.add(fill);

      group.position.copy(nodePositions[zone]);
      group.userData.zone = zone;
      scene.add(group);
      nodeGroups[zone] = group;

      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(nodePositions[zone]);
      hit.userData.zone = zone;
      scene.add(hit);
      hitMeshes[zone] = hit;

      // status ring — dynamic, lerps toward live risk color (red/amber/green)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.013, 8, 48),
        new THREE.MeshBasicMaterial({ color: channelColor, transparent: true, opacity: 0.9 })
      );
      ring.position.copy(nodePositions[zone]);
      ring.rotation.x = Math.PI / 2.3;
      scene.add(ring);
      ringMeshes[zone] = ring;

      const glow = makeGlowSprite(channelColor);
      glow.position.copy(nodePositions[zone]);
      scene.add(glow);
      glowSprites[zone] = glow;

      const label = makeLabelSprite(zone.replace("_", "-"), ZONE_COORDS[zone], channelColor);
      label.position.copy(nodePositions[zone].clone().add(new THREE.Vector3(0, 0.62, 0)));
      scene.add(label);

      // transmission line — static channel color identifies the zone at rest
      const curve = new THREE.LineCurve3(nodePositions.HUB, nodePositions[zone]);
      const linePoints = curve.getPoints(20);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineDashedMaterial({ color: channelColor, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.65 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      scene.add(line);
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

    let angle = 0, frameId;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      angle += 0.0013;
      camera.position.x = Math.sin(angle) * 8.3;
      camera.position.z = Math.cos(angle) * 8.3;
      camera.lookAt(0, 0, 0);

      const currentAssets = stateRef.current.assets || [];
      const currentSelected = stateRef.current.selectedZone;

      ZONES.forEach((zone) => {
        const asset = currentAssets.find((a) => a.zone === zone);
        const risk = asset ? asset.risk_score : 0;
        const riskColor = new THREE.Color(stateColor(asset ? asset.status : "normal"));

        const group = nodeGroups[zone];
        const ring = ringMeshes[zone];
        const glow = glowSprites[zone];

        // ring blends from its static channel identity toward the risk color
        // as risk rises — low risk stays close to channel color, high risk goes alarm
        ring.material.color.lerp(riskColor, 0.02 + risk * 0.06);
        group.rotation.y = t * (0.15 + risk * 0.25);
        group.rotation.x = Math.sin(t * 0.3) * 0.1;

        const pulseSpeed = 1.2 + risk * 3.5;
        const pulse = 0.5 + 0.5 * Math.sin(t * pulseSpeed);
        ring.scale.setScalar(1 + pulse * 0.07 * risk);
        glow.material.opacity = 0.18 + risk * 0.3 + pulse * 0.1 * risk;
        glow.scale.setScalar(1 + risk * 0.75 + pulse * 0.16 * risk);

        const isSelected = currentSelected === zone;
        group.scale.setScalar(isSelected ? 1.22 : 1);
        ring.rotation.z = t * (0.3 + risk * 0.5);
      });

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      if (!mount) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onSelectZone]);

  useEffect(() => {
    stateRef.current.assets = assets;
    stateRef.current.selectedZone = selectedZone;
  }, [assets, selectedZone]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

// ---- UI atoms ----
function StatusDot({ status }) {
  const color = stateColor(status);
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 7px ${color}`, marginRight: 10, flexShrink: 0 }} />;
}

function Panel({ index, title, accent, children, style, noPad }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`, borderRadius: 3,
      padding: noPad ? 0 : "16px 18px", display: "flex", flexDirection: "column",
      position: "relative", borderTop: `2px solid ${accent || C.line}`, ...style,
    }}>
      <div style={{
        position: noPad ? "absolute" : "static", top: 14, left: 18, zIndex: 2,
        display: "flex", alignItems: "baseline", gap: 9,
        marginBottom: noPad ? 0 : 14, paddingBottom: noPad ? 0 : 10,
        borderBottom: noPad ? "none" : `1px solid ${C.line}`,
      }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: accent || C.textFaint, border: `1px solid ${accent || C.line}66`, padding: "1px 5px", borderRadius: 2 }}>{index}</span>
        <span style={{ fontFamily: FONT_HEADER, fontWeight: 600, fontSize: 14, letterSpacing: "0.06em", color: C.textDim, textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

const TickRuler = () => (
  <div style={{ height: 7, flexShrink: 0, backgroundImage: `repeating-linear-gradient(90deg, ${C.line} 0px, ${C.line} 1px, transparent 1px, transparent 22px)` }} />
);

// ============================================================================
// Main dashboard
// ============================================================================
export default function GridSenseDashboard() {
  const [assets, setAssets] = useState([]);
  const [selectedZone, setSelectedZone] = useState("ES");
  const [forecast, setForecast] = useState([]);
  const [risk, setRisk] = useState(null);
  const [shedSchedule, setShedSchedule] = useState([]);
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAssets = useCallback(async () => {
    try { setAssets(await fetchAssets()); setError(null); } catch (e) { setError(e.message); }
  }, []);
  const loadZoneDetail = useCallback(async (zone) => {
    try {
      const [f, r, s] = await Promise.all([fetchForecast(zone), fetchRisk(zone), fetchShedSchedule(zone)]);
      setForecast(f); setRisk(r); setShedSchedule(s); setError(null);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);
  useEffect(() => { loadZoneDetail(selectedZone); }, [selectedZone, loadZoneDetail]);

  const sortedAssets = useMemo(() => [...assets].sort((a, b) => b.risk_score - a.risk_score), [assets]);
  const systemAvgRisk = useMemo(() => assets.length ? assets.reduce((s, a) => s + a.risk_score, 0) / assets.length : 0, [assets]);
  const criticalCount = useMemo(() => assets.filter((a) => a.status === "critical").length, [assets]);
  const selectedChannelColorHex = "#" + (ZONE_CHANNEL_COLOR[selectedZone] || 0x35D6E8).toString(16).padStart(6, "0");

  return (
    <div style={{ width: "100%", height: "100vh", background: C.field, color: C.text, fontFamily: FONT_BODY, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.lineBright}; border-radius: 3px; }
        .tabular { font-variant-numeric: tabular-nums; }
        button { font-family: inherit; }
        .gs-root { background-image: radial-gradient(circle at 1px 1px, rgba(234,240,245,0.03) 1px, transparent 0); background-size: 26px 26px; }
      `}</style>

      {/* Header */}
      <div className="gs-root" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px 11px", background: C.panel, borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontFamily: FONT_HERO, fontWeight: 700, fontSize: 19, letterSpacing: "0.03em", lineHeight: 1, background: `linear-gradient(90deg, ${C.text} 0%, ${C.cyan} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            GRIDSENSE·AI
          </div>
          <div style={{ width: 1, height: 18, background: C.line }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textFaint, letterSpacing: "0.06em" }}>
            {USE_MOCK_DATA ? "SIMULATION MODE" : `LIVE · ${API_BASE_URL}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: criticalCount > 0 ? C.critical : C.safe, boxShadow: `0 0 6px ${criticalCount > 0 ? C.critical : C.safe}` }} />
            <span className="tabular" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.textDim }}>
              {criticalCount} CRITICAL &nbsp;·&nbsp; SYS AVG {(systemAvgRisk * 100).toFixed(0)}%
            </span>
          </div>
          <div className="tabular" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.textFaint }}>
            {clock.toISOString().slice(0, 19).replace("T", " ")} UTC
          </div>
        </div>
      </div>
      <TickRuler />

      {error && (
        <div style={{ background: "#2A1210", color: C.critical, padding: "7px 22px", fontFamily: FONT_MONO, fontSize: 11.5, flexShrink: 0, borderBottom: `1px solid ${C.line}` }}>
          ⚠ API ERROR — {error}. Confirm `uvicorn api.main:app` is running, or leave USE_MOCK_DATA = true.
        </div>
      )}

      {/* Main grid */}
      <div style={{ flex: 1, display: "grid", minHeight: 0, gridTemplateColumns: "300px 1fr 330px", gridTemplateRows: "1fr 230px", gap: 10, padding: 10, background: C.field }}>
        {/* Asset table */}
        <div style={{ gridRow: "1 / 3" }}>
          <Panel index="01" title="Monitored Assets" accent={C.cyan} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 46px", fontFamily: FONT_MONO, fontSize: 9.5, color: C.textFaint, letterSpacing: "0.08em", paddingBottom: 8 }}>
                <span>ASSET / ZONE</span>
                <span style={{ textAlign: "right" }}>RISK</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
                {sortedAssets.map((a) => {
                  const channelHex = "#" + ZONE_CHANNEL_COLOR[a.zone].toString(16).padStart(6, "0");
                  return (
                    <button key={a.asset_id} onClick={() => setSelectedZone(a.zone)}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr 46px", alignItems: "center",
                        background: selectedZone === a.zone ? C.panelRaised : "transparent",
                        border: "none", borderLeft: `2px solid ${selectedZone === a.zone ? channelHex : "transparent"}`,
                        padding: "10px 8px 10px 10px", cursor: "pointer", textAlign: "left", color: C.text,
                      }}>
                      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                        <StatusDot status={a.status} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT_HEADER, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.asset_id}</div>
                          <div style={{ fontSize: 10, color: channelHex, fontFamily: FONT_MONO, marginTop: 1 }}>{ZONE_LABELS[a.zone]}</div>
                        </div>
                      </div>
                      <div className="tabular" style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, textAlign: "right", color: stateColor(a.status) }}>
                        {(a.risk_score * 100).toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>

        {/* 3D topology */}
        <div style={{ gridRow: "1 / 2" }}>
          <Panel index="02" title="Grid Topology" accent={C.gold} noPad style={{ height: "100%" }}>
            <GridTopology3D assets={assets} selectedZone={selectedZone} onSelectZone={setSelectedZone} />
          </Panel>
        </div>

        {/* Detail panel */}
        <div style={{ gridRow: "1 / 3" }}>
          <Panel index="03" title={`Risk Detail — ${selectedZone}`} accent={stateColor(risk ? (risk.risk_score > 0.7 ? "critical" : risk.risk_score > 0.4 ? "elevated" : "normal") : "normal")} style={{ height: "100%" }}>
            {risk ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%", overflowY: "auto" }}>
                <div>
                  <div className="tabular" style={{
                    fontFamily: FONT_HERO, fontSize: 44, fontWeight: 800, lineHeight: 0.95,
                    color: stateColor(risk.risk_score > 0.7 ? "critical" : risk.risk_score > 0.4 ? "elevated" : "normal"),
                  }}>
                    {(risk.risk_score * 100).toFixed(0)}<span style={{ fontSize: 20, color: C.textFaint }}>%</span>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, letterSpacing: "0.1em", marginTop: 4 }}>OVERLOAD RISK SCORE</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 4, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ paddingTop: 12 }}>
                    <div className="tabular" style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: C.cyan }}>{risk.predicted_load_mw.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>PREDICTED LOAD (MW)</div>
                  </div>
                  <div style={{ paddingTop: 12 }}>
                    <div className="tabular" style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: C.violet }}>{risk.capacity_mw.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>CAPACITY (MW) {risk.is_proxy_capacity && <span style={{ color: C.gold }}>· PROXY</span>}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, letterSpacing: "0.1em", marginBottom: 10 }}>TOP CONTRIBUTING FACTORS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {risk.top_factors.map((f) => (
                      <div key={f.feature}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontFamily: FONT_MONO, color: C.textDim, marginBottom: 3 }}>
                          <span>{f.feature}</span>
                          <span className="tabular">{f.contribution > 0 ? "+" : ""}{f.contribution.toFixed(2)}</span>
                        </div>
                        <div style={{ height: 3, background: C.line, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(Math.abs(f.contribution) * 250, 100)}%`, height: "100%", background: f.contribution > 0 ? C.critical : C.safe }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {shedSchedule.length > 0 && (
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, letterSpacing: "0.1em", marginBottom: 10 }}>RECOMMENDED SHED SCHEDULE</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {shedSchedule.map((s, i) => (
                        <div key={i} style={{
                          background: C.panelRaised, border: `1px solid ${s.priority === 1 ? C.critical : C.line}`,
                          borderRadius: 3, padding: "9px 10px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: FONT_HEADER, fontWeight: 600, fontSize: 12, color: C.text }}>{s.asset_id}</span>
                            <span style={{
                              fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 2,
                              color: s.priority === 1 ? C.critical : C.caution,
                              border: `1px solid ${s.priority === 1 ? C.critical : C.caution}`,
                            }}>PRIORITY {s.priority}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: C.textDim, lineHeight: 1.5, fontFamily: FONT_BODY }}>{s.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {shedSchedule.length === 0 && risk && (
                  <div style={{ fontSize: 10.5, color: C.safe, fontFamily: FONT_MONO }}>
                    No shed action recommended for this zone — critical infrastructure excluded or margin healthy.
                  </div>
                )}

                <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 10.5, color: C.textFaint, lineHeight: 1.6, fontFamily: FONT_BODY }}>
                    Decision-support output only. No automated shed action is taken — human review required before any operational change.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: C.textFaint, fontSize: 12, fontFamily: FONT_MONO }}>LOADING…</div>
            )}
          </Panel>
        </div>

        {/* Forecast chart */}
        <div style={{ gridColumn: "2 / 3", gridRow: "2 / 3" }}>
          <Panel index="04" title={`24H Load Forecast — ${selectedZone} · P10 / P50 / P90`} accent={selectedChannelColorHex} style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selectedChannelColorHex} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={selectedChannelColorHex} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: C.textFaint, fontSize: 10, fontFamily: "Space Mono" }} axisLine={{ stroke: C.line }} tickLine={false}
                  label={{ value: "HOURS AHEAD", position: "insideBottom", offset: -2, fill: C.textFaint, fontSize: 9.5 }} />
                <YAxis tick={{ fill: C.textFaint, fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={{ background: C.panelRaised, border: `1px solid ${selectedChannelColorHex}`, borderRadius: 2, fontSize: 11, fontFamily: FONT_MONO }} labelStyle={{ color: C.textFaint }} />
                <Area type="monotone" dataKey="p90" stroke="none" fill="url(#bandFill)" />
                <Area type="monotone" dataKey="p10" stroke="none" fill={C.field} fillOpacity={1} />
                <Line type="monotone" dataKey="p50" stroke={selectedChannelColorHex} strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="p90" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="2 3" />
                <Line type="monotone" dataKey="p10" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="2 3" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>

      {/* Title block footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 18px", background: C.panel, borderTop: `1px solid ${C.line}`,
        fontFamily: FONT_MONO, fontSize: 9.5, color: C.textFaint, letterSpacing: "0.06em", flexShrink: 0,
      }}>
        <span>DWG NO. GSA-001 &nbsp;·&nbsp; REV C &nbsp;·&nbsp; SCALE NTS &nbsp;·&nbsp; <span style={{ color: C.gold, fontWeight: 700 }}>POWERED BY HUZAIFA HIMAD</span></span>
        <span>MODEL: LSTM-CNN + LGBM &nbsp;·&nbsp; SOURCE: {USE_MOCK_DATA ? "SIMULATED" : "ENTSO-E / NASA POWER"} &nbsp;·&nbsp; PROXY CAPACITY FLAGGED</span>
      </div>
    </div>
  );
}
