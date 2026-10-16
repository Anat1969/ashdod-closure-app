import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GOOD } from '@/lib/guidelines';

// A street section in meters: facade at z=0, street toward +z, x along the shopfront.
const CAMERAS = {
  overview: { pos: [-9, 6.5, 13], target: [0, 1.8, 2.5] },
  clearance: { pos: [9, 7, 12], target: [0, 0, 4] },
  front: { pos: [0.5, 3, 12.5], target: [0, 2.2, 2] },
  side: { pos: [12, 3.5, 5], target: [0, 1.8, 1.5] },
  roof: { pos: [-5, 10, 9], target: [0, 3.2, 1.5] },
  ground: { pos: [6, 2.6, 9], target: [0, 0.4, 2] },
};

const NUMERIC = ['width', 'depth', 'height', 'sidewalk', 'floor', 'drop', 'opacity', 'mounted'];
const BOOL_FADE = { fascia: 'fasciaA', gutter: 'gutterA', deck: 'deckA', cable: 'cableA' };

function stateFrom(p) {
  const s = {};
  NUMERIC.forEach(k => { s[k] = p[k]; });
  Object.entries(BOOL_FADE).forEach(([k, a]) => { s[a] = p[k] ? 1 : 0; });
  s.doorSide = p.door === 'side' ? 1 : 0;
  s.signRoof = p.sign === 'roof' ? 1 : 0;
  s.glass = p.type === 'type2' ? 1 : 0;
  return s;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export default function ClosureScene3D({ params = GOOD, camera = 'overview', labels = [], autoRotate = false, height = null, className = '' }) {
  const mountRef = useRef(null);
  const labelRefs = useRef({});
  const api = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    if (!webglAvailable()) { setFailed(true); return undefined; }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch { setFailed(true); return undefined; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeef1f5, 30, 60);
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    cam.position.set(...CAMERAS.overview.pos);
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(...CAMERAS.overview.target);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-8, 14, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
    scene.add(sun);

    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const box = (material, shadow = true) => {
      const m = new THREE.Mesh(unit, material);
      m.castShadow = shadow; m.receiveShadow = true;
      return m;
    };
    const place = (m, [x, y, z], [sx, sy, sz]) => { m.position.set(x, y, z); m.scale.set(Math.max(sx, 0.001), Math.max(sy, 0.001), Math.max(sz, 0.001)); };

    // Static street
    const road = box(mat(0x9aa3ad), false); place(road, [0, -0.2, 12], [40, 0.2, 12]); scene.add(road);
    const sidewalkM = mat(0xdfe3e8);
    const sidewalk = box(sidewalkM, false); scene.add(sidewalk);
    const curb = box(mat(0x5b6574)); scene.add(curb);
    const tiles = new THREE.GridHelper(40, 80, 0xc4cad2, 0xc4cad2); tiles.position.set(0, 0.012, 3); tiles.material.opacity = 0.35; tiles.material.transparent = true; scene.add(tiles);
    const bldg = box(mat(0x46505e)); place(bldg, [0, 6, -4], [16, 12, 8]); scene.add(bldg);
    const neighbourL = box(mat(0x5b6574)); place(neighbourL, [-11, 4.5, -4], [6, 9, 8]); scene.add(neighbourL);
    const neighbourR = box(mat(0x353d49)); place(neighbourR, [11, 5, -4], [6, 10, 8]); scene.add(neighbourR);
    const shopfront = box(mat(0x1f2937, { roughness: 0.2, metalness: 0.4 })); place(shopfront, [0, 1.6, 0.02], [5.6, 3.2, 0.05]); scene.add(shopfront);
    for (let i = 0; i < 2; i++) for (let j = -1; j <= 1; j++) {
      const w = box(mat(0xa9b0bb, { roughness: 0.3 })); place(w, [j * 4.5, 6 + i * 3, 0.02], [2.4, 1.6, 0.05]); scene.add(w);
    }
    const floorLine = box(mat(0xfbbf24, { emissive: 0xfbbf24, emissiveIntensity: 0.4 }), false); scene.add(floorLine);
    const tree = new THREE.Group();
    const trunk = box(mat(0x6b4f3a)); place(trunk, [0, 1.2, 0], [0.25, 2.4, 0.25]); tree.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), mat(0x4d7c5a)); crown.position.y = 3; crown.castShadow = true; tree.add(crown);
    scene.add(tree);

    // Clearance zone on the sidewalk
    const zoneMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.28, depthWrite: false });
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), zoneMat); zone.rotation.x = -Math.PI / 2; scene.add(zone);

    // Closure
    const closure = new THREE.Group(); scene.add(closure);
    const frameM = mat(0x262c35, { metalness: 0.6, roughness: 0.4 });
    const panelM = new THREE.MeshStandardMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const roofM = mat(0xe7e9ed);
    const fasciaM = mat(0x181c22);
    const posts = Array.from({ length: 6 }, () => { const p = box(frameM); closure.add(p); return p; });
    const panels = { front1: box(panelM, false), front2: box(panelM, false), front3: box(panelM, false), left: box(panelM, false), right1: box(panelM, false), right2: box(panelM, false) };
    Object.values(panels).forEach(p => closure.add(p));
    const roof = box(roofM); closure.add(roof);
    const fascia = box(fasciaM); closure.add(fascia);
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 10), mat(0x5b6574, { metalness: 0.5 })); gutter.castShadow = true; closure.add(gutter);
    const deck = box(mat(0x92400e)); closure.add(deck);
    const cableM = mat(0xdc2626, { emissive: 0xdc2626, emissiveIntensity: 0.5 });
    const cable1 = box(cableM); const cable2 = box(cableM); closure.add(cable1); closure.add(cable2);
    const signM = mat(0xfbbf24, { emissive: 0xfbbf24, emissiveIntensity: 0.25 });
    const sign = box(signM); closure.add(sign);
    const drops = Array.from({ length: 14 }, (_, i) => {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true }));
      d.userData.offset = i / 14; scene.add(d); return d;
    });

    // Pedestrian walking through the clearance zone
    const person = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.0, 4, 10), mat(0x353d49)); body.position.y = 0.85; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0x7d8796)); head.position.y = 1.65; head.castShadow = true;
    person.add(body, head); scene.add(person);

    const cur = stateFrom(GOOD);
    const target = { s: stateFrom(GOOD), cam: CAMERAS.overview, camT: 1 };
    const camFrom = { pos: cam.position.clone(), target: controls.target.clone() };
    let userMoved = false;
    controls.addEventListener('start', () => { userMoved = true; });

    const anchors = {};
    const v = new THREE.Vector3();

    const layout = (s, t) => {
      const W = s.width, D = s.depth * Math.max(0.001, s.mounted), H = s.height * s.mounted + 0.001, drop = s.drop * s.mounted, hb = H + drop;
      const hw = W / 2;
      place(sidewalk, [0, -0.08, s.sidewalk / 2], [40, 0.16, s.sidewalk]);
      place(curb, [0, -0.02, s.sidewalk], [40, 0.24, 0.25]);
      place(floorLine, [0, s.floor, 0.06], [16, 0.08, 0.08]);
      tree.position.set(-6.5, 0, s.sidewalk - 0.8);
      const clear = s.sidewalk - s.depth;
      place(zone, [0, 0.02, s.depth + clear / 2], [W + 2, clear, 1]);
      zone.rotation.set(-Math.PI / 2, 0, 0);
      zoneMat.color.set(clear >= 2.5 ? 0x16a34a : 0xdc2626);

      const postH = (z) => H + drop * (1 - z / Math.max(D, 0.001));
      [[-hw, 0], [hw, 0], [-hw, D], [hw, D], [-0.6, D], [0.6, D]].forEach(([x, z], i) => {
        const h = postH(z); place(posts[i], [x, h / 2, z], [0.09, h, 0.09]);
      });
      const doorSide = s.doorSide > 0.5;
      // front: with a door gap in the middle unless the door moved to the side
      if (doorSide) {
        place(panels.front1, [0, H / 2, D], [W, H, 0.03]);
        place(panels.front2, [0, 0, D], [0, 0, 0]); place(panels.front3, [0, 0, D], [0, 0, 0]);
        place(posts[4], [0, 0, D], [0, 0, 0]); place(posts[5], [0, 0, D], [0, 0, 0]);
        place(panels.right1, [hw, (H + drop / 2) / 2, D * 0.15], [0.03, H + drop / 2, D * 0.3]);
        place(panels.right2, [hw, (H + drop / 2) / 2, D * 0.85], [0.03, H + drop / 2, D * 0.3]);
      } else {
        const seg = hw - 0.6;
        place(panels.front1, [-(0.6 + seg / 2), H / 2, D], [seg, H, 0.03]);
        place(panels.front2, [0.6 + seg / 2, H / 2, D], [seg, H, 0.03]);
        place(panels.front3, [0, H - 0.35, D], [1.2, 0.7, 0.03]);
        place(panels.right1, [hw, (H + drop / 2) / 2, D / 2], [0.03, H + drop / 2, D]);
        place(panels.right2, [hw, 0, 0], [0, 0, 0]);
      }
      place(panels.left, [-hw, (H + drop / 2) / 2, D / 2], [0.03, H + drop / 2, D]);
      panelM.opacity = s.opacity * (0.4 + 0.6 * s.mounted);
      panelM.color.set(s.glass > 0.5 ? 0xbfe3f5 : 0xe8dcc4);

      const slope = Math.atan2(drop, Math.max(D, 0.001));
      roof.position.set(0, H + drop / 2 + 0.03, D / 2);
      roof.rotation.set(slope, 0, 0);
      roof.scale.set(W + 0.1, 0.06, Math.hypot(D, drop) + 0.05);
      const fh = (drop + 0.25) * s.fasciaA;
      place(fascia, [0, H + fh / 2 - 0.05, D + 0.03], [W + 0.16, fh, 0.08]);

      const gh = H * s.gutterA;
      gutter.scale.set(1, Math.max(gh, 0.001), 1); gutter.position.set(hw - 0.12, gh / 2, D + 0.1);
      place(deck, [0, 0.12 * s.deckA, D / 2], [W * s.deckA, 0.24 * s.deckA, D * s.deckA]);
      place(cable1, [hw * 0.2, H + 0.05, D + 0.12], [W * 0.75 * s.cableA, 0.05, 0.05]);
      place(cable2, [hw * 0.2 + W * 0.37, H / 2, D + 0.12], [0.05, H * s.cableA, 0.05]);
      const signOnRoof = s.signRoof > 0.5;
      if (signOnRoof) place(sign, [0, hb + 0.6, D * 0.7], [2.6, 0.9, 0.08]);
      else place(sign, [0, H + Math.max(fh, 0.25) / 2 - 0.05, D + 0.09], [2.4, Math.max(fh, 0.25) * 0.75, 0.03]);
      sign.visible = s.mounted > 0.05;

      // rain dripping from the roof edge when there is no gutter
      const dripping = s.gutterA < 0.5 && s.mounted > 0.5;
      drops.forEach((d) => {
        d.visible = dripping;
        if (!dripping) return;
        const ph = (t * 0.6 + d.userData.offset) % 1;
        d.position.set(-hw + 0.3 + d.userData.offset * (W - 0.6), H * (1 - ph), D + 0.15);
        d.material.opacity = 1 - ph * 0.6;
      });

      const walkZ = s.depth + clear / 2;
      const px = ((t * 0.9) % 16) - 8;
      person.position.set(px, 0, walkZ);
      person.rotation.y = Math.PI / 2;

      anchors.clearance = new THREE.Vector3(hw + 1.2, 0.2, s.depth + clear / 2);
      anchors.floor = new THREE.Vector3(-7.5, s.floor + 0.3, 0.2);
      anchors.height = new THREE.Vector3(-hw - 0.3, H, D);
      anchors.roof = new THREE.Vector3(0, hb + 0.5, D / 2);
      anchors.door = doorSide ? new THREE.Vector3(hw + 0.2, H * 0.5, D / 2) : new THREE.Vector3(0, H * 0.45, D + 0.2);
      anchors.gutter = new THREE.Vector3(hw, H * 0.5, D + 0.3);
      anchors.width = new THREE.Vector3(0, 0.15, D + 0.4);
      anchors.deck = new THREE.Vector3(0, 0.4, D / 2);
      anchors.sign = signOnRoof ? new THREE.Vector3(0, hb + 1.2, D * 0.7) : new THREE.Vector3(0, H + 0.4, D + 0.2);
      anchors.cable = new THREE.Vector3(hw * 0.2 + W * 0.37, H * 0.6, D + 0.2);
      anchors.panel = new THREE.Vector3(-hw * 0.5, H * 0.55, D + 0.1);
    };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const k = reduce ? 1 : 1 - Math.pow(0.002, dt);
      Object.keys(cur).forEach(key => { cur[key] += (target.s[key] - cur[key]) * k; });
      if (target.camT < 1) {
        target.camT = Math.min(1, target.camT + dt / 1.2);
        const e = reduce ? 1 : 1 - Math.pow(1 - target.camT, 3);
        cam.position.lerpVectors(camFrom.pos, new THREE.Vector3(...target.cam.pos), e);
        controls.target.lerpVectors(camFrom.target, new THREE.Vector3(...target.cam.target), e);
      }
      controls.autoRotate = api.current?.autoRotate && !userMoved && target.camT >= 1;
      controls.autoRotateSpeed = 0.6;
      controls.update();
      layout(cur, reduce ? 0 : t);
      renderer.render(scene, cam);

      const rect = renderer.domElement.getBoundingClientRect();
      Object.entries(labelRefs.current).forEach(([key, el]) => {
        if (!el) return;
        const a = anchors[el.dataset.anchor];
        if (!a) { el.style.opacity = 0; return; }
        v.copy(a).project(cam);
        const x = (v.x * 0.5 + 0.5) * rect.width, y = (-v.y * 0.5 + 0.5) * rect.height;
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        el.style.opacity = v.z < 1 ? 1 : 0;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    api.current = {
      autoRotate,
      set(p, camKey) {
        target.s = stateFrom(p);
        const c = CAMERAS[camKey] || CAMERAS.overview;
        if (c !== target.cam) {
          camFrom.pos.copy(cam.position); camFrom.target.copy(controls.target);
          target.cam = c; target.camT = 0; userMoved = false;
        }
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse(o => { o.geometry?.dispose?.(); });
      mount.removeChild(renderer.domElement);
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (api.current) { api.current.autoRotate = autoRotate; api.current.set(params, camera); }
  }, [params, camera, autoRotate]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef1f5] to-[#dfe3e8] ${className}`} style={height ? { height } : undefined} data-testid="scene3d">
      <div ref={mountRef} className="absolute inset-0 map-ltr cursor-grab active:cursor-grabbing" />
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-blue-700">התצוגה התלת־ממדית אינה נתמכת בדפדפן זה. ההנחיות מופיעות בטקסט.</div>
      ) : (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {labels.map(l => (
            <div key={l.key} ref={el => { labelRefs.current[l.key] = el; }} data-anchor={l.anchor}
              className={`absolute top-0 left-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium shadow-lg transition-colors ${l.tone === 'bad' ? 'bg-red-700 text-white' : l.tone === 'note' ? 'bg-blue-900 text-white' : 'bg-white text-blue-950 ring-1 ring-blue-200'}`}
              style={{ opacity: 0 }}>
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
