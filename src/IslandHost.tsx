import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { setAnnouncer } from './api';
import { resolveMotion, resolveTheme } from './config';
import { useMedia } from './dom';
import { Island } from './Island';
import { useIslandConfig } from './IslandProvider';
import { store } from './store';

const getLive = () => store.get();
const getNull = () => null;
const hidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};
const canPopover = () =>
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/**
 * Where the island draws. Mount one, anywhere in the app. It sits in the browser's top layer,
 * above dialogs; when several are mounted, the newest one draws.
 */
export function IslandHost() {
  const config = useIslandConfig();
  const [mounted, setMounted] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [hostId, setHostId] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const prefersDark = useMedia('(prefers-color-scheme: dark)');
  const entry = useSyncExternalStore(store.subscribe, getLive, getNull);
  const layer = useRef<HTMLDivElement>(null);
  const polite = useRef<HTMLDivElement>(null);
  const assertive = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const host = store.registerHost();
    setHostId(host.id);
    const sync = () => setIsTop(store.topHost() === host.id);
    const off = store.subscribeHosts(sync);
    sync();
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => {
      off();
      host.unregister();
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (!isTop) return;
    setAnnouncer((text, loud) => {
      const el = loud ? assertive.current : polite.current;
      if (!el) return;
      // cleared first, so the same text is read again
      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = text;
      });
    });
    return () => setAnnouncer(null);
  }, [isTop]);

  // each new message moves the layer to the top of the top layer (above a dialog opened since)
  const id = entry?.message.id;
  useLayoutEffect(() => {
    const el = layer.current;
    if (!el || !canPopover() || id === undefined) return;
    try {
      if (el.matches(':popover-open')) el.hidePopover();
      el.showPopover();
    } catch {}
  }, [id, mounted, isTop]);

  if (!mounted || !isTop || hostId === null) return null;
  const dark = config.colorScheme === 'auto' ? prefersDark : config.colorScheme === 'dark';
  const edge = `calc(env(safe-area-inset-${config.position === 'top' ? 'top' : 'bottom'}, 0px) + ${6 + config.offset}px)`;

  return createPortal(
    <>
      <div
        ref={layer}
        {...(canPopover() ? { popover: 'manual' } : {})}
        style={{
          position: 'fixed',
          inset: 'auto',
          left: 0,
          right: 0,
          [config.position === 'top' ? 'top' : 'bottom']: edge,
          width: '100%',
          margin: 0,
          padding: 0,
          border: 0,
          background: 'none',
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2147483000,
        }}
      >
        {entry && width > 0 && (
          <Island
            key={`${entry.message.id}-${hostId}`}
            entry={entry}
            resume={entry.opened}
            theme={resolveTheme(config, entry.message.type, dark, entry.message.theme)}
            motion={resolveMotion(config, {
              ...entry.message.motion,
              ...(entry.message.hero === undefined ? {} : { hero: entry.message.hero }),
            })}
            config={config}
            hostWidth={width}
            onGone={store.finish}
          />
        )}
      </div>
      <div ref={polite} role="status" aria-live="polite" style={hidden} />
      <div ref={assertive} role="alert" aria-live="assertive" style={hidden} />
    </>,
    document.body
  );
}
