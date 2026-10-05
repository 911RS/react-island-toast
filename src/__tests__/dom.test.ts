import { tween } from '../dom';

// a minimal Web Animations stand-in that records what was cancelled
function fakeEl() {
  const el = document.createElement('div');
  const running: { props: string[]; cancelled: boolean; committed: boolean }[] = [];
  (el as any).animate = (frames: Keyframe[]) => {
    const props = Object.keys(frames[1] ?? {});
    const a = {
      props,
      cancelled: false,
      committed: false,
      effect: { getKeyframes: () => frames },
      cancel() {
        a.cancelled = true;
      },
      commitStyles() {
        a.committed = true;
      },
    };
    running.push(a);
    return a;
  };
  (el as any).getAnimations = () => running.filter((a) => !a.cancelled);
  return { el, running };
}

it('leaves animations on other properties running', () => {
  const { el, running } = fakeEl();
  tween(el, { opacity: 1 }, 120, 'ease-out');
  tween(el, { width: 200, height: 56 }, 300, 'ease-out');
  expect(running[0]!.cancelled).toBe(false);
  expect(running[0]!.committed).toBe(false);
});

it('takes over an animation on the same property from where it is', () => {
  const { el, running } = fakeEl();
  tween(el, { width: 116 }, 320, 'ease-out');
  tween(el, { width: 200, height: 56 }, 300, 'ease-out');
  expect(running[0]!.committed).toBe(true);
  expect(running[0]!.cancelled).toBe(true);
});
