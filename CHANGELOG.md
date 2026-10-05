# Changelog

## 0.1.0

First release.

- `island.success`, `error`, `info`, `show`, `promise`, `update`, `dismiss`, `dismissAll`
- Big-icon opening that morphs into the message pill, one continuous close (Web Animations API, springs as CSS `linear()`)
- Browser top layer: shows above `<dialog>` modals
- Layered config, per-type themes (light and dark), presets, slots, `classNames`
- Custom fonts per script (Latin and Arabic); re-measures when web fonts load
- Queue modes, top or bottom, click, swipe and Escape to dismiss, RTL
- Live regions for screen readers, `prefers-reduced-motion`, `prefers-color-scheme`
- Server rendering safe (`'use client'`)
