import { Canvas } from '@react-three/fiber';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SceneContainerProps {
  children: ReactNode;
  className?: string;
  /** Stop rendering entirely (e.g. while hidden behind other UI). */
  paused?: boolean;
  /** Render only on demand instead of every frame (used for reduced motion). */
  still?: boolean;
  /** Camera field of view in degrees. */
  fov?: number;
  /** Rendered when WebGL is unavailable. */
  fallback?: ReactNode;
  /** Fires once the first frame has been drawn (or immediately if WebGL is unavailable). */
  onReady?: () => void;
  'aria-label'?: string;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    (ctx as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!ctx;
  } catch {
    return false;
  }
}

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

/**
 * Full-bleed R3F canvas with sane defaults for decorative scenes:
 * device-aware DPR, transparent background, pauses while the tab is hidden,
 * and (via R3F's unmount) disposes the scene and releases the WebGL context,
 * so repeated mounts never leak.
 */
export function SceneContainer({
  children,
  className,
  paused = false,
  still = false,
  fov = 70,
  fallback = null,
  onReady,
  'aria-label': ariaLabel,
}: SceneContainerProps) {
  const [supported] = useState(detectWebGL);
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!supported) onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once
  }, [supported]);

  const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
  const dpr: [number, number] = isSmall ? [1, 1.25] : [1, 1.5];

  if (!supported) return <div className={cn('absolute inset-0', className)}>{fallback}</div>;

  const frameloop = paused || !visible ? 'never' : still ? 'demand' : 'always';

  return (
    <div className={cn('absolute inset-0', className)} role="img" aria-label={ariaLabel} aria-hidden={ariaLabel ? undefined : true}>
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        camera={{ position: [0, 0, 0], fov, near: 0.1, far: 200 }}
        gl={{ antialias: !isSmall, alpha: true, powerPreference: 'high-performance', stencil: false, depth: false }}
        onCreated={state => {
          state.gl.setClearColor(0x000000, 0);
          if (onReady) requestAnimationFrame(() => onReady());
        }}
        style={{ pointerEvents: 'none' }}
      >
        {children}
      </Canvas>
    </div>
  );
}
