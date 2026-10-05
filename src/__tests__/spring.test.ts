import { curve, springEasing } from '../spring';

const points = (easing: string) =>
  easing.slice('linear('.length, -1).split(',').map(Number);

describe('springEasing', () => {
  it('builds a CSS linear() curve from 0 to 1', () => {
    const { easing } = springEasing({ damping: 17, stiffness: 210, mass: 0.9 });
    expect(easing.startsWith('linear(0,')).toBe(true);
    expect(easing.endsWith(',1)')).toBe(true);
  });
  it('lasts until the spring settles', () => {
    const { duration } = springEasing({ damping: 17, stiffness: 210, mass: 0.9 });
    expect(duration).toBeGreaterThan(300);
    expect(duration).toBeLessThan(1500);
  });
  it('never overshoots when overdamped', () => {
    const { easing } = springEasing({ damping: 40, stiffness: 210, mass: 0.9 });
    expect(Math.max(...points(easing))).toBeLessThanOrEqual(1.0001);
  });
  it('overshoots when underdamped', () => {
    const { easing } = springEasing({ damping: 8, stiffness: 210, mass: 0.9 });
    expect(Math.max(...points(easing))).toBeGreaterThan(1);
  });
  it('caps very slow springs at 3 s', () => {
    expect(springEasing({ damping: 1, stiffness: 5, mass: 10 }).duration).toBe(3000);
  });
});

describe('curve', () => {
  it('passes a timing curve through', () => {
    expect(curve({ type: 'timing', duration: 200 }).duration).toBe(200);
    expect(curve({ type: 'timing', duration: 200, cssEasing: 'ease-in' }).easing).toBe('ease-in');
  });
  it('turns a spring into linear()', () => {
    expect(curve({ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }).easing).toMatch(/^linear\(/);
  });
});

describe('older browsers', () => {
  it('falls back to a cubic-bezier when linear() is not supported', () => {
    const original = globalThis.CSS;
    (globalThis as any).CSS = { supports: () => false };
    try {
      expect(curve({ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }).easing).toMatch(/^cubic-bezier/);
    } finally {
      (globalThis as any).CSS = original;
    }
  });
});
