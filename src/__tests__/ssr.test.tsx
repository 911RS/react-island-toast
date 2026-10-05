// @vitest-environment node
import { renderToString } from 'react-dom/server';

it('imports and renders on the server without a DOM', async () => {
  const mod = await import('../index');
  expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
  expect(renderToString(<mod.IslandHost />)).toBe('');
});
