import { useEffect, useState } from 'react';

/** Follows a media query; false on the server. */
export function useMedia(query: string): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    setOn(mq.matches);
    const l = () => setOn(mq.matches);
    mq.addEventListener('change', l);
    return () => mq.removeEventListener('change', l);
  }, [query]);
  return on;
}

type Props = Record<string, string | number>;

/** Animates an element from where it is now to `to`, and leaves it there. */
export function tween(el: HTMLElement | null, to: Props, duration: number, easing: string) {
  if (!el) return;
  const cs = getComputedStyle(el);
  const from: Props = {};
  for (const k of Object.keys(to)) from[k] = cs.getPropertyValue(toKebab(k)) || (el.style as any)[k] || '';
  // only take over animations on the same properties; the others keep running
  const keys = Object.keys(to);
  el.getAnimations?.().forEach((a) => {
    const frames = (a.effect as KeyframeEffect | null)?.getKeyframes?.() ?? [];
    if (!frames.some((f) => keys.some((k) => k in f))) return;
    try {
      a.commitStyles();
    } catch {}
    a.cancel();
  });
  Object.assign(el.style, toStyle(to));
  if (!el.animate || duration <= 0) return;
  el.animate([toStyle(from), toStyle(to)] as Keyframe[], { duration, easing });
}

const toKebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const px = new Set(['width', 'height', 'borderRadius']);
const toStyle = (p: Props) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) out[k] = typeof v === 'number' && px.has(k) ? `${v}px` : String(v);
  return out;
};
