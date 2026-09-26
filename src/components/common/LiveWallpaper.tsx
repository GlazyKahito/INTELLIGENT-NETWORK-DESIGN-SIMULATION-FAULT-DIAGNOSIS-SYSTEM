import React, { useEffect, useRef } from 'react';

// Site background after the warp: a topographic "signal field" (WebGL2 contour
// shader) with a sparse network drawn over it — nodes, links and the occasional
// packet. One rAF loop, 30 fps cap, half-resolution shader, paused when hidden,
// a single static frame under prefers-reduced-motion.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColor;
out vec4 outColor;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float t = uTime * 0.035;
  vec2 m = uMouse / uRes.y;
  float d = length(uv - m);
  float lift = exp(-d * d * 9.0) * 0.18;
  float h = fbm(uv * 1.35 + vec2(t, -t * 0.7)) + lift;
  float lines = h * 16.0;
  float w = clamp(fwidth(lines), 1e-4, 0.5);
  // distance to the nearest contour (fract near 0 or 1)
  float f = abs(fract(lines) - 0.5);
  float line = smoothstep(0.5 - w * 1.5, 0.5, f);
  float major = step(abs(mod(floor(lines + 0.5), 5.0)), 0.5);
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  float vig = 1.0 - smoothstep(0.15, 0.85, length(q * vec2(1.1, 1.3)));
  float a = line * (0.07 + 0.09 * major) * vig;
  a = (a == a) ? clamp(a, 0.0, 0.25) : 0.0; // guard NaN on odd drivers
  outColor = vec4(uColor * a, a);
}`;

interface Node {
  x: number;
  y: number;
  bx: number;
  by: number;
  pulse: number;
  links: number[];
}
interface Packet {
  a: number;
  b: number;
  t: number;
  speed: number;
}

const FRAME_MS = 1000 / 30;

function initTopo(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl || gl.isContextLost()) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    color: gl.getUniformLocation(prog, 'uColor'),
  };
  gl.uniform3f(u.color, 255 / 255, 95 / 255, 31 / 255);
  return {
    draw(time: number, w: number, h: number, mx: number, my: number) {
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.mouse, mx, my);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Keep the context itself: StrictMode remounts reuse this canvas, and a lost
      // context would paint as an opaque pale layer. The browser frees it with the element.
    },
  };
}

export const LiveWallpaper: React.FC = () => {
  const topoRef = useRef<HTMLCanvasElement>(null);
  const netRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const topoCanvas = topoRef.current;
    const netCanvas = netRef.current;
    const ctx = netCanvas?.getContext('2d');
    if (!topoCanvas || !netCanvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const topo = initTopo(topoCanvas);
    topoCanvas.style.visibility = topo ? 'visible' : 'hidden';
    const onLost = () => (topoCanvas.style.visibility = 'hidden');
    topoCanvas.addEventListener('webglcontextlost', onLost);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };

    const layout = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      netCanvas.width = Math.round(W * dpr);
      netCanvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ts = W < 768 ? 0.35 : 0.5;
      topoCanvas.width = Math.round(W * dpr * ts);
      topoCanvas.height = Math.round(H * dpr * ts);
      // Sparse jittered grid of nodes, each linked to its nearest neighbours.
      const cols = W < 768 ? 3 : 6;
      const rows = W < 768 ? 4 : 4;
      nodes = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (Math.random() < 0.28) continue;
          const x = ((c + 0.5 + (Math.random() - 0.5) * 0.7) / cols) * W;
          const y = ((r + 0.5 + (Math.random() - 0.5) * 0.7) / rows) * H;
          nodes.push({ x, y, bx: x, by: y, pulse: 0, links: [] });
        }
      nodes.forEach((n, i) => {
        const near = nodes
          .map((m, j) => ({ j, d: Math.hypot(m.bx - n.bx, m.by - n.by) }))
          .filter(o => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        near.forEach(({ j }) => {
          if (!n.links.includes(j)) n.links.push(j);
          if (!nodes[j].links.includes(i)) nodes[j].links.push(i);
        });
      });
      packets = [];
    };

    const drawNet = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      const drawn = new Set<string>();
      nodes.forEach((n, i) =>
        n.links.forEach(j => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (drawn.has(key)) return;
          drawn.add(key);
          const m = nodes[j];
          ctx.strokeStyle = 'rgba(116,115,113,0.10)';
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }),
      );
      for (const p of packets) {
        const a = nodes[p.a];
        const b = nodes[p.b];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.strokeStyle = 'rgba(255,122,56,0.28)';
        ctx.beginPath();
        ctx.moveTo(a.x + (b.x - a.x) * Math.max(0, p.t - 0.12), a.y + (b.y - a.y) * Math.max(0, p.t - 0.12));
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,163,112,0.75)';
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const n of nodes) {
        ctx.strokeStyle = `rgba(255,122,56,${0.16 + n.pulse * 0.5})`;
        ctx.fillStyle = '#0c0b09';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (n.pulse > 0.02) {
          ctx.fillStyle = `rgba(255,122,56,${n.pulse * 0.8})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(255,122,56,${n.pulse * 0.25})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3.2 + (1 - n.pulse) * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const t0 = performance.now();
    const drawTopo = (time: number) =>
      topo?.draw(time, topoCanvas.width, topoCanvas.height, mouse.sx * (topoCanvas.width / W), (H - mouse.sy) * (topoCanvas.height / H));

    layout();
    const onResize = () => {
      layout();
      if (reduced) (drawTopo(0), drawNet());
    };
    window.addEventListener('resize', onResize);
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    if (reduced) {
      drawTopo(12);
      drawNet();
      return () => {
        window.removeEventListener('resize', onResize);
        topo?.dispose();
      topoCanvas.removeEventListener('webglcontextlost', onLost);
      };
    }

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let spawnIn = 0.6;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      acc += now - last;
      last = now;
      if (acc < FRAME_MS) return;
      const dt = Math.min(acc, 100) / 1000;
      acc = 0;
      // Smoothed cursor; nodes drift a few pixels toward it (desktop only).
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4);
      mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4);
      for (const n of nodes) {
        const dx = mouse.sx - n.bx;
        const dy = mouse.sy - n.by;
        const d = Math.hypot(dx, dy);
        const pull = d < 220 ? (1 - d / 220) * 6 : 0;
        n.x += (n.bx + (d ? (dx / d) * pull : 0) - n.x) * Math.min(1, dt * 5);
        n.y += (n.by + (d ? (dy / d) * pull : 0) - n.y) * Math.min(1, dt * 5);
        n.pulse = Math.max(0, n.pulse - dt * 1.2);
      }
      spawnIn -= dt;
      if (spawnIn <= 0 && nodes.length > 1) {
        spawnIn = 1.1 + Math.random() * 1.6;
        const a = Math.floor(Math.random() * nodes.length);
        const links = nodes[a].links;
        if (links.length) {
          nodes[a].pulse = 0.7;
          packets.push({ a, b: links[Math.floor(Math.random() * links.length)], t: 0, speed: 0.22 + Math.random() * 0.15 });
        }
      }
      packets = packets.filter(p => {
        p.t += p.speed * dt;
        if (p.t >= 1) {
          nodes[p.b].pulse = 1;
          // Some packets hop onward, so routes read as paths, not blips.
          if (Math.random() < 0.55) {
            const next = nodes[p.b].links.filter(j => j !== p.a);
            if (next.length) packets.push({ a: p.b, b: next[Math.floor(Math.random() * next.length)], t: 0, speed: p.speed });
          }
          return false;
        }
        return true;
      });
      drawTopo((now - t0) / 1000);
      drawNet();
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      topo?.dispose();
      topoCanvas.removeEventListener('webglcontextlost', onLost);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 tech-grid-bg opacity-25 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_75%)]" />
      <canvas ref={topoRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={netRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
