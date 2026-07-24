# Tailwind Migration — Done

Both `admin/` and `user/` are migrated. This document is now a record of what was
done and the rules that make the result work; the "Constraints" section is still
required reading before touching styles, because two of those constraints fail
*silently*.

---

## 1. Result

**4,169 → 1,198 lines of component SCSS (−71%)**, plus **148 → 80 lines** of inline
`styles: [...]` across nine more components. Six stylesheets deleted outright.

| | Before | After |
|---|---:|---:|
| `admin/` component SCSS | 1,915 | **659** |
| `user/` component SCSS | 2,254 | **539** |

Both `styles.scss` files stay Sass and are unchanged apart from the three
`@tailwind` directives — see §2.1 for why they can never be `.css`.

**Every page was verified in the running app, light and dark**, by comparing
`getBoundingClientRect()` and `getComputedStyle()` against a pre-conversion
baseline plus a screenshot. All pages match their baseline exactly, except two
1px sub-pixel rounding differences on the admin detail headers. The collapsed
sidebar rail was verified separately in both apps (264px → 76px, content margin
follows, brand text hides, active-link marker survives).

Where the remaining SCSS went — it is no longer layout:

| Stylesheet | Lines | What's left |
|---|---:|---|
| `admin-layout` / `user-layout` | 199 / 190 | `::ng-deep` Material internals, MDC custom properties, the `.collapsed` rail state |
| `user/dashboard` | 135 | `.alert` / `.late` / `.overdue-bucket` state + dark counterparts |
| `admin/login` | 98 | pseudo-element glows, keyframes, Material overrides |
| `user/project-detail` | 90 | CDK drag-and-drop classes, kanban surfaces |
| `admin/settings` | 84 | `[class.active]` nav/swatch state + dark counterparts |
| `admin/dashboard` | 77 | stagger delays, `::before` accent strip, `[ngClass]` variants |
| the rest | 7–61 each | `[ngClass]` chip/bar colour maps, one Sass mixin, one `::ng-deep` |

---

## 2. Constraints (measured, not assumed)

### 2.1 `styles.scss` can never become `.css`

Both apps build their Material theme with Sass **functions and mixins**:

```scss
@use '@angular/material' as mat;
$light-primary: mat.m2-define-palette(mat.$m2-blue-gray-palette, 400, 200, 700);
$light-theme:   mat.m2-define-light-theme((color: (primary: $light-primary, ...)));
body { @include mat.all-component-colors($light-theme); }
```

These run at build time and emit hundreds of CSS custom properties for the silver
palette in light and dark. There is no CSS equivalent and Tailwind knows nothing
about Material's token system. `admin/src/styles.scss` has 12 such lines, `user/`
has 13.

**The global stylesheet stays `.scss` in both apps.** The only way out is to drop
the custom palette for a prebuilt CSS theme, which changes how both apps look.

### 2.2 Utilities lose specificity fights with Material — silently

Component SCSS gets Angular's `[_ngcontent]` attribute → specificity **(0,2,0)**.
A Tailwind utility is a bare class → **(0,1,0)**. Material's own styles load after
the global sheet. So moving a rule out of component SCSS into a utility *lowers*
its specificity, and Material can start winning where it previously lost.

This bit the pilot: the theme toggle silently dropped out of its corner because
`.mat-mdc-icon-button { position: relative }` beat `.absolute`. Fixed with
`!absolute`. Nothing errored — it just moved.

> **Rule:** any utility applied to a Material element (`mat-*`, `button mat-*`,
> `mat-icon`) probably needs the `!` prefix. Assume it does, and verify visually.

### 2.3 Dynamic `[ngClass]` cannot be converted at all

Tailwind's JIT only sees **literal class strings** in source files. Runtime-built
names are invisible to it:

```html
<mat-chip [ngClass]="'status-' + project.status">      <!-- status-active -->
<mat-progress-bar [ngClass]="'bar-' + s.key">          <!-- bar-completed -->
```

Every one of these colour maps must stay in SCSS. Affected files:

- `admin/` — project-detail, project-list, task-list, user-list, dashboard, reports
- `user/` — project-detail, project-list, task-list, dashboard, task-detail-dialog

### 2.4 What this means

You are **not** migrating off SCSS. You are deleting the ~80% of it that is plain
layout and keeping a small, gnarly remainder. Budget for both apps ending up with
Tailwind *and* SCSS side by side, permanently.

---

## 3. Per-file outcome

### admin/ — 1,915 → 659

| File | Before | After |
|---|---:|---:|
| `admin-layout.component.scss` | 336 | 199 |
| `settings.component.scss` | 300 | 84 |
| `dashboard.component.scss` | 286 | 77 |
| `login.component.scss` | 258 | 98 |
| `project-detail.component.scss` | 138 | 40 |
| `reports.component.scss` | 125 | 30 |
| `user-list.component.scss` | 120 | 40 |
| `user-detail.component.scss` | 115 | 21 |
| `project-list.component.scss` | 100 | 33 |
| `task-list.component.scss` | 95 | 37 |
| `user-dialog.component.scss` | 42 | **deleted** |

### user/ — 2,254 → 539

| File | Before | After |
|---|---:|---:|
| `dashboard.component.scss` | 336 | 135 |
| `user-layout.component.scss` | 286 | 190 |
| `project-detail.component.scss` | 277 | 90 |
| `project-list.component.scss` | 245 | 34 |
| `task-list.component.scss` | 223 | 61 |
| `task-detail-dialog.component.scss` | 167 | 22 |
| `profile.component.scss` | 123 | **deleted** |
| `login-dialog.component.scss` | 86 | **deleted** |
| `register.component.scss` | 81 | **deleted** |
| `project-form-dialog.component.scss` | 44 | 7 |
| `task-form-dialog.component.scss` | 33 | **deleted** |

When a stylesheet was deleted, its `styleUrls` entry was removed from the
component decorator too.

### Inline `styles: [...]` components

These have no `.scss` file, so a `find -name '*.scss'` inventory misses them
entirely — which is exactly what happened on the first pass. All nine are now
converted; each keeps a small `styles` block for what utilities cannot reach.

| Component | Before | After |
|---|---:|---:|
| `admin/forgot-password` | 29 | 8 |
| `user/forgot-password` | 29 | 9 |
| `admin/confirm-dialog` | 22 | 9 |
| `user/calendar` | 21 | 26 |
| `user/settings` | 18 | 8 |
| `admin/project-dialog` | 10 | 5 |
| `admin/task-dialog` | 7 | 5 |
| `admin/reset-password-dialog` | 7 | 6 |
| `user/confirm-dialog` | 5 | 4 |

`user/calendar` grew slightly: its grid-hairline trick, `.today`/`.other-month`
cell states and `[ngClass]` priority colours all had to stay, and they now carry
explanatory comments.

**When auditing styles, search for both**:

```bash
find src -name '*.scss'
grep -rl "styles:\s*\[" --include=*.ts src
```


Still worth doing: `user/shared/task-meta.ts` already centralises status and
priority labels/colours. The chip colour maps that stayed in SCSS could likely be
driven from it instead — that would remove most of the remaining `[ngClass]` maps.

---

## 4. Toolchain (both apps, already installed)

`tailwindcss@3.4`, `postcss`, `autoprefixer`, plus `tailwind.config.js` and
`.postcssrc.json` in each app. Two config values are load-bearing:

```js
corePlugins: { preflight: false },     // preflight breaks Material's buttons/inputs
darkMode: ['selector', '.dark-theme'], // ThemeService toggles `dark-theme`, not `dark`
```

Without the second line every `dark:` utility silently does nothing. Both apps'
`ThemeService` puts the class on `document.body`, so `dark:` works from any
component.

In each `styles.scss`, after the existing `@use`/`@import` (Sass requires `@use`
first):

```scss
@tailwind base;
@tailwind components;
```

and at the **very bottom of the file**:

```scss
@tailwind utilities;
```

Utilities go last so they beat equal-specificity rules declared above them.

---

## 5. Gotchas found during the migration

Beyond the constraints in §2, these cost real time and will bite the next change:

- **`text-*` utilities bundle a line-height.** `text-2xl` is `font-size: 1.5rem`
  *plus* `line-height: 2rem`; a bare `font-size: 24px` had neither. This silently
  grew two admin cards by 5px and a user dashboard card by 4px. Where the original
  set only `font-size`, use an arbitrary value (`text-[24px]`, `text-[14px]`) —
  those set font-size alone.
- **Converting a class to utilities deletes that selector.** `.theme-toggle`
  became utilities and broke a test script that clicked it. Anything a test or
  script targets needs a `data-*` hook instead.
- **`[class.x]` state is usually better left in SCSS.** `.active`, `.done`,
  `.overdue`, `.collapsed` each restyle several descendants at once; expressing
  that as a conditional utility string is worse in every way. `[ngClass]` with a
  *literal* utility string (`{ 'text-[#ef4444]': overdue > 0 }`) is fine and
  visible to the JIT — a *computed* one is not (§2.3).
- **Verify with geometry, not just screenshots.** The 4–5px line-height drift was
  invisible by eye and obvious in `getBoundingClientRect()`.
- **Run `ng build` from the app root.** Tailwind resolves `content: ['./src/**']`
  against the **current working directory**, not the config file's location. A
  build run from `admin/src/app` scans `admin/src/app/src/**`, matches nothing,
  and emits **zero utilities** — the app builds "successfully" and renders
  completely unstyled.
- **Don't grep build output for `"bundle generation"`.** It matches
  `Application bundle generation failed` as happily as `...complete`. Grep for
  `✘` or the word `complete`.
- **Backticks inside an inline `styles: [\`...\`]` block terminate the template
  literal.** A CSS comment mentioning a property in backticks breaks the build
  with a confusing `TS-991010: Failed to resolve styles` error.
- **Scoped rules need their class kept.** `.row mat-form-field { flex: 1 }` only
  matched fields *inside a row*; replacing `class="row"` with `class="flex gap-3"`
  silently dropped the scope, and applying `flex-1` to every field instead grew
  the dialog by 12px.

---

## 6. Checklist for future style changes

The same loop that was used for the migration, and the one to use when adding or
restyling a component:

1. **Screenshot first** — light *and* dark, before touching anything. Without a
   baseline you cannot tell a regression from a pre-existing quirk.
2. Move layout/spacing/colour into template utilities.
3. Leave in SCSS: `[ngClass]` colour maps (§2.3), `::before`/`::after` decoration,
   `@keyframes`, and Material overrides that need (0,2,0) specificity.
4. Add `!` to any utility on a Material element (§2.2).
5. Rebuild, screenshot again, compare **both modes**. Check computed geometry, not
   just the image — `getBoundingClientRect()` plus `getComputedStyle()` on the main
   container catches shifts the eye misses.
6. Keep a `data-*` hook on anything a test needs to click. Converting a class like
   `.theme-toggle` into utilities **deletes that selector**, breaking test scripts
   silently. The pilot hit exactly this.

---

## 7. Outstanding environment issue

`admin/.angular/cache` is owned by `root` (from a `sudo` run on 2026-07-14), so
`ng serve` dies with `EACCES` whenever the lockfile changes — which installing
Tailwind did:

```
EACCES: permission denied, rmdir '.../admin/.angular/cache/18.2.21/admin/vite/deps'
```

Still unfixed, because it needs sudo:

```bash
sudo rm -rf admin/.angular
```

`ng build` is unaffected. The whole migration was therefore verified by building
and serving `dist/` through a static server with SPA fallback — a usable fallback
if the problem recurs.

---

## 8. Follow-ups worth doing

- **Design tokens.** The palette is hex literals, so the conversion produced
  arbitrary values (`bg-[#64748b]`, `text-[#6b7280]`, `border-[#edeff2]`) rather
  than named ones. Lifting the recurring colours into `theme.extend.colors` and
  sweeping the arbitrary values into names would make the utilities readable and
  the palette editable in one place. This is the single biggest remaining cleanup.
- **Chip colours from `task-meta.ts`.** `user/shared/task-meta.ts` already owns
  status/priority labels and colours. Most of the surviving `[ngClass]` colour
  maps could be driven from it instead of hand-written SCSS.
- **Shared config.** No workspace tooling, so the two apps have two copies of
  `tailwind.config.js`. Fine for now; they will drift eventually.
- **`admin/` has no `shared/` equivalents.** The migration did not change this —
  the two frontends still duplicate models, services, and now Tailwind config.
