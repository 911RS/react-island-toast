import type { Curve } from './types';

const MAX_MS = 3000;
const POINTS = 40;
const cache = new Map<string, { easing: string; duration: number }>();

/** A spring from 0 to 1 as a CSS linear() easing and the time it takes to settle. */
export function springEasing(c: { damping: number; stiffness: number; mass: number }) {
  const key = `${c.damping}/${c.stiffness}/${c.mass}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let x = 0;
  let v = 0;
  const samples = [0];
  let t = 0;
  // 1 ms steps, semi-implicit Euler
  while (t < MAX_MS) {
    const a = (c.stiffness * (1 - x) - c.damping * v) / c.mass;
    v += a / 1000;
    x += v / 1000;
    t++;
    samples.push(x);
    if (Math.abs(1 - x) < 0.001 && Math.abs(v) < 0.001) break;
  }
  const pts: string[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const s = samples[Math.round((i / POINTS) * (samples.length - 1))] ?? 1;
    pts.push(i === 0 ? '0' : i === POINTS ? '1' : String(Math.round(s * 1e4) / 1e4));
  }
  const out = { easing: `linear(${pts.join(',')})`, duration: t };
  cache.set(key, out);
  return out;
}

export function curve(c: Curve): { easing: string; duration: number } {
  return c.type === 'spring'
    ? springEasing(c)
    : { duration: c.duration, easing: c.cssEasing ?? 'cubic-bezier(.33,1,.68,1)' };
}
