import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as RPointerEvent,
} from 'react';
import { fontFor } from './config';
import { tween, useMedia } from './dom';
import { defaultIconFor } from './icons';
import { renderIcon } from './renderIcon';
import { curve } from './spring';
import { store, type LiveEntry } from './store';
import type {
  IslandConfig,
  IslandMessage,
  IslandMotion,
  IslandSlots,
  IslandTheme,
  SlotProps,
} from './types';

export interface IslandProps {
  entry: LiveEntry;
  /** Already opened on a host that went away: show it as it is, no opening. */
  resume: boolean;
  theme: IslandTheme;
  motion: IslandMotion;
  config: IslandConfig;
  /** Width of the host; the island is capped to a share of it. */
  hostWidth: number;
  onGone: (id: number) => void;
}

type Size = { w: number; h: number };

const SWIPE_DISTANCE = 24;
const BACK = 'cubic-bezier(.34,1.56,.64,1)';
const BACK_POP = 'cubic-bezier(.34,1.9,.64,1)';
const IN_OUT = 'cubic-bezier(.65,0,.35,1)';
const IN = 'cubic-bezier(.32,0,.67,0)';
const SYSTEM_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const radiusFor = (h: number, theme: IslandTheme) =>
  h > 80 ? theme.heroRadius : Math.min(theme.radius, h / 2);

export function Island({ entry, resume, theme, motion, config, hostWidth, onGone }: IslandProps) {
  const m = entry.message;
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)');
  const reduced =
    motion.reducedMotion === 'always' || (motion.reducedMotion === 'system' && systemReduced);
  const heroOn = motion.hero && !resume && !reduced;
  const maxWidth = Math.min(hostWidth * theme.maxWidthRatio, theme.maxWidth);
  const top = config.position === 'top';

  // The message on screen; a new one (update) is measured first, then swapped in.
  const [shown, setShown] = useState<IslandMessage>(m);
  const [measured, setMeasured] = useState<Size | null>(null);
  const measuring = shown !== m || !measured;

  const shell = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const drag = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const opened = useRef(false);
  /** When the big-icon square starts turning into the message. */
  const morphAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const finish = useCallback(() => {
    m.onHide?.();
    config.onHide?.(m);
    onGone(m.id);
  }, [m, config, onGone]);

  const sizeTo = (s: Size, c: { duration: number; easing: string }) =>
    tween(shell.current, { width: s.w, height: s.h, borderRadius: radiusFor(s.h, theme) }, c.duration, c.easing);

  // Measure the message (first time, and after each update).
  useLayoutEffect(() => {
    if (!measuring || !probe.current) return;
    const r = probe.current.getBoundingClientRect();
    const size = { w: Math.min(maxWidth, Math.ceil(r.width) + 1), h: Math.ceil(r.height) };
    if (opened.current && !closing.current) {
      const resize = () => {
        if (!closing.current) sizeTo(size, curve(motion.morph));
      };
      const wait = morphAt.current - Date.now();
      if (wait > 0) {
        // still on the big icon: let it finish, the content fades in as planned
        later(wait, resize);
      } else {
        tween(body.current, { opacity: 0 }, 0, 'linear');
        resize();
        later(80, () => tween(body.current, { opacity: 1 }, 160, 'ease-out'));
      }
    }
    setShown(m);
    setMeasured(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, measuring]);

  // Opening, once the first size is known.
  useLayoutEffect(() => {
    if (!measured || opened.current || closing.current) return;
    opened.current = true;
    const size = measured;
    const s = shell.current;
    if (resume) {
      // carried over from a host that went away: already open, so no opening at all
      if (entry.closing) {
        onGone(m.id);
        return;
      }
      tween(s, { width: size.w, height: size.h, borderRadius: radiusFor(size.h, theme), opacity: 1, transform: 'scale(1)' }, 0, 'linear');
      tween(body.current, { opacity: 1, transform: 'scale(1)' }, 0, 'linear');
      return;
    }
    let shownAt = 120;
    if (reduced) {
      tween(s, { width: size.w, height: size.h, borderRadius: radiusFor(size.h, theme), transform: 'scale(1)' }, 0, 'linear');
      tween(s, { opacity: 1 }, 200, 'ease-out');
      tween(body.current, { opacity: 1, transform: 'scale(1)' }, 200, 'ease-out');
      shownAt = 200;
    } else if (!heroOn) {
      tween(s, { opacity: 1, transform: 'scale(1)' }, 120, 'ease-out');
      sizeTo(size, curve(motion.open));
      later(120, () => tween(body.current, { opacity: 1, transform: 'scale(1)' }, 160, 'ease-out'));
      shownAt = 280;
    } else {
      // the pill opens into a square, the big icon pops, holds, then the square becomes the message
      const turn = motion.heroHoldMs + 380;
      morphAt.current = Date.now() + turn;
      tween(s, { opacity: 1, transform: 'scale(1)' }, 120, 'ease-out');
      later(60, () => sizeTo({ w: theme.heroSize, h: theme.heroSize }, { duration: 320, easing: BACK }));
      later(160, () => tween(hero.current, { opacity: 1, transform: 'scale(1)' }, 260, BACK_POP));
      later(turn - 40, () => tween(hero.current, { opacity: 0, transform: 'scale(.5)' }, 140, 'ease-in'));
      later(60 + 320 + motion.heroHoldMs, () => sizeTo(size, curve(motion.morph)));
      later(turn + 200, () => tween(body.current, { opacity: 1, transform: 'scale(1)' }, 180, 'ease-out'));
      shownAt = turn + 380;
    }
    store.markOpened(m.id);
    later(shownAt, () => {
      m.onShow?.();
      config.onShow?.(m);
    });
    // the opening runs once per island
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    store.beginClose(m.id);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const s = shell.current;
    if (reduced) {
      tween(body.current, { opacity: 0 }, 200, 'ease-in');
      tween(s, { opacity: 0 }, 200, 'ease-in');
      later(200, finish);
      return;
    }
    // one continuous motion: the content fades while the island draws in, then it keeps shrinking as it fades out
    const { pillWidth: pw, pillHeight: ph } = theme;
    tween(hero.current, { opacity: 0 }, 120, 'ease-out');
    tween(body.current, { opacity: 0 }, 140, 'ease-out');
    later(60, () =>
      tween(s, { width: pw, height: ph, borderRadius: ph / 2 }, 260, IN_OUT)
    );
    later(320, () => tween(s, { width: ph, height: ph * 0.7, borderRadius: (ph * 0.7) / 2 }, 220, IN));
    later(260, () => tween(s, { opacity: 0, transform: 'scale(.8)' }, 280, IN));
    later(540, finish);
  }, [reduced, theme, finish, m.id]);

  useEffect(() => {
    if (!Number.isFinite(entry.until)) return;
    const t = setTimeout(close, Math.max(400, entry.until - Date.now()));
    return () => clearTimeout(t);
  }, [close, entry.until]);

  useEffect(
    () =>
      store.onCloseRequest((id) => {
        if (id === m.id) close();
      }),
    [close, m.id]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  // Swipe toward the edge to close; a drag cancels the click that follows.
  const gesture = useRef<{ y: number; t: number; moved: boolean } | null>(null);
  const setDrag = (y: number, ms = 0) => {
    const d = drag.current;
    if (!d) return;
    d.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.8,.2,1)` : 'none';
    d.style.transform = `translateY(${y}px)`;
  };
  const onPointerDown = (e: RPointerEvent) => {
    if (!config.swipeToDismiss) return;
    gesture.current = { y: e.clientY, t: performance.now(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: RPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dy = e.clientY - g.y;
    if (Math.abs(dy) > 6) g.moved = true;
    const out = top ? dy < 0 : dy > 0;
    setDrag(out ? dy : dy * 0.2);
  };
  const onPointerUp = (e: RPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dy = e.clientY - g.y;
    const dist = top ? -dy : dy;
    const speed = dist / Math.max(1, performance.now() - g.t);
    if (g.moved && (dist > SWIPE_DISTANCE || speed > 0.5)) {
      setDrag(top ? -40 : 40, 200);
      close();
    } else {
      setDrag(0, 260);
    }
    later(0, () => {
      gesture.current = null;
    });
  };
  const onClick = () => {
    if (gesture.current?.moved) return;
    if (config.tapToDismiss) close();
  };

  const cn = config.classNames ?? {};
  const slot = (k: keyof IslandSlots, msg: IslandMessage) => msg[k] ?? config[k];
  const font = (text: string | undefined, role: 'title' | 'body'): CSSProperties => {
    const fontFamily = fontFor(text, theme, role);
    if (!fontFamily) return { fontFamily: SYSTEM_FONT };
    // a dedicated bold file must not be bolded again
    const ownTitleFile =
      role === 'title' &&
      (fontFamily === theme.titleFontFamily || fontFamily === theme.arabicTitleFontFamily);
    return ownTitleFile ? { fontFamily, fontWeight: 400 } : { fontFamily };
  };
  const flip = config.direction === 'rtl';

  const content = (msg: IslandMessage, interactive: boolean) => {
    const props: SlotProps = { message: msg, theme, dismiss: close };
    // slots render as components, so they may use hooks
    const Whole = slot('renderContent', msg);
    if (Whole) return <Whole {...props} />;
    const IconSlot = slot('renderIcon', msg);
    const TitleSlot = slot('renderTitle', msg);
    const BodySlot = slot('renderBody', msg);
    const ActionSlot = slot('renderAction', msg);
    const a = msg.action;
    return (
      <div className={cn.content} style={{ ...st.row, direction: flip ? 'rtl' : undefined }}>
        <div style={st.message}>
          {IconSlot ? (
            <IconSlot {...props} />
          ) : (
            <div className={cn.icon} style={{ ...st.iconDisc, background: theme.iconDisc }}>
              {renderIcon(msg.icon ?? theme.icon ?? defaultIconFor(msg.type), theme.iconSize, theme.accent)}
            </div>
          )}
          <div style={st.texts}>
            {TitleSlot ? (
              <TitleSlot {...props} />
            ) : (
              <div className={cn.title} dir="auto" style={{ ...st.title, color: theme.title, ...font(msg.title, 'title'), ...theme.titleStyle }}>
                {msg.title}
              </div>
            )}
            {BodySlot ? (
              <BodySlot {...props} />
            ) : (
              !!msg.body && (
                <div className={cn.body} dir="auto" style={{ ...st.body, color: theme.body, ...font(msg.body, 'body'), ...theme.bodyStyle }}>
                  {msg.body}
                </div>
              )
            )}
          </div>
        </div>
        {ActionSlot ? (
          <ActionSlot {...props} />
        ) : (
          !!a && (
            <button
              type="button"
              className={cn.action}
              tabIndex={interactive ? 0 : -1}
              aria-label={a.label}
              onClick={
                interactive
                  ? (e) => {
                      e.stopPropagation();
                      a.onPress();
                      close();
                    }
                  : undefined
              }
              style={
                a.icon
                  ? st.actionIcon
                  : { ...st.action, background: theme.actionBackground, color: theme.actionText, ...font(a.label, 'title') }
              }
            >
              {a.icon ? renderIcon(a.icon, 24, theme.accent) : a.label}
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {measuring && (
        <div aria-hidden style={{ ...st.measure, maxWidth }}>
          <div ref={probe} style={{ display: 'inline-block', maxWidth }}>
            {content(m, false)}
          </div>
        </div>
      )}
      <div ref={drag} style={st.drag}>
        <div
          ref={shell}
          role="button"
          tabIndex={-1}
          aria-label={m.accessibilityLabel ?? [m.title, m.body].filter(Boolean).join('. ')}
          aria-description={config.tapToDismiss ? (config.accessibilityHint ?? 'Dismiss') : undefined}
          className={cn.island}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            ...st.island,
            width: theme.pillWidth,
            height: theme.pillHeight,
            borderRadius: theme.pillHeight / 2,
            background: theme.background,
            border: `0.5px solid ${theme.border}`,
            boxShadow: theme.shadow,
          }}
        >
          <div ref={hero} style={st.hero}>
            {renderIcon(m.heroIcon ?? m.icon ?? theme.heroIcon ?? defaultIconFor(m.type), theme.heroIconSize, theme.accent)}
          </div>
          {measured && (
            <div ref={body} style={{ ...st.body0, width: measured.w, height: measured.h }}>
              {content(shown, true)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const st: Record<string, CSSProperties> = {
  measure: { position: 'fixed', left: -10000, top: 0, visibility: 'hidden', pointerEvents: 'none' },
  drag: { pointerEvents: 'auto', touchAction: 'none' },
  island: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transform: 'scale(.8)',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
  },
  hero: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transform: 'scale(.5)',
    pointerEvents: 'none',
  },
  body0: { flex: 'none', opacity: 0, transform: 'scale(.96)' },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: 10, minHeight: 56, boxSizing: 'border-box' },
  message: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1, paddingInlineEnd: 6 },
  texts: { minWidth: 0, flexShrink: 1 },
  iconDisc: { width: 34, height: 34, borderRadius: 17, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: 700, lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  body: { fontSize: 12, lineHeight: '16px', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  action: { flex: 'none', border: 0, borderRadius: 12, padding: '0 14px', minHeight: 36, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' },
  actionIcon: { flex: 'none', width: 36, height: 36, border: 0, background: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};
