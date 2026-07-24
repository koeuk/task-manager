# Tailwind Migration Plan

Moving `admin/` and `user/` from hand-written SCSS to Tailwind utilities.

Everything in the "Constraints" section below was **measured on a working pilot**
(the admin login page), not assumed. Read that section before writing any code —
two of the three constraints fail *silently*, which is how you lose an afternoon.

---

## 1. Current status

| | State |
|---|---|
| `admin/` toolchain | **Installed.** `tailwindcss@3.4`, `postcss`, `autoprefixer`, `tailwind.config.js`, `.postcssrc.json`, directives wired into `styles.scss` |
| `admin/` login page | **Converted and verified** — pixel-identical light + dark, SCSS 258 → 98 lines (−62%) |
| Everything else in `admin/` | Not started |
| `user/` | Not started — no Tailwind installed |

Uncommitted at time of writing: `admin/package.json`, `package-lock.json`,
`src/styles.scss`, `login.component.{html,scss}`, plus the two new config files.

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

## 3. Inventory

### admin/ — 2,297 SCSS lines, 141 Material-coupled (6%)

| File | Lines | Notes |
|---|---:|---|
| `styles.scss` | 382 | **Stays SCSS** (§2.1) |
| `admin-layout.component.scss` | 336 | Highest risk — on every page. Do last |
| `settings.component.scss` | 300 | |
| `dashboard.component.scss` | 286 | Has `[ngClass]` colour maps |
| `project-detail.component.scss` | 138 | Has `[ngClass]` colour maps |
| `reports.component.scss` | 125 | |
| `user-list.component.scss` | 120 | Has `[ngClass]` colour maps |
| `user-detail.component.scss` | 115 | |
| `project-list.component.scss` | 100 | Has `[ngClass]` colour maps |
| `task-list.component.scss` | 95 | Has `[ngClass]` colour maps |
| `user-dialog.component.scss` | 42 | |
| `login.component.scss` | ~~258~~ 98 | **Done** |

### user/ — 2,254 SCSS lines, 102 Material-coupled (5%)

| File | Lines | Notes |
|---|---:|---|
| `styles.scss` | 353 | **Stays SCSS** (§2.1) |
| `dashboard.component.scss` | 336 | Has `[ngClass]` colour maps |
| `user-layout.component.scss` | 286 | Highest risk — on every page. Do last |
| `project-detail.component.scss` | 277 | Has `[ngClass]` colour maps |
| `project-list.component.scss` | 245 | Has `[ngClass]` colour maps |
| `task-list.component.scss` | 223 | Has `[ngClass]` colour maps |
| `task-detail-dialog.component.scss` | 167 | Has `[ngClass]` colour maps |
| `profile.component.scss` | 123 | |
| `login-dialog.component.scss` | 86 | |
| `register.component.scss` | 81 | |
| `project-form-dialog.component.scss` | 44 | |
| `task-form-dialog.component.scss` | 33 | |

`user/` additionally has `shared/task-meta.ts`, which centralises status/priority
labels and colours. **Check whether it can feed the chip colours** before
hand-writing another SCSS colour map — it may already be the right home for them.

---

## 4. Setup for `user/` (admin is already done)

```bash
cd user
npm install -D tailwindcss@^3 postcss autoprefixer
```

Copy `admin/tailwind.config.js` and `admin/.postcssrc.json` verbatim. Both config
values matter:

```js
corePlugins: { preflight: false },     // preflight breaks Material's buttons/inputs
darkMode: ['selector', '.dark-theme'], // ThemeService toggles `dark-theme`, not `dark`
```

Without the second line every `dark:` utility silently does nothing. Both apps'
`ThemeService` puts the class on `document.body`, so `dark:` works from any
component.

Then in `user/src/styles.scss`, after the existing `@use`/`@import` (Sass requires
`@use` first):

```scss
@tailwind base;
@tailwind components;
```

and at the **very bottom of the file**:

```scss
@tailwind utilities;
```

Utilities go last so they beat equal-specificity rules declared above them. This
is the arrangement already working in `admin/src/styles.scss`.

---

## 5. Order of work

Convert **leaf pages first, shared layout last** — a mistake in a layout breaks
every screen at once and is much harder to attribute.

**admin/** (login done)
1. `user-dialog` (42) — smallest, confirms the dialog pattern
2. `project-list` → `user-list` → `task-list` (95–120) — these three are near-identical; whatever works on the first applies to the other two
3. `user-detail` → `project-detail` (115–138)
4. `reports` (125)
5. `dashboard` (286)
6. `settings` (300)
7. `admin-layout` (336) — last

**user/** — same shape
1. `task-form-dialog` (33) → `project-form-dialog` (44)
2. `register` (81) → `login-dialog` (86)
3. `profile` (123)
4. `task-detail-dialog` (167)
5. `task-list` → `project-list` → `project-detail` (223–277)
6. `dashboard` (336)
7. `user-layout` (286) — last

---

## 6. Per-file checklist

For each component:

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

## 7. Environment issue to clear first

`admin/.angular/cache` is owned by `root` (from a `sudo` run on 2026-07-14), so
`ng serve` dies with `EACCES` whenever the lockfile changes — which installing
Tailwind does:

```
EACCES: permission denied, rmdir '.../admin/.angular/cache/18.2.21/admin/vite/deps'
```

Fix before starting:

```bash
sudo rm -rf admin/.angular
```

`ng build` is unaffected. The pilot was verified by building and serving `dist/`
through a static server with SPA fallback, which is a usable fallback if the cache
problem recurs.

---

## 8. Open decisions

- **Design tokens.** The palette is currently hex literals scattered across SCSS
  (`#64748b`, `#6b7280`, `#e6e9ee`…). Converting verbatim moves them into
  `bg-[#64748b]` arbitrary values, which is no better. Worth lifting the recurring
  ones into `theme.extend.colors` first so the conversion produces `bg-slate-500`
  rather than arbitrary hex.
- **Shared config.** There is no workspace tooling, so the two apps get two copies
  of `tailwind.config.js`. Fine for now; revisit if they drift.
- **Is this worth doing for `user/`?** The pilot returned −62% on one file. If that
  holds, both apps together shed roughly 3,000 lines. If the answer is "not worth
  it," stopping after `admin/` is a coherent place to stop — the two apps already
  duplicate their models and services, so a styling split changes nothing
  structurally.
