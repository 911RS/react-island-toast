import { act, fireEvent, render, screen } from '@testing-library/react';
import { IslandHost, island } from '../index';
import { resetIds, setGlobalConfig } from '../api';
import { DEFAULT_CONFIG } from '../config';
import { store } from '../store';

// jsdom has no Web Animations API
beforeAll(() => {
  (Element.prototype as any).animate = function () {
    return { cancel() {}, commitStyles() {}, finished: Promise.resolve(), onfinish: null };
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  store.reset();
  resetIds();
  setGlobalConfig(DEFAULT_CONFIG);
});
afterEach(() => vi.useRealTimers());

const flush = async (ms = 0) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

it('shows the title and body', async () => {
  render(<IslandHost />);
  await act(async () => {
    island.success('Order shipped', { body: 'Arrives Friday' });
  });
  await flush(50);
  expect(screen.getAllByText('Order shipped').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Arrives Friday').length).toBeGreaterThan(0);
});

it('announces politely, and errors assertively', async () => {
  render(<IslandHost />);
  await act(async () => {
    island.success('Order shipped', { body: 'Arrives Friday' });
  });
  await flush(50);
  expect(screen.getByRole('status').textContent).toBe('Order shipped. Arrives Friday');
  await act(async () => {
    island.dismissAll();
  });
  await flush(2000);
  await act(async () => {
    island.error('Payment failed');
  });
  await flush(50);
  expect(screen.getByRole('alert').textContent).toBe('Payment failed');
});

it('closes on Escape', async () => {
  render(<IslandHost />);
  await act(async () => {
    island.info('New message');
  });
  await flush(50);
  fireEvent.keyDown(document, { key: 'Escape' });
  await flush(1500);
  expect(store.get()).toBeNull();
});

it('ignores Escape when nothing shows', async () => {
  render(<IslandHost />);
  const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
  document.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(false);
});

it('runs the action once and closes', async () => {
  const onPress = vi.fn();
  render(<IslandHost />);
  await act(async () => {
    island.info('Message archived', { action: { label: 'Undo', onPress } });
  });
  await flush(50);
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await flush(1500);
  expect(store.get()).toBeNull();
});

it('shows a message sent before the host mounted', async () => {
  island.success('Sent early');
  render(<IslandHost />);
  await flush(50);
  expect(screen.getAllByText('Sent early').length).toBeGreaterThan(0);
});

describe('review fixes', () => {
  it('does not capture the pointer when a press starts on the action button', async () => {
    const capture = vi.fn();
    (Element.prototype as any).setPointerCapture = capture;
    render(<IslandHost />);
    await act(async () => {
      island.info('Message archived', { action: { label: 'Undo', onPress: () => {} } });
    });
    await flush(50);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Undo' }), { pointerId: 1, clientY: 20 });
    expect(capture).not.toHaveBeenCalled();
  });

  it('keeps the island open while the pointer is over it', async () => {
    render(<IslandHost />);
    let id = 0;
    await act(async () => {
      id = island.info('Message archived', { action: { label: 'Undo', onPress: () => {} } });
    });
    await flush(50);
    const shell = document.querySelector(`[aria-label="Message archived"]`)!;
    fireEvent.pointerEnter(shell);
    await flush(10000);
    expect(store.get()?.message.id).toBe(id);
    fireEvent.pointerLeave(shell);
    await flush(4000);
    expect(store.get()).toBeNull();
  });

  it('leaves an Escape that something else already handled', async () => {
    render(<IslandHost />);
    await act(async () => {
      island.info('New message');
    });
    await flush(50);
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    ev.preventDefault();
    document.dispatchEvent(ev);
    await flush(1500);
    expect(store.get()?.message.title).toBe('New message');
  });

  it('gives the island no button role when it holds an action', async () => {
    render(<IslandHost />);
    await act(async () => {
      island.info('Message archived', { action: { label: 'Undo', onPress: () => {} } });
    });
    await flush(50);
    expect(document.querySelector('[aria-label="Message archived"]')!.getAttribute('role')).not.toBe('button');
  });

  it('opens inside an open modal dialog so it stays usable', async () => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);
    const orig = document.querySelector.bind(document);
    const spy = vi.spyOn(document, 'querySelector').mockImplementation((sel: string) =>
      sel === 'dialog:modal' ? dialog : orig(sel)
    );
    render(<IslandHost />);
    await act(async () => {
      island.success('Coupon applied');
    });
    await flush(50);
    expect(dialog.querySelector('[aria-label="Coupon applied"]')).not.toBeNull();
    spy.mockRestore();
    dialog.remove();
  });
});
