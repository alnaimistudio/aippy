import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const canvas = $('#g');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.55));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.03;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x879887);
scene.fog = new THREE.FogExp2(0x728173, 0.0175);

const camera = new THREE.PerspectiveCamera(17.5, innerWidth / innerHeight, 0.08, 190);
camera.position.set(0, 1.74, 0);
camera.rotation.order = 'YXZ';

scene.add(new THREE.HemisphereLight(0xdce5d9, 0x253026, 1.34));
const sun = new THREE.DirectionalLight(0xffe7c4, 2.15);
sun.position.set(-34, 43, 21);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
sun.shadow.bias = -0.00035;
scene.add(sun);

const terrainY = (x, z) => Math.sin(x * 0.085) * 0.27 + Math.cos(z * 0.09) * 0.25 + Math.sin((x + z) * 0.041) * 0.19;
const groundGeo = new THREE.PlaneGeometry(180, 180, 76, 76);
groundGeo.rotateX(-Math.PI / 2);
for (let i = 0; i < groundGeo.attributes.position.count; i++) {
  const x = groundGeo.attributes.position.getX(i);
  const z = groundGeo.attributes.position.getZ(i);
  groundGeo.attributes.position.setY(i, terrainY(x, z));
}
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x344d32, roughness: 1 }));
ground.receiveShadow = true;
scene.add(ground);

let seed = 4182026;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const dummy = new THREE.Object3D();

function buildForest() {
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.29, 3.8, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3a29, roughness: 1 });
  const crownGeo = new THREE.ConeGeometry(1.25, 4.3, 8);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x29482d, roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 205);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, 205);
  trunks.castShadow = crowns.castShadow = true;

  for (let i = 0; i < 205; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 10 + Math.sqrt(rnd()) * 73;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = 0.62 + rnd() * 1.28;
    const y = terrainY(x, z);
    dummy.position.set(x, y + 1.9 * s, z);
    dummy.scale.setScalar(s);
    dummy.rotation.y = rnd() * Math.PI * 2;
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y + 4.15 * s, z);
    dummy.scale.set(s * (0.82 + rnd() * 0.22), s * (0.88 + rnd() * 0.18), s * (0.82 + rnd() * 0.22));
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  }
  scene.add(trunks, crowns);

  const bushGeo = new THREE.IcosahedronGeometry(0.42, 1);
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x45633d, roughness: 1 });
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, 130);
  for (let i = 0; i < 130; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 8 + Math.sqrt(rnd()) * 68;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = 0.4 + rnd() * 0.8;
    dummy.position.set(x, terrainY(x, z) + 0.2 * s, z);
    dummy.scale.set(s * 1.35, s * 0.62, s * 1.08);
    dummy.rotation.set(rnd() * 0.2, rnd() * Math.PI * 2, rnd() * 0.15);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);
  }
  scene.add(bushes);
}
buildForest();

const rifles = [
  { id: 'ranger', name: 'RANGER .243', tag: 'Balanced starter', price: 0, mag: 5, damage: 1, reload: 1.25, recoil: 1, sway: 1, zoom: 6 },
  { id: 'timber', name: 'TIMBER .308', tag: 'Harder body hits', price: 250, mag: 4, damage: 1.18, reload: 1.35, recoil: 1.08, sway: 0.92, zoom: 6 },
  { id: 'whisper', name: 'WHISPER .300', tag: 'Very steady aim', price: 600, mag: 5, damage: 1.08, reload: 1.1, recoil: 0.68, sway: 0.58, zoom: 7 },
  { id: 'magnum', name: 'MAGNUM .338', tag: 'High power, small mag', price: 1200, mag: 3, damage: 1.55, reload: 1.5, recoil: 1.35, sway: 0.92, zoom: 8 },
  { id: 'apex', name: 'APEX .50', tag: 'Extreme stopping power', price: 2200, mag: 2, damage: 2.15, reload: 1.75, recoil: 1.7, sway: 1.04, zoom: 10 }
];

const saveKey = 'forest-stalker-v5';
let save = { coins: 0, bag: 0, kills: 0, owned: ['ranger'], equipped: 'ranger' };
try { save = { ...save, ...(JSON.parse(localStorage.getItem(saveKey)) || {}) }; } catch {}
if (!Array.isArray(save.owned) || !save.owned.includes('ranger')) save.owned = ['ranger'];
if (!rifles.some(r => r.id === save.equipped) || !save.owned.includes(save.equipped)) save.equipped = 'ranger';
const persist = () => { try { localStorage.setItem(saveKey, JSON.stringify(save)); } catch {} };
let rifle = rifles.find(r => r.id === save.equipped) || rifles[0];
let ammo = rifle.mag;
let reserveAmmo = Infinity;
let reloading = false;
let bolting = false;

const deer = [];
const hitboxes = [];
const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function limb(material, upperLen, lowerLen, hoofMat) {
  const hip = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.10, upperLen, 9), material);
  upper.position.y = -upperLen * 0.5;
  upper.castShadow = true;
  hip.add(upper);
  const knee = new THREE.Group();
  knee.position.y = -upperLen;
  hip.add(knee);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, lowerLen, 8), material);
  lower.position.y = -lowerLen * 0.5;
  lower.castShadow = true;
  knee.add(lower);
  const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.18), hoofMat);
  hoof.position.set(0, -lowerLen - 0.02, 0.035);
  hoof.castShadow = true;
  knee.add(hoof);
  return { hip, knee };
}

function createDeerVisual(index) {
  const root = new THREE.Group();
  const coatColors = [0x795033, 0x855936, 0x6e472f, 0x91613b];
  const coat = new THREE.MeshStandardMaterial({ color: coatColors[index % coatColors.length], roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2f241d, roughness: 1 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xc1a57d, roughness: 1 });
  const antler = new THREE.MeshStandardMaterial({ color: 0x4b3a28, roughness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: 0x080908, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), coat);
  body.scale.set(0.58, 0.67, 1.28);
  body.position.set(0, 1.22, 0);
  body.castShadow = true;
  root.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14), coat);
  chest.scale.set(0.68, 0.82, 0.72);
  chest.position.set(0, 1.35, 0.68);
  chest.castShadow = true;
  root.add(chest);

  const neck = new THREE.Group();
  neck.position.set(0, 1.56, 0.83);
  neck.rotation.x = -0.43;
  root.add(neck);
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.18, 12), coat);
  neckMesh.position.y = 0.55;
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.04, 0.28);
  neck.add(headPivot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), coat);
  head.scale.set(0.72, 0.67, 1.12);
  head.position.set(0, 0.07, 0.27);
  head.castShadow = true;
  headPivot.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), dark);
  muzzle.scale.set(0.7, 0.58, 1.18);
  muzzle.position.set(0, -0.02, 0.63);
  muzzle.castShadow = true;
  headPivot.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), black);
  nose.scale.set(1.25, 0.72, 0.7);
  nose.position.set(0, -0.01, 0.83);
  headPivot.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 9), coat);
    ear.position.set(0.22 * sx, 0.35, 0.11);
    ear.rotation.z = sx * -0.28;
    ear.castShadow = true;
    headPivot.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 9, 7), black);
    eye.position.set(0.285 * sx, 0.13, 0.43);
    headPivot.add(eye);
  }

  const male = index % 3 !== 1;
  if (male) {
    const branch = (x, y, z, rx, rz, len = 0.55, rad = 0.027) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.68, len, 7), antler);
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.castShadow = true;
      headPivot.add(m);
    };
    for (const sx of [-1, 1]) {
      branch(0.12 * sx, 0.55, 0.12, 0.08 * sx, -0.12 * sx, 0.68, 0.035);
      branch(0.20 * sx, 0.83, 0.12, 0.48 * sx, -0.22 * sx, 0.42, 0.026);
      branch(0.09 * sx, 0.77, 0.22, -0.38 * sx, 0.12 * sx, 0.35, 0.023);
    }
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 9), cream);
  tail.position.set(0, 1.46, -1.2);
  tail.rotation.x = Math.PI * 0.62;
  tail.castShadow = true;
  root.add(tail);

  const legs = [];
  const legSpots = [[-0.34, 0.68], [0.34, 0.68], [-0.34, -0.72], [0.34, -0.72]];
  legSpots.forEach(([x, z]) => {
    const l = limb(coat, 0.72, 0.62, dark);
    l.hip.position.set(x, 0.98, z);
    root.add(l.hip);
    legs.push(l);
  });

  const bodyHit = new THREE.Mesh(new THREE.SphereGeometry(0.86, 11, 9), invisible);
  bodyHit.scale.set(0.72, 0.78, 1.28);
  bodyHit.position.set(0, 1.28, 0.06);
  const vitalHit = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), invisible);
  vitalHit.position.set(0, 1.3, 0.64);
  const headHit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), invisible);
  headHit.position.set(0, 2.42, 1.36);
  root.add(bodyHit, vitalHit, headHit);

  return { root, legs, neck, headPivot, tail, bodyHit, vitalHit, headHit };
}

function randomSpawn(minR = 21, maxR = 55) {
  const a = Math.random() * Math.PI * 2;
  const r = minR + Math.random() * (maxR - minR);
  return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
}

function setRoamTarget(d, nearby = true) {
  const base = d.root.position;
  const a = Math.random() * Math.PI * 2;
  const r = nearby ? 4 + Math.random() * 8 : 14 + Math.random() * 24;
  d.target.set(base.x + Math.cos(a) * r, 0, base.z + Math.sin(a) * r);
  const dist = Math.hypot(d.target.x, d.target.z);
  if (dist < 14 || dist > 66) {
    const p = randomSpawn(20, 55);
    d.target.copy(p);
  }
}

function spawnDeer(index, existing = null) {
  const visual = existing || createDeerVisual(index);
  if (!existing) scene.add(visual.root);
  const pos = randomSpawn(22, 52);
  visual.root.position.set(pos.x, terrainY(pos.x, pos.z), pos.z);
  visual.root.rotation.y = Math.random() * Math.PI * 2;
  visual.root.visible = true;
  const d = {
    ...visual,
    index,
    hp: 100,
    state: 'roam',
    timer: Math.random() * 3,
    speed: 0.68 + Math.random() * 0.28,
    target: new THREE.Vector3(),
    phase: Math.random() * Math.PI * 2,
    respawnAt: 0,
    lastHitAt: 0
  };
  [d.bodyHit, d.vitalHit, d.headHit].forEach((mesh, i) => {
    mesh.userData.deer = d;
    mesh.userData.zone = ['body', 'vital', 'head'][i];
    hitboxes.push(mesh);
  });
  setRoamTarget(d, true);
  return d;
}

for (let i = 0; i < 7; i++) deer.push(spawnDeer(i));

const killsEl = $('#kills');
const coinsEl = $('#coins');
const bagEl = $('#bag');
const ammoEl = $('#ammo');
const reserveEl = $('#reserve');
const weaponPill = $('#weaponPill');
const targetHud = $('#targetHud');
const targetHpFill = $('#targetHpFill');
const targetHpText = $('#targetHpText');
const targetName = $('#targetName');
const scopeRead = $('#scopeRead');
const message = $('#message');
const damageEl = $('#damage');
const hitMark = $('#hitMark');
const blood = $('#blood');
const shotFlash = $('#shotFlash');
const shop = $('#shop');
const shopBag = $('#shopBag');
const shopCoins = $('#shopCoins');
const rifleList = $('#rifleList');
const sellAllBtn = $('#sellAllBtn');

function updateHud() {
  killsEl.textContent = save.kills;
  coinsEl.textContent = save.coins;
  bagEl.textContent = save.bag;
  ammoEl.textContent = ammo;
  reserveEl.textContent = '∞';
  weaponPill.textContent = rifle.name;
  shopBag.textContent = save.bag;
  shopCoins.textContent = save.coins;
  sellAllBtn.disabled = save.bag <= 0;
}
updateHud();

function note(text, ms = 700) {
  message.textContent = text;
  message.classList.add('show');
  clearTimeout(note.t);
  note.t = setTimeout(() => message.classList.remove('show'), ms);
}

function popDamage(value, zone) {
  damageEl.textContent = `-${value} ${zone.toUpperCase()}`;
  damageEl.style.color = zone === 'head' ? '#ffe27a' : zone === 'vital' ? '#ffbd76' : '#ff8c77';
  damageEl.classList.remove('show');
  void damageEl.offsetWidth;
  damageEl.classList.add('show');
  hitMark.classList.remove('show');
  void hitMark.offsetWidth;
  hitMark.classList.add('show');
  blood.classList.remove('show');
  void blood.offsetWidth;
  blood.classList.add('show');
}

function flashShot() {
  shotFlash.classList.remove('show');
  void shotFlash.offsetWidth;
  shotFlash.classList.add('show');
}

function haptic(pattern = 18) { try { navigator.vibrate?.(pattern); } catch {} }

// Sound hooks are intentionally silent in V5. User-provided final audio can be dropped here later.
const sound = { shot() {}, hit() {}, reload() {}, nature() {} };

let yaw = 0;
let pitch = -0.025;
let targetYaw = 0;
let targetPitch = -0.025;
let recoil = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
let lastFrame = performance.now();
let lastTarget = null;
let lastTargetSeen = 0;
let shopOpen = false;
const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, l, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

function currentScopeTarget() {
  let best = null;
  let bestDist = Infinity;
  for (const d of deer) {
    if (!d.root.visible || d.state === 'down') continue;
    const p = d.root.position.clone().add(new THREE.Vector3(0, 1.45, 0)).project(camera);
    if (p.z < -1 || p.z > 1) continue;
    const centerDist = Math.hypot(p.x, p.y);
    if (centerDist < bestDist) {
      bestDist = centerDist;
      best = d;
    }
  }
  return bestDist < 0.42 ? best : null;
}

function updateTargetHud(now) {
  const t = currentScopeTarget();
  if (t) {
    lastTarget = t;
    lastTargetSeen = now;
  }
  const show = lastTarget && lastTarget.root.visible && now - lastTargetSeen < 1300;
  targetHud.classList.toggle('active', !!show);
  if (show) {
    targetHpText.textContent = Math.max(0, Math.ceil(lastTarget.hp));
    targetHpFill.style.width = `${clamp(lastTarget.hp, 0, 100)}%`;
    targetName.textContent = lastTarget.index % 3 === 1 ? 'DOE' : 'STAG';
    const dist = camera.position.distanceTo(lastTarget.root.position);
    scopeRead.textContent = `${rifle.zoom}× · ${Math.round(dist)} m`;
  } else {
    scopeRead.textContent = `${rifle.zoom}× · SCANNING`;
  }
}

function setFovFromRifle() {
  camera.fov = 105 / rifle.zoom;
  camera.updateProjectionMatrix();
}
setFovFromRifle();

function alertDeer(d, hard = false) {
  if (!d || d.state === 'down') return;
  d.state = 'run';
  d.timer = hard ? 4.8 : 3.2;
  const away = d.root.position.clone().normalize();
  const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar((Math.random() - 0.5) * 12);
  d.target.copy(d.root.position).add(away.multiplyScalar(18 + Math.random() * 14)).add(side);
}

function harvest(d) {
  if (d.state === 'down') return;
  d.state = 'down';
  d.timer = 0;
  d.hp = 0;
  save.kills += 1;
  save.bag += 1;
  persist();
  updateHud();
  note(`HUNT #${save.kills} · +1 DEER`, 1100);
  haptic([25, 25, 35]);
  d.respawnAt = performance.now() + 2200;
  setTimeout(() => {
    if (d.state !== 'down') return;
    d.root.visible = false;
  }, 1250);
}

function respawnDeer(d) {
  const pos = randomSpawn(22, 54);
  d.root.position.set(pos.x, terrainY(pos.x, pos.z), pos.z);
  d.root.rotation.set(0, Math.random() * Math.PI * 2, 0);
  d.root.scale.setScalar(0.92 + Math.random() * 0.16);
  d.root.visible = true;
  d.hp = 100;
  d.state = 'roam';
  d.timer = Math.random() * 2;
  d.speed = 0.65 + Math.random() * 0.32;
  d.respawnAt = 0;
  setRoamTarget(d, true);
}

function shoot() {
  if (shopOpen || reloading || bolting) return;
  if (ammo <= 0) {
    note('RELOAD');
    haptic(8);
    return;
  }
  ammo--;
  bolting = true;
  updateHud();
  recoil += 0.046 * rifle.recoil;
  flashShot();
  sound.shot();
  haptic(24);
  setTimeout(() => { bolting = false; }, 620 + rifle.recoil * 90);

  ray.setFromCamera(center, camera);
  const hits = ray.intersectObjects(hitboxes, false).filter(h => h.object.userData.deer?.state !== 'down' && h.object.userData.deer?.root.visible);
  const hit = hits[0];
  if (hit) {
    const d = hit.object.userData.deer;
    const zone = hit.object.userData.zone;
    const base = zone === 'head' ? 100 : zone === 'vital' ? 72 : 38;
    const dealt = Math.min(100, Math.round(base * rifle.damage));
    d.hp = Math.max(0, d.hp - dealt);
    d.lastHitAt = performance.now();
    lastTarget = d;
    lastTargetSeen = performance.now();
    popDamage(dealt, zone);
    sound.hit();
    if (d.hp <= 0) {
      harvest(d);
    } else {
      alertDeer(d, true);
      note(`${zone === 'head' ? 'HEAD' : zone === 'vital' ? 'VITAL' : 'BODY'} HIT · ${Math.ceil(d.hp)} HP`, 820);
      haptic(zone === 'vital' ? [16, 20, 16] : 14);
    }
    deer.forEach(other => {
      if (other !== d && other.root.visible && other.state !== 'down' && other.root.position.distanceTo(d.root.position) < 13) alertDeer(other, false);
    });
  } else {
    note('MISS');
    const near = currentScopeTarget();
    if (near) alertDeer(near, true);
  }
}

function reloadGun() {
  if (shopOpen || reloading || bolting || ammo === rifle.mag) return;
  reloading = true;
  note('RELOADING…', Math.round(rifle.reload * 1000));
  sound.reload();
  setTimeout(() => {
    ammo = rifle.mag;
    reloading = false;
    updateHud();
    note('READY', 420);
  }, rifle.reload * 1000);
}

function renderShop() {
  updateHud();
  rifleList.innerHTML = '';
  for (const r of rifles) {
    const owned = save.owned.includes(r.id);
    const equipped = save.equipped === r.id;
    const card = document.createElement('div');
    card.className = `rifleCard${equipped ? ' equipped' : ''}`;
    const left = document.createElement('div');
    left.innerHTML = `<div class="rifleName">${r.name}</div><div class="rifleTag">${r.tag}</div><div class="statsRow"><span class="stat">DMG ${Math.round(r.damage * 100)}%</span><span class="stat">MAG ${r.mag}</span><span class="stat">${r.zoom}× ZOOM</span><span class="stat">STABILITY ${Math.round(100 / r.sway)}%</span></div>`;
    const btn = document.createElement('button');
    btn.className = `rifleAction${owned ? '' : ' locked'}`;
    btn.textContent = equipped ? 'EQUIPPED' : owned ? 'EQUIP' : `◉ ${r.price}`;
    btn.disabled = equipped;
    btn.onclick = () => {
      if (equipped) return;
      if (!owned) {
        if (save.coins < r.price) { note('NOT ENOUGH COINS', 900); return; }
        save.coins -= r.price;
        save.owned.push(r.id);
      }
      save.equipped = r.id;
      rifle = r;
      ammo = rifle.mag;
      reserveAmmo = Infinity;
      persist();
      setFovFromRifle();
      renderShop();
      updateHud();
      note(`${r.name} EQUIPPED`, 900);
    };
    card.append(left, btn);
    rifleList.append(card);
  }
}

function openShop() {
  shopOpen = true;
  shop.classList.add('open');
  shop.setAttribute('aria-hidden', 'false');
  renderShop();
}
function closeShop() {
  shopOpen = false;
  shop.classList.remove('open');
  shop.setAttribute('aria-hidden', 'true');
}

$('#shopBtn').onpointerdown = (e) => { e.preventDefault(); openShop(); };
$('#closeShop').onclick = closeShop;
$('#fireBtn').onpointerdown = (e) => { e.preventDefault(); shoot(); };
$('#reloadBtn').onpointerdown = (e) => { e.preventDefault(); reloadGun(); };
sellAllBtn.onclick = () => {
  if (save.bag <= 0) return;
  const earned = save.bag * 45;
  save.coins += earned;
  save.bag = 0;
  persist();
  updateHud();
  renderShop();
  note(`SOLD · +${earned} COINS`, 1000);
  haptic([12, 35, 12]);
};

addEventListener('pointerdown', (e) => {
  if (shopOpen || e.target.closest?.('button') || e.target.closest?.('.shop')) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
addEventListener('pointermove', (e) => {
  if (!dragging || shopOpen) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  const sensitivity = 0.00155 * (6 / rifle.zoom);
  targetYaw -= dx * sensitivity;
  targetPitch = clamp(targetPitch - dy * sensitivity, -0.47, 0.35);
});
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointercancel', () => { dragging = false; });

function animateDeer(d, dt, now) {
  if (d.state === 'down') {
    d.timer += dt;
    d.root.rotation.z = damp(d.root.rotation.z, Math.PI * 0.48, 2.8, dt);
    d.root.position.y = terrainY(d.root.position.x, d.root.position.z);
    if (d.respawnAt && now >= d.respawnAt) respawnDeer(d);
    return;
  }

  d.timer -= dt;
  const to = d.target.clone().sub(d.root.position);
  to.y = 0;
  const dist = to.length();
  if (dist < 1.2 || d.timer < -5) setRoamTarget(d, d.state === 'roam');
  const dir = dist > 0.001 ? to.normalize() : new THREE.Vector3(0, 0, 1);
  const running = d.state === 'run';
  const speed = running ? 6.2 : d.speed;
  d.root.position.addScaledVector(dir, speed * dt);
  d.root.position.y = terrainY(d.root.position.x, d.root.position.z);
  const targetRot = Math.atan2(dir.x, dir.z);
  d.root.rotation.y = damp(d.root.rotation.y, targetRot, running ? 8 : 3.2, dt);
  d.root.rotation.z = damp(d.root.rotation.z, 0, 5, dt);

  if (running && d.timer <= 0) {
    d.state = 'roam';
    setRoamTarget(d, true);
  }
  const radius = Math.hypot(d.root.position.x, d.root.position.z);
  if (radius > 69 || radius < 10) {
    const p = randomSpawn(22, 54);
    d.root.position.x = p.x;
    d.root.position.z = p.z;
    setRoamTarget(d, true);
  }

  const f = running ? 11.5 : 3.8;
  const amp = running ? 0.72 : 0.22;
  const p = now * 0.001 * f + d.phase;
  const s1 = Math.sin(p) * amp;
  const s2 = Math.sin(p + Math.PI) * amp;
  d.legs[0].hip.rotation.x = s1;
  d.legs[1].hip.rotation.x = s2;
  d.legs[2].hip.rotation.x = s2;
  d.legs[3].hip.rotation.x = s1;
  d.legs[0].knee.rotation.x = Math.max(0, -s1) * 0.52;
  d.legs[1].knee.rotation.x = Math.max(0, -s2) * 0.52;
  d.legs[2].knee.rotation.x = Math.max(0, -s2) * 0.68;
  d.legs[3].knee.rotation.x = Math.max(0, -s1) * 0.68;
  d.neck.rotation.z = Math.sin(p * 0.32) * (running ? 0.045 : 0.018);
  d.headPivot.rotation.y = Math.sin(p * 0.21) * (running ? 0.03 : 0.10);
  d.headPivot.rotation.x = Math.sin(p * 0.5) * (running ? 0.025 : 0.04);
  d.tail.rotation.z = Math.sin(p * 0.7) * 0.16;
  d.root.position.y += Math.abs(Math.sin(p)) * (running ? 0.055 : 0.008);
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, (now - lastFrame) / 1000);
  lastFrame = now;

  if (!shopOpen) deer.forEach(d => animateDeer(d, dt, now));

  yaw = damp(yaw, targetYaw, 15, dt);
  pitch = damp(pitch, targetPitch, 15, dt);
  const t = now * 0.001;
  const sway = 0.00145 * rifle.sway;
  const sx = Math.sin(t * 1.18) * sway + Math.sin(t * 0.46) * sway * 0.42;
  const sy = Math.sin(t * 0.92 + 1.2) * sway * 0.74;
  recoil = damp(recoil, 0, 13.5, dt);
  camera.rotation.y = yaw + sx;
  camera.rotation.x = pitch + sy + recoil;

  updateTargetHud(now);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

window.__forestStalker = {
  version: 5,
  state: () => ({ kills: save.kills, coins: save.coins, bag: save.bag, deerAlive: deer.filter(d => d.root.visible && d.state !== 'down').length, rifle: rifle.id, ammo, reserveAmmo: 'infinite' }),
  deer
};
