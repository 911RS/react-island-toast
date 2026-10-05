<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/banner.png" alt="react-island-toast: toasts that open like the Dynamic Island" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-island-toast"><img src="https://img.shields.io/npm/v/react-island-toast?color=34C759&label=npm&cacheSeconds=3600" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/gzip-%E2%89%88%208%20kB-34C759" alt="about 8 kB gzipped" />
  <img src="https://img.shields.io/badge/dependencies-0-34C759" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/types-TypeScript-0A84FF" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-8E8E93" alt="MIT license" />
</p>

<p align="center">
  <a href="https://911rs.github.io/react-island-toast/"><b>Live demo</b></a> ·
  <a href="#get-started">Get started</a> ·
  <a href="#examples">Examples</a> ·
  <a href="#customize">Customize</a> ·
  <a href="#api">API</a> ·
  <a href="https://github.com/911RS/react-native-island-toast">React Native version</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/island.gif" alt="An island opens on a big tick, then turns into the message" width="520" />
</p>

## Why

- **One line.** `island.success('Saved')`, from anywhere, even outside React.
- **Tiny.** About 8 kB gzipped. Zero dependencies.
- **Smooth.** Real springs played by the browser. Open, morph and close are one continuous motion.
- **Always on top.** Above your page and inside open `<dialog>` modals, still clickable.
- **Yours.** Every color, size, font, timing and part can be changed.

## Get started

```sh
npm install react-island-toast
```

Mount the host once, then call `island` from anywhere:

```tsx
import { IslandHost, island } from 'react-island-toast';

export default function App() {
  return (
    <>
      <Routes />
      <IslandHost />
    </>
  );
}

island.success('Order shipped', { body: 'Arrives Friday' });
island.error('Payment failed', { body: 'Card declined' });
island.info('New message', { body: 'From Sam' });
```

Works with Vite, Next.js (App Router and server rendering), Remix and any React 18 or 19 app.

## Examples

<img src="https://raw.githubusercontent.com/911RS/react-island-toast/main/media/showcase.png" alt="Success, error, promise, undo, custom icons, Arabic fonts and light theme islands" width="100%" />

<details>
<summary><b>Promise</b>: a spinner, then the result in the same island</summary>

```tsx
island.promise(saveProfile(form), {
  loading: 'Saving',
  success: 'Profile saved',
  error: (e) => ({ title: 'Could not save', body: e.message }),
});
```

It returns your promise, so `await` and `.catch` work as usual.

</details>

<details>
<summary><b>Undo</b>: an action button that reads longer</summary>

```tsx
island.info('Message archived', {
  action: { label: 'Undo', icon: UndoIcon, onPress: restore },
});
```

With an action, the message reads 3.5 s instead of 1.6 s, and it waits while the pointer or the focus is on it.

</details>

<details>
<summary><b>Update</b>: change a message that is on screen</summary>

```tsx
const id = island.info('Looking for a driver', { duration: Infinity });

island.update(id, {
  type: 'success',
  title: 'Driver found',
  body: 'Alex, 4 min away',
  duration: 2000,
});
```

</details>

<details>
<summary><b>Icons</b>: bring any icon set</summary>

```tsx
import { Utensils } from 'lucide-react';

island.success('Table booked', {
  icon: ({ size, color }) => <Utensils size={size} color={color} />,
});
```

`heroIcon` sets a different icon for the big opening.

</details>

<details>
<summary><b>Your own types</b>: register a type with its own colors</summary>

```tsx
<IslandProvider config={{ types: { upload: { light: { accent: '#BF5AF2' } } } }}>

island.show({ type: 'upload', title: 'Photo uploaded', icon: UploadIcon });
```

</details>

<details>
<summary><b>Fonts</b>: one for Latin, one for Arabic</summary>

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

Each line picks its font by script. If a web font loads after the island opened, it resizes to fit.

</details>

<details>
<summary><b>Tailwind</b>: add class names to any part</summary>

```tsx
<IslandProvider config={{ classNames: { island: 'ring-1 ring-white/10', title: 'tracking-tight' } }}>
```

Keys: `island`, `content`, `icon`, `title`, `body`, `action`.

</details>

<details>
<summary><b>Custom content</b>: replace any part with your own component</summary>

```tsx
island.show({
  title: 'Storage almost full',
  type: 'error',
  renderContent: ({ theme }) => <StorageBar value={0.92} color={theme.accent} />,
});
```

Slots: `renderIcon`, `renderTitle`, `renderBody`, `renderAction`, `renderContent`. Each gets `{ message, theme, dismiss }` and can use hooks.

</details>

<details>
<summary><b>Next.js</b>: put the host in the root layout</summary>

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

The package is marked `'use client'` and renders nothing on the server. Call `island` from any client component.

</details>

## Customize

Wrap your app in `IslandProvider` and keep the host inside it. Every key is optional.

```tsx
<IslandProvider
  config={{
    preset: 'snappy',
    position: 'top',
    theme: { radius: 18, accent: '#FF9F0A' },
    darkTheme: { background: '#000' },
  }}
>
  <App />
  <IslandHost />
</IslandProvider>
```

**Presets:** `snappy` · `calm` · `bouncy` · `minimal` (no big icon).
Settings apply in layers: defaults → `theme` → `darkTheme` → `types[type]` → the message's own `theme`.

<details>
<summary><b>Behavior options</b></summary>

| Key | What it does | Default |
| --- | --- | --- |
| `queue` | `'replace-latest'`: the current one closes, the newest waits. `'queue-all'`: each in turn. `'replace-now'`: swap at once. | `'replace-latest'` |
| `position` | `'top'` or `'bottom'` | `'top'` |
| `offset` | Extra distance from the edge, in px | `0` |
| `tapToDismiss` | Click the island to close it | `true` |
| `swipeToDismiss` | Drag it toward the edge to close it | `true` |
| `direction` | `'ltr'` or `'rtl'` | the page's |
| `colorScheme` | `'auto'` (follows the system), `'light'` or `'dark'` | `'auto'` |
| `accessibilityHint` | Screen reader hint for clicking the island | `'Dismiss'` |
| `classNames` | `{ island, content, icon, title, body, action }` | none |
| `haptics`, `sound` | `(type) => void`, called for each message | none |
| `onShow`, `onHide` | `(message) => void` | none |

</details>

<details>
<summary><b>Theme options</b></summary>

| Key | Default |
| --- | --- |
| `background` | `#0A0A0A` |
| `border` | `rgba(255,255,255,0.10)`, `0.20` in dark mode |
| `title`, `body` | `#FFFFFF`, `rgba(255,255,255,0.72)` |
| `accent` | success `#34C759`, error `#FF453A`, info `#0A84FF`, loading `#FFFFFF` |
| `iconDisc` | the accent at 15 % |
| `actionBackground`, `actionText` | the accent, `#0A0A0A` |
| `pillWidth`, `pillHeight` | `120`, `36` |
| `heroSize`, `heroIconSize`, `iconSize` | `116`, `64`, `20` |
| `maxWidth`, `maxWidthRatio` | `560`, `0.95` of the window |
| `radius`, `heroRadius` | `22`, `36` |
| `shadow` | any CSS `box-shadow` |
| `fontFamily`, `titleFontFamily`, `arabicFontFamily`, `arabicTitleFontFamily` | the system font |
| `titleStyle`, `bodyStyle` | any CSS properties |
| `icon`, `heroIcon` | built-in tick, warning sign, info sign, spinner |

</details>

<details>
<summary><b>Motion options</b></summary>

| Key | Default |
| --- | --- |
| `hero` | `true` |
| `heroHoldMs` | `900` |
| `readMs`, `readWithActionMs` | `1600`, `3500` |
| `open`, `morph` | `{ type: 'spring', damping: 17, stiffness: 210, mass: 0.9 }` or `{ type: 'timing', duration, cssEasing }` |
| `reducedMotion` | `'system'`, `'always'` or `'never'` |

</details>

<details>
<summary><b>Options for one message</b></summary>

| Option | What it does | Default |
| --- | --- | --- |
| `body` | Second line | none |
| `icon`, `heroIcon` | Element, or `({ size, color }) => element` | by type |
| `action` | `{ label, onPress, icon? }` | none |
| `duration` | Reading time in ms; `Infinity` keeps it | `1600`, `3500` with an action |
| `hero` | Show the big icon first | `true` |
| `theme`, `motion` | Overrides for this message | none |
| `haptic` | `false` skips the haptics and sound hooks | `true` |
| `onShow`, `onHide` | Callbacks | none |
| `accessibilityLabel` | What screen readers say | title and body |
| `renderIcon` … `renderContent` | Slots | none |

</details>

## API

| Call | Returns |
| --- | --- |
| `island.success(title, options?)` · `.error` · `.info` | the message id |
| `island.show({ title, type?, ...options })` | the message id |
| `island.promise(promise, { loading, success, error })` | your promise |
| `island.update(id, changes)` | |
| `island.dismiss(id)` · `island.dismissAll()` | |
| `useIsland()` | the same API, plus `current` |
| `<IslandHost />` · `<IslandProvider config>` | |

Unknown ids are ignored, so `dismiss` and `update` are always safe.

## Accessibility & browsers

- Screen readers hear each message through live regions; errors right away, the others politely.
- Escape closes the island. The action is a real button, and the island waits while it is hovered or focused.
- `prefers-reduced-motion` turns the motion into a simple fade.
- Chrome, Edge, Firefox and Safari from 2023. Older browsers get a plain ease-out and a high `z-index` instead of the top layer.
- ESM only. Jest setups that do not transform `node_modules` need it in `transformIgnorePatterns`.

## Related

- **[react-native-island-toast](https://github.com/911RS/react-native-island-toast)**: the same island for iOS and Android.
- **[Live demo](https://911rs.github.io/react-island-toast/)**, or run it locally: `npm install && npm run playground`.

## License

MIT
