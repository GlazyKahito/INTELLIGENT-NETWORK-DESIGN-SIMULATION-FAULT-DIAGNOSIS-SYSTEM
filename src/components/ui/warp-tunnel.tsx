import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';
import { SceneContainer } from './warp-tunnel-utils/scene-container';
import { useShadcnTheme } from './warp-tunnel-utils/use-shadcn-theme';

export interface WarpTunnelColors {
  /** Dominant streak colour. Defaults to the shadcn `--primary` token. */
  primary: string;
  /** Secondary streak colour. Defaults to the shadcn `--accent` token. */
  accent: string;
  /** Colour of the bright "packet" streaks. Defaults to a light tint of primary. */
  highlight: string;
}

export interface WarpTunnelProps {
  /** Target travel speed. 0 is still, ~1 is cruise, ~6 is full warp. Changes are eased. */
  speed?: number;
  /** Overall brightness, 0–1. Changes are eased. */
  intensity?: number;
  /** Streak count. Picked from the device class when omitted. */
  count?: number;
  /** Tunnel radius in world units. */
  radius?: number;
  /** Tunnel depth in world units. */
  depth?: number;
  /** Stop rendering (keeps the last frame on screen). */
  paused?: boolean;
  colors?: Partial<WarpTunnelColors>;
  /** Fires once the first frame is on screen — use it to sync choreography. */
  onReady?: () => void;
  className?: string;
  'aria-label'?: string;
}

const RING_COUNT = 18;
const PACKET_RATIO = 0.09;
const UNITS_PER_SECOND = 7;

const tmpObject = new THREE.Object3D();
const tmpColor = new THREE.Color();

function autoCount(): number {
  if (typeof window === 'undefined') return 320;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (window.innerWidth < 768) return 150;
  if (cores <= 4) return 220;
  return 420;
}

interface SceneProps {
  count: number;
  radius: number;
  depth: number;
  speed: number;
  intensity: number;
  still: boolean;
  isDark: boolean;
  background: string;
  colors: WarpTunnelColors;
}

function TunnelScene({ count, radius, depth, speed, intensity, still, isDark, background, colors }: SceneProps) {
  const streaks = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree(s => s.invalidate);

  // Eased live values; the parent only sets targets, so no React re-render per frame.
  const live = useRef({ speed, intensity, roll: 0 });
  const target = useRef({ speed, intensity });

  useEffect(() => {
    target.current.speed = speed;
    target.current.intensity = intensity;
    if (still) {
      live.current.speed = speed;
      live.current.intensity = intensity;
    }
    invalidate();
  }, [speed, intensity, still, invalidate]);

  const streakData = useMemo(() => {
    const angle = new Float32Array(count);
    const r = new Float32Array(count);
    const z = new Float32Array(count);
    const length = new Float32Array(count);
    const velocity = new Float32Array(count);
    const packet = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      angle[i] = Math.random() * Math.PI * 2;
      r[i] = radius * (0.55 + Math.random() * 0.6);
      z[i] = -Math.random() * depth;
      packet[i] = Math.random() < PACKET_RATIO ? 1 : 0;
      length[i] = packet[i] ? 0.35 + Math.random() * 0.3 : 0.5 + Math.random() * 1.4;
      velocity[i] = packet[i] ? 1.35 + Math.random() * 0.4 : 0.75 + Math.random() * 0.5;
    }
    return { angle, r, z, length, velocity, packet };
  }, [count, radius, depth]);

  const ringData = useMemo(() => {
    const z = new Float32Array(RING_COUNT);
    const spin = new Float32Array(RING_COUNT);
    for (let i = 0; i < RING_COUNT; i++) {
      z[i] = -(i / RING_COUNT) * depth;
      spin[i] = Math.random() * Math.PI * 2;
    }
    return { z, spin };
  }, [depth]);

  const palette = useMemo(() => {
    const primary = new THREE.Color(colors.primary);
    const accent = new THREE.Color(colors.accent);
    const highlight = new THREE.Color(colors.highlight);
    const base = Array.from({ length: count }, (_, i) =>
      streakData.packet[i] ? highlight.clone() : primary.clone().lerp(accent, Math.random() * 0.85),
    );
    return { base, ring: primary.clone().lerp(accent, 0.5), bg: new THREE.Color(background) };
  }, [colors.primary, colors.accent, colors.highlight, background, count, streakData]);

  useEffect(() => invalidate(), [palette, invalidate]);

  useFrame((state, delta) => {
    const s = streaks.current;
    const g = rings.current;
    if (!s || !g) return;

    const dt = Math.min(delta, 1 / 20);
    const L = live.current;
    L.speed += (target.current.speed - L.speed) * (1 - Math.exp(-dt * 2.4));
    L.intensity += (target.current.intensity - L.intensity) * (1 - Math.exp(-dt * 3));

    const travel = L.speed * UNITS_PER_SECOND * dt;
    const stretch = 1 + Math.min(L.speed, 8) * 1.1;
    const energy = 0.35 + Math.min(L.speed, 6) / 6 * 0.65;
    const { angle, r, z, length, velocity, packet } = streakData;

    for (let i = 0; i < count; i++) {
      z[i] += travel * velocity[i];
      if (z[i] > 0.5) {
        z[i] -= depth;
        angle[i] = Math.random() * Math.PI * 2;
      }
      const len = length[i] * (packet[i] ? 1 + (stretch - 1) * 0.35 : stretch);
      const thick = packet[i] ? 0.024 : 0.016;
      tmpObject.position.set(Math.cos(angle[i]) * r[i], Math.sin(angle[i]) * r[i], z[i] - len / 2);
      tmpObject.rotation.set(0, 0, 0);
      tmpObject.scale.set(thick, thick, len);
      tmpObject.updateMatrix();
      s.setMatrixAt(i, tmpObject.matrix);

      const near = 1 + z[i] / depth; // 0 far → 1 at camera
      const closeFade = Math.min(1, -z[i] / 4); // soften streaks sweeping past the lens
      const fade = near * near * closeFade * L.intensity * energy * (packet[i] ? 1.5 : 1);
      if (isDark) tmpColor.copy(palette.base[i]).multiplyScalar(fade);
      else tmpColor.copy(palette.bg).lerp(palette.base[i], Math.min(1, fade));
      s.setColorAt(i, tmpColor);
    }
    s.instanceMatrix.needsUpdate = true;
    if (s.instanceColor) s.instanceColor.needsUpdate = true;

    for (let i = 0; i < RING_COUNT; i++) {
      ringData.z[i] += travel * 0.9;
      if (ringData.z[i] > 0) ringData.z[i] -= depth;
      ringData.spin[i] += dt * 0.15;
      tmpObject.position.set(0, 0, ringData.z[i]);
      tmpObject.rotation.set(0, 0, ringData.spin[i]);
      tmpObject.scale.setScalar(radius * 1.22);
      tmpObject.updateMatrix();
      g.setMatrixAt(i, tmpObject.matrix);

      const near = 1 + ringData.z[i] / depth;
      const fade = near * near * 0.22 * L.intensity;
      if (isDark) tmpColor.copy(palette.ring).multiplyScalar(fade);
      else tmpColor.copy(palette.bg).lerp(palette.ring, Math.min(1, fade * 2));
      g.setColorAt(i, tmpColor);
    }
    g.instanceMatrix.needsUpdate = true;
    if (g.instanceColor) g.instanceColor.needsUpdate = true;

    // Slow barrel roll that tightens with speed — reads as travel, not spin.
    L.roll += dt * (0.02 + L.speed * 0.012);
    state.camera.rotation.z = L.roll;
  });

  const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      {/* Opaque theme background: additive blending on a transparent canvas would write alpha and show dark seams. */}
      <color attach="background" args={[background]} />
      <instancedMesh key={`s-${count}`} ref={streaks} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} blending={blending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, RING_COUNT]} frustumCulled={false}>
        <ringGeometry args={[1, 1.004, 96, 1, 0, Math.PI * 1.35]} />
        <meshBasicMaterial transparent depthWrite={false} blending={blending} toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

/**
 * Warp Tunnel — an instanced WebGL streak field that reads as travelling through
 * a data conduit. Colours follow the shadcn theme tokens; speed and intensity are
 * targets that the scene eases toward, so they can be driven by coarse state changes.
 */
export function WarpTunnel({
  speed = 1,
  intensity = 1,
  count,
  radius = 3,
  depth = 60,
  paused = false,
  colors,
  onReady,
  className,
  'aria-label': ariaLabel,
}: WarpTunnelProps) {
  const reduced = usePrefersReducedMotion();
  const theme = useShadcnTheme();
  const resolvedCount = useMemo(() => count ?? autoCount(), [count]);

  const resolvedColors = useMemo<WarpTunnelColors>(() => {
    const primary = colors?.primary ?? theme.colors.primary;
    const highlight =
      colors?.highlight ??
      '#' + new THREE.Color(primary).lerp(new THREE.Color(theme.isDark ? '#ffffff' : '#000000'), 0.35).getHexString();
    return { primary, accent: colors?.accent ?? theme.colors.accent, highlight };
  }, [colors?.primary, colors?.accent, colors?.highlight, theme]);

  return (
    <SceneContainer
      className={cn('pointer-events-none', className)}
      paused={paused}
      still={reduced}
      onReady={onReady}
      aria-label={ariaLabel}
      fallback={
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 50%, ${resolvedColors.primary}33, transparent 60%)` }}
        />
      }
    >
      <TunnelScene
        count={resolvedCount}
        radius={radius}
        depth={depth}
        speed={reduced ? 0 : speed}
        intensity={intensity}
        still={reduced}
        isDark={theme.isDark}
        background={theme.colors.background}
        colors={resolvedColors}
      />
    </SceneContainer>
  );
}

export default WarpTunnel;
