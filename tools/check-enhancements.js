var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};

// audio.js
class RestaurantAudio {
  constructor(settings, factory = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)) {
    this.settings = settings;
    this.factory = factory;
    this.ctx = null;
    this.step = 0;
    this.next = 0;
    this.intense = false;
    this.paused = false;
    this.hidden = false;
  }
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = this.factory();
        const c = this.ctx;
        this.music = c.createGain();
        this.effects = c.createGain();
        this.accent = c.createGain();
        this.master = c.createDynamicsCompressor();
        this.music.gain.value = 0;
        this.effects.gain.value = 0;
        this.accent.gain.value = 0;
        this.accent.connect(this.music);
        this.music.connect(this.master);
        this.effects.connect(this.master);
        this.master.connect(c.destination);
        this.next = c.currentTime + 0.1;
        this.apply();
      }
      this.ctx.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
  apply() {
    if (!this.ctx)
      return;
    const s = this.settings(), t = this.ctx.currentTime;
    const music = s.musicMuted || this.hidden ? 0 : s.musicVolume * (this.paused ? 0.4 : 1);
    const effects = s.sfxMuted || this.hidden ? 0 : s.sfxVolume;
    this.music.gain.setTargetAtTime(music, t, 0.12);
    this.effects.gain.setTargetAtTime(effects, t, 0.025);
  }
  setScene({ rush = false, paused = false, hidden = false } = {}) {
    if (this.intense !== rush) {
      this.intense = rush;
      if (this.ctx)
        this.accent.gain.setTargetAtTime(rush ? 1 : 0, this.ctx.currentTime, 1.2);
    }
    if (this.paused !== paused || this.hidden !== hidden) {
      this.paused = paused;
      this.hidden = hidden;
      this.apply();
    }
  }
  note(frequency, time, duration, type, bus, volume = 0.1) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(volume, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(bus);
    o.start(time);
    o.stop(time + duration + 0.025);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  effect(kind, delay = 0) {
    const s = this.settings();
    if (!this.ctx || this.ctx.state !== "running" || s.sfxMuted || s.sfxVolume === 0 || this.hidden)
      return;
    const t = this.ctx.currentTime + delay;
    for (const [f, offset, duration, type] of EFFECTS[kind] || EFFECTS.tap)
      this.note(f, t + offset, duration, type, this.effects, 0.16);
  }
  tick() {
    if (!this.ctx || this.ctx.state !== "running" || this.hidden)
      return;
    const now = this.ctx.currentTime;
    if (this.next < now - 0.3)
      this.next = now + 0.03;
    const chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]];
    while (this.next < now + 0.15) {
      const i = this.step % 16, chord = chords[Math.floor(this.step / 16) % 4], t = this.next;
      if (i % 2 === 0) {
        this.note(hz(chord[i / 2 % 4]), t, 0.65, "triangle", this.music, 0.075);
        if (i % 4 === 0)
          this.note(hz(chord[0] - 24), t, 0.75, "sine", this.music, 0.14);
      }
      if ([3, 6, 11, 14].includes(i))
        this.note(hz(chord[(i + Math.floor(this.step / 16)) % 4] + 12), t, 0.4, "sine", this.music, 0.045);
      if (i % 4 === 2)
        this.note(150, t, 0.07, "triangle", this.accent, 0.08);
      if (i % 2 === 1)
        this.note(2400, t, 0.025, "triangle", this.accent, 0.022);
      if (i % 4 === 0)
        this.note(hz(chord[2] + 12), t, 0.22, "triangle", this.accent, 0.045);
      this.step++;
      this.next += 60 / 88 / 2;
    }
  }
}
var EFFECTS, hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
var init_audio = __esm(() => {
  EFFECTS = {
    dough: [[210, 0, 0.08, "triangle"], [340, 0.06, 0.1, "sine"]],
    ingredient: [[560, 0, 0.05, "sine"], [730, 0.055, 0.07, "sine"]],
    prep: [[280, 0, 0.06, "triangle"], [420, 0.09, 0.05, "triangle"], [560, 0.18, 0.1, "triangle"]],
    prepDone: [[440, 0, 0.08, "sine"], [660, 0.08, 0.12, "sine"]],
    ovenIn: [[145, 0, 0.12, "triangle"], [220, 0.1, 0.12, "triangle"]],
    ovenOut: [[520, 0, 0.1, "triangle"], [780, 0.09, 0.15, "sine"]],
    ovenReady: [[880, 0, 0.12, "sine"], [880, 0.22, 0.16, "sine"]],
    arrival: [[494, 0, 0.12, "sine"], [740, 0.11, 0.18, "sine"]],
    order: [[660, 0, 0.07, "triangle"], [830, 0.08, 0.1, "triangle"]],
    delivery: [[523, 0, 0.08, "triangle"], [659, 0.08, 0.09, "triangle"], [784, 0.16, 0.13, "triangle"]],
    cash: [[1175, 0, 0.06, "sine"], [1568, 0.07, 0.12, "sine"]],
    tip: [[1760, 0, 0.05, "sine"], [2093, 0.07, 0.08, "sine"]],
    purchase: [[330, 0, 0.08, "triangle"], [494, 0.09, 0.09, "triangle"], [660, 0.18, 0.16, "sine"]],
    restock: [[300, 0, 0.05, "triangle"], [360, 0.07, 0.06, "triangle"], [460, 0.14, 0.09, "triangle"]],
    mission: [[523, 0, 0.12, "sine"], [659, 0.12, 0.12, "sine"], [784, 0.24, 0.12, "sine"], [1046, 0.36, 0.2, "sine"]],
    level: [[392, 0, 0.12, "triangle"], [523, 0.12, 0.12, "triangle"], [659, 0.24, 0.12, "triangle"], [784, 0.36, 0.25, "sine"]],
    expansion: [[262, 0, 0.2, "triangle"], [392, 0.15, 0.2, "triangle"], [523, 0.3, 0.2, "triangle"], [784, 0.45, 0.3, "sine"]],
    wrong: [[220, 0, 0.12, "triangle"], [165, 0.15, 0.2, "triangle"]],
    burn: [[350, 0, 0.08, "sawtooth"], [240, 0.15, 0.12, "triangle"]],
    leave: [[330, 0, 0.12, "sine"], [247, 0.12, 0.12, "sine"], [196, 0.24, 0.18, "sine"]],
    helperTake: [[390, 0, 0.07, "triangle"], [490, 0.08, 0.09, "triangle"]],
    helperDrop: [[490, 0, 0.07, "triangle"], [390, 0.08, 0.1, "triangle"]],
    store: [[260, 0, 0.09, "triangle"]],
    take: [[460, 0, 0.09, "triangle"]],
    combo: [[784, 0, 0.08, "sine"], [988, 0.08, 0.08, "sine"], [1318, 0.16, 0.18, "sine"]],
    event: [[587, 0, 0.1, "triangle"], [784, 0.12, 0.1, "triangle"], [988, 0.24, 0.16, "triangle"]],
    tap: [[320, 0, 0.08, "sine"]]
  };
});

// core.js
function fresh() {
  return { version: 1, money: 20, xp: 0, served: 0, purchases: 0, bestCombo: 0, claimed: [], upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])), stock: [0, 0, 0, 8, 8, 8], volume: 0.35, sfxVolume: 0.35, musicVolume: 0.22, sfxMuted: false, musicMuted: false, cameraZoom: 1.15, daily: null, quality: "media" };
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
    d.sfxVolume = Number.isFinite(s.sfxVolume) ? Math.max(0, Math.min(1, s.sfxVolume)) : d.volume;
    d.musicVolume = Number.isFinite(s.musicVolume) ? Math.max(0, Math.min(1, s.musicVolume)) : 0.22;
    d.sfxMuted = s.sfxMuted === true;
    d.musicMuted = s.musicMuted === true;
    d.cameraZoom = Number.isFinite(s.cameraZoom) ? Math.max(0.8, Math.min(1.5, s.cameraZoom)) : 1.15;
    if (s.daily && /^\d{4}-\d{2}-\d{2}$/.test(s.daily.day)) {
      d.daily = { day: s.daily.day, served: 0, fast: 0, special: 0, claimed: [] };
      for (const k of ["served", "fast", "special"])
        d.daily[k] = Math.max(0, Math.min(1e4, Math.floor(Number(s.daily[k]) || 0)));
      d.daily.claimed = Array.isArray(s.daily.claimed) ? [...new Set(s.daily.claimed.filter((i) => Number.isInteger(i) && i >= 0 && i < 3))] : [];
    }
    d.quality = ["baixa", "media", "alta"].includes(s.quality) ? s.quality : "media";
  } catch {}
  return d;
}
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
  const tip = Math.round(base * 0.25 * Math.max(0, patience) * Math.min(2, 1 + combo * 0.2) * (1 + s.upgrades.decor * 0.2) * (rush ? 1.5 : 1));
  const total = Math.round(base * quality + tip);
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
var RECIPES, UPGRADES, MISSIONS, level = (s) => Math.min(6, 1 + Math.floor(s.xp / 100)), cost = (s, k) => Math.round(UPGRADES[k].base * Math.pow(1.8, s.upgrades[k]));
var init_core = __esm(() => {
  RECIPES = [
    { name: "Muçarela", ingredients: "Molho · muçarela", level: 1, price: 28, color: 16045419 },
    { name: "Calabresa", ingredients: "Molho · muçarela · calabresa", level: 2, price: 36, color: 12076584 },
    { name: "Marguerita", ingredients: "Molho · muçarela · tomate · manjericão", level: 3, price: 42, color: 3573325 },
    { name: "Frango com catupiry", ingredients: "Molho · frango · catupiry", level: 4, price: 48, color: 15317620 },
    { name: "Quatro queijos", ingredients: "Molho · muçarela · provolone · parmesão · gorgonzola", level: 5, price: 56, color: 16770209 },
    { name: "Especial da casa", ingredients: "Molho · queijos · calabresa · manjericão", level: 6, price: 68, color: 10111278 }
  ];
  UPGRADES = { oven: { name: "Forno", max: 3, base: 65, desc: (n) => `${Math.max(4, 10 - n * 2)} s · ${1 + n} pizzas simultâneas` }, bench: { name: "Bancada", max: 3, base: 55, desc: (n) => `${(2.5 - n * 0.55).toFixed(1)} s para montar` }, tray: { name: "Bandeja", max: 2, base: 80, desc: (n) => `${1 + n} pizzas nas mãos` }, tables: { name: "Mesas", max: 2, base: 90, desc: (n) => `${2 + n} clientes + ${n} mesas adicionais` }, decor: { name: "Decoração", max: 3, base: 75, desc: (n) => `+${n * 20}% de gorjeta` }, expand: { name: "Expansão do salão", max: 1, base: 230, desc: (n) => n ? "Salão completo · +2 clientes" : "Salão de bairro" }, helper: { name: "Roberto", max: 3, base: 95, desc: (n) => n ? `Velocidade ${(1.5 + n * 0.6).toFixed(1)} · ${n} pizzas por viagem` : "Ainda não contratado" } };
  MISSIONS = [{ name: "As primeiras três", desc: "Pegue massa, monte na bancada, asse e entregue 3 pizzas.", goal: 3, key: "served", money: 40, xp: 30 }, { name: "Um toque de evolução", desc: "Compre sua primeira melhoria.", goal: 1, key: "purchases", money: 30, xp: 25 }, { name: "Uma dupla de respeito", desc: "Contrate Roberto para levar pizzas do forno ao balcão.", goal: 1, key: "hired", money: 35, xp: 30 }, { name: "No capricho", desc: "Alcance cinco entregas corretas consecutivas.", goal: 5, key: "bestCombo", money: 50, xp: 45 }, { name: "Novos sabores", desc: "Chegue ao nível 2 e desbloqueie calabresa.", goal: 2, key: "level", money: 40, xp: 25 }, { name: "O bairro ficou pequeno", desc: "Compre a expansão do salão.", goal: 1, key: "expanded", money: 100, xp: 80 }];
});

// progression.js
function dayKey(date = new Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function ensureDaily(state, date = new Date) {
  const day = dayKey(date);
  if (state.daily?.day !== day)
    state.daily = { day, served: 0, fast: 0, special: 0, claimed: [] };
  return state.daily;
}
function recordDaily(state, { fast = false, special = false }, date = new Date) {
  const d = ensureDaily(state, date);
  d.served++;
  if (fast)
    d.fast++;
  if (special)
    d.special++;
  const result = [];
  DAILY_GOALS.forEach((g, i) => {
    if (d[g.key] >= g.goal && !d.claimed.includes(i)) {
      d.claimed.push(i);
      state.money += g.money;
      state.xp += g.xp;
      result.push(g);
    }
  });
  return result;
}
function nearestUnlock(state) {
  const next = RECIPES.find((r) => r.level > level(state));
  const candidates = Object.keys(UPGRADES).filter((k) => state.upgrades[k] < UPGRADES[k].max && (k !== "helper" || state.served >= 3)).sort((a, b) => cost(state, a) - cost(state, b));
  const key = candidates[0];
  return { recipe: next ? `${next.name}: faltam ${(next.level - 1) * 100 - state.xp} XP` : "Todas as receitas liberadas!", upgrade: key ? `${UPGRADES[key].name}: ${state.money >= cost(state, key) ? "já pode comprar" : "faltam R$ " + (cost(state, key) - state.money)}` : "Todas as melhorias concluídas!", key, expansion: state.upgrades.expand ? "Novo salão aberto!" : `Novo salão: ${state.money >= cost(state, "expand") ? "já pode abrir" : "faltam R$ " + (cost(state, "expand") - state.money)}` };
}
function specialCustomer(served, serial) {
  if (served < 3 || serial % 4 !== 0)
    return null;
  return serial % 8 === 0 ? { name: "Crítico gastronômico", qty: 1, patience: 150, money: 25, xp: 25, kind: "critic" } : { name: "Família do bairro", qty: 2, patience: 240, money: 18, xp: 15, kind: "family" };
}
function specialBonus(special, perfect) {
  return special && (special.kind !== "critic" || perfect) ? { money: special.money, xp: special.xp } : null;
}
function comboBonus(count) {
  return count === 3 ? { money: 5, xp: 3 } : count === 5 ? { money: 10, xp: 5 } : null;
}
function eventAt(time) {
  const cycle = Math.floor(time / 180), elapsed = time % 180;
  return { id: cycle, type: cycle % 2 ? "festival" : "rush", name: cycle % 2 ? "Festival de sabores" : "Horário de pico", warning: elapsed >= 135 && elapsed < 150, active: elapsed >= 150, remaining: Math.ceil((elapsed < 150 ? 150 : 180) - elapsed), goal: 2 };
}
var DAILY_GOALS;
var init_progression = __esm(() => {
  init_core();
  DAILY_GOALS = [
    { key: "served", goal: 5, title: "Cinco motivos para sorrir", desc: "Entregue 5 pizzas corretas.", money: 25, xp: 15 },
    { key: "fast", goal: 3, title: "Quentinhas na mesa", desc: "Faça 3 entregas antes de metade da paciência acabar.", money: 20, xp: 15 },
    { key: "special", goal: 1, title: "Cliente de honra", desc: "Complete um pedido especial.", money: 30, xp: 20 }
  ];
});

// counter.js
function storePizza(hand, shelf, index) {
  if (!Number.isInteger(index) || index < 0 || index >= hand.length)
    return false;
  const pizza = hand[index];
  if (!["dough", "raw", "ready"].includes(pizza.stage) || shelf.includes(pizza))
    return false;
  hand.splice(index, 1);
  shelf.push(pizza);
  return true;
}
function takePizza(shelf, hand, index, capacity) {
  if (hand.length >= capacity || !Number.isInteger(index) || index < 0 || index >= shelf.length)
    return false;
  const pizza = shelf[index];
  if (hand.includes(pizza))
    return false;
  shelf.splice(index, 1);
  hand.push(pizza);
  return true;
}
function findReadyPizza(pizzas, recipe) {
  return pizzas.find((pizza) => pizza.stage === "ready" && pizza.recipe === recipe);
}

// game.js
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    toast("Salvamento indisponível neste navegador.");
  }
}
function toast(t) {
  if (toastTime > 0) {
    if (!notices.includes(t))
      notices.push(t);
    return;
  }
  $("#toast").textContent = t;
  $("#toast").style.opacity = 1;
  toastTime = 3.5;
}
function tickNotices(dt) {
  toastTime -= dt;
  if (toastTime <= 0) {
    $("#toast").style.opacity = 0;
    if (notices.length)
      toast(notices.shift());
  }
}
function sound(kind, delay = 0) {
  music.effect(kind, delay);
}
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
function plant(x, z) {
  cyl(0.25, 0.45, 12152645, x, 0.22, z);
  for (let i = 0;i < 6; i++) {
    let leaf = sphere(0.26, 5273675, x + Math.sin(i) * 0.2, 0.6 + i * 0.06, z + Math.cos(i) * 0.2);
    leaf.scale.set(0.6, 1.5, 0.7);
  }
}
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
    m.position.set(-6.4 + i % 4 * 0.93, 1.24 + Math.floor(i / 8) * 0.16, 1.5 + Math.floor(i / 4) % 2 * 0.6);
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
function spawn() {
  if (customers.filter((c) => c.status !== "exit").length >= 2 + state.upgrades.tables + 2 * state.upgrades.expand)
    return;
  let r = state.served < 3 ? 0 : Math.floor(Math.random() * level(state));
  let special = specialCustomer(state.served, serial), vip = !!special;
  let c = person([7573142, 13609296, 10058395, 4746836, 12216905][serial % 5], [14856065, 10051395, 13077605][serial % 3]);
  Object.assign(c, { id: serial++, recipe: r, qty: special?.qty || 1, remaining: special?.qty || 1, patience: special?.patience || 180, maxPatience: special?.patience || 180, status: "enter", vip, special, perfect: true });
  c.g.position.set(-0.5, 0, 5.1);
  c.label = label(c.g, RECIPES[r].name, "", 2.1);
  customers.push(c);
  selected ??= c.id;
  sound("arrival");
  if (special)
    toast(special.name + " chegou! " + special.qty + " pizza(s) · bônus até R$ " + special.money + ".");
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
    if (navigate(c, target, 1.5, dt) && c.status !== "wait") {
      c.status = "wait";
      sound("order");
    }
    c.patience -= dt;
    if (c.patience <= 0) {
      c.status = "exit";
      combo = 0;
      streak = 0;
      sound("leave");
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
      sound("helperDrop");
      toast("Roberto deixou pizzas prontas no balcão.");
    }
    return;
  }
  if (ovens.some((p) => p.stage === "ready")) {
    if (navigate(roberto, points.oven, speed, dt)) {
      const ready = ovens.filter((p) => p.stage === "ready").slice(0, state.upgrades.helper);
      roberto.carrying.push(...ready);
      if (ready.length)
        sound("helperTake");
      ovens = ovens.filter((p) => !ready.includes(p));
      refreshPizzas();
    }
  } else
    animatePerson(roberto, dt, false);
}
function checkProgress() {
  for (const m of claim(state)) {
    toast(`Missão concluída: ${m.name}! +R$ ${m.money} · +${m.xp} XP`);
    sound("mission");
  }
  for (let n = knownLevel + 1;n <= level(state); n++)
    toast(`Nível ${n}! ${RECIPES[n - 1].name} desbloqueada. Escolha na bancada!`);
  if (level(state) > knownLevel)
    sound("level", 0.5);
  knownLevel = level(state);
  save();
}
function deliver(c, p, source) {
  if (c.status !== "wait")
    return toast("Espere o cliente chegar ao lugar na fila.");
  if (p.stage !== "ready" || !source.includes(p))
    return;
  if (c.recipe !== p.recipe) {
    combo = 0;
    streak = 0;
    sound("wrong");
    return toast("Receita diferente. Combo encerrado. Guarde esta pizza ou refaça o pedido.");
  }
  source.splice(source.indexOf(p), 1);
  streak++;
  combo = Math.min(streak, 5);
  const fast = c.patience / c.maxPatience > 0.5;
  c.perfect = c.perfect && p.quality >= 1 && fast;
  const gain = reward(state, p.recipe, c.patience / c.maxPatience, p.quality ?? 1, combo, rush);
  c.remaining--;
  const finished = !c.remaining;
  if (finished) {
    const bonus = specialBonus(c.special, c.perfect);
    if (bonus) {
      state.money += bonus.money;
      state.xp += bonus.xp;
      toast(`${c.special.name}: +R$ ${bonus.money} · +${bonus.xp} XP de bônus!`);
    } else if (c.special)
      toast("Crítico atendido. O bônus exige pizza no ponto e entrega antes de metade da paciência.");
    c.status = "exit";
    if (selected === c.id)
      selected = customers.find((x) => x.status !== "exit" && x !== c)?.id ?? null;
  }
  sound("delivery");
  sound("cash", 0.3);
  if (gain.tip)
    sound("tip", 0.5);
  toast(`Entrega concluída! +R$ ${gain.total} (inclui R$ ${gain.tip} de gorjeta) · +${Math.round(22 * (p.quality ?? 1))} XP`);
  const streakReward = comboBonus(streak);
  if (streakReward) {
    state.money += streakReward.money;
    state.xp += streakReward.xp;
    sound("combo", 0.7);
    toast(`Sequência de ${streak}! +R$ ${streakReward.money} · +${streakReward.xp} XP`);
  }
  for (const goal of recordDaily(state, { fast, special: finished && !!c.special })) {
    toast(`Meta diária: ${goal.title}! +R$ ${goal.money} · +${goal.xp} XP`);
    sound("mission", 0.9);
  }
  recordEvent(p.recipe);
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
      return toast("Bandeja cheia. Guarde uma pizza no balcão para liberar espaço.");
    hand.push({ stage: "dough", recipe: null, quality: 1 });
    heldIndex = hand.length - 1;
    sound("dough");
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
      sound("ovenOut");
      return;
    }
    const p = hand.find((p) => p.stage === "raw");
    if (!p)
      return toast(ready ? "Sua bandeja está cheia. Use E no balcão para guardar uma pizza." : "Monte uma pizza na bancada antes de assar.");
    if (ovens.length >= 1 + state.upgrades.oven)
      return toast("Forno cheio. Aproveite para atender ou preparar outra massa.");
    hand.splice(hand.indexOf(p), 1);
    p.stage = "baking";
    p.elapsed = 0;
    p.duration = Math.max(4, 10 - state.upgrades.oven * 2);
    ovens.push(p);
    refreshPizzas();
    sound("ovenIn");
  }
  if (n.id === "counter")
    return showCounter();
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
function showCounter() {
  const describe = (p) => (p.stage === "dough" ? "Massa" : RECIPES[p.recipe].name) + " · " + ({ dough: "crua", raw: "montada, falta assar", ready: p.quality < 1 ? "pronta, passou do ponto" : "pronta" }[p.stage] || "em preparo");
  const index = hand.length ? Math.max(0, Math.min(heldIndex, hand.length - 1)) : 0;
  const held = hand[index];
  const client = customers.find((c) => c.id === selected && c.status === "wait") || customers.find((c) => c.status === "wait");
  const fromHand = client && findReadyPizza(hand, client.recipe);
  const ready = fromHand || client && findReadyPizza(shelf, client.recipe);
  showModal(`<span class="eyebrow">04 / BALCÃO DE APOIO E ENTREGA</span><h2>Um lugar para cada pizza.</h2><p>Guarde sua pizza aqui para liberar a bandeja e retirar outra do forno. Você pode guardar massas, pizzas montadas ou prontas e pegá-las depois.</p>
    <div class="grid"><div class="card"><h4>Deixar no balcão</h4><p>${held ? describe(held) : "Sua bandeja está vazia."}</p><button id="store-pizza" ${held ? "" : "disabled"}>Guardar pizza da mão</button></div>
    <div class="card"><h4>Entregar pedido</h4><p>${client ? "#" + client.id + " · " + RECIPES[client.recipe].name : "Aguarde um cliente chegar."}</p><button id="serve-pizza" ${ready ? "" : "disabled"}>Entregar ${client ? "comanda #" + client.id : "pedido"}</button></div></div>
    <h3>Pizzas no balcão · ${shelf.length}</h3><p>${hand.length}/${1 + state.upgrades.tray} espaços ocupados na bandeja. ${hand.length >= 1 + state.upgrades.tray ? "Guarde uma pizza antes de pegar outra." : "Escolha qual pizza deseja pegar."}</p>
    ${shelf.length ? shelf.map((p, i) => `<div class="recipe"><span>${describe(p)}</span><button data-take-pizza="${i}" ${hand.length >= 1 + state.upgrades.tray ? "disabled" : ""}>Pegar pizza</button></div>`).join("") : "<p>Nenhuma pizza guardada. Roberto também deixa as pizzas prontas aqui.</p>"}`);
  $("#store-pizza").onclick = () => {
    if (!storePizza(hand, shelf, index))
      return;
    heldIndex = Math.max(0, Math.min(index, hand.length - 1));
    closeModal();
    refreshPizzas();
    renderUI();
    sound("store");
    toast("Pizza guardada no balcão. Sua bandeja tem espaço para outra!");
  };
  $("#serve-pizza").onclick = () => {
    if (!client || !ready)
      return;
    closeModal();
    deliver(client, ready, fromHand ? hand : shelf);
  };
  document.querySelectorAll("[data-take-pizza]").forEach((button) => button.onclick = () => {
    if (!takePizza(shelf, hand, +button.dataset.takePizza, 1 + state.upgrades.tray))
      return;
    heldIndex = hand.length - 1;
    closeModal();
    refreshPizzas();
    renderUI();
    sound("take");
    toast("Pizza retirada do balcão.");
  });
}
function showRecipes() {
  const target = customers.find((c) => c.id === selected);
  showModal(`<span class="eyebrow">02 / BANCADA DE PREPARO</span><h2>Feita com capricho.</h2><p>Escolha a receita. Você espalha o molho e adiciona os ingredientes na bancada. ${target ? "Comanda selecionada: <b>" + RECIPES[target.recipe].name + "</b>." : ""}</p>` + RECIPES.map((r, i) => `<div class="recipe"><span><b>${r.name}</b><br><small>${r.ingredients}</small></span><button data-recipe="${i}" ${level(state) < r.level || i >= 3 && !state.stock[i] ? "disabled" : ""}>${level(state) < r.level ? "Nível " + r.level : i >= 3 && !state.stock[i] ? "Sem estoque" : "Montar" + (i >= 3 ? " · " + state.stock[i] + " disponíveis" : "")}</button></div>`).join(""));
  document.querySelectorAll("[data-recipe]").forEach((b) => b.onclick = () => {
    let r = +b.dataset.recipe, p = hand.find((p) => p.stage === "dough");
    if (!p || level(state) < RECIPES[r].level || r >= 3 && !state.stock[r])
      return;
    if (r >= 3)
      state.stock[r]--;
    sound("ingredient");
    sound("prep", 0.15);
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
      sound("purchase");
      if (b.dataset.buy === "expand") {
        sound("expansion", 0.3);
        toast("Novo salão aberto! Duas mesas novas e espaço para mais 2 clientes.");
      } else
        toast(UPGRADES[b.dataset.buy].name + " melhorado! " + UPGRADES[b.dataset.buy].desc(state.upgrades[b.dataset.buy]));
      checkProgress();
      rebuild();
      refreshPizzas();
      renderUI();
      showUpgrades();
    }
  });
}
function showMissions() {
  showModal(dailyMarkup() + '<span class="eyebrow">A SUA JORNADA</span><h2>Do balcão ao império.</h2>' + MISSIONS.map((m, i) => `<div class="card"><h4>${state.claimed.includes(i) ? "✓ " : ""}${m.name}</h4><p>${m.desc} · ${Math.min(m.goal, missionValue(state, m))}/${m.goal}</p><small>R$ ${m.money} + ${m.xp} XP ${state.claimed.includes(i) ? "· RECEBIDOS" : ""}</small></div>`).join(""));
}
function showRoberto() {
  showModal(`<span class="eyebrow">SEU BRAÇO DIREITO</span><h2>Ô, chefe! Bora crescer?</h2><p>“O segredo é o forno quente e o cliente feliz.”</p><p>${state.upgrades.helper ? "Estou levando as pizzas prontas do forno ao balcão. Você entrega a comanda correta pelo balcão e fica com os lucros." : "Vamos começar: pegue a massa, escolha muçarela na bancada, asse e entregue no balcão. Depois de três pizzas, você pode me contratar."}</p><div class="dialog-actions"><button id="rm">Ver missões</button><button id="rd">Pedir uma dica</button><button id="ru">Melhorar ajudante</button><button id="rs">Sair</button></div>`);
  $("#rm").onclick = showMissions;
  $("#ru").onclick = showUpgrades;
  $("#rs").onclick = closeModal;
  $("#rd").onclick = () => {
    const tips = ["Chefe, essa pizza não vai se entregar sozinha! Selecione a comanda e escolha Entregar no balcão.", "Pizzas prontas passam do ponto após 18 segundos. A qualidade cai, mas ainda podem ser entregues.", "A primeira melhoria do forno custa R$ 65. Dois bons pedidos já resolvem!", "Cinco acertos seguidos dobram as gorjetas. Receita errada ou desistência encerra o combo.", "Os ingredientes especiais usam estoque. A despensa repõe oito por R$ 24."];
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
      sound("restock");
      toast("Despensa abastecida: +8 porções por R$ 24.");
      showStock();
      renderUI();
    }
  });
}
function showPause() {
  showModal(`<span class="eyebrow">FAÇA UMA PAUSA</span><h2>O forno pode esperar.</h2><p>O tempo para enquanto este painel estiver aberto. Seu progresso é salvo automaticamente.</p><div class="audio-settings"><label for="music-volume">Música ambiente <output id="music-value">${Math.round(state.musicVolume * 100)}%</output></label><input id="music-volume" aria-label="Volume da música" type="range" min="0" max="1" step=".05" value="${state.musicVolume}"><button id="music-mute" aria-pressed="${state.musicMuted}">${state.musicMuted ? "Ativar música" : "Silenciar música"}</button><label for="sfx-volume">Efeitos sonoros <output id="sfx-value">${Math.round(state.sfxVolume * 100)}%</output></label><input id="sfx-volume" aria-label="Volume dos efeitos" type="range" min="0" max="1" step=".05" value="${state.sfxVolume}"><button id="sfx-mute" aria-pressed="${state.sfxMuted}">${state.sfxMuted ? "Ativar efeitos" : "Silenciar efeitos"}</button></div><label>Qualidade gráfica <select id="quality"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></label><p>WASD ou setas: mover · Shift: correr · E: interagir · Esc: pausar. No celular, use o joystick e E. Clique em uma comanda para selecioná-la.</p><div class="dialog-actions"><button id="resume">Continuar</button><button id="reset">Reiniciar progresso</button></div>`);
  $("#quality").value = state.quality;
  $("#quality").onchange = (e) => {
    state.quality = e.target.value;
    quality();
    save();
  };
  for (const kind of ["music", "sfx"]) {
    const key = kind + "Volume", mute = kind + "Muted";
    $("#" + kind + "-volume").oninput = (e) => {
      state[key] = +e.target.value;
      if (kind === "sfx")
        state.volume = state[key];
      $("#" + kind + "-value").textContent = Math.round(state[key] * 100) + "%";
      music.apply();
      save();
      updateEnhancementUI();
    };
    $("#" + kind + "-volume").onchange = () => {
      if (kind === "sfx")
        sound("tap");
    };
    $("#" + kind + "-mute").onclick = () => {
      state[mute] = !state[mute];
      music.apply();
      save();
      showPause();
      updateEnhancementUI();
    };
  }
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
function renderUI() {
  updateEnhancementUI();
  $("#money").textContent = state.money.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  $("#level").textContent = `NÍVEL ${level(state)} · ${["APRENDIZ", "PIZZAIOLO", "ARTESÃO", "CHEF", "MESTRE", "IMPERADOR"][level(state) - 1]}`;
  $("#xp").style.width = (level(state) === 6 ? 100 : state.xp % 100) + "%";
  $("#xptext").textContent = level(state) === 6 ? "Todas as receitas liberadas" : `${state.xp % 100} / 100 XP`;
  let active = customers.filter((c) => c.status !== "exit");
  $("#count").textContent = `${active.length}/${2 + state.upgrades.tables + 2 * state.upgrades.expand}`;
  $("#orderlist").innerHTML = active.length ? active.map((c) => `<div class="order ${c.id === selected ? "selected" : ""}" data-order="${c.id}" tabindex="0" role="button"><h4>${c.special ? "★ " + c.special.name + " · " : ""}#${String(c.id).padStart(2, "0")} · ${RECIPES[c.recipe].name}</h4><p>${RECIPES[c.recipe].ingredients}</p><small>${c.remaining} pizza${c.remaining > 1 ? "s" : ""} · R$ ${RECIPES[c.recipe].price * c.remaining}${c.special ? " + até R$ " + c.special.money + " bônus" : ""} · ${c.status === "enter" ? "chegando" : Math.ceil(c.patience) + " s"}</small><div class="track"><i style="width:${c.patience / c.maxPatience * 100}%"></i></div></div>`).join("") : '<p class="hint">O próximo cliente já está a caminho.</p>';
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
  $("#combo").textContent = `✦ ${streak} acertos · gorjetas ×${Math.min(2, 1 + combo * 0.2).toFixed(1)}${streak < 3 ? " · bônus em 3" : streak < 5 ? " · bônus em 5" : " · multiplicador máximo"}`;
}
function keysReset() {
  for (let k in keys)
    keys[k] = false;
  stick.x = stick.y = 0;
}
function moveStick(e) {
  if (!$("#joystick").hasPointerCapture(e.pointerId))
    return;
  let r = $("#joystick").getBoundingClientRect(), x = (e.clientX - r.left - 50) / 38, y = (e.clientY - r.top - 50) / 38, l = Math.max(1, Math.hypot(x, y));
  stick.x = x / l;
  stick.y = y / l;
  $("#joystick i").style.transform = `translate(${stick.x * 28}px,${stick.y * 28}px)`;
}
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
    $("#prompt").innerHTML = "<b>E</b> " + { dough: "Pegar massa", bench: "Escolher receita e montar", oven: ovens.some((p) => p.stage === "ready") ? "Retirar pizza pronta" : "Colocar pizza no forno", counter: "Balcão · guardar, pegar ou entregar" + (shelf.length ? " · " + shelf.length + " guardada(s)" : ""), stock: "Repor ingredientes especiais", bin: "Descartar pizza selecionada", roberto: "Conversar com Roberto", customer: "Entregar ao cliente #" + nearest.customer?.id }[nearest.id];
}
function frame(dt) {
  tickNotices(dt);
  music.setScene({ rush, paused, hidden: document.hidden });
  music.tick();
  if (guideRing)
    guideRing.scale.setScalar(1 + Math.sin(time * 3) * 0.08);
  if (started && !paused) {
    time += dt;
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
        sound("ovenReady");
        toast("Pizza pronta! Retire no forno.");
        refreshPizzas();
      }
      if (p.stage === "ready" && p.elapsed > p.duration + 18 && p.quality !== 0.6) {
        p.quality = 0.6;
        sound("burn");
        toast("Uma pizza passou do ponto. Ainda pode ser entregue com valor reduzido.");
        refreshPizzas();
      }
    }
    if (work) {
      work.left -= dt;
      $("#work").style.display = "block";
      $("#work span").textContent = "Espalhando molho e ingredientes…";
      $("#work i").style.width = (1 - work.left / work.total) * 100 + "%";
      if (work.left <= 0) {
        work = null;
        $("#work").style.display = "none";
        sound("prepDone");
        toast("Pizza montada. Agora leve ao forno!");
      }
    }
    updateEvent();
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
  const focus = new T.Vector3(player.g.position.x * 0.55, 0, player.g.position.z * 0.45);
  let dist = (innerWidth < 700 ? 25 : 22) / state.cameraZoom;
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
function initEnhancements() {
  ensureDaily(state);
  const guide = document.createElement("div");
  guide.id = "guide";
  guide.innerHTML = '<small>PRÓXIMO PASSO</small><strong id="guide-title"></strong><span id="guide-detail"></span>';
  document.body.append(guide);
  const progress = document.createElement("div");
  progress.id = "next-unlock";
  $("#mission").append(progress);
  const controls = document.createElement("div");
  controls.id = "view-controls";
  controls.innerHTML = '<button id="zoom-out" aria-label="Afastar câmera">−</button><span>Câmera</span><button id="zoom-in" aria-label="Aproximar câmera">+</button><button id="help-game">Como jogar</button>';
  document.body.append(controls);
  const badge = document.createElement("button");
  badge.id = "audio-status";
  badge.onclick = showPause;
  document.body.append(badge);
  $("#zoom-in").onclick = () => changeZoom(0.1);
  $("#zoom-out").onclick = () => changeZoom(-0.1);
  $("#help-game").onclick = showHelp;
  addEventListener("pointerdown", () => {
    music.unlock();
  }, { capture: true });
  addEventListener("keydown", () => {
    music.unlock();
  }, { capture: true });
  document.addEventListener("visibilitychange", () => music.setScene({ rush, paused, hidden: document.hidden }));
  guideRing = mesh(new T.TorusGeometry(0.48, 0.055, 8, 40), 16169022, 0, 0.06, 0);
  guideRing.rotation.x = Math.PI / 2;
  guideRing.visible = false;
  for (const x of [-5, 1, 6]) {
    cyl(0.035, 0.6, 5456685, x, 3.3, -2);
    const shade = mesh(new T.ConeGeometry(0.4, 0.3, 20, 1, true), 4813666, x, 2.88, -2);
    const bulb = sphere(0.13, 16769952, x, 2.8, -2);
    bulb.material = new T.MeshStandardMaterial({ color: 16769696, emissive: 16758100, emissiveIntensity: 0.8 });
  }
  updateEnhancementUI();
}
function changeZoom(amount) {
  state.cameraZoom = Math.max(0.8, Math.min(1.5, Math.round((state.cameraZoom + amount) * 100) / 100));
  save();
}
function showHelp() {
  showModal(`<span class="eyebrow">SEU GUIA RÁPIDO</span><h2>Uma pizza, quatro passos.</h2><div class="help-steps"><p><b>1 · Massa</b> Vá ao círculo dourado e aperte E para pegar uma massa.</p><p><b>2 · Preparo</b> Na bancada, escolha a receita da comanda. Aguarde a montagem.</p><p><b>3 · Forno</b> Aperte E para colocar. Quando ouvir o aviso, aperte E para retirar.</p><p><b>4 · Balcão</b> Aperte E e escolha Entregar comanda. Também é possível guardar e pegar pizzas.</p></div><p>Selecione uma comanda à esquerda. O quadro “Próximo passo” e o círculo dourado ajudam a encontrar a estação. WASD ou setas movem, Shift corre e Esc pausa.</p><p>Use + e − para aproximar a câmera. Em Configurações, música e efeitos têm volume e silêncio separados.</p><button id="help-back">Entendi, vamos cozinhar!</button>`);
  $("#help-back").onclick = closeModal;
}
function dailyMarkup() {
  const d = ensureDaily(state);
  return "<h3>Metas de hoje</h3><p>Recompensas automáticas, uma vez por dia. Seu avanço fica salvo.</p>" + DAILY_GOALS.map((g, i) => `<div class="card daily"><b>${d.claimed.includes(i) ? "✓ " : ""}${g.title}</b><p>${g.desc} ${Math.min(g.goal, d[g.key])}/${g.goal}</p><small>+R$ ${g.money} · +${g.xp} XP ${d.claimed.includes(i) ? "· RECEBIDOS" : ""}</small></div>`).join("");
}
function updateEnhancementUI() {
  if (!$("#guide"))
    return;
  const next = nearestUnlock(state), d = ensureDaily(state), goal = DAILY_GOALS.find((g, i) => !d.claimed.includes(i));
  $("#next-unlock").innerHTML = `<small>LOGO ALI</small><p>${next.recipe}</p><p>${next.upgrade}</p><p>${next.expansion}</p><small>META DE HOJE</small><p>${goal ? goal.desc + " " + Math.min(goal.goal, d[goal.key]) + "/" + goal.goal : "✓ Todas as metas de hoje concluídas!"}</p>`;
  const mutedMusic = state.musicMuted || state.musicVolume === 0, mutedEffects = state.sfxMuted || state.sfxVolume === 0;
  $("#audio-status").textContent = mutedMusic ? "Música silenciada" : mutedEffects ? "Efeitos silenciados" : "♫ Som e música";
  $("#audio-status").title = "Abrir configurações de música e efeitos";
  $("#zoom-in").disabled = state.cameraZoom >= 1.5;
  $("#zoom-out").disabled = state.cameraZoom <= 0.8;
  const c = customers.find((c) => c.id === selected && c.status !== "exit");
  let station = "dough", title = "01 · Pegue uma massa", detail = "Aproxime-se da estação iluminada e aperte E.";
  const matching = hand.find((p) => p.recipe === c?.recipe), p = matching || hand[heldIndex] || hand[0];
  if (work) {
    station = "bench";
    title = "Montando sua pizza…";
    detail = "Um instante: o molho e os ingredientes estão sendo adicionados.";
  } else if (ovens.some((p) => p.stage === "ready") && hand.length >= 1 + state.upgrades.tray) {
    station = "counter";
    title = "Libere espaço na bandeja";
    detail = "E no balcão → Guardar pizza da mão. Depois retire a pizza do forno.";
  } else if (ovens.some((p) => p.stage === "ready")) {
    station = "oven";
    title = "Sua pizza está pronta!";
    detail = "Aperte E junto ao forno para retirar antes de passar do ponto.";
  } else if (p?.stage === "dough") {
    station = "bench";
    title = "02 · Monte a receita";
    detail = c ? "E na bancada → " + RECIPES[c.recipe].name : "Abra a bancada com E e escolha uma receita.";
  } else if (p?.stage === "raw") {
    station = "oven";
    title = "03 · Leve ao forno";
    detail = "Aperte E perto do forno para assar " + RECIPES[p.recipe].name + ".";
  } else if (p?.stage === "ready") {
    station = "counter";
    title = "04 · Entregue ou guarde";
    detail = "E no balcão → Entregar comanda ou Guardar pizza da mão.";
  } else if (c && findReadyPizza(shelf, c.recipe)) {
    station = "counter";
    title = "A comanda já está no balcão";
    detail = "E no balcão → Entregar comanda #" + c.id + ".";
  } else if (ovens.length) {
    station = "oven";
    title = "Assando… " + Math.max(0, Math.ceil(ovens[0].duration - ovens[0].elapsed)) + " s";
    detail = "Espere o aviso do forno. Você também pode preparar o próximo pedido.";
  } else if (!c) {
    title = "Sua pizzaria está aberta";
    detail = "Prepare uma massa enquanto espera o próximo cliente.";
  }
  $("#guide-title").textContent = title;
  $("#guide-detail").textContent = detail;
  if (guideRing) {
    guideRing.visible = started;
    guideRing.position.set(points[station].x, 0.065, points[station].z);
  }
}
function updateEvent() {
  const ev = eventAt(time);
  if (currentEvent !== ev.id) {
    currentEvent = ev.id;
    eventServed = 0;
    eventRecipes.clear();
    eventPaid = false;
    eventWarned = false;
    eventStarted = false;
  }
  rush = ev.active;
  if (ev.warning && !eventWarned) {
    eventWarned = true;
    sound("event");
    toast(`${ev.name} em 15 segundos! ${ev.type === "rush" ? "Entregue 2 pizzas" : "Sirva 2 receitas diferentes"} para ganhar +R$ 20 e +10 XP.`);
  }
  if (ev.active && !eventStarted) {
    eventStarted = true;
    sound("event");
    toast(ev.name + " começou! Gorjetas +50% por 30 segundos.");
  }
  $("#event").style.display = ev.warning || ev.active ? "block" : "none";
  $("#event").textContent = ev.active ? `${ev.name} · ${ev.remaining}s · ${ev.type === "rush" ? eventServed : eventRecipes.size}/2 · ${eventPaid ? "bônus recebido" : "bônus R$ 20 + 10 XP"}` : `${ev.name} em ${ev.remaining}s`;
}
function recordEvent(recipe) {
  const ev = eventAt(time);
  if (!ev.active)
    return;
  eventServed++;
  eventRecipes.add(recipe);
  if (!eventPaid && (ev.type === "rush" ? eventServed : eventRecipes.size) >= ev.goal) {
    eventPaid = true;
    state.money += 20;
    state.xp += 10;
    toast("Evento concluído! +R$ 20 · +10 XP");
    sound("mission");
  }
}
var $ = (s) => document.querySelector(s), KEY = "pizza-empire-v1", state, paused = false, started = false, time = 0, spawnClock = 0, combo = 0, selected = null, serial = 1, hand, ovens, shelf, customers, work = null, toastTime = 0, uiClock = 0, rush = false, nearest = null, heldIndex = 0, keys, obstacles, labels, models, stations, music, knownLevel, streak = 0, guideRing = null, currentEvent = -1, eventServed = 0, eventRecipes, eventPaid = false, eventWarned = false, eventStarted = false, notices, scene, renderer, camera, sun, mats, ground, furniture, ovenLight, ovenGroup, player, ring, roberto, shown, points, ovenLabel, steamMaterial, steam, queue, exit, stick, previous;
var init_game = __esm(() => {
  init_audio();
  init_progression();
  init_core();
  try {
    state = restore(localStorage.getItem(KEY));
  } catch {
    state = fresh();
  }
  hand = [];
  ovens = [];
  shelf = [];
  customers = [];
  keys = {};
  obstacles = [];
  labels = [];
  models = {};
  stations = [];
  music = new RestaurantAudio(() => state);
  knownLevel = level(state);
  eventRecipes = new Set;
  notices = [];
  scene = new T.Scene;
  scene.background = new T.Color("#e5dcca");
  scene.fog = new T.Fog("#e5dcca", 35, 70);
  renderer = new T.WebGLRenderer({ canvas: $("#world"), antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  scene.add(new T.HemisphereLight(16773581, 6386534, 2.2));
  sun = new T.DirectionalLight(16770486, 3);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 13;
  sun.shadow.camera.bottom = -13;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  addEventListener("resize", resize);
  mats = new Map;
  ground = box(80, 0.2, 80, 14276031, 0, -0.65, 0);
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
  plant(-8, 4.7);
  plant(7.8, -4.9);
  furniture = new T.Group;
  scene.add(furniture);
  ovenLight = new T.PointLight(16744496, 12, 5);
  ovenLight.position.set(0, 1, -3.5);
  scene.add(ovenLight);
  player = person(15394517, 14261616, true);
  player.g.position.set(-5.7, 0, -2.5);
  ring = mesh(new T.TorusGeometry(0.4, 0.035, 8, 40), 15914382, 0, 0.03, 0, player.g);
  ring.rotation.x = Math.PI / 2;
  roberto = person(11749684, 12552286, true, true);
  roberto.g.position.set(-2.6, 0, -1.4);
  label(roberto.g, "ROBERTO", "roberto", 2.45);
  shown = [];
  points = { dough: { x: -7, z: -3.35 }, bench: { x: -3.9, z: -3.35 }, oven: { x: -0.65, z: -3.1 }, counter: { x: -5, z: 0.65 }, stock: { x: 1.7, z: -3.35 }, bin: { x: -8, z: 2.9 } };
  for (const [id, p] of Object.entries(points)) {
    stations.push({ ...p, id });
    let anchor = new T.Object3D;
    anchor.position.set(p.x, 0.1, p.z - 0.65);
    scene.add(anchor);
    label(anchor, { dough: "01 · MASSA", bench: "02 · PREPARO", oven: "03 · FORNO", counter: "04 · BALCÃO", stock: "DESPENSA", bin: "DESCARTAR" }[id], "", 1.35);
  }
  cyl(0.28, 0.6, 6780522, -8, 0.3, 2.9);
  cyl(0.3, 0.06, 10202528, -8, 0.63, 2.9);
  ovenLabel = label(ovenLight, "Forno livre", "", 0.4);
  steamMaterial = new T.MeshBasicMaterial({ color: 16774359, transparent: true, opacity: 0.25, depthWrite: false });
  steam = Array.from({ length: 14 }, (_, i) => {
    const m = new T.Mesh(new T.SphereGeometry(0.07, 7, 5), steamMaterial.clone());
    m.visible = false;
    scene.add(m);
    return m;
  });
  queue = [{ x: -5, z: 3 }, { x: -3.8, z: 3.65 }, { x: -2.7, z: 4.25 }, { x: -1.5, z: 4.25 }, { x: 0, z: 4.25 }, { x: 1.5, z: 4.25 }];
  exit = { x: -0.5, z: 5.1 };
  $("#close").onclick = closeModal;
  $("#upgrades").onclick = showUpgrades;
  $("#missions").onclick = showMissions;
  $("#pause").onclick = showPause;
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input,select,textarea"))
      return;
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
  stick = { x: 0, y: 0 };
  $("#joystick").onpointerdown = (e) => {
    $("#joystick").setPointerCapture(e.pointerId);
    moveStick(e);
  };
  $("#joystick").onpointermove = moveStick;
  $("#joystick").onpointerup = $("#joystick").onpointercancel = () => {
    stick.x = stick.y = 0;
    $("#joystick i").style.transform = "";
  };
  $("#interact").onclick = interact;
  initEnhancements();
  rebuild();
  quality();
  loadAssets();
  renderUI();
  camera.position.set(12, 21, 25);
  $("#loading").classList.add("hidden");
  showModal(`<span class="eyebrow">BEM-VINDO À SUA NOVA HISTÓRIA</span><h2>Uma massa.<br>Mil possibilidades.</h2><p>Seu pequeno balcão está pronto para virar um império. Roberto está por perto, o forno está quente e o primeiro cliente chega assim que você abrir.</p><div class="grid"><div class="card"><h4>01 · Prepare</h4><p>Pegue massa e monte muçarela na bancada.</p></div><div class="card"><h4>02 · Encante</h4><p>Asse por 10 segundos e entregue no balcão. Cada pedido aproxima você da próxima melhoria.</p></div></div><p>WASD / setas para andar · E para interagir · Shift para correr.</p><button id="start">${state.served ? "Reabrir minha pizzaria" : "Abrir as portas"} →</button>`);
  $("#close").classList.add("hidden");
  $("#start").onclick = () => {
    music.unlock();
    started = true;
    closeModal();
    $("#close").classList.remove("hidden");
    spawn();
    toast("Roberto: comece pegando uma massa na estação 01!");
  };
  previous = performance.now();
  renderer.setAnimationLoop((now) => {
    let dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    frame(dt);
  });
  setInterval(save, 1e4);
  addEventListener("pagehide", save);
});

// startup.js
var loading = document.querySelector("#loading");
var message = loading.querySelector("p");
var phase = "Inicializando";
function status(text) {
  phase = text;
  message.textContent = text;
}
function fail(error) {
  loading.classList.remove("hidden");
  loading.querySelector("h1").textContent = "A pizzaria não conseguiu abrir";
  message.textContent = error.message || String(error);
  let details = document.querySelector("#startup-details");
  if (!details) {
    details = document.createElement("pre");
    details.id = "startup-details";
    details.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;max-width:90vw;padding:16px;font:12px monospace;background:#e8dfca;border-radius:10px";
    loading.append(details);
  }
  details.textContent = `Etapa: ${phase}
Endereço: ${location.href}
${error.stack || error}`;
  if (!document.querySelector("#startup-retry")) {
    const button = document.createElement("button");
    button.id = "startup-retry";
    button.textContent = "Tentar novamente";
    button.onclick = () => location.reload();
    loading.append(button);
  }
  console.error("Falha ao abrir Pizza Empire:", phase, error);
}
function timeout(promise, ms, explanation) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(explanation)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}
try {
  if (location.protocol === "file:") {
    throw new Error("Abra JOGAR.bat e acesse http://localhost:4173. Abrir index.html diretamente não permite carregar os módulos do jogo.");
  }
  status("Verificando suporte a gráficos 3D…");
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  if (!gl) {
    throw new Error("O navegador não disponibilizou WebGL 2, necessário para esta versão do Three.js. Confira a aceleração gráfica nas configurações do navegador e tente uma versão atual do Chrome ou Edge.");
  }
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  status("Baixando Three.js pelo CDN…");
  try {
    await timeout(import("three"), 15000, "O CDN não respondeu em 15 segundos. Confira sua conexão e o acesso a cdn.jsdelivr.net.");
  } catch (error) {
    throw new Error("Não foi possível carregar o Three.js pelo CDN. A cena 3D depende desse download. Confira o acesso a https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js. Detalhe: " + error.message);
  }
  status("Carregando o leitor de modelos 3D…");
  await timeout(import("three/addons/loaders/GLTFLoader.js"), 15000, "O leitor GLTFLoader não respondeu. Confira o acesso a cdn.jsdelivr.net.");
  status("Construindo a pizzaria…");
  await Promise.resolve().then(() => (init_game(), {}));
} catch (error) {
  fail(error);
}
