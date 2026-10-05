import type { IconSpec, IslandType } from './types.js';

type P = { size: number; color: string };
const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true as const,
});

export const Tick = ({ size, color }: P) => (
  <svg {...svg(size)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Ring = ({ size, color, mark }: P & { mark: '!' | 'i' }) => (
  <svg {...svg(size)}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <path d={mark === '!' ? 'M12 7.5v5.5' : 'M12 10.5v6'} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <circle cx="12" cy={mark === '!' ? 16.3 : 7.6} r="1.3" fill={color} />
  </svg>
);

export const Warning = (p: P) => <Ring {...p} mark="!" />;
export const Info = (p: P) => <Ring {...p} mark="i" />;

export const Spinner = ({ size, color }: P) => (
  <svg {...svg(size)}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity={0.25} strokeWidth={2.5} />
    <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
    </path>
  </svg>
);

export function defaultIconFor(type: IslandType): IconSpec {
  if (type === 'success') return Tick;
  if (type === 'error') return Warning;
  if (type === 'loading') return Spinner;
  return Info;
}
