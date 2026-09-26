import { useEffect, useState } from 'react';

export interface ShadcnThemeColors {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
  muted: string;
  border: string;
}

export interface ShadcnTheme {
  isDark: boolean;
  colors: ShadcnThemeColors;
}

const TOKENS: Record<keyof ShadcnThemeColors, string> = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  accent: '--accent',
  muted: '--muted-foreground',
  border: '--border',
};

const FALLBACK: ShadcnThemeColors = {
  background: '#0c0b09',
  foreground: '#e9e8e6',
  primary: '#ff5f1f',
  accent: '#e8dfd2',
  muted: '#a3a2a0',
  border: '#2a2927',
};

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

let probe: CanvasRenderingContext2D | null = null;

/**
 * Resolve a shadcn token value to a hex string Three.js can parse.
 * Handles the Tailwind v3 HSL-triplet form ("160 84% 39%") and falls back to the
 * browser's own colour parser for anything else (hex, rgb(), hsl(), named colours).
 */
function toHex(raw: string, fallback: string): string {
  const value = raw.trim();
  if (!value) return fallback;

  const triplet = value.match(/^(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%$/);
  if (triplet) return hslToHex(parseFloat(triplet[1]), parseFloat(triplet[2]), parseFloat(triplet[3]));

  if (typeof document === 'undefined') return fallback;
  probe ??= document.createElement('canvas').getContext('2d');
  if (!probe) return fallback;
  probe.fillStyle = fallback;
  probe.fillStyle = value;
  const parsed = String(probe.fillStyle);
  return parsed.startsWith('#') ? parsed : fallback;
}

function readTheme(): ShadcnTheme {
  if (typeof document === 'undefined') return { isDark: true, colors: FALLBACK };
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const colors = { ...FALLBACK };
  (Object.keys(TOKENS) as (keyof ShadcnThemeColors)[]).forEach(key => {
    colors[key] = toHex(style.getPropertyValue(TOKENS[key]), FALLBACK[key]);
  });
  const isDark =
    root.classList.contains('dark') ||
    root.dataset.theme === 'dark' ||
    (!root.classList.contains('light') && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return { isDark, colors };
}

/**
 * Reads the active shadcn/ui CSS variables and re-reads them whenever the theme
 * changes (class / data-theme / style on <html>, or the OS colour scheme).
 */
export function useShadcnTheme(): ShadcnTheme {
  const [theme, setTheme] = useState<ShadcnTheme>(readTheme);

  useEffect(() => {
    const update = () =>
      setTheme(prev => {
        const next = readTheme();
        const same =
          prev.isDark === next.isDark &&
          (Object.keys(next.colors) as (keyof ShadcnThemeColors)[]).every(k => prev.colors[k] === next.colors[k]);
        return same ? prev : next;
      });

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    mql?.addEventListener('change', update);
    return () => {
      observer.disconnect();
      mql?.removeEventListener('change', update);
    };
  }, []);

  return theme;
}
