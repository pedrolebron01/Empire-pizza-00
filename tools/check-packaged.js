// game.js
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// core.js
var RECIPES = [
  { name: "Muçarela", ingredients: "Molho · muçarela", level: 1, price: 28, color: 16045419 },
  { name: "Calabresa", ingredients: "Molho · muçarela · calabresa", level: 2, price: 36, color: 12076584 },
  { name: "Marguerita", ingredients: "Molho · muçarela · tomate · manjericão", level: 3, price: 42, color: 3573325 },
  { name: "Frango com catupiry", ingredients: "Molho · frango · catupiry", level: 4, price: 48, color: 15317620 },
  { name: "Quatro queijos", ingredients: "Molho · muçarela · provolone · parmesão · gorgonzola", level: 5, price: 56, color: 16770209 },
  { name: "Especial da casa", ingredients: "Molho · queijos · calabresa · manjericão", level: 6, price: 68, color: 10111278 }
];
var UPGRADES = { oven: { name: "Forno", max: 3, base: 65, desc: (n) => `${Math.max(4, 10 - n * 2)} s · ${1 + n} pizzas simultâneas` }, bench: { name: "Bancada", max: 3, base: 55, desc: (n) => `${(2.5 - n * 0.55).toFixed(1)} s para montar` }, tray: { name: "Bandeja", max: 2, base: 80, desc: (n) => `${1 + n} pizzas nas mãos` }, tables: { name: "Mesas", max: 2, base: 90, desc: (n) => `${2 + n} clientes + ${n} mesas adicionais` }, decor: { name: "Decoração", max: 3, base: 75, desc: (n) => `+${n * 20}% de gorjeta` }, expand: { name: "Expansão do salão", max: 1, base: 230, desc: (n) => n ? "Salão completo · +2 clientes" : "Salão de bairro" }, helper: { name: "Roberto", max: 3, base: 95, desc: (n) => n ? `Velocidade ${(1.5 + n * 0.6).toFixed(1)} · ${n} pizzas por viagem` : "Ainda não contratado" } };
var MISSIONS = [{ name: "As primeiras três", desc: "Pegue massa, monte na bancada, asse e entregue 3 pizzas.", goal: 3, key: "served", money: 40, xp: 30 }, { name: "Um toque de evolução", desc: "Compre sua primeira melhoria.", goal: 1, key: "purchases", money: 30, xp: 25 }, { name: "Uma dupla de respeito", desc: "Contrate Roberto para levar pizzas do forno ao balcão.", goal: 1, key: "hired", money: 35, xp: 30 }, { name: "No capricho", desc: "Alcance cinco entregas corretas consecutivas.", goal: 5, key: "bestCombo", money: 50, xp: 45 }, { name: "Novos sabores", desc: "Chegue ao nível 2 e desbloqueie calabresa.", goal: 2, key: "level", money: 40, xp: 25 }, { name: "O bairro ficou pequeno", desc: "Compre a expansão do salão.", goal: 1, key: "expanded", money: 100, xp: 80 }];
function fresh() {
  return { version: 1, money: 20, xp: 0, served: 0, purchases: 0, bestCombo: 0, claimed: [], upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])), stock: [0, 0, 0, 8, 8, 8], volume: 0.35, quality: "media" };
}
function restore(raw) {
  const d = fresh();
  try {
    const s = JSON.parse(raw);
    if (s?.version !== 1)
      return d;
    for (const k of ["money", "xp", "served", "purchases", "bestCombo"])
      if (Number.isFinite(s[k]) && s[k] >= 0)
        d[k] = Math.min(1e8, Math.floor(s[k]));
    for (const k in UPGRADES)
      d.upgrades[k] = Math.max(0, Math.min(UPGRADES[k].max, Math.floor(Number(s.upgrades?.[k]) || 0)));
    d.claimed = Array.isArray(s.claimed) ? [...new Set(s.claimed.filter((n) => Number.isInteger(n) && n >= 0 && n < MISSIONS.length))] : [];
    d.stock = d.stock.map((n, i) => i < 3 ? 0 : Math.max(0, Math.min(999, Math.floor(Number(s.stock?.[i]) || 0))));
    d.volume = Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : 0.35;
    d.quality = ["baixa", "media", "alta"].includes(s.quality) ? s.quality : "media";
  } catch {}
  return d;
}
var level = (s) => Math.min(6, 1 + Math.floor(s.xp / 100));
var cost = (s, k) => Math.round(UPGRADES[k].base * Math.pow(1.8, s.upgrades[k]));
function buy(s, k) {
  if (!UPGRADES[k] || s.upgrades[k] >= UPGRADES[k].max)
    return false;
  if (k === "helper" && s.served < 3)
    return false;
  let p = cost(s, k);
  if (s.money < p)
    return false;
  s.money -= p;
  s.upgrades[k]++;
  s.purchases++;
  return true;
}
function missionValue(s, m) {
  return m.key === "level" ? level(s) : m.key === "hired" ? +(s.upgrades.helper > 0) : m.key === "expanded" ? s.upgrades.expand : s[m.key];
}
function claim(s) {
  const rewards = [];
  MISSIONS.forEach((m, i) => {
    if (!s.claimed.includes(i) && missionValue(s, m) >= m.goal) {
      s.claimed.push(i);
      s.money += m.money;
      s.xp += m.xp;
      rewards.push(m);
    }
  });
  return rewards;
}
function reward(s, recipe, patience, quality, combo, rush) {
  const base = RECIPES[recipe].price;
  const tip = Math.round(base * 0.25 * Math.max(0, patience) * Math.min(2, 1 + combo * 0.2) * (1 + s.upgrades.decor * 0.2));
  const total = Math.round(base * quality + tip * (rush ? 1.5 : 1));
  s.money += total;
  s.xp += Math.round(22 * quality);
  s.served++;
  s.bestCombo = Math.max(s.bestCombo, combo);
  return { total, tip };
}
function canStand(x, z, obstacles, expanded = false) {
  if (x < -8.15 || x > (expanded ? 8.15 : 3.4) || z < -5.15 || z > 5.3)
    return false;
  return !obstacles.some((o) => x > o.x - o.w / 2 - 0.27 && x < o.x + o.w / 2 + 0.27 && z > o.z - o.d / 2 - 0.27 && z < o.z + o.d / 2 + 0.27);
}
function route(start, end, obstacles, expanded = false) {
  const step = 0.45, minX = -8.1, minZ = -5.1, W = expanded ? 37 : 26, H = 24;
  const cell = (p) => [Math.max(0, Math.min(W - 1, Math.round((p.x - minX) / step))), Math.max(0, Math.min(H - 1, Math.round((p.z - minZ) / step)))];
  const world = ([x, z]) => ({ x: minX + x * step, z: minZ + z * step });
  const a = cell(start), b = cell(end), key = (p) => p[0] + p[1] * W;
  let q = [a], prev = new Map([[key(a), null]]), found = null;
  for (let h = 0;h < q.length; h++) {
    let p = q[h];
    if (key(p) === key(b)) {
      found = p;
      break;
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let n = [p[0] + dx, p[1] + dz], v = world(n);
      if (n[0] < 0 || n[1] < 0 || n[0] >= W || n[1] >= H || prev.has(key(n)) || !canStand(v.x, v.z, obstacles, expanded))
        continue;
      prev.set(key(n), p);
      q.push(n);
    }
  }
  if (!found)
    return [];
  let path = [];
  while (prev.get(key(found))) {
    path.push(world(found));
    found = prev.get(key(found));
  }
  return path.reverse();
}

// game.js
var $ = (s) => document.querySelector(s);
var KEY = "pizza-empire-v1";
var state;
try {
  state = restore(localStorage.getItem(KEY));
} catch {
  state = fresh();
}
var paused = false;
var started = false;
var time = 0;
var spawnClock = 0;
var combo = 0;
var selected = null;
var serial = 1;
var hand = [];
var ovens = [];
var shelf = [];
var customers = [];
var work = null;
var toastTime = 0;
var uiClock = 0;
var rush = false;
var nearest = null;
var heldIndex = 0;
var keys = {};
var obstacles = [];
var labels = [];
var models = {};
var stations = [];
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    toast("Salvamento indisponível neste navegador.");
  }
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.opacity = 1;
  toastTime = 4;
}
var audio;
function sound(kind) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext);
    audio.resume();
    const seq = { order: [660, 880], cash: [880, 1175, 1568], level: [523, 659, 784, 1046], oven: [440, 660], tap: [320] }[kind] || [400];
    seq.forEach((f, i) => {
      let o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.09;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(Math.max(0.0001, state.volume * 0.12), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      o.connect(g);
      g.connect(audio.destination);
      o.start(t);
      o.stop(t + 0.18);
    });
  } catch {}
}
var scene = new T.Scene;
scene.background = new T.Color("#e5dcca");
scene.fog = new T.Fog("#e5dcca", 35, 70);
var renderer = new T.WebGLRenderer({ canvas: $("#world"), antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
var camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
scene.add(new T.HemisphereLight(16773581, 6386534, 2.2));
var sun = new T.DirectionalLight(16770486, 3);
sun.position.set(-7, 15, 8);
sun.castShadow = true;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 13;
sun.shadow.camera.bottom = -13;
sun.shadow.normalBias = 0.04;
scene.add(sun);
function quality() {
  let q = state.quality;
  renderer.setPixelRatio(Math.min(devicePixelRatio, q === "alta" ? 2 : q === "media" ? 1.4 : 1));
  renderer.shadowMap.enabled = q !== "baixa";
  sun.shadow.mapSize.set(q === "alta" ? 2048 : 1024, q === "alta" ? 2048 : 1024);
  sun.shadow.map?.dispose();
  sun.shadow.map = null;
  resize();
}
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
var mats = new Map;
function mat(c) {
  if (!mats.has(c))
    mats.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.8 }));
  return mats.get(c);
}
function mesh(geo, c, x, y, z, parent = scene) {
  const m = new T.Mesh(geo, mat(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(w, h, d, c, x, y, z, p = scene) {
  return mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
}
function cyl(r, h, c, x, y, z, p = scene, r2 = r) {
  return mesh(new T.CylinderGeometry(r, r2, h, 20), c, x, y, z, p);
}
function sphere(r, c, x, y, z, p = scene) {
  return mesh(new T.SphereGeometry(r, 12, 8), c, x, y, z, p);
}
function textSign(text, w, h, bg, fg, x, y, z, parent = scene) {
  let cv = document.createElement("canvas");
  cv.width = 768;
  cv.height = 192;
  let c = cv.getContext("2d");
  c.fillStyle = bg;
  c.fillRect(0, 0, 768, 192);
  c.fillStyle = fg;
  c.font = "bold 65px Georgia";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 384, 96, 730);
  let tx = new T.CanvasTexture(cv);
  tx.colorSpace = T.SRGBColorSpace;
  let m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx }));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function label(obj, text, cls = "", height = 2.4) {
  let el = document.createElement("div");
  el.className = "label " + cls;
  el.textContent = text;
  $("#labels").append(el);
  let item = { obj, el, height };
  labels.push(item);
  return item;
}
function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry)
      o.geometry.dispose();
  });
  scene.remove(group);
}
var ground = box(80, 0.2, 80, 14276031, 0, -0.65, 0);
ground.castShadow = false;
box(18, 0.5, 12, 6772297, 0, -0.3, 0);
box(18.5, 0.15, 12.5, 12562057, 0, -0.55, 0);
for (let x = -8.5;x < 9; x++)
  for (let z = -5.5;z < 6; z++)
    box(0.975, 0.05, 0.975, Math.round(x + z) % 2 === 0 ? 15064519 : 14077107, x, -0.015, z);
box(18, 3.5, 0.2, 15251845, 0, 1.7, -6);
box(0.2, 3.5, 12, 15251845, -9, 1.7, 0);
box(18, 0.9, 0.23, 4351577, 0, 0.45, -5.87);
box(0.23, 0.9, 12, 4351577, -8.87, 0.45, 0);
for (let x = -8.8;x < 9; x += 0.55)
  box(0.045, 0.85, 0.04, 3167044, x, 0.45, -5.72);
box(18, 0.09, 0.12, 14595966, 0, 0.95, -5.7);
box(0.12, 0.09, 12, 14595966, -8.72, 0.95, 0);
box(3.2, 0.025, 1.5, 4285523, -0.5, 0.03, 4.9);
for (let i = 0;i < 8; i++)
  box(0.4, 0.04, 1.5, i % 2 ? 16113579 : 12208438, -1.9 + i * 0.4, 0.06, 4.9);
textSign("PIZZA EMPIRE", 5.1, 0.85, "#315444", "#ffe6a5", -1, 2.65, -5.74);
textSign("FORNO A LENHA  •  DESDE HOJE", 3.7, 0.4, "#e8b985", "#84492d", -1, 1.98, -5.73);
for (let x of [-6.7, 5.7]) {
  box(2.5, 1.65, 0.15, 7096629, x, 2.15, -5.75);
  box(2.25, 1.4, 0.16, 9549491, x, 2.15, -5.64);
  box(0.08, 1.4, 0.2, 15257244, x, 2.15, -5.5);
  box(2.3, 0.07, 0.2, 15257244, x, 2.15, -5.5);
}
function plant(x, z) {
  cyl(0.25, 0.45, 12152645, x, 0.22, z);
  for (let i = 0;i < 6; i++) {
    let leaf = sphere(0.26, 5273675, x + Math.sin(i) * 0.2, 0.6 + i * 0.06, z + Math.cos(i) * 0.2);
    leaf.scale.set(0.6, 1.5, 0.7);
  }
}
plant(-8, 4.7);
plant(7.8, -4.9);
var furniture = new T.Group;
scene.add(furniture);
function obstacle(x, z, w, d) {
  obstacles.push({ x, z, w, d });
}
function counter(x, z, w, d, color = 10115637) {
  box(w, 1.05, d, color, x, 0.54, z, furniture);
  box(w + 0.15, 0.12, d + 0.12, 15521965, x, 1.12, z, furniture);
  for (let dx = -w / 2 + 0.3;dx < w / 2; dx += 0.65) {
    box(0.49, 0.72, 0.03, 12682316, x + dx, 0.55, z + d / 2 + 0.02, furniture);
    box(0.12, 0.04, 0.08, 5718575, x + dx, 0.79, z + d / 2 + 0.07, furniture);
  }
  obstacle(x, z, w, d);
}
function table(x, z) {
  cyl(0.85, 0.12, 11365695, x, 0.87, z, furniture);
  cyl(0.11, 0.8, 3625031, x, 0.4, z, furniture);
  cyl(0.43, 0.08, 3625031, x, 0.06, z, furniture);
  box(0.7, 0.015, 0.7, 15983298, x, 0.94, z, furniture);
  cyl(0.09, 0.2, 13003846, x, 1.05, z, furniture);
  sphere(0.14, 6325315, x, 1.23, z, furniture);
  obstacle(x, z, 1.65, 1.65);
  for (let a of [-1, 1]) {
    box(0.65, 0.12, 0.65, 11027762, x, 0.45, z + a * 1.22, furniture);
    box(0.65, 0.6, 0.1, 11357753, x, 0.75, z + a * 1.5, furniture);
    for (let dx of [-0.24, 0.24])
      for (let dz of [-0.24, 0.24])
        box(0.07, 0.4, 0.07, 4734513, x + dx, 0.2, z + a * 1.22 + dz, furniture);
    obstacle(x, z + a * 1.22, 0.65, 0.65);
  }
}
var ovenLight = new T.PointLight(16744496, 12, 5);
ovenLight.position.set(0, 1, -3.5);
scene.add(ovenLight);
var ovenGroup;
function rebuild() {
  furniture.clear();
  obstacles.length = 0;
  counter(-7, -4.65, 2.4, 1.25);
  counter(-3.9, -4.65, 2.6, 1.25, state.upgrades.bench ? 4352347 : 10115637);
  counter(-5, 1.8, 4.4, 1.1);
  counter(1.7, -4.65, 1.2, 1.25);
  box(1.8, 0.03, 0.8, 12553043, -3.9, 1.2, -4.65, furniture);
  for (let i = 0;i < 4; i++) {
    box(0.36, 0.12, 0.38, 6583415, -4.9 + i * 0.6, 1.23, -5, furniture);
    sphere(0.12, [12404530, 16244357, 10111280, 4685120][i], -4.9 + i * 0.6, 1.34, -5, furniture);
  }
  for (let i = 0;i < 3; i++)
    cyl(0.28, 0.1, 15913630, -7.7 + i * 0.6, 1.26, -4.6, furniture);
  ovenGroup = new T.Group;
  furniture.add(ovenGroup);
  ovenGroup.position.set(-0.65, 0, -4.55);
  const ow = 2.1 + state.upgrades.oven * 0.13;
  box(ow, 0.7, 1.55, 9590845, 0, 0.35, 0, ovenGroup);
  let dome = sphere(1.08, 11685171, 0, 1, 0, ovenGroup);
  dome.scale.set(ow / 2, 1, 0.77);
  box(1.3, 0.7, 0.1, 3287587, 0, 0.91, 0.82, ovenGroup);
  box(1.1, 0.11, 0.65, 6901832, 0, 0.58, 1, ovenGroup);
  box(0.6, 1.2, 0.6, 7033154, 0, 2.15, -0.15, ovenGroup);
  for (let i = 0;i < 5; i++) {
    const f = sphere(0.13, 16753968, -0.4 + i * 0.2, 0.7, 0.86, ovenGroup);
    f.scale.y = 1.5 + i % 2 * 0.8;
  }
  obstacle(-0.65, -4.55, ow, 1.8);
  table(1, 1.3);
  if (state.upgrades.tables >= 1)
    table(-7.25, -0.7);
  if (state.upgrades.tables >= 2)
    table(1, -1.8);
  if (state.upgrades.expand) {
    table(6, 1.4);
    table(6, -2.5);
    box(0.2, 1.1, 12, 4351577, 9, 0.55, 0, furniture);
  } else {
    box(0.15, 0.8, 12, 8944481, 3.85, 0.4, 0, furniture);
    for (let z = -5;z < 6; z += 1)
      box(0.2, 1.2, 0.15, 8944481, 3.85, 0.6, z, furniture);
    textSign("FUTURO SALÃO", 3, 0.6, "#e4cfa4", "#715b39", 6, 1.3, 0, furniture);
  }
  for (let i = 0;i < state.upgrades.decor + 1; i++) {
    box(0.8, 0.95, 0.12, 6833454, -7 + i * 1.3, 2, -5.65, furniture);
    textSign(["BUON APPETITO", "FATTO CON AMORE", "PIZZA & AMIGOS", "CASA CHEIA"][i], 0.72, 0.8, "#f4dfac", "#b14c35", -7 + i * 1.3, 2, -5.56, furniture);
  }
  if (state.upgrades.bench) {
    box(2.9, 0.1, 0.3, 5533020, -3.9, 2, -5.45, furniture);
    for (let i = 0;i < 5; i++)
      cyl(0.1, 0.28, 14004849, -5 + i * 0.5, 2.17, -5.45, furniture);
  }
  customers.forEach((c) => c.path = []);
  roberto.path = [];
  for (const actor of [player, roberto, ...customers]) {
    if (!canStand(actor.g.position.x, actor.g.position.z, obstacles, !!state.upgrades.expand)) {
      let spot = null;
      for (let radius = 0.3;radius < 7 && !spot; radius += 0.3) {
        for (let a = 0;a < 16; a++) {
          let x = actor.g.position.x + Math.cos(a * Math.PI / 8) * radius, z = actor.g.position.z + Math.sin(a * Math.PI / 8) * radius;
          if (canStand(x, z, obstacles, !!state.upgrades.expand)) {
            spot = { x, z };
            break;
          }
        }
      }
      if (spot)
        actor.g.position.set(spot.x, 0, spot.z);
    }
  }
}
function person(shirt, skin, chef = false, big = false) {
  const g = new T.Group;
  const body = cyl(0.26, 0.6, shirt, 0, 0.98, 0, g, 0.32);
  sphere(0.23, skin, 0, 1.52, 0, g);
  cyl(0.23, 0.15, chef ? 16774365 : 4667437, 0, 1.7, 0, g);
  if (chef) {
    sphere(0.25, 16774365, 0, 1.87, 0, g);
    sphere(0.18, 16774365, 0.17, 1.86, 0, g);
    box(0.38, 0.48, 0.055, 15849389, 0, 0.93, 0.265, g);
    box(0.12, 0.025, 0.06, 4797224, -0.075, 1.45, 0.22, g);
    box(0.12, 0.025, 0.06, 4797224, 0.075, 1.45, 0.22, g);
  }
  for (let x of [-0.08, 0.08])
    sphere(0.025, 3025191, x, 1.55, 0.207, g);
  const arms = [], legs = [];
  for (let s of [-1, 1]) {
    const a = new T.Group;
    a.position.set(s * 0.34, 1.2, 0);
    cyl(0.09, 0.4, shirt, 0, -0.14, 0, a);
    sphere(0.09, skin, 0, -0.37, 0, a);
    g.add(a);
    arms.push(a);
    const l = new T.Group;
    l.position.set(s * 0.14, 0.68, 0);
    cyl(0.105, 0.5, 3427655, 0, -0.2, 0, l);
    box(0.19, 0.12, 0.3, 4929576, 0, -0.46, 0.05, l);
    g.add(l);
    legs.push(l);
  }
  if (big)
    g.scale.setScalar(1.12);
  scene.add(g);
  return { g, arms, legs, path: [], carrying: [], walk: 0 };
}
var player = person(15394517, 14261616, true);
player.g.position.set(-5.7, 0, -2.5);
var ring = mesh(new T.TorusGeometry(0.4, 0.035, 8, 40), 15914382, 0, 0.03, 0, player.g);
ring.rotation.x = Math.PI / 2;
var roberto = person(11749684, 12552286, true, true);
roberto.g.position.set(-2.6, 0, -1.4);
label(roberto.g, "ROBERTO", "roberto", 2.45);
function pizza(p) {
  const g = new T.Group;
  cyl(0.35, 0.09, p.quality < 0.7 ? 6308146 : 14394970, 0, 0, 0, g);
  if (p.stage !== "dough") {
    cyl(0.315, 0.02, 12534576, 0, 0.055, 0, g);
    cyl(0.29, 0.025, 15847022, 0, 0.072, 0, g);
    for (let i = 0;i < 8; i++) {
      let a = i * 2.399, r = 0.12 + i % 2 * 0.1;
      const top = cyl(0.055, 0.025, RECIPES[p.recipe || 0].color, Math.cos(a) * r, 0.098, Math.sin(a) * r, g);
      if (p.recipe === 2)
        top.scale.set(0.65, 1, 1.5);
    }
  }
  if (p.stage === "ready") {
    box(0.83, 0.03, 0.83, 12423254, 0, -0.065, 0, g);
    if (models.pizza) {
      g.children.slice(0).forEach((o) => {
        if (o.geometry)
          o.geometry.dispose();
      });
      g.clear();
      let real = models.pizza.clone();
      g.add(real);
      box(0.83, 0.03, 0.83, 12423254, 0, -0.065, 0, g);
    }
  }
  return g;
}
var shown = [];
function refreshPizzas() {
  for (const g of shown)
    disposeGroup(g);
  shown = [];
  for (const [i, p] of hand.entries()) {
    let m = pizza(p);
    scene.add(m);
    shown.push(m);
    p.visual = m;
  }
  for (const [i, p] of ovens.entries()) {
    let m = pizza(p);
    m.position.set(-1.15 + i * 0.35, 0.8, -3.65);
    scene.add(m);
    shown.push(m);
  }
  for (const [i, p] of shelf.entries()) {
    let m = pizza(p);
    m.position.set(-6 + i % 4 * 0.7, 1.24, 1.8 + Math.floor(i / 4) * 0.3);
    scene.add(m);
    shown.push(m);
  }
  for (const p of roberto.carrying) {
    let m = pizza(p);
    scene.add(m);
    shown.push(m);
    p.visual = m;
  }
}
async function loadAssets() {
  try {
    const manifest = await (await fetch("./assets/models.json")).json();
    const key = Object.keys(manifest).find((k) => k.toLowerCase() === "pizza") || Object.keys(manifest).find((k) => /^pizza(?!.*box|.*cutter)/i.test(k));
    if (!key)
      return;
    const gltf = await new GLTFLoader().loadAsync("./" + manifest[key]);
    const g = gltf.scene;
    let bounds = new T.Box3().setFromObject(g), size = bounds.getSize(new T.Vector3), center = bounds.getCenter(new T.Vector3);
    g.position.sub(center);
    const wrap = new T.Group;
    wrap.add(g);
    wrap.scale.setScalar(0.7 / Math.max(size.x, size.z));
    models.pizza = wrap;
    refreshPizzas();
  } catch (e) {
    console.info("Food Kit indisponível; visual procedural ativo.", e.message);
  }
}
var points = { dough: { x: -7, z: -3.35 }, bench: { x: -3.9, z: -3.35 }, oven: { x: -0.65, z: -3.1 }, counter: { x: -5, z: 0.65 }, stock: { x: 1.7, z: -3.35 }, bin: { x: -8, z: 2.9 } };
for (const [id, p] of Object.entries(points)) {
  stations.push({ ...p, id });
  let anchor = new T.Object3D;
  anchor.position.set(p.x, 0.1, p.z - 0.65);
  scene.add(anchor);
  label(anchor, { dough: "01 · MASSA", bench: "02 · PREPARO", oven: "03 · FORNO", counter: "04 · BALCÃO", stock: "DESPENSA", bin: "DESCARTAR" }[id], "", 1.35);
}
cyl(0.28, 0.6, 6780522, -8, 0.3, 2.9);
cyl(0.3, 0.06, 10202528, -8, 0.63, 2.9);
var ovenLabel = label(ovenLight, "Forno livre", "", 0.4);
var steamMaterial = new T.MeshBasicMaterial({ color: 16774359, transparent: true, opacity: 0.25, depthWrite: false });
var steam = Array.from({ length: 14 }, (_, i) => {
  const m = new T.Mesh(new T.SphereGeometry(0.07, 7, 5), steamMaterial.clone());
  m.visible = false;
  scene.add(m);
  return m;
});
function updateSteam() {
  let sources = [...ovens.filter((p) => p.stage === "ready").map(() => new T.Vector3(-0.65, 1.05, -3.65)), ...hand.filter((p) => p.stage === "ready" && p.visual).map((p) => p.visual.position), ...shelf.slice(0, 2).map((p, i) => new T.Vector3(-6 + i * 0.7, 1.3, 1.8))];
  steam.forEach((m, i) => {
    m.visible = !!sources.length && state.quality !== "baixa";
    if (!m.visible)
      return;
    let t = (time * 0.65 + i * 0.19) % 1, src = sources[i % sources.length];
    m.position.copy(src).add(new T.Vector3(Math.sin(i * 3 + time) * 0.12, 0.12 + t * 0.7, Math.cos(i) * 0.12));
    m.scale.setScalar(0.6 + t * 1.2);
    m.material.opacity = (1 - t) * 0.24;
  });
}
function animatePerson(p, dt, moving, working = false) {
  p.walk += dt * (moving ? 11 : 2);
  p.legs.forEach((l, i) => l.rotation.x = moving ? Math.sin(p.walk + i * Math.PI) * 0.48 : 0);
  p.arms.forEach((a, i) => a.rotation.x = working ? -0.9 + Math.sin(p.walk * 2) * 0.18 : moving ? Math.sin(p.walk + i * Math.PI + Math.PI) * 0.35 : Math.sin(p.walk) * 0.025);
}
function navigate(p, target, speed, dt) {
  if (Math.hypot(p.g.position.x - target.x, p.g.position.z - target.z) < 0.36) {
    animatePerson(p, dt, false);
    return true;
  }
  if (!p.path.length || p.target !== target) {
    p.path = route(p.g.position, target, obstacles, !!state.upgrades.expand);
    p.target = target;
  }
  const n = p.path[0];
  if (!n)
    return false;
  let dx = n.x - p.g.position.x, dz = n.z - p.g.position.z, d = Math.hypot(dx, dz), v = Math.min(d, speed * dt);
  if (d < 0.001) {
    p.path.shift();
    return false;
  }
  p.g.position.x += dx / d * v;
  p.g.position.z += dz / d * v;
  p.g.rotation.y = Math.atan2(dx, dz);
  if (d < 0.1)
    p.path.shift();
  animatePerson(p, dt, true, p.carrying.length > 0);
  return false;
}
var queue = [{ x: -5, z: 3 }, { x: -3.8, z: 3.65 }, { x: -2.7, z: 4.25 }, { x: -1.5, z: 4.25 }, { x: 0, z: 4.25 }, { x: 1.5, z: 4.25 }];
var exit = { x: -0.5, z: 5.1 };
function spawn() {
  if (customers.filter((c) => c.status !== "exit").length >= 2 + state.upgrades.tables + 2 * state.upgrades.expand)
    return;
  let r = state.served < 3 ? 0 : Math.floor(Math.random() * level(state));
  let vip = state.served >= 8 && Math.random() < 0.18;
  let c = person([7573142, 13609296, 10058395, 4746836, 12216905][serial % 5], [14856065, 10051395, 13077605][serial % 3]);
  Object.assign(c, { id: serial++, recipe: r, qty: vip ? 2 : 1, remaining: vip ? 2 : 1, patience: 180, maxPatience: 180, status: "enter", vip });
  c.g.position.set(-0.5, 0, 5.1);
  c.label = label(c.g, RECIPES[r].name, "", 2.1);
  customers.push(c);
  selected ??= c.id;
  sound("order");
}
function removeCustomer(c) {
  scene.remove(c.g);
  c.g.traverse((o) => o.geometry?.dispose());
  c.label.el.remove();
  labels.splice(labels.indexOf(c.label), 1);
  customers.splice(customers.indexOf(c), 1);
}
function updateCustomers(dt) {
  let active = customers.filter((c) => c.status !== "exit");
  for (const c of [...customers]) {
    if (c.status === "exit") {
      if (navigate(c, exit, 2, dt))
        removeCustomer(c);
      continue;
    }
    let target = queue[active.indexOf(c)];
    if (navigate(c, target, 1.5, dt))
      c.status = "wait";
    c.patience -= dt;
    if (c.patience <= 0) {
      c.status = "exit";
      combo = 0;
      toast("Um cliente desistiu. Combo encerrado; novos pedidos chegarão.");
      if (selected === c.id)
        selected = active.find((x) => x !== c)?.id ?? null;
      continue;
    }
    c.label.el.innerHTML = `${c.vip ? "★ " : ""}#${c.id} ${c.remaining}× ${RECIPES[c.recipe].name}<div class="track"><i style="width:${c.patience / c.maxPatience * 100}%"></i></div>`;
  }
}
function updateHelper(dt) {
  if (!state.upgrades.helper) {
    animatePerson(roberto, dt, false);
    return;
  }
  let speed = 1.5 + state.upgrades.helper * 0.6;
  if (roberto.carrying.length) {
    if (navigate(roberto, points.counter, speed, dt)) {
      shelf.push(...roberto.carrying);
      roberto.carrying = [];
      refreshPizzas();
      toast("Roberto deixou pizzas prontas no balcão.");
    }
    return;
  }
  if (ovens.some((p) => p.stage === "ready")) {
    if (navigate(roberto, points.oven, speed, dt)) {
      const ready = ovens.filter((p) => p.stage === "ready").slice(0, state.upgrades.helper);
      roberto.carrying.push(...ready);
      ovens = ovens.filter((p) => !ready.includes(p));
      refreshPizzas();
    }
  } else
    animatePerson(roberto, dt, false);
}
function checkProgress() {
  const old = level(state);
  for (const m of claim(state)) {
    toast(`Missão concluída: ${m.name}! +R$ ${m.money} · +${m.xp} XP`);
    sound("level");
  }
  if (level(state) > old) {
    toast("Novo nível! Receita liberada: " + RECIPES[level(state) - 1].name);
    sound("level");
  }
  save();
}
function deliver(c, p, source) {
  if (c.status !== "wait")
    return toast("Espere o cliente chegar ao lugar na fila.");
  if (c.recipe !== p.recipe) {
    combo = 0;
    return toast("Receita diferente. Combo encerrado. Guarde esta pizza ou refaça o pedido.");
  }
  source.splice(source.indexOf(p), 1);
  combo = Math.min(combo + 1, 5);
  let old = level(state);
  let gain = reward(state, p.recipe, c.patience / c.maxPatience, p.quality ?? 1, combo, rush);
  c.remaining--;
  if (!c.remaining) {
    if (c.vip) {
      state.money += 18;
      state.xp += 15;
    }
    c.status = "exit";
    if (selected === c.id)
      selected = customers.find((x) => x.status !== "exit" && x !== c)?.id ?? null;
  }
  sound("cash");
  toast(`Entrega concluída! +R$ ${gain.total} · +${Math.round(22 * (p.quality ?? 1))} XP${gain.tip ? " · gorjeta R$ " + gain.tip : ""}`);
  if (level(state) > old) {
    sound("level");
    toast(`Nível ${level(state)}! ${RECIPES[level(state) - 1].name} desbloqueada.`);
  }
  checkProgress();
  refreshPizzas();
  renderUI();
}
function interact() {
  if (paused || work || !started)
    return;
  const n = nearest;
  if (!n)
    return;
  if (n.id === "roberto")
    return showRoberto();
  if (n.id === "customer") {
    let p = hand.find((p) => p.stage === "ready");
    return p ? deliver(n.customer, p, hand) : toast("Leve uma pizza pronta para este cliente.");
  }
  if (n.id === "dough") {
    if (hand.length >= 1 + state.upgrades.tray)
      return toast("Bandeja cheia. Asse ou entregue o que está carregando.");
    hand.push({ stage: "dough", recipe: null, quality: 1 });
    heldIndex = hand.length - 1;
    sound("tap");
    refreshPizzas();
  }
  if (n.id === "bench") {
    if (!hand.some((p) => p.stage === "dough"))
      return toast("Primeiro pegue uma massa na estação 01.");
    showRecipes();
  }
  if (n.id === "oven") {
    const ready = ovens.find((p) => p.stage === "ready");
    if (ready && hand.length < 1 + state.upgrades.tray) {
      ovens.splice(ovens.indexOf(ready), 1);
      hand.push(ready);
      heldIndex = hand.length - 1;
      refreshPizzas();
      sound("oven");
      return;
    }
    const p = hand.find((p) => p.stage === "raw");
    if (!p)
      return toast(ready ? "Sua bandeja está cheia." : "Monte uma pizza na bancada antes de assar.");
    if (ovens.length >= 1 + state.upgrades.oven)
      return toast("Forno cheio. Aproveite para atender ou preparar outra massa.");
    hand.splice(hand.indexOf(p), 1);
    p.stage = "baking";
    p.elapsed = 0;
    p.duration = Math.max(4, 10 - state.upgrades.oven * 2);
    ovens.push(p);
    refreshPizzas();
    sound("tap");
  }
  if (n.id === "counter") {
    const c = customers.find((c) => c.id === selected && c.status === "wait") || customers.find((c) => c.status === "wait");
    if (!c)
      return toast("Aguarde um cliente chegar ao balcão.");
    let p = hand.find((p) => p.stage === "ready" && p.recipe === c.recipe), src = hand;
    if (!p) {
      p = shelf.find((p) => p.recipe === c.recipe);
      src = shelf;
    }
    if (!p)
      return toast("Pedido #" + c.id + ": prepare " + RECIPES[c.recipe].name + ".");
    deliver(c, p, src);
  }
  if (n.id === "stock")
    showStock();
  if (n.id === "bin") {
    if (!hand.length)
      return toast("Suas mãos estão vazias.");
    hand.splice(Math.min(heldIndex, hand.length - 1), 1);
    heldIndex = 0;
    refreshPizzas();
    toast("Pizza descartada. Pegue outra massa gratuitamente.");
  }
  renderUI();
}
function showModal(html) {
  paused = true;
  keysReset();
  $("#modalcontent").innerHTML = html;
  $("#modal").classList.remove("hidden");
  $("#close").focus();
}
function closeModal() {
  paused = false;
  $("#modal").classList.add("hidden");
  keysReset();
}
$("#close").onclick = closeModal;
function showRecipes() {
  const target = customers.find((c) => c.id === selected);
  showModal(`<span class="eyebrow">02 / BANCADA DE PREPARO</span><h2>Feita com capricho.</h2><p>Escolha a receita. Você espalha o molho e adiciona os ingredientes na bancada. ${target ? "Comanda selecionada: <b>" + RECIPES[target.recipe].name + "</b>." : ""}</p>` + RECIPES.map((r, i) => `<div class="recipe"><span><b>${r.name}</b><br><small>${r.ingredients}</small></span><button data-recipe="${i}" ${level(state) < r.level || i >= 3 && !state.stock[i] ? "disabled" : ""}>${level(state) < r.level ? "Nível " + r.level : i >= 3 && !state.stock[i] ? "Sem estoque" : "Montar" + (i >= 3 ? " · " + state.stock[i] + " disponíveis" : "")}</button></div>`).join(""));
  document.querySelectorAll("[data-recipe]").forEach((b) => b.onclick = () => {
    let r = +b.dataset.recipe, p = hand.find((p) => p.stage === "dough");
    if (!p || level(state) < RECIPES[r].level || r >= 3 && !state.stock[r])
      return;
    if (r >= 3)
      state.stock[r]--;
    p.recipe = r;
    p.stage = "raw";
    work = { left: 2.5 - state.upgrades.bench * 0.55, total: 2.5 - state.upgrades.bench * 0.55 };
    closeModal();
    refreshPizzas();
    save();
  });
}
function showUpgrades() {
  showModal(`<span class="eyebrow">INVISTA NO SEU SONHO</span><h2>Pequenas melhorias. Grande futuro.</h2><p>Caixa disponível: <b>R$ ${state.money}</b>. Cada compra transforma a pizzaria.</p><div class="grid">` + Object.entries(UPGRADES).map(([k, u]) => {
    let n = state.upgrades[k], locked = k === "helper" && state.served < 3;
    return `<div class="card"><h4>${u.name} <small>ETAPA ${n}/${u.max}</small></h4><p>${u.desc(n)}<br>→ ${n < u.max ? u.desc(n + 1) : "Melhoria completa"}</p><button data-buy="${k}" ${n >= u.max || state.money < cost(state, k) || locked ? "disabled" : ""}>${n >= u.max ? "Concluído" : locked ? "Entregue 3 pizzas" : "Melhorar · R$ " + cost(state, k)}</button></div>`;
  }).join("") + "</div>");
  document.querySelectorAll("[data-buy]").forEach((b) => b.onclick = () => {
    if (buy(state, b.dataset.buy)) {
      sound("level");
      checkProgress();
      rebuild();
      refreshPizzas();
      renderUI();
      showUpgrades();
    }
  });
}
function showMissions() {
  showModal('<span class="eyebrow">A SUA JORNADA</span><h2>Do balcão ao império.</h2>' + MISSIONS.map((m, i) => `<div class="card"><h4>${state.claimed.includes(i) ? "✓ " : ""}${m.name}</h4><p>${m.desc} · ${Math.min(m.goal, missionValue(state, m))}/${m.goal}</p><small>R$ ${m.money} + ${m.xp} XP ${state.claimed.includes(i) ? "· RECEBIDOS" : ""}</small></div>`).join(""));
}
function showRoberto() {
  showModal(`<span class="eyebrow">SEU BRAÇO DIREITO</span><h2>Ô, chefe! Bora crescer?</h2><p>“O segredo é o forno quente e o cliente feliz.”</p><p>${state.upgrades.helper ? "Estou levando as pizzas prontas do forno ao balcão. Você entrega a comanda correta pelo balcão e fica com os lucros." : "Vamos começar: pegue a massa, escolha muçarela na bancada, asse e entregue no balcão. Depois de três pizzas, você pode me contratar."}</p><div class="dialog-actions"><button id="rm">Ver missões</button><button id="rd">Pedir uma dica</button><button id="ru">Melhorar ajudante</button><button id="rs">Sair</button></div>`);
  $("#rm").onclick = showMissions;
  $("#ru").onclick = showUpgrades;
  $("#rs").onclick = closeModal;
  $("#rd").onclick = () => {
    const tips = ["Chefe, essa pizza não vai se entregar sozinha! Selecione a comanda e entregue no balcão.", "Pizzas prontas passam do ponto após 18 segundos. A qualidade cai, mas ainda podem ser entregues.", "A primeira melhoria do forno custa R$ 65. Dois bons pedidos já resolvem!", "Cinco acertos seguidos dobram as gorjetas. Receita errada ou desistência encerra o combo.", "Os ingredientes especiais usam estoque. A despensa repõe oito por R$ 24."];
    $("#modalcontent p").textContent = "“" + tips[Math.floor(Math.random() * tips.length)] + "”";
  };
}
function showStock() {
  showModal('<span class="eyebrow">DESPENSA</span><h2>Sempre de portas abertas.</h2><p>Massa, molho e ingredientes das três primeiras receitas são ilimitados. Ingredientes especiais são liberados no nível 4 e custam R$ 24 por 8 porções.</p>' + RECIPES.slice(3).map((r, j) => `<div class="recipe"><span>${r.name} · ${state.stock[j + 3]} porções</span><button data-stock="${j + 3}" ${level(state) < r.level || state.money < 24 ? "disabled" : ""}>+8 · R$ 24</button></div>`).join(""));
  document.querySelectorAll("[data-stock]").forEach((b) => b.onclick = () => {
    let i = +b.dataset.stock;
    if (state.money >= 24 && level(state) >= RECIPES[i].level) {
      state.money -= 24;
      state.stock[i] += 8;
      save();
      sound("cash");
      showStock();
      renderUI();
    }
  });
}
function showPause() {
  showModal(`<span class="eyebrow">FAÇA UMA PAUSA</span><h2>O forno pode esperar.</h2><p>O tempo para enquanto este painel estiver aberto. Seu progresso é salvo automaticamente.</p><label>Volume <input id="volume" type="range" min="0" max="1" step=".05" value="${state.volume}"></label><label>Qualidade gráfica <select id="quality"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></label><p>WASD ou setas: mover · Shift: correr · E: interagir · Esc: pausar. No celular, use o joystick e E. Clique em uma comanda para selecioná-la.</p><div class="dialog-actions"><button id="resume">Continuar</button><button id="reset">Reiniciar progresso</button></div>`);
  $("#quality").value = state.quality;
  $("#quality").onchange = (e) => {
    state.quality = e.target.value;
    quality();
    save();
  };
  $("#volume").oninput = (e) => {
    state.volume = +e.target.value;
    sound("tap");
    save();
  };
  $("#resume").onclick = closeModal;
  $("#reset").onclick = () => {
    showModal('<h2>Começar uma nova história?</h2><p>Dinheiro, níveis, missões e melhorias serão apagados. Esta ação não pode ser desfeita.</p><div class="dialog-actions"><button id="confirmreset">Sim, reiniciar tudo</button><button id="cancelreset">Cancelar</button></div>');
    $("#cancelreset").onclick = showPause;
    $("#confirmreset").onclick = () => {
      state = fresh();
      save();
      location.reload();
    };
  };
}
$("#upgrades").onclick = showUpgrades;
$("#missions").onclick = showMissions;
$("#pause").onclick = showPause;
function renderUI() {
  $("#money").textContent = state.money.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  $("#level").textContent = `NÍVEL ${level(state)} · ${["APRENDIZ", "PIZZAIOLO", "ARTESÃO", "CHEF", "MESTRE", "IMPERADOR"][level(state) - 1]}`;
  $("#xp").style.width = (level(state) === 6 ? 100 : state.xp % 100) + "%";
  $("#xptext").textContent = level(state) === 6 ? "Todas as receitas liberadas" : `${state.xp % 100} / 100 XP`;
  let active = customers.filter((c) => c.status !== "exit");
  $("#count").textContent = `${active.length}/${2 + state.upgrades.tables + 2 * state.upgrades.expand}`;
  $("#orderlist").innerHTML = active.length ? active.map((c) => `<div class="order ${c.id === selected ? "selected" : ""}" data-order="${c.id}" tabindex="0" role="button"><h4>${c.vip ? "★ " : ""}#${String(c.id).padStart(2, "0")} · ${RECIPES[c.recipe].name}</h4><p>${RECIPES[c.recipe].ingredients}</p><small>${c.remaining} pizza${c.remaining > 1 ? "s" : ""} · R$ ${RECIPES[c.recipe].price * c.remaining}${c.vip ? " + bônus" : ""} · ${c.status === "enter" ? "chegando" : Math.ceil(c.patience) + " s"}</small><div class="track"><i style="width:${c.patience / c.maxPatience * 100}%"></i></div></div>`).join("") : '<p class="hint">O próximo cliente já está a caminho.</p>';
  document.querySelectorAll("[data-order]").forEach((el) => {
    const select = () => {
      selected = +el.dataset.order;
      renderUI();
    };
    el.onclick = select;
    el.onkeydown = (e) => {
      if (e.key === "Enter")
        select();
    };
  });
  const mi = MISSIONS.findIndex((m, i) => !state.claimed.includes(i)), m = MISSIONS[mi];
  $("#missiontitle").textContent = m ? m.name : "Seu império está vivo!";
  $("#missiondesc").textContent = m ? m.desc : "Todas as missões concluídas. Continue servindo e aperfeiçoando sua pizzaria.";
  $("#missionbar").style.width = m ? Math.min(100, missionValue(state, m) / m.goal * 100) + "%" : "100%";
  $("#missionreward").textContent = m ? `RECOMPENSA · R$ ${m.money} + ${m.xp} XP` : "JORNADA COMPLETA";
  $("#inventory").innerHTML = "<small>BANDEJA</small>" + Array.from({ length: 1 + state.upgrades.tray }, (_, i) => {
    let p = hand[i];
    return `<span class="slot ${heldIndex === i ? "active" : ""}" data-slot="${i}">${p ? (p.stage === "dough" ? "Massa" : RECIPES[p.recipe].name) + " · " + ({ dough: "crua", raw: "montada", ready: "pronta" }[p.stage] || "assando") : "Vazio"}</span>`;
  }).join("");
  document.querySelectorAll("[data-slot]").forEach((el) => el.onclick = () => {
    heldIndex = +el.dataset.slot;
    renderUI();
  });
  $("#combo").style.display = combo ? "block" : "none";
  $("#combo").textContent = `✦ COMBO ${combo} · GORJETAS ×${Math.min(2, 1 + combo * 0.2).toFixed(1)}`;
}
function keysReset() {
  for (let k in keys)
    keys[k] = false;
  stick.x = stick.y = 0;
}
addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
    e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.repeat)
    return;
  if (e.key.toLowerCase() === "e")
    interact();
  if (e.key === "Escape") {
    if (!started)
      return;
    paused ? closeModal() : showPause();
  }
});
addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
addEventListener("blur", () => {
  keysReset();
  if (started && !paused)
    showPause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started && !paused)
    showPause();
});
var stick = { x: 0, y: 0 };
$("#joystick").onpointerdown = (e) => {
  $("#joystick").setPointerCapture(e.pointerId);
  moveStick(e);
};
function moveStick(e) {
  if (!$("#joystick").hasPointerCapture(e.pointerId))
    return;
  let r = $("#joystick").getBoundingClientRect(), x = (e.clientX - r.left - 50) / 38, y = (e.clientY - r.top - 50) / 38, l = Math.max(1, Math.hypot(x, y));
  stick.x = x / l;
  stick.y = y / l;
  $("#joystick i").style.transform = `translate(${stick.x * 28}px,${stick.y * 28}px)`;
}
$("#joystick").onpointermove = moveStick;
$("#joystick").onpointerup = $("#joystick").onpointercancel = () => {
  stick.x = stick.y = 0;
  $("#joystick i").style.transform = "";
};
$("#interact").onclick = interact;
function updatePlayer(dt) {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + stick.x, z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + stick.y;
  let len = Math.hypot(x, z);
  if (work) {
    animatePerson(player, dt, false, true);
    return;
  }
  if (len) {
    x /= Math.max(1, len);
    z /= Math.max(1, len);
    const dx = (x * 0.866 + z * 0.5) * (keys.shift ? 5 : 3.1) * dt, dz = (-x * 0.5 + z * 0.866) * (keys.shift ? 5 : 3.1) * dt;
    const p = player.g.position;
    if (canStand(p.x + dx, p.z, obstacles, !!state.upgrades.expand))
      p.x += dx;
    if (canStand(p.x, p.z + dz, obstacles, !!state.upgrades.expand))
      p.z += dz;
    player.g.rotation.y = Math.atan2(dx, dz);
  }
  animatePerson(player, dt, !!len, hand.length > 0);
}
function updatePrompt() {
  let list = [...stations, { x: roberto.g.position.x, z: roberto.g.position.z, id: "roberto" }, ...customers.filter((c) => c.status === "wait").map((c) => ({ x: c.g.position.x, z: c.g.position.z, id: "customer", customer: c }))];
  nearest = list.map((n) => ({ ...n, d: Math.hypot(n.x - player.g.position.x, n.z - player.g.position.z) })).filter((n) => n.d < 1.4).sort((a, b) => a.d - b.d)[0];
  $("#prompt").style.display = nearest && !paused ? "block" : "none";
  if (nearest)
    $("#prompt").innerHTML = "<b>E</b> " + { dough: "Pegar massa", bench: "Escolher receita e montar", oven: ovens.some((p) => p.stage === "ready") ? "Retirar pizza pronta" : "Colocar pizza no forno", counter: "Entregar comanda selecionada" + (shelf.length ? " · " + shelf.length + " no balcão" : ""), stock: "Repor ingredientes especiais", bin: "Descartar pizza selecionada", roberto: "Conversar com Roberto", customer: "Entregar ao cliente #" + nearest.customer?.id }[nearest.id];
}
function frame(dt) {
  if (started && !paused) {
    time += dt;
    toastTime -= dt;
    if (toastTime <= 0)
      $("#toast").style.opacity = 0;
    updatePlayer(dt);
    updateCustomers(dt);
    updateHelper(dt);
    spawnClock += dt;
    if (spawnClock > (rush ? 8 : 20)) {
      spawnClock = 0;
      spawn();
    }
    for (const p of ovens) {
      p.elapsed += dt;
      if (p.stage === "baking" && p.elapsed >= p.duration) {
        p.stage = "ready";
        sound("oven");
        toast("Pizza pronta! Retire no forno.");
        refreshPizzas();
      }
      if (p.stage === "ready")
        p.quality = p.elapsed > p.duration + 18 ? 0.6 : 1;
    }
    if (work) {
      work.left -= dt;
      $("#work").style.display = "block";
      $("#work span").textContent = "Espalhando molho e ingredientes…";
      $("#work i").style.width = (1 - work.left / work.total) * 100 + "%";
      if (work.left <= 0) {
        work = null;
        $("#work").style.display = "none";
        toast("Pizza montada. Agora leve ao forno!");
      }
    }
    let cycle = time % 180;
    rush = cycle >= 150;
    $("#event").style.display = cycle >= 135 ? "block" : "none";
    $("#event").textContent = rush ? "☀ HORÁRIO DE PICO · gorjetas +50% · " + Math.ceil(180 - cycle) + " s" : "☀ Horário de pico em " + Math.ceil(150 - cycle) + " s";
    updatePrompt();
    uiClock += dt;
    if (uiClock > 0.35) {
      renderUI();
      uiClock = 0;
    }
  }
  hand.forEach((p, i) => {
    if (p.visual) {
      p.visual.position.copy(player.g.position).add(new T.Vector3(Math.sin(player.g.rotation.y) * 0.5, 1 + i * 0.16, Math.cos(player.g.rotation.y) * 0.5));
    }
  });
  roberto.carrying.forEach((p, i) => {
    if (p.visual)
      p.visual.position.copy(roberto.g.position).add(new T.Vector3(Math.sin(roberto.g.rotation.y) * 0.5, 1.1 + i * 0.16, Math.cos(roberto.g.rotation.y) * 0.5));
  });
  ovenLight.intensity = ovens.length ? 10 + Math.sin(time * 8) : 5;
  ovenLabel.el.innerHTML = ovens.length ? ovens.map((p) => `<div>${p.stage === "ready" ? p.quality < 1 ? "Passou do ponto" : "Pronta!" : "Assando " + Math.ceil(p.duration - p.elapsed) + " s"}<div class="track"><i style="width:${Math.min(100, p.elapsed / p.duration * 100)}%"></i></div></div>`).join("") : "Forno livre";
  const focus = new T.Vector3(player.g.position.x * 0.22, 0, player.g.position.z * 0.14);
  let dist = innerWidth < 700 ? 30 : 24;
  camera.position.lerp(new T.Vector3(focus.x + dist * 0.45, dist * 0.8, focus.z + dist * 0.95), 1 - Math.exp(-dt * 3));
  camera.lookAt(focus.x, 0.1, focus.z - 1);
  camera.updateMatrixWorld();
  for (const l of labels) {
    const v = l.obj.getWorldPosition(new T.Vector3);
    v.y += l.height;
    v.project(camera);
    l.el.style.left = (v.x * 0.5 + 0.5) * innerWidth + "px";
    l.el.style.top = (-v.y * 0.5 + 0.5) * innerHeight + "px";
    l.el.style.display = v.z > 1 || v.z < -1 ? "none" : "block";
  }
  updateSteam();
  renderer.render(scene, camera);
}
rebuild();
quality();
loadAssets();
renderUI();
camera.position.set(12, 21, 25);
$("#loading").classList.add("hidden");
showModal(`<span class="eyebrow">BEM-VINDO À SUA NOVA HISTÓRIA</span><h2>Uma massa.<br>Mil possibilidades.</h2><p>Seu pequeno balcão está pronto para virar um império. Roberto está por perto, o forno está quente e o primeiro cliente chega assim que você abrir.</p><div class="grid"><div class="card"><h4>01 · Prepare</h4><p>Pegue massa e monte muçarela na bancada.</p></div><div class="card"><h4>02 · Encante</h4><p>Asse por 10 segundos e entregue no balcão. Cada pedido aproxima você da próxima melhoria.</p></div></div><p>WASD / setas para andar · E para interagir · Shift para correr.</p><button id="start">${state.served ? "Reabrir minha pizzaria" : "Abrir as portas"} →</button>`);
$("#close").classList.add("hidden");
$("#start").onclick = () => {
  started = true;
  closeModal();
  $("#close").classList.remove("hidden");
  spawn();
  sound("level");
  toast("Roberto: comece pegando uma massa na estação 01!");
};
var previous = performance.now();
renderer.setAnimationLoop((now) => {
  let dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  frame(dt);
});
setInterval(save, 1e4);
addEventListener("pagehide", save);
