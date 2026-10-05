import { StrictMode, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  IslandHost,
  IslandProvider,
  island,
  type IslandConfig,
  type PresetName,
  type QueueMode,
} from 'react-island-toast';

interface Settings {
  preset?: PresetName;
  queue: QueueMode;
  position: 'top' | 'bottom';
  tap: boolean;
  swipe: boolean;
  rtl: boolean;
  look: 'dark' | 'light';
  accent?: string;
  fonts: boolean;
}
const DEFAULTS: Settings = { queue: 'replace-latest', position: 'top', tap: true, swipe: true, rtl: false, look: 'dark', fonts: false };

const LIGHT = { background: '#FFFFFF', border: 'rgba(0,0,0,0.08)', title: '#111114', body: 'rgba(17,17,20,0.6)', actionText: '#FFFFFF' };
const FONTS = {
  fontFamily: "'Space Grotesk', sans-serif",
  arabicFontFamily: "'Cairo', sans-serif",
};

const toConfig = (s: Settings): Partial<IslandConfig> => ({
  preset: s.preset,
  queue: s.queue,
  position: s.position,
  tapToDismiss: s.tap,
  swipeToDismiss: s.swipe,
  direction: s.rtl ? 'rtl' : undefined,
  theme: { ...(s.look === 'light' ? LIGHT : {}), ...(s.accent ? { accent: s.accent } : {}), ...(s.fonts ? FONTS : {}) },
  types: { upload: { light: { accent: '#BF5AF2' } } },
});

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const emoji = (c: string) => ({ size }: { size: number }) => <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{c}</span>;
const glyph = (c: string) => ({ size, color }: { size: number; color: string }) => (
  <span style={{ fontSize: size * 0.9, lineHeight: 1, color }}>{c}</span>
);
const Undo = glyph('↶');
const Up = glyph('↑');

function Card({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{hint}</p>
      {children}
    </section>
  );
}
const B = ({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) => (
  <button className={`b${on ? ' on' : ''}`} onClick={onClick}>
    {children}
  </button>
);

function App() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const set = (p: Partial<Settings>) => setS((o) => ({ ...o, ...p }));
  const config = useMemo(() => toConfig(s), [s]);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const demo = new URLSearchParams(location.search).get('demo');
    if (!demo) return;
    const steps: [number, () => void][] =
      demo === 'hero'
        ? [[500, () => island.success('Order shipped', { body: 'Arrives Friday' })]]
        : [
            [600, () => island.success('Order shipped', { body: 'Arrives Friday' })],
            [4200, () => island.error('Payment failed', { body: 'Card declined' })],
            [7800, () => island.info('New message', { body: 'From Sam: running late' })],
            [11400, () => island.show({ type: 'upload', title: 'Photo uploaded', body: '3.2 MB', icon: Up })],
            [15000, () => island.info('Message archived', { action: { label: 'Undo', icon: Undo, onPress: () => {} } })],
            [20600, () => void island.promise(wait(2400).then(() => 'clip.mp4'), { loading: 'Uploading video', success: (v) => ({ title: 'Video uploaded', body: v }), error: 'Upload failed' })],
            [26400, () => set({ look: 'light' })],
            [26600, () => island.success('Light island', { body: 'Any colors you want' })],
            [30200, () => set({ look: 'dark', fonts: true })],
            [30400, () => island.success('تم حفظ الملف', { body: 'report-2026.pdf · 2 MB' })],
            [34000, () => set({ fonts: false, preset: 'bouncy' })],
            [34200, () => island.success('Bouncy preset', { body: 'Springier motion' })],
            [37800, () => set({ preset: undefined })],
          ];
    const t = steps.map(([at, run]) => setTimeout(run, at));
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <IslandProvider config={config}>
      <main className="wrap">
        <div className="kicker">React · zero dependencies</div>
        <h1>
          Toasts that open like the <span>Dynamic Island</span>
        </h1>
        <p className="lead">A big icon pops, then morphs into the message. Click any button below; the island opens at the top of this page.</p>
        <div className="cmd">
          <b>$</b> npm i react-island-toast
        </div>

        <div className="grid">
          <Card title="Types" hint="Built-in and your own">
            <div className="btns">
              <B onClick={() => island.success('Order shipped', { body: 'Arrives Friday' })}>Success</B>
              <B onClick={() => island.error('Payment failed', { body: 'Card declined' })}>Error</B>
              <B onClick={() => island.info('New message', { body: 'From Sam: running late' })}>Info</B>
              <B onClick={() => island.show({ type: 'upload', title: 'Photo uploaded', body: '3.2 MB', icon: Up })}>Custom type</B>
              <B onClick={() => island.info('Your weekly summary is ready with 48 new orders, 3 refunds and 12 reviews to answer', { body: 'Open the full report with every detail of the week that just ended' })}>Long text</B>
            </div>
          </Card>

          <Card title="Content" hint="Icons, actions, promises, updates">
            <div className="btns">
              <B onClick={() => island.success('Table booked', { body: 'Friday, 8 pm', icon: emoji('🍽️') })}>Own icon</B>
              <B onClick={() => island.info('Message archived', { action: { label: 'Undo', icon: Undo, onPress: () => island.success('Message restored') } })}>Undo</B>
              <B onClick={() => island.success('Invoice sent', { action: { label: 'View', onPress: () => island.info('Opening invoice') } })}>Text action</B>
              <B onClick={() => void island.promise(wait(2200).then(() => 'clip.mp4'), { loading: 'Uploading video', success: (v) => ({ title: 'Video uploaded', body: v }), error: 'Upload failed' })}>Promise</B>
              <B onClick={() => island.promise(wait(2200).then(() => Promise.reject(new Error('No connection'))), { loading: 'Sending payment', success: 'Payment sent', error: (e) => ({ title: 'Payment failed', body: (e as Error).message }) }).catch(() => {})}>Promise fails</B>
              <B onClick={() => { const id = island.info('Looking for a driver', { duration: 4000 }); setTimeout(() => island.update(id, { type: 'success', title: 'Driver found', body: 'Alex, 4 min away' }), 2600); }}>Update</B>
              <B onClick={() => island.info('Reminder set', { body: 'Tomorrow, 9:00', hero: false })}>No big icon</B>
            </div>
          </Card>

          <Card title="Motion" hint="Presets, one line">
            <div className="btns">
              {(['default', 'snappy', 'calm', 'bouncy', 'minimal'] as const).map((p) => (
                <B key={p} on={(s.preset ?? 'default') === p} onClick={() => { set({ preset: p === 'default' ? undefined : p }); setTimeout(() => island.success('Order shipped', { body: `${p} preset` }), 50); }}>
                  {p}
                </B>
              ))}
            </div>
          </Card>

          <Card title="Look" hint="Colors, fonts, light and dark">
            <div className="btns">
              <B on={s.look === 'dark'} onClick={() => set({ look: 'dark' })}>Dark</B>
              <B on={s.look === 'light'} onClick={() => set({ look: 'light' })}>Light</B>
              <B on={!s.accent} onClick={() => set({ accent: undefined })}>Per type</B>
              <B on={s.accent === '#FF9F0A'} onClick={() => set({ accent: '#FF9F0A' })}>Orange</B>
              <B on={s.accent === '#FF375F'} onClick={() => set({ accent: '#FF375F' })}>Pink</B>
              <B on={s.fonts} onClick={() => set({ fonts: !s.fonts })}>Space Grotesk + Cairo</B>
            </div>
            <div className="label">Try it</div>
            <div className="btns">
              <B onClick={() => island.success('Profile saved', { body: 'Visible to your team' })}>Latin</B>
              <B onClick={() => island.success('تم حفظ الملف', { body: 'report-2026.pdf · 2 MB' })}>Arabic + Latin</B>
            </div>
          </Card>

          <Card title="Behavior" hint="Queue, position, gestures, RTL">
            <div className="btns">
              {(['replace-latest', 'queue-all', 'replace-now'] as const).map((q) => (
                <B key={q} on={s.queue === q} onClick={() => set({ queue: q })}>{q}</B>
              ))}
              <B onClick={() => { island.success('Order 1 shipped'); island.success('Order 2 shipped'); island.success('Order 3 shipped'); }}>Send 3</B>
            </div>
            <div className="label">Place and gestures</div>
            <div className="btns">
              <B on={s.position === 'top'} onClick={() => set({ position: 'top' })}>Top</B>
              <B on={s.position === 'bottom'} onClick={() => set({ position: 'bottom' })}>Bottom</B>
              <B on={s.tap} onClick={() => set({ tap: !s.tap })}>Click to close</B>
              <B on={s.swipe} onClick={() => set({ swipe: !s.swipe })}>Swipe to close</B>
              <B on={s.rtl} onClick={() => set({ rtl: !s.rtl })}>RTL</B>
            </div>
          </Card>

          <Card title="Above dialogs" hint="Stays on top of a modal <dialog>">
            <div className="btns">
              <B onClick={() => dialog.current?.showModal()}>Open a dialog</B>
            </div>
          </Card>
        </div>
      </main>

      <dialog ref={dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <h3>Checkout</h3>
        <p>The island opens above this dialog. Press Escape to close the island, then again for the dialog.</p>
        <div className="btns">
          <B onClick={() => island.success('Coupon applied', { body: '−10 %' })}>Show a message</B>
          <B onClick={() => dialog.current?.close()}>Close</B>
        </div>
      </dialog>
      <IslandHost />
    </IslandProvider>
  );
}

// ?zoom=2 draws the page twice as large (sharper screen recordings)
const zoom = new URLSearchParams(location.search).get('zoom');
if (zoom) document.documentElement.style.setProperty('zoom', zoom);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
