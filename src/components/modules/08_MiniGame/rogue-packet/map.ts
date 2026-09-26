// Rogue Packet — facility layout. World units are pixels at zoom 1.

import type { DeviceId, LinkId } from './network';

export const WORLD = { w: 1600, h: 1100 };
export const WALL = 14;
export const DOOR = 64;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RoomId = 'lab' | 'monitor' | 'packet' | 'switch' | 'control' | 'router' | 'server';

export interface Room extends Rect {
  id: RoomId;
  name: string;
  floor: string;
  doors: { side: 'top' | 'bottom' | 'left' | 'right'; at: number }[];
}

export const ROOMS: Room[] = [
  { id: 'lab', name: 'Computer Lab', x: 40, y: 40, w: 600, h: 360, floor: '#161513', doors: [{ side: 'bottom', at: 270 }, { side: 'right', at: 150 }] },
  { id: 'monitor', name: 'Monitoring Room', x: 720, y: 40, w: 420, h: 300, floor: '#151412', doors: [{ side: 'left', at: 150 }, { side: 'bottom', at: 190 }, { side: 'right', at: 120 }] },
  { id: 'packet', name: 'Packet Analysis Lab', x: 1220, y: 40, w: 340, h: 440, floor: '#151412', doors: [{ side: 'left', at: 120 }, { side: 'bottom', at: 140 }] },
  { id: 'switch', name: 'Switch Room', x: 40, y: 480, w: 480, h: 280, floor: '#151412', doors: [{ side: 'top', at: 270 }, { side: 'right', at: 110 }, { side: 'bottom', at: 200 }] },
  { id: 'control', name: 'Network Control Room', x: 600, y: 420, w: 540, h: 340, floor: '#171614', doors: [{ side: 'top', at: 310 }, { side: 'left', at: 170 }, { side: 'right', at: 150 }, { side: 'bottom', at: 240 }] },
  { id: 'router', name: 'Router Room', x: 40, y: 840, w: 480, h: 220, floor: '#151412', doors: [{ side: 'top', at: 200 }, { side: 'right', at: 90 }] },
  { id: 'server', name: 'Server Room', x: 600, y: 840, w: 960, h: 220, floor: '#141311', doors: [{ side: 'left', at: 90 }, { side: 'top', at: 240 }, { side: 'top', at: 760 }] },
];

export interface Door {
  x: number;
  y: number;
  horizontal: boolean;
}

export function buildWalls(): { walls: Rect[]; doors: Door[] } {
  const walls: Rect[] = [];
  const doors: Door[] = [];
  // Facility shell
  walls.push({ x: 0, y: 0, w: WORLD.w, h: 20 }, { x: 0, y: WORLD.h - 20, w: WORLD.w, h: 20 }, { x: 0, y: 0, w: 20, h: WORLD.h }, { x: WORLD.w - 20, y: 0, w: 20, h: WORLD.h });

  for (const r of ROOMS) {
    const edges: { side: Room['doors'][number]['side']; x: number; y: number; len: number; horizontal: boolean }[] = [
      { side: 'top', x: r.x, y: r.y, len: r.w, horizontal: true },
      { side: 'bottom', x: r.x, y: r.y + r.h, len: r.w, horizontal: true },
      { side: 'left', x: r.x, y: r.y, len: r.h, horizontal: false },
      { side: 'right', x: r.x + r.w, y: r.y, len: r.h, horizontal: false },
    ];
    for (const e of edges) {
      const gaps = r.doors.filter(d => d.side === e.side).map(d => d.at).sort((a, b) => a - b);
      let start = -WALL / 2;
      const segs: [number, number][] = [];
      for (const g of gaps) {
        segs.push([start, g]);
        start = g + DOOR;
        doors.push(e.horizontal ? { x: e.x + g, y: e.y, horizontal: true } : { x: e.x, y: e.y + g, horizontal: false });
      }
      segs.push([start, e.len + WALL / 2]);
      for (const [a, b] of segs) {
        if (b - a <= 0) continue;
        walls.push(e.horizontal ? { x: e.x + a, y: e.y - WALL / 2, w: b - a, h: WALL } : { x: e.x - WALL / 2, y: e.y + a, w: WALL, h: b - a });
      }
    }
  }
  return { walls, doors };
}

// ---------------------------------------------------------------------------
// Furniture & devices

export type PropKind = 'desk' | 'rack' | 'console' | 'bench' | 'screen' | 'chair' | 'plant' | 'ups' | 'cabinet';

export interface Prop extends Rect {
  kind: PropKind;
  solid: boolean;
  label?: string;
  device?: DeviceId;
}

export const PROPS: Prop[] = [
  // Computer Lab — four workstations
  { kind: 'desk', x: 100, y: 110, w: 170, h: 60, solid: true, device: 'PC-01' },
  { kind: 'desk', x: 360, y: 110, w: 170, h: 60, solid: true, device: 'PC-02' },
  { kind: 'desk', x: 100, y: 260, w: 170, h: 60, solid: true, device: 'PC-03' },
  { kind: 'desk', x: 360, y: 260, w: 170, h: 60, solid: true, device: 'PC-04' },
  { kind: 'chair', x: 170, y: 184, w: 26, h: 26, solid: false },
  { kind: 'chair', x: 430, y: 184, w: 26, h: 26, solid: false },
  { kind: 'chair', x: 170, y: 334, w: 26, h: 26, solid: false },
  { kind: 'chair', x: 430, y: 334, w: 26, h: 26, solid: false },
  { kind: 'plant', x: 586, y: 60, w: 30, h: 30, solid: true },
  { kind: 'cabinet', x: 560, y: 300, w: 60, h: 80, solid: true },
  // Monitoring Room
  { kind: 'screen', x: 900, y: 50, w: 220, h: 22, solid: true, label: 'MONITOR-01' },
  { kind: 'console', x: 780, y: 150, w: 300, h: 46, solid: true },
  { kind: 'chair', x: 850, y: 210, w: 26, h: 26, solid: false },
  { kind: 'chair', x: 980, y: 210, w: 26, h: 26, solid: false },
  // Packet Analysis Lab
  { kind: 'bench', x: 1260, y: 90, w: 260, h: 56, solid: true, label: 'ANALYZER' },
  { kind: 'rack', x: 1480, y: 260, w: 54, h: 120, solid: true },
  { kind: 'bench', x: 1250, y: 330, w: 150, h: 50, solid: true },
  { kind: 'plant', x: 1250, y: 430, w: 28, h: 28, solid: true },
  // Switch Room
  { kind: 'rack', x: 110, y: 560, w: 100, h: 70, solid: true, device: 'SWITCH-01' },
  { kind: 'rack', x: 320, y: 560, w: 100, h: 70, solid: true, device: 'SWITCH-02' },
  { kind: 'cabinet', x: 450, y: 690, w: 50, h: 50, solid: true },
  // Control Room
  { kind: 'screen', x: 840, y: 430, w: 270, h: 20, solid: true, label: 'TOPOLOGY' },
  { kind: 'console', x: 740, y: 540, w: 260, h: 60, solid: true, label: 'DIAGNOSE' },
  { kind: 'chair', x: 857, y: 612, w: 26, h: 26, solid: false },
  { kind: 'plant', x: 1090, y: 700, w: 30, h: 30, solid: true },
  // Router Room
  { kind: 'rack', x: 200, y: 880, w: 120, h: 70, solid: true, device: 'ROUTER-01' },
  { kind: 'ups', x: 60, y: 880, w: 70, h: 90, solid: true },
  // Server Room
  { kind: 'rack', x: 700, y: 870, w: 70, h: 90, solid: true },
  { kind: 'rack', x: 790, y: 870, w: 70, h: 90, solid: true },
  { kind: 'rack', x: 960, y: 870, w: 90, h: 90, solid: true, device: 'SERVER-01' },
  { kind: 'rack', x: 1120, y: 870, w: 70, h: 90, solid: true },
  { kind: 'rack', x: 1210, y: 870, w: 70, h: 90, solid: true },
  { kind: 'ups', x: 1440, y: 880, w: 80, h: 90, solid: true },
];

/** Where a device's cable terminates, in world coordinates. */
export const DEVICE_PORT: Record<DeviceId, { x: number; y: number }> = {
  'PC-01': { x: 185, y: 140 },
  'PC-02': { x: 445, y: 140 },
  'PC-03': { x: 185, y: 290 },
  'PC-04': { x: 445, y: 290 },
  'SWITCH-01': { x: 160, y: 615 },
  'SWITCH-02': { x: 370, y: 615 },
  'ROUTER-01': { x: 260, y: 915 },
  'SERVER-01': { x: 1005, y: 915 },
};

export type Pt = [number, number];

/** Floor-trunk cable runs, from link.a to link.b. */
export const CABLES: Record<LinkId, Pt[]> = {
  'L-PC1': [[185, 140], [185, 225], [292, 225], [292, 450], [152, 450], [152, 615]],
  'L-PC2': [[445, 140], [445, 225], [300, 225], [300, 458], [166, 458], [166, 615]],
  'L-PC3': [[185, 290], [185, 372], [308, 372], [308, 466], [362, 466], [362, 615]],
  'L-PC4': [[445, 290], [445, 380], [316, 380], [316, 474], [378, 474], [378, 615]],
  'L-TRUNK': [[160, 615], [160, 660], [370, 660], [370, 615]],
  'L-UPLINK': [[160, 615], [160, 700], [272, 700], [272, 915], [260, 915]],
  'L-SRV': [[260, 915], [560, 915], [560, 1010], [1005, 1010], [1005, 915]],
};

export type InteractKind = 'device' | 'cable' | 'monitor' | 'analyzer' | 'console';

export interface Interactable {
  id: string;
  kind: InteractKind;
  label: string;
  verb: string;
  x: number;
  y: number;
  device?: DeviceId;
  link?: LinkId;
  room: RoomId;
}

export const INTERACTABLES: Interactable[] = [
  { id: 'PC-01', kind: 'device', device: 'PC-01', label: 'PC-01', verb: 'Inspect Computer', x: 185, y: 190, room: 'lab' },
  { id: 'PC-02', kind: 'device', device: 'PC-02', label: 'PC-02', verb: 'Inspect Computer', x: 445, y: 190, room: 'lab' },
  { id: 'PC-03', kind: 'device', device: 'PC-03', label: 'PC-03', verb: 'Inspect Computer', x: 185, y: 340, room: 'lab' },
  { id: 'PC-04', kind: 'device', device: 'PC-04', label: 'PC-04', verb: 'Inspect Computer', x: 445, y: 340, room: 'lab' },
  { id: 'SWITCH-01', kind: 'device', device: 'SWITCH-01', label: 'SWITCH-01', verb: 'Inspect Switch', x: 160, y: 652, room: 'switch' },
  { id: 'SWITCH-02', kind: 'device', device: 'SWITCH-02', label: 'SWITCH-02', verb: 'Inspect Switch', x: 370, y: 652, room: 'switch' },
  { id: 'ROUTER-01', kind: 'device', device: 'ROUTER-01', label: 'ROUTER-01', verb: 'Inspect Router', x: 260, y: 985, room: 'router' },
  { id: 'SERVER-01', kind: 'device', device: 'SERVER-01', label: 'SERVER-01', verb: 'Inspect Server', x: 1005, y: 995, room: 'server' },
  { id: 'MONITOR-01', kind: 'monitor', label: 'MONITOR-01', verb: 'Read Network Monitor', x: 1010, y: 110, room: 'monitor' },
  { id: 'ANALYZER', kind: 'analyzer', label: 'Packet Analyzer', verb: 'Open Packet Capture', x: 1390, y: 180, room: 'packet' },
  { id: 'CONSOLE', kind: 'console', label: 'Diagnosis Console', verb: 'Diagnose Network', x: 870, y: 650, room: 'control' },
  // Patch points along the cable runs
  { id: 'C-PC1', kind: 'cable', link: 'L-PC1', label: 'PC-01 patch lead', verb: 'Inspect Connection', x: 232, y: 218, room: 'lab' },
  { id: 'C-PC2', kind: 'cable', link: 'L-PC2', label: 'PC-02 patch lead', verb: 'Inspect Connection', x: 492, y: 218, room: 'lab' },
  { id: 'C-PC3', kind: 'cable', link: 'L-PC3', label: 'PC-03 patch lead', verb: 'Inspect Connection', x: 232, y: 372, room: 'lab' },
  { id: 'C-PC4', kind: 'cable', link: 'L-PC4', label: 'PC-04 patch lead', verb: 'Inspect Connection', x: 492, y: 380, room: 'lab' },
  { id: 'C-TRUNK', kind: 'cable', link: 'L-TRUNK', label: 'Trunk SW-01 ↔ SW-02', verb: 'Inspect Connection', x: 265, y: 682, room: 'switch' },
  { id: 'C-UPLINK', kind: 'cable', link: 'L-UPLINK', label: 'Uplink SW-01 ↔ R1', verb: 'Inspect Connection', x: 272, y: 790, room: 'switch' },
  { id: 'C-SRV', kind: 'cable', link: 'L-SRV', label: 'Fibre R1 ↔ SERVER-01', verb: 'Inspect Connection', x: 580, y: 1010, room: 'server' },
];

export const SPAWN = { x: 870, y: 700 };

export function roomAt(x: number, y: number): Room | null {
  return ROOMS.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? null;
}

export const DEVICE_ROOM: Record<DeviceId, RoomId> = {
  'PC-01': 'lab',
  'PC-02': 'lab',
  'PC-03': 'lab',
  'PC-04': 'lab',
  'SWITCH-01': 'switch',
  'SWITCH-02': 'switch',
  'ROUTER-01': 'router',
  'SERVER-01': 'server',
};
