// Rogue Packet — canvas engine. One rAF loop; React is only notified on change.

import {
  CABLES,
  DEVICE_PORT,
  INTERACTABLES,
  PROPS,
  ROOMS,
  SPAWN,
  WORLD,
  buildWalls,
  roomAt,
  type Interactable,
  type Pt,
  type Rect,
  type Room,
  type RoomId,
} from './map';
import {
  LINKS,
  linkById,
  linkUp,
  portStatus,
  type DeviceId,
  type LinkId,
  type NetState,
  type Outcome,
  type Trace,
} from './network';

export interface SimHost {
  state(): NetState;
  trace(src: DeviceId, dst: string): Trace;
  rogueFlow(): { src: DeviceId; dst: string } | null;
  discovered(): Set<DeviceId>;
  blackoutRoom(): RoomId | null;
  storm(): boolean;
  loopEvent(): boolean;
  countPacket(t: Trace): void;
}

export interface EngineCallbacks {
  onNear(i: Interactable | null): void;
  onInteract(i: Interactable): void;
  onRoom(r: Room | null): void;
  onTraceHop(d: DeviceId): void;
  onTraceEnd(t: Trace): void;
  onStep(): void;
}

type SpriteKind = 'data' | 'reply' | 'rogue' | 'loop';

interface Sprite {
  pts: Pt[];
  cum: number[];
  stopAt: number;
  d: number;
  speed: number;
  kind: SpriteKind;
  outcome: Outcome;
  trace: Trace;
  marks: { at: number; device: DeviceId; hit: boolean }[];
  traced: boolean;
  onArrive?: () => void;
  trail: Pt[];
  links: { link: LinkId; from: number; to: number }[];
}

interface Puff {
  x: number;
  y: number;
  t: number;
  ok: boolean;
}

const PLAYER_R = 12;
const SPEED = 200;
const INTERACT_R = 58;
const FLOWS: DeviceId[] = ['PC-01', 'PC-02', 'PC-03', 'PC-04'];
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

function orient(link: LinkId, from: DeviceId): Pt[] {
  const pts = CABLES[link];
  return linkById(link).a === from ? pts : [...pts].reverse();
}

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private mini: CanvasRenderingContext2D | null;
  private raf = 0;
  private last = 0;
  private time = 0;
  private frame = 0;
  private dpr = 1;
  private viewW = 0;
  private viewH = 0;
  private zoom = 1;
  private staticLayer: HTMLCanvasElement | null = null;
  private staticScale = 0;
  private walls: Rect[];
  private doors: ReturnType<typeof buildWalls>['doors'];
  private doorOpen: number[];
  private solids: Rect[];
  private ro: ResizeObserver;

  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private inputEnabled = true;
  player = { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, angle: -Math.PI / 2, phase: 0, moving: false };
  private cam = { x: SPAWN.x, y: SPAWN.y };
  private near: Interactable | null = null;
  private room: Room | null = null;
  visited = new Set<RoomId>();
  private sprites: Sprite[] = [];
  private puffs: Puff[] = [];
  private activity: Partial<Record<LinkId, number>> = {};
  private spawnIn = 0.4;
  private rogueIn = 6;
  private loopIn = 0;
  private tracing: Sprite | null = null;
  private stepAcc = 0;
  private reduced: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    minimap: HTMLCanvasElement | null,
    private sim: SimHost,
    private cb: EngineCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.mini = minimap?.getContext('2d') ?? null;
    const built = buildWalls();
    this.walls = built.walls;
    this.doors = built.doors;
    this.doorOpen = this.doors.map(() => 0);
    this.solids = [...this.walls, ...PROPS.filter(p => p.solid)];
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    document.fonts?.ready.then(() => {
      this.staticScale = 0;
      this.ensureStatic();
    });
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (document.hidden) return;
      this.update(dt);
      this.render();
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.staticLayer = null;
    this.sprites = [];
  }

  // ---- input -----------------------------------------------------------------
  keyDown(code: string) {
    this.keys.add(code);
  }
  keyUp(code: string) {
    this.keys.delete(code);
  }
  clearKeys() {
    this.keys.clear();
    this.joy = { x: 0, y: 0 };
  }
  setJoystick(x: number, y: number) {
    this.joy = { x, y };
  }
  setInputEnabled(v: boolean) {
    this.inputEnabled = v;
    if (!v) this.clearKeys();
  }
  interact() {
    if (this.near && this.inputEnabled && !this.tracing) this.cb.onInteract(this.near);
  }
  reset() {
    Object.assign(this.player, { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, angle: -Math.PI / 2 });
    this.cam = { x: SPAWN.x, y: SPAWN.y };
    this.sprites = [];
    this.puffs = [];
    this.tracing = null;
    this.visited.clear();
    this.room = null;
    this.near = null;
    this.rogueIn = 6;
  }
  isTracing() {
    return !!this.tracing;
  }

  /** Follow the rogue packet with the camera. Returns false if there is none. */
  startTrace(): boolean {
    const flow = this.sim.rogueFlow();
    if (!flow || this.tracing) return false;
    const s = this.spawn(flow.src, flow.dst, 'rogue');
    if (!s) return false;
    s.traced = true;
    s.speed = 150;
    this.tracing = s;
    return true;
  }

  cancelTrace() {
    if (this.tracing) this.tracing.traced = false;
    this.tracing = null;
  }

  // ---- layout ------------------------------------------------------------------
  private resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const r = parent.getBoundingClientRect();
    this.viewW = Math.max(1, r.width);
    this.viewH = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;
    this.zoom = Math.max(0.55, Math.min(1.35, Math.min(this.viewW / 980, this.viewH / 640)));
    this.ensureStatic();
  }

  private ensureStatic() {
    const scale = Math.min(2, this.dpr * this.zoom);
    if (this.staticLayer && Math.abs(scale - this.staticScale) < 0.15) return;
    this.staticScale = scale;
    const c = document.createElement('canvas');
    c.width = Math.round(WORLD.w * scale);
    c.height = Math.round(WORLD.h * scale);
    const g = c.getContext('2d')!;
    g.scale(scale, scale);
    this.drawStatic(g);
    this.staticLayer = c;
  }

  // ---- simulation ----------------------------------------------------------------
  private collides(x: number, y: number) {
    for (const r of this.solids) {
      const cx = Math.max(r.x, Math.min(x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(y, r.y + r.h));
      if ((x - cx) ** 2 + (y - cy) ** 2 < PLAYER_R * PLAYER_R) return true;
    }
    return false;
  }

  private update(dt: number) {
    this.time += dt;
    this.frame++;
    const p = this.player;

    // Movement
    let ix = 0;
    let iy = 0;
    if (this.inputEnabled && !this.tracing) {
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
      ix += this.joy.x;
      iy += this.joy.y;
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) (ix /= mag), (iy /= mag);
    const k = 1 - Math.exp(-dt * 16);
    p.vx += (ix * SPEED - p.vx) * k;
    p.vy += (iy * SPEED - p.vy) * k;
    const nx = p.x + p.vx * dt;
    if (!this.collides(nx, p.y)) p.x = nx;
    else p.vx = 0;
    const ny = p.y + p.vy * dt;
    if (!this.collides(p.x, ny)) p.y = ny;
    else p.vy = 0;
    const speed = Math.hypot(p.vx, p.vy);
    p.moving = speed > 20;
    if (p.moving) {
      const target = Math.atan2(p.vy, p.vx);
      let diff = target - p.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      p.angle += diff * Math.min(1, dt * 14);
      p.phase += dt * speed * 0.055;
      this.stepAcc += dt * speed;
      if (this.stepAcc > 70) {
        this.stepAcc = 0;
        this.cb.onStep();
      }
    }

    // Doors slide open when someone is near.
    this.doors.forEach((d, i) => {
      const cx = d.horizontal ? d.x + 32 : d.x;
      const cy = d.horizontal ? d.y : d.y + 32;
      const want = Math.hypot(p.x - cx, p.y - cy) < 95 ? 1 : 0;
      this.doorOpen[i] += (want - this.doorOpen[i]) * Math.min(1, dt * 9);
    });

    // Room + nearest interactable
    const room = roomAt(p.x, p.y);
    if (room?.id !== this.room?.id) {
      this.room = room;
      if (room) this.visited.add(room.id);
      this.cb.onRoom(room);
    }
    let best: Interactable | null = null;
    let bestD = INTERACT_R;
    for (const it of INTERACTABLES) {
      const d = Math.hypot(p.x - it.x, p.y - it.y);
      if (d < bestD) (bestD = d), (best = it);
    }
    if (this.tracing) best = null;
    if (best?.id !== this.near?.id) {
      this.near = best;
      this.cb.onNear(best);
    }

    // Traffic
    const storm = this.sim.storm();
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = storm ? 0.09 : 0.5 + Math.random() * 0.35;
      const src = FLOWS[Math.floor(Math.random() * FLOWS.length)];
      const r = Math.random();
      const st = this.sim.state();
      const dst =
        r < 0.6 ? '192.168.2.10' : r < 0.75 ? '192.168.1.1' : st.hosts[FLOWS[Math.floor(Math.random() * 4)] as "PC-01"].ip;
      if (!(dst === st.hosts[src as 'PC-01'].ip)) this.spawn(src, dst, 'data');
    }
    this.rogueIn -= dt;
    if (this.rogueIn <= 0 && !this.tracing) {
      this.rogueIn = 11 + Math.random() * 5;
      const flow = this.sim.rogueFlow();
      if (flow) this.spawn(flow.src, flow.dst, 'rogue');
    }
    if (this.sim.loopEvent()) {
      this.loopIn -= dt;
      if (this.loopIn <= 0) {
        this.loopIn = 0.6;
        this.spawnLoop();
      }
    }

    // Advance packets
    const congestion = storm ? 0.55 : 1;
    for (const s of this.sprites) {
      const before = s.d;
      s.d = Math.min(s.stopAt, s.d + s.speed * dt * (s.kind === 'rogue' || s.kind === 'loop' ? 1 : congestion));
      for (const l of s.links) if (s.d >= l.from && before <= l.to) this.activity[l.link] = this.time;
      for (const m of s.marks)
        if (!m.hit && s.d >= m.at) {
          m.hit = true;
          if (s.traced) this.cb.onTraceHop(m.device);
        }
      if (s.kind === 'rogue' || s.traced) {
        const pos = this.posAt(s, s.d);
        s.trail.push(pos);
        if (s.trail.length > 14) s.trail.shift();
      }
    }
    for (const s of [...this.sprites]) {
      if (s.d < s.stopAt) continue;
      const pos = this.posAt(s, s.stopAt);
      this.puffs.push({ x: pos[0], y: pos[1], t: 0, ok: s.outcome === 'delivered' });
      this.sprites.splice(this.sprites.indexOf(s), 1);
      s.onArrive?.();
      if (s === this.tracing) {
        const t = s.trace;
        window.setTimeout(() => {
          this.tracing = null;
          this.cb.onTraceEnd(t);
        }, 700);
      }
    }
    this.puffs = this.puffs.filter(f => (f.t += dt) < 0.8);

    // Camera
    const target = this.tracing ? this.posAt(this.tracing, this.tracing.d) : [p.x, p.y];
    const ck = this.reduced ? 1 : 1 - Math.exp(-dt * (this.tracing ? 4 : 7));
    this.cam.x += (target[0] - this.cam.x) * ck;
    this.cam.y += (target[1] - this.cam.y) * ck;
    const hw = this.viewW / 2 / this.zoom;
    const hh = this.viewH / 2 / this.zoom;
    this.cam.x = WORLD.w < hw * 2 ? WORLD.w / 2 : Math.max(hw, Math.min(WORLD.w - hw, this.cam.x));
    this.cam.y = WORLD.h < hh * 2 ? WORLD.h / 2 : Math.max(hh, Math.min(WORLD.h - hh, this.cam.y));
  }

  private build(trace: Trace, kind: SpriteKind): Sprite {
    const pts: Pt[] = [];
    const cum: number[] = [];
    const marks: Sprite['marks'] = [];
    const links: Sprite['links'] = [];
    let total = 0;
    const src = trace.legs[0]?.from ?? trace.at;
    pts.push([DEVICE_PORT[src].x, DEVICE_PORT[src].y]);
    cum.push(0);
    const legStart: number[] = [];
    trace.legs.forEach(leg => {
      legStart.push(total);
      const from = total;
      const poly = orient(leg.link, leg.from);
      for (let i = 1; i < poly.length; i++) {
        const [x0, y0] = pts[pts.length - 1];
        const [x1, y1] = poly[i];
        total += Math.hypot(x1 - x0, y1 - y0);
        pts.push([x1, y1]);
        cum.push(total);
      }
      marks.push({ at: total, device: leg.to, hit: false });
      links.push({ link: leg.link, from, to: total });
    });
    legStart.push(total);
    let stopAt = total;
    if (trace.outcome !== 'delivered') {
      if (trace.stopLeg < 0) stopAt = 0;
      else {
        const a = legStart[trace.stopLeg];
        const b = legStart[trace.stopLeg + 1];
        stopAt = a + (b - a) * trace.stopFrac;
      }
    }
    // Hop marks beyond the stop point never fire.
    const speed = kind === 'reply' ? 250 : kind === 'rogue' ? 175 : 230;
    return { pts, cum, stopAt, d: 0, speed, kind, outcome: trace.outcome, trace, marks: marks.filter(m => m.at <= stopAt + 0.5), traced: false, trail: [], links };
  }

  private spawn(src: DeviceId, dst: string, kind: SpriteKind): Sprite | null {
    const t = this.sim.trace(src, dst);
    this.sim.countPacket(t);
    const s = this.build(t, kind);
    if (kind === 'data' && t.outcome === 'delivered') {
      s.onArrive = () => {
        const back = this.sim.trace(t.at, this.sim.state().hosts[src as 'PC-01'].ip);
        this.sim.countPacket(back);
        this.sprites.push(this.build(back, 'reply'));
      };
    }
    if (this.sprites.length < 160) this.sprites.push(s);
    return s;
  }

  private spawnLoop() {
    const legs = [] as Trace['legs'];
    for (let i = 0; i < 6; i++) legs.push(i % 2 ? { from: 'SWITCH-01', to: 'ROUTER-01', link: 'L-UPLINK' } : { from: 'ROUTER-01', to: 'SWITCH-01', link: 'L-UPLINK' });
    const t: Trace = { legs, outcome: 'ttl', stopLeg: 5, stopFrac: 1, at: 'ROUTER-01', reason: 'transient loop' };
    this.sprites.push(this.build(t, 'loop'));
  }

  private posAt(s: Sprite, d: number): Pt {
    if (s.pts.length === 1) return s.pts[0];
    let i = 1;
    while (i < s.cum.length - 1 && s.cum[i] < d) i++;
    const a = s.pts[i - 1];
    const b = s.pts[i];
    const seg = s.cum[i] - s.cum[i - 1] || 1;
    const f = Math.max(0, Math.min(1, (d - s.cum[i - 1]) / seg));
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  // ---- rendering -------------------------------------------------------------------
  private drawStatic(g: CanvasRenderingContext2D) {
    g.fillStyle = '#05070d';
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    // Corridor floor
    g.fillStyle = '#0a0f19';
    g.fillRect(20, 20, WORLD.w - 40, WORLD.h - 40);
    g.strokeStyle = 'rgba(148,163,184,0.035)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 20; x < WORLD.w; x += 40) (g.moveTo(x, 20), g.lineTo(x, WORLD.h - 20));
    for (let y = 20; y < WORLD.h; y += 40) (g.moveTo(20, y), g.lineTo(WORLD.w - 20, y));
    g.stroke();

    // Rooms
    for (const r of ROOMS) {
      g.fillStyle = r.floor;
      g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = 'rgba(148,163,184,0.05)';
      g.beginPath();
      for (let x = r.x + 32; x < r.x + r.w; x += 32) (g.moveTo(x, r.y), g.lineTo(x, r.y + r.h));
      for (let y = r.y + 32; y < r.y + r.h; y += 32) (g.moveTo(r.x, y), g.lineTo(r.x + r.w, y));
      g.stroke();
      const grad = g.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 10, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.7);
      grad.addColorStop(0, 'rgba(16,185,129,0.025)');
      grad.addColorStop(1, 'rgba(0,0,0,0.18)');
      g.fillStyle = grad;
      g.fillRect(r.x, r.y, r.w, r.h);
    }

    // Cables (under-floor trunks)
    g.lineJoin = 'round';
    g.lineCap = 'round';
    for (const l of LINKS) {
      const pts = CABLES[l.id];
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.strokeStyle = '#060910';
      g.lineWidth = 8;
      g.stroke();
      g.strokeStyle = l.id === 'L-SRV' ? '#5c4f2a' : l.id === 'L-TRUNK' ? '#34445f' : l.id === 'L-UPLINK' ? '#255565' : '#1d5245';
      g.lineWidth = 2.2;
      g.stroke();
    }

    // Props
    for (const p of PROPS) this.drawProp(g, p);

    // Walls with drop shadow
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (const w of this.walls) g.fillRect(w.x, w.y + 5, w.w, w.h);
    g.fillStyle = '#1a2334';
    for (const w of this.walls) g.fillRect(w.x, w.y, w.w, w.h);
    g.fillStyle = 'rgba(148,163,184,0.14)';
    for (const w of this.walls) g.fillRect(w.x, w.y, w.w, 2);

    // Labels
    g.textBaseline = 'top';
    for (const r of ROOMS) {
      g.font = `600 11px ${MONO}`;
      g.fillStyle = '#4d5d78';
      this.spaced(g, r.name.toUpperCase(), r.x + 16, r.y + 16, 2);
    }
    g.font = `500 10px ${MONO}`;
    for (const p of PROPS) {
      const text = p.device ?? p.label;
      if (!text) continue;
      g.fillStyle = '#65758f';
      const w = g.measureText(text).width;
      const below = p.kind === 'desk' || (p.kind === 'rack' && !p.device?.startsWith('SWITCH'));
      g.fillText(text, p.x + p.w / 2 - w / 2, below ? p.y - 15 : p.y + p.h + 6);
    }
  }

  private spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
    let cx = x;
    for (const ch of text) {
      g.fillText(ch, cx, y);
      cx += g.measureText(ch).width + spacing;
    }
  }

  private roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  }

  private drawProp(g: CanvasRenderingContext2D, p: (typeof PROPS)[number]) {
    g.save();
    // soft contact shadow
    g.fillStyle = 'rgba(0,0,0,0.28)';
    this.roundRect(g, p.x + 3, p.y + 5, p.w, p.h, 6);
    g.fill();
    switch (p.kind) {
      case 'desk': {
        g.fillStyle = '#182133';
        this.roundRect(g, p.x, p.y, p.w, p.h, 6);
        g.fill();
        g.strokeStyle = '#26324a';
        g.stroke();
        g.fillStyle = '#0b111d';
        this.roundRect(g, p.x + p.w / 2 - 34, p.y + 8, 68, 10, 3);
        g.fill();
        g.fillStyle = '#222d42';
        this.roundRect(g, p.x + p.w / 2 - 24, p.y + 32, 48, 12, 2);
        g.fill();
        g.fillStyle = '#1c2638';
        g.beginPath();
        g.arc(p.x + p.w / 2 + 40, p.y + 38, 5, 0, Math.PI * 2);
        g.fill();
        break;
      }
      case 'chair':
        g.fillStyle = '#131b2a';
        g.beginPath();
        g.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#223047';
        g.stroke();
        break;
      case 'rack': {
        g.fillStyle = '#0e1522';
        this.roundRect(g, p.x, p.y, p.w, p.h, 4);
        g.fill();
        g.strokeStyle = '#2a3850';
        g.lineWidth = 1.5;
        g.stroke();
        g.strokeStyle = 'rgba(148,163,184,0.08)';
        g.lineWidth = 1;
        for (let y = p.y + 8; y < p.y + p.h - 4; y += 8) {
          g.beginPath();
          g.moveTo(p.x + 5, y);
          g.lineTo(p.x + p.w - 5, y);
          g.stroke();
        }
        break;
      }
      case 'console':
        g.fillStyle = '#131c2c';
        this.roundRect(g, p.x, p.y, p.w, p.h, 8);
        g.fill();
        g.strokeStyle = '#27344c';
        g.stroke();
        break;
      case 'bench':
        g.fillStyle = '#161f30';
        this.roundRect(g, p.x, p.y, p.w, p.h, 5);
        g.fill();
        g.strokeStyle = '#26324a';
        g.stroke();
        g.fillStyle = '#0d1422';
        for (let i = 0; i < 3; i++) {
          this.roundRect(g, p.x + 12 + i * (p.w / 3), p.y + 10, p.w / 3 - 24, p.h - 20, 3);
          g.fill();
        }
        break;
      case 'screen':
        g.fillStyle = '#0a101b';
        this.roundRect(g, p.x, p.y, p.w, p.h, 3);
        g.fill();
        g.strokeStyle = '#2b3950';
        g.stroke();
        break;
      case 'plant':
        g.fillStyle = '#18241f';
        g.beginPath();
        g.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#1f4034';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.beginPath();
          g.ellipse(p.x + p.w / 2 + Math.cos(a) * 7, p.y + p.h / 2 + Math.sin(a) * 7, 8, 4, a, 0, Math.PI * 2);
          g.fill();
        }
        break;
      case 'ups':
      case 'cabinet':
        g.fillStyle = '#121a28';
        this.roundRect(g, p.x, p.y, p.w, p.h, 4);
        g.fill();
        g.strokeStyle = '#243049';
        g.stroke();
        g.strokeStyle = 'rgba(148,163,184,0.07)';
        for (let x = p.x + 8; x < p.x + p.w - 6; x += 6) {
          g.beginPath();
          g.moveTo(x, p.y + 8);
          g.lineTo(x, p.y + 22);
          g.stroke();
        }
        break;
    }
    g.restore();
  }

  private render() {
    const g = this.ctx;
    const z = this.zoom * this.dpr;
    const ox = this.viewW / 2 - this.cam.x * this.zoom;
    const oy = this.viewH / 2 - this.cam.y * this.zoom;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#05070d';
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(z, 0, 0, z, ox * this.dpr, oy * this.dpr);

    // Static layer — only the visible slice
    if (this.staticLayer) {
      const vx = Math.max(0, this.cam.x - this.viewW / 2 / this.zoom);
      const vy = Math.max(0, this.cam.y - this.viewH / 2 / this.zoom);
      const vw = Math.min(WORLD.w - vx, this.viewW / this.zoom + 2);
      const vh = Math.min(WORLD.h - vy, this.viewH / this.zoom + 2);
      const s = this.staticScale;
      g.drawImage(this.staticLayer, vx * s, vy * s, vw * s, vh * s, vx, vy, vw, vh);
    }

    const st = this.sim.state();
    this.drawDoors(g);
    this.drawDevices(g, st);
    this.drawPackets(g);
    this.drawNear(g);
    this.drawPlayer(g);
    this.drawBlackout(g);

    if (this.mini && this.frame % 6 === 0) this.drawMinimap();
  }

  private drawDoors(g: CanvasRenderingContext2D) {
    this.doors.forEach((d, i) => {
      const open = this.doorOpen[i];
      const half = 32 * (1 - open * 0.92);
      g.fillStyle = '#233049';
      if (d.horizontal) {
        g.fillRect(d.x, d.y - 4, half, 8);
        g.fillRect(d.x + 64 - half, d.y - 4, half, 8);
      } else {
        g.fillRect(d.x - 4, d.y, 8, half);
        g.fillRect(d.x - 4, d.y + 64 - half, 8, half);
      }
      g.fillStyle = open > 0.5 ? 'rgba(52,211,153,0.7)' : 'rgba(100,116,139,0.6)';
      const lx = d.horizontal ? d.x - 6 : d.x - 1.5;
      const ly = d.horizontal ? d.y - 1.5 : d.y - 6;
      g.fillRect(lx, ly, 3, 3);
    });
  }

  private led(g: CanvasRenderingContext2D, x: number, y: number, color: string, on: number) {
    if (on <= 0) {
      g.fillStyle = '#1b2433';
      g.fillRect(x - 1.5, y - 1.5, 3, 3);
      return;
    }
    g.fillStyle = color.replace('A', String(0.18 * on));
    g.beginPath();
    g.arc(x, y, 4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = color.replace('A', String(Math.min(1, 0.5 + on * 0.5)));
    g.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  private drawDevices(g: CanvasRenderingContext2D, st: NetState) {
    const t = this.time;
    const blink = (link: LinkId, seed: number) => {
      const recent = this.time - (this.activity[link] ?? -10) < 0.25;
      return recent ? (Math.sin(t * 40 + seed) > 0 ? 1 : 0.35) : 0.7;
    };
    const G = 'rgba(52,211,153,A)';
    const AMB = 'rgba(251,191,36,A)';

    for (const p of PROPS) {
      if (p.kind === 'desk' && p.device) {
        const link = LINKS.find(l => l.a === p.device)!;
        const up = linkUp(st, link.id);
        const flicker = 0.85 + Math.sin(t * 3 + p.x) * 0.05;
        g.fillStyle = up ? `rgba(45,212,191,${0.35 * flicker})` : 'rgba(148,163,184,0.22)';
        g.fillRect(p.x + p.w / 2 - 32, p.y + 10, 64, 6);
        if (!up) {
          // tray icon: tiny warning glyph, not a highlight
          g.fillStyle = 'rgba(251,191,36,0.75)';
          g.fillRect(p.x + p.w / 2 + 26, p.y + 11, 3, 3);
        }
        this.led(g, p.x + p.w / 2 + 40, p.y + 38, G, up ? blink(link.id, p.x) : 0);
      }
      if (p.kind === 'rack' && p.device && p.device !== 'SERVER-01') {
        const ports = LINKS.filter(l => l.a === p.device || l.b === p.device);
        ports.forEach((l, i) => {
          const status = portStatus(st, p.device!, l);
          const x = p.x + 14 + i * ((p.w - 28) / Math.max(1, ports.length - 1));
          const on = status === 'connected' ? blink(l.id, i * 3) : 0;
          if (status === 'err-down') this.led(g, x, p.y + p.h - 10, AMB, Math.sin(t * 6) > 0 ? 1 : 0);
          else this.led(g, x, p.y + p.h - 10, G, on);
        });
        this.led(g, p.x + 8, p.y + 8, G, st.switchDown[p.device] ? 0 : 0.6);
      }
      if (p.kind === 'rack' && p.device === 'SERVER-01') {
        this.led(g, p.x + 10, p.y + 10, G, 0.6);
        for (let i = 0; i < 6; i++) {
          const on = st.serverUp ? (Math.sin(t * (5 + i) + i) > 0.2 ? 0.9 : 0.3) : 0;
          this.led(g, p.x + 24 + (i % 3) * 20, p.y + 30 + Math.floor(i / 3) * 18, G, on);
        }
        const fibre = linkUp(st, 'L-SRV');
        this.led(g, p.x + p.w - 10, p.y + p.h - 10, 'rgba(56,189,248,A)', fibre ? blink('L-SRV', 9) : 0);
      }
      if (p.kind === 'rack' && !p.device) {
        for (let i = 0; i < 5; i++) {
          const on = Math.sin(t * (1.3 + hash(p.x + i) * 3) + i * 2) > 0.3 ? 0.8 : 0.25;
          this.led(g, p.x + 12 + (i % 3) * 18, p.y + 16 + Math.floor(i / 3) * 30, G, on);
        }
      }
      if (p.kind === 'screen') {
        const bars = Math.floor(p.w / 12);
        for (let i = 0; i < bars; i++) {
          const h = (0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + i * 0.7))) * (p.h - 8);
          g.fillStyle = `rgba(45,212,191,${0.25 + 0.2 * hash(i)})`;
          g.fillRect(p.x + 6 + i * 12, p.y + p.h - 4 - h, 6, h);
        }
      }
      if (p.kind === 'console' || p.kind === 'bench') {
        const n = p.kind === 'console' ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const sx = p.x + 14 + i * ((p.w - 28) / n);
          const w = (p.w - 28) / n - 10;
          g.fillStyle = `rgba(45,212,191,${0.12 + 0.06 * Math.sin(t * 2 + i)})`;
          g.fillRect(sx, p.y + 12, w, 6);
          g.fillStyle = 'rgba(148,163,184,0.15)';
          g.fillRect(sx, p.y + 22, w * (0.4 + 0.5 * hash(i + p.x)), 2);
        }
      }
    }
  }

  private drawPackets(g: CanvasRenderingContext2D) {
    for (const s of this.sprites) {
      const [x, y] = this.posAt(s, s.d);
      if (s.kind === 'rogue') {
        g.strokeStyle = 'rgba(196,181,253,0.35)';
        g.lineWidth = 2;
        g.beginPath();
        s.trail.forEach(([tx, ty], i) => (i ? g.lineTo(tx, ty) : g.moveTo(tx, ty)));
        g.stroke();
        g.save();
        g.translate(x, y);
        g.rotate(this.time * 3);
        g.fillStyle = 'rgba(196,181,253,0.18)';
        g.fillRect(-8, -8, 16, 16);
        g.fillStyle = '#ddd6fe';
        g.fillRect(-3.5, -3.5, 7, 7);
        g.restore();
        if (s.traced) {
          g.strokeStyle = 'rgba(221,214,254,0.6)';
          g.lineWidth = 1;
          g.beginPath();
          g.arc(x, y, 14 + Math.sin(this.time * 6) * 2, 0, Math.PI * 2);
          g.stroke();
        }
        continue;
      }
      const color = s.kind === 'reply' ? '103,232,249' : s.kind === 'loop' ? '251,191,36' : '52,211,153';
      g.fillStyle = `rgba(${color},0.18)`;
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(${color},0.95)`;
      g.beginPath();
      g.arc(x, y, 2.2, 0, Math.PI * 2);
      g.fill();
    }
    for (const f of this.puffs) {
      const a = 1 - f.t / 0.8;
      g.strokeStyle = f.ok ? `rgba(52,211,153,${a * 0.5})` : `rgba(226,232,240,${a * 0.7})`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(f.x, f.y, 3 + f.t * 16, 0, Math.PI * 2);
      g.stroke();
      if (!f.ok) {
        const r = 4;
        g.beginPath();
        g.moveTo(f.x - r, f.y - r);
        g.lineTo(f.x + r, f.y + r);
        g.moveTo(f.x + r, f.y - r);
        g.lineTo(f.x - r, f.y + r);
        g.stroke();
      }
    }
  }

  private drawNear(g: CanvasRenderingContext2D) {
    if (!this.near) return;
    const { x, y } = this.near;
    g.save();
    g.strokeStyle = 'rgba(52,211,153,0.55)';
    g.lineWidth = 1.5;
    g.setLineDash([4, 5]);
    g.lineDashOffset = -this.time * 12;
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  private drawPlayer(g: CanvasRenderingContext2D) {
    const p = this.player;
    const walk = p.moving ? Math.sin(p.phase) : 0;
    const breathe = p.moving ? 1 : 1 + Math.sin(this.time * 2.2) * 0.018;
    g.save();
    g.translate(p.x, p.y);
    // shadow
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(2, 4, 15, 12, 0, 0, Math.PI * 2);
    g.fill();
    g.rotate(p.angle + Math.PI / 2);
    g.scale(breathe, breathe);
    // legs
    g.fillStyle = '#1e293b';
    g.beginPath();
    g.ellipse(-5, walk * 6, 3.5, 6, 0, 0, Math.PI * 2);
    g.ellipse(5, -walk * 6, 3.5, 6, 0, 0, Math.PI * 2);
    g.fill();
    // tool pack (behind)
    g.fillStyle = '#0f766e';
    g.beginPath();
    g.roundRect(-7, 5, 14, 8, 2);
    g.fill();
    // torso
    g.fillStyle = '#334155';
    g.beginPath();
    g.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#475569';
    g.lineWidth = 1;
    g.stroke();
    // shoulder stripe
    g.strokeStyle = '#34d399';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, 9.5, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
    // arms
    g.fillStyle = '#3b4a61';
    g.beginPath();
    g.arc(-12, -walk * 4, 3.2, 0, Math.PI * 2);
    g.arc(12, walk * 4, 3.2, 0, Math.PI * 2);
    g.fill();
    // head + headset
    g.fillStyle = '#d6c3b0';
    g.beginPath();
    g.arc(0, -1, 6.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1f2937';
    g.beginPath();
    g.arc(0, 0.5, 6.4, 0, Math.PI);
    g.fill();
    g.strokeStyle = '#0f172a';
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(0, -1, 7.4, Math.PI * 0.05, Math.PI * 0.95);
    g.stroke();
    const ledOn = Math.sin(this.time * 3) > 0.6;
    g.fillStyle = ledOn ? '#34d399' : '#14532d';
    g.fillRect(6, -3, 2.4, 2.4);
    g.restore();
  }

  private drawBlackout(g: CanvasRenderingContext2D) {
    const id = this.sim.blackoutRoom();
    if (!id) return;
    const r = ROOMS.find(x => x.id === id);
    if (!r) return;
    const p = this.player;
    const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    if (inside) {
      const grad = g.createRadialGradient(p.x, p.y, 20, p.x, p.y, 170);
      grad.addColorStop(0, 'rgba(2,4,8,0)');
      grad.addColorStop(1, 'rgba(2,4,8,0.9)');
      g.fillStyle = grad;
    } else g.fillStyle = 'rgba(2,4,8,0.88)';
    g.fillRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
  }

  private drawMinimap() {
    const m = this.mini!;
    const c = m.canvas;
    const w = c.width;
    const h = c.height;
    const s = Math.min(w / WORLD.w, h / WORLD.h);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.clearRect(0, 0, w, h);
    m.setTransform(s, 0, 0, s, (w - WORLD.w * s) / 2, (h - WORLD.h * s) / 2);
    m.fillStyle = 'rgba(10,15,25,0.9)';
    m.fillRect(0, 0, WORLD.w, WORLD.h);
    for (const r of ROOMS) {
      const seen = this.visited.has(r.id);
      m.fillStyle = seen ? 'rgba(30,41,59,0.95)' : 'rgba(20,27,40,0.8)';
      m.fillRect(r.x, r.y, r.w, r.h);
      m.strokeStyle = r.id === this.room?.id ? 'rgba(52,211,153,0.9)' : seen ? 'rgba(100,116,139,0.6)' : 'rgba(51,65,85,0.5)';
      m.lineWidth = 12;
      m.strokeRect(r.x, r.y, r.w, r.h);
    }
    const known = this.sim.discovered();
    for (const d of known) {
      const it = INTERACTABLES.find(i => i.device === d);
      if (!it) continue;
      m.fillStyle = 'rgba(148,163,184,0.9)';
      m.fillRect(it.x - 14, it.y - 14, 28, 28);
    }
    if (this.tracing) {
      const [x, y] = this.posAt(this.tracing, this.tracing.d);
      m.fillStyle = '#ddd6fe';
      m.beginPath();
      m.arc(x, y, 22, 0, Math.PI * 2);
      m.fill();
    }
    m.fillStyle = '#34d399';
    m.beginPath();
    m.arc(this.player.x, this.player.y, 26, 0, Math.PI * 2);
    m.fill();
  }
}
