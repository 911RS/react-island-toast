<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/banner.png" alt="react-island-toast: toasts that open like the Dynamic Island" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-island-toast"><img src="https://img.shields.io/npm/v/react-island-toast?color=34C759&label=npm" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/gzip-%E2%89%88%207%20kB-34C759" alt="about 7 kB gzipped" />
  <img src="https://img.shields.io/badge/dependencies-0-34C759" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/types-TypeScript-0A84FF" alt="TypeScript" />
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/react-island-toast?color=8E8E93" alt="license" /></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/hero.gif" alt="An island opens on a big tick, then turns into the message" width="540" />
  <br />
  <sub><a href="https://github.com/911RS/react-island-toast/blob/main/media/demo.mp4">▶ Watch the 40-second tour</a></sub>
</p>

<p align="center">
  <b>Building a mobile app?</b> The same island for React Native: <a href="https://github.com/911RS/react-native-island-toast"><b>react-native-island-toast</b></a>
</p>

<br />

```tsx
island.success('Order shipped', { body: 'Arrives Friday' });
```

One line, and a black island grows out of the top of the page, pops a big icon, then turns into your message. When it is done, it folds back and fades away in one smooth motion.

<br />

<img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/showcase.png" alt="Success, error, promise, undo, custom icons, Arabic fonts and light theme islands" width="100%" />

## Highlights

- **Tiny.** About 7 kB gzipped, zero dependencies. Only `react` and `react-dom` as peers.
- **Smooth.** Real springs, played by the browser through the Web Animations API. Every open, morph and close is one continuous motion.
- **On top of everything.** Lives in the browser's top layer, so it shows above `<dialog>` modals.
- **Yours.** Colors, sizes, corners, fonts, timings, curves, icons, `classNames` for Tailwind, slots for every part.
- **Smart queue.** A new message closes the current one smoothly, then opens. Or queue them all, or replace at once.
- **For everyone.** Screen reader live regions, keyboard (Escape closes it), reduced motion, RTL, a separate font for Arabic.
- **Works everywhere.** Vite, Next.js (App Router and server rendering), Remix, any React 18 or 19 app.

## Install

```sh
npm install react-island-toast
```

## Quick start

**1.** Mount the host once, anywhere in your app:

```tsx
import { IslandHost } from 'react-island-toast';

export default function App() {
  return (
    <>
      <Routes />
      <IslandHost />
    </>
  );
}
```

**2.** Show a message from anywhere, even outside React:

```tsx
import { island } from 'react-island-toast';

island.success('Order shipped', { body: 'Arrives Friday' });
island.error('Payment failed', { body: 'Card declined' });
island.info('New message', { body: 'From Sam' });
```

That's it.

### Next.js

The package is marked `'use client'` and renders nothing on the server. Put the host in your root layout:

```tsx
// app/layout.tsx
import { IslandHost } from 'react-island-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <IslandHost />
      </body>
    </html>
  );
}
```

Call `island.success(...)` from any client component.

## Recipes

### Promise

A spinner while it runs, then the result in the same island.

```tsx
island.promise(saveProfile(form), {
  loading: 'Saving',
  success: 'Profile saved',
  error: (e) => ({ title: 'Could not save', body: e.message }),
});
```

It returns your promise, so `await` and `.catch` work as usual.

### Undo

```tsx
island.info('Message archived', {
  action: { label: 'Undo', icon: UndoIcon, onPress: restore },
});
```

The action is a real button, reachable with the keyboard. With an action, the message reads longer (3.5 s instead of 1.6 s).

### Update a message on screen

```tsx
const id = island.info('Looking for a driver', { duration: Infinity });
// later
island.update(id, {
  type: 'success',
  title: 'Driver found',
  body: 'Alex, 4 min away',
  duration: 2000,
});
```

### Your own icons

```tsx
import { Utensils } from 'lucide-react';

island.success('Table booked', {
  icon: ({ size, color }) => <Utensils size={size} color={color} />,
});
```

Any icon set works. `heroIcon` sets a different icon for the big opening.

### Your own types

```tsx
<IslandProvider config={{ types: { upload: { light: { accent: '#BF5AF2' } } } }}>

island.show({ type: 'upload', title: 'Photo uploaded', icon: UploadIcon });
```

### Fonts, including Arabic

Each line picks its font: text with Arabic letters gets the Arabic font, everything else the Latin one. If a web font loads after the island opened, it resizes to fit.

```tsx
<IslandProvider
  config={{
    theme: {
      fontFamily: "'Inter', sans-serif",
      arabicFontFamily: "'Cairo', sans-serif",
    },
  }}
>
```

### Tailwind and class names

```tsx
<IslandProvider config={{ classNames: { island: 'ring-1 ring-white/10', title: 'tracking-tight' } }}>
```

Keys: `island`, `content`, `icon`, `title`, `body`, `action`.

### Your own content

Replace any part with a slot. Slots are components, so they can use hooks.

```tsx
island.show({
  title: 'Storage almost full',
  type: 'error',
  renderContent: ({ theme }) => <StorageBar value={0.92} color={theme.accent} />,
});
```

Slots: `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent`. Each gets `{ message, theme, dismiss }`.

## Configuration

Wrap your app in `IslandProvider` to change the defaults. Every key is optional.

```tsx
<IslandProvider
  config={{
    preset: 'snappy',
    queue: 'replace-latest',
    theme: { radius: 18, accent: '#FF9F0A' },
    darkTheme: { background: '#000' },
  }}
>
  <App />
</IslandProvider>
```

Layers apply in order, each over the one before: library defaults → `theme` → `darkTheme` (in dark mode) → `types[type]` → the call's own `theme`.

**Presets:** `snappy` · `calm` · `bouncy` · `minimal` (no big icon).

<details>
<summary><b>Behavior</b></summary>

| Key | What it does | Default |
| --- | --- | --- |
| `queue` | `'replace-latest'`: the current one closes, the newest waits, older ones are dropped. `'queue-all'`: each one shows in turn. `'replace-now'`: swap at once. | `'replace-latest'` |
| `position` | `'top'` or `'bottom'` | `'top'` |
| `offset` | Extra distance from the edge, in px | `0` |
| `tapToDismiss` | Click the island to close it | `true` |
| `swipeToDismiss` | Drag it toward the edge to close it | `true` |
| `direction` | `'ltr'` or `'rtl'` | the page's |
| `colorScheme` | `'auto'` (follows `prefers-color-scheme`), `'light'` or `'dark'` | `'auto'` |
| `accessibilityHint` | Screen reader hint for clicking the island | `'Dismiss'` |
| `classNames` | `{ island, content, icon, title, body, action }` | none |
| `haptics`, `sound` | `(type) => void`, called for each message | none |
| `onShow`, `onHide` | `(message) => void` | none |

</details>

<details>
<summary><b>Theme</b></summary>

| Key | Default |
| --- | --- |
| `background` | `#0A0A0A` |
| `border` | `rgba(255,255,255,0.10)`, `0.20` in dark mode |
| `title`, `body` | `#FFFFFF`, `rgba(255,255,255,0.72)` |
| `accent` | success `#34C759`, error `#FF453A`, info `#0A84FF`, loading `#FFFFFF` |
| `iconDisc` | the accent at 15 % (needs a `#RGB` or `#RRGGBB` accent, else a neutral disc) |
| `actionBackground`, `actionText` | the accent, `#0A0A0A` |
| `pillWidth`, `pillHeight` | `120`, `36`: the resting size it opens from and folds back to |
| `heroSize`, `heroIconSize`, `iconSize` | `116`, `64`, `20` |
| `maxWidth`, `maxWidthRatio` | `560`, `0.95` of the window width |
| `radius`, `heroRadius` | `22`, `36` |
| `shadow` | any CSS `box-shadow` |
| `fontFamily`, `titleFontFamily` | the system font |
| `arabicFontFamily`, `arabicTitleFontFamily` | the Latin fonts |
| `titleStyle`, `bodyStyle` | any CSS properties |
| `icon`, `heroIcon` | built-in tick, warning sign, info sign, spinner |

</details>

<details>
<summary><b>Motion</b></summary>

| Key | Default |
| --- | --- |
| `hero` | `true` |
| `heroHoldMs` | `900` |
| `readMs`, `readWithActionMs` | `1600`, `3500` |
| `open`, `morph` | `{ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }`, or `{ type: 'timing', duration, cssEasing }` |
| `reducedMotion` | `'system'` (follows `prefers-reduced-motion`), `'always'` or `'never'` |

</details>

<details>
<summary><b>Options for one message</b></summary>

| Option | Type | Default |
| --- | --- | --- |
| `body` | `string` | none |
| `icon` | element, or `({ size, color }) => element` | by type |
| `heroIcon` | same, for the big opening | `icon` |
| `action` | `{ label, onPress, icon? }`; with an `icon`, only the icon shows | none |
| `duration` | reading time in ms; `Infinity` keeps it until dismissed | `1600`, `3500` with an action |
| `hero` | show the big icon first | `true` |
| `theme`, `motion` | partial overrides for this message | none |
| `haptic` | `false` skips the haptics and sound hooks | `true` |
| `onShow`, `onHide` | `() => void` | none |
| `accessibilityLabel` | what screen readers say | title and body |
| slots | `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent` | none |

</details>

## API

| Call | Returns |
| --- | --- |
| `island.success(title, options?)` · `.error` · `.info` | the message id |
| `island.show({ title, type?, ...options })` | the message id |
| `island.promise(promise, { loading, success, error })` | your promise |
| `island.update(id, changes)` | |
| `island.dismiss(id)` · `island.dismissAll()` | |
| `useIsland()` | the same API, plus `current`: the message on screen |
| `<IslandHost />` · `<IslandProvider config>` | |

Unknown ids are ignored, so `dismiss` and `update` are always safe to call.

## Accessibility

- Messages are read by screen readers through live regions: errors right away, the others politely. A promise's result is read too.
- Escape closes the island. Its action is a real, focusable button.
- With `prefers-reduced-motion`, it simply fades in and out.

## Browsers

Chrome, Edge, Firefox and Safari with the Web Animations API and CSS `linear()` easing (2023 and later). On older browsers springs fall back gracefully, and without the popover API the island uses a very high `z-index` instead of the top layer.

## Playground

```sh
git clone https://github.com/911RS/react-island-toast && cd react-island-toast
npm install && npm run playground
```

## Also for React Native

The same island, API and options for iOS and Android: [react-native-island-toast](https://github.com/911RS/react-native-island-toast).

## License

MIT
