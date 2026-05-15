# Handoff: Data Points page redesign (Variant B — Inline Expand)

## Overview

A redesign of the **Data Points management screen** in InkVault. Replaces the current flat list of icon + label + "Edit"/"Delete" text buttons with **compact rows that each carry a live preview of the field they represent**, and **expand inline into an editor** when tapped. The page never navigates away — viewing, editing, and adding all happen in one continuous list.

The goal is to make the page feel less abstract: instead of "a list of configs", it looks like a list of the actual widgets that will appear in the diary, so the user can see at a glance what each tracker does and how it will behave.

## About the design file

The HTML in this bundle (`Data Points Redesign.html`) is a **design reference**, not production code. It is a single static page that mocks three variants side-by-side — only **Variant B** is the chosen direction; Variants A and C can be ignored.

The task is to **recreate the Variant B design inside the InkVault Vue 3 + TypeScript + Tailwind v4 codebase**, using the project's existing patterns:

- Components live under `src/components/datapoints/`
- Styling uses the Tailwind v4 utility classes wired to the CSS variables defined in `src/assets/main.css` (`bg-raised`, `border-edge`, `text-ink`, `rounded-card`, etc.) — **do not introduce raw hex values or new tokens**. Every colour and radius in the mock corresponds to an existing token.
- All strings go through `vue-i18n` (`src/i18n/locales/en.ts`)
- Emoji rendering must respect `appSettings.settings.useEmojis` (see `DataPointIcon.vue`)
- `npm run type-check` must pass before the change is considered done

## Fidelity

**High-fidelity.** Colours, radii, spacing, typography, and interaction states in the mock are final. The developer should recreate the layout pixel-faithfully using the existing Tailwind classes mapped to the project's tokens.

## Files in this bundle

| File | What it is |
|---|---|
| `Data Points Redesign.html` | Static HTML mock of all three variants. **Variant B is in the middle column.** |
| `screenshots/01-list-state.png` | Variant B, collapsed list state — five trackers, each with a type-appropriate preview. |
| `screenshots/02-editor-expanded.png` | Variant B, one row expanded into the editor with the live diary preview pane. Also shows the locked-data treatment (locked pill + read-only chip field). |
| `README.md` | This file. |

## Files in the InkVault codebase that change

| File | Change |
|---|---|
| `src/views/DataPointsView.vue` | Top-level layout adjustments; remove the separate "show editor / show list" state — editing is now per-row |
| `src/components/datapoints/DataPointList.vue` | Major rewrite — rows become expandable; each row hosts a preview slot and (when active) the editor + preview panel |
| `src/components/datapoints/DataPointEditor.vue` | Adapt to render **inside an expanded row** rather than as a standalone card; remove the outer `bg-raised … shadow-card p-5` wrapper (the row provides chrome now); footer buttons move to a sticky foot strip |
| `src/components/datapoints/DataPointPreview.vue` | **New** — renders the small read-only preview (range scale, chips, yes/no pill, dosage tags, text hint) used both in the collapsed row's preview slot and inside the expanded row's live-preview pane |
| `src/i18n/locales/en.ts` | Add new strings (listed below) |

---

## Screens / views

There is one screen — `/#/data-points`, served by `DataPointsView.vue` — but it has three visible states. All states live in the same component tree; nothing routes away.

### State 1 — Header + list (collapsed)

**Layout** (top to bottom inside the standard `AppShell` content container, max width `--width-content`, default 48rem):

1. **Page header row** — flex, justify-between, align-center, `mb-3.5` (14px):
   - Left: title block
     - `h1` text — `text-xl font-semibold text-ink`, copy: "Data Points" (`t('dataPoints.title')`)
     - Helper line below — `text-xs text-ink-muted`, copy: "Tap a row to edit · drag to reorder" (new i18n key, see below)
   - Right: primary action button
     - Copy: "+ Add" (`t('dataPoints.add')`)
     - Style: existing primary button styling (`bg-accent text-on-accent px-4 py-2 rounded-input hover:bg-accent-dim font-medium text-sm`)
     - Click: inserts a new "draft" row at the top of the list in expanded state (see *Add flow* below); does **not** toggle a global editor mode

2. **List** — flex column, `gap-1.5` (6px between rows):
   - Each tracker is one row. See **Row component** below.
   - After the last row: a **dashed-border "+ Add another data point"** button (see **Add row** below). Hide it when the list is empty — the empty state takes over.

3. **Empty state** (when `configs.length === 0`):
   - Replace the list with a centered block: `text-center text-ink-faint text-sm py-10`
   - Copy: `t('dataPoints.empty')` (unchanged from current)
   - The dashed "+ Add another" row is replaced by a primary CTA in the same spot.

### State 2 — Row, collapsed (default)

This is the most important component. It is a grid row.

**Container:**
- Tag: `<div role="button" tabindex="0">` (the whole row is clickable to expand)
- Grid: `grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5`
- Padding: `px-3.5 py-3` (14px / 12px)
- `border border-edge rounded-card bg-raised`
- Hover: `hover:bg-subtle`; transition `transition-colors duration-100`
- Focus visible: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30`

**Slots in the grid (in order):**

#### Slot 1 — Icon

- The existing `<DataPointIcon>` component, default `size="md"` (32×32 round disc, filled with `config.color`, content = emoji if `useEmojis`, else uppercase first letter in white).

#### Slot 2 — Meta (label + sub)

- Two stacked lines, `min-width: 0` so it truncates cleanly:
  - `label`: `text-sm font-semibold text-ink truncate` — copy: `config.label`
  - `sub`: `text-[11.5px] text-ink-faint` — copy describes the type **and** the salient config (see *Sub line content* below)

**Sub line content** by type — render exact text including separators:

| Type | Sub copy | Example |
|---|---|---|
| `range` | `<typeLabel> · <min>–<max> · step <step>` | "Range · 0–10 · step 1" |
| `string` | `<typeLabel>` | "Text" |
| `multi-string` | `<typeLabel> · <N> options` | "Multiple choice · 5 options" |
| `boolean` | `<typeLabel>` | "Yes / No" |
| `medication` | `<typeLabel> · <preset1>, <preset2>, …` (cap at 3, then `…`) | "Medication · 25mg, 50mg, 100mg" |

Use the existing `typeLabel()` helper from `DataPointList.vue` for `<typeLabel>`. Add new i18n keys for the suffix joiners (see *i18n additions*).

#### Slot 3 — Preview

- A **read-only mini render of the field**. Width: `min-w-[200px] max-w-[240px]`. On viewports under 640px, hide it (`hidden sm:block`).
- This is the new `<DataPointPreview>` component. Pass `config`. It does not bind to a value — it shows a representative sample state. Spec by type:

  - **range** — horizontal scale, exactly the structure in the mock:
    ```html
    <div class="flex items-center gap-2.5">
      <span class="text-[11px] text-ink-faint">{{ min }}</span>
      <div class="relative flex-1 h-1 bg-edge rounded-full">
        <div class="absolute inset-y-0 left-0 rounded-full" :style="{ width: sampleFill+'%', background: config.color }"></div>
        <div class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
             :style="{ left: sampleFill+'%', background: config.color, boxShadow: '0 0 0 2px var(--color-surface), 0 0 0 3px '+config.color }"></div>
      </div>
      <span class="text-[11px] text-ink-faint">{{ max }}</span>
    </div>
    ```
    `sampleFill` = 70 (constant — it's a preview, not real data).

  - **string** — italic faint placeholder hint: `text-xs text-ink-faint italic truncate` — copy: `placeholder || t('dataPoints.preview.stringFallback')` (new key; English: "Free-form text").

  - **multi-string** — `flex flex-wrap gap-1`, render up to **4 chips**. Chip style:
    ```
    text-[11px] px-2 py-0.5 rounded-full border border-edge bg-surface text-ink-muted
    ```
    Show the first chip in "selected" state to indicate the look when picked:
    ```
    bg-accent-tint border-accent/30 text-accent-dim font-medium
    ```
    If `options.length > 4`, append a non-chip `+N more` faint span.

  - **boolean** — two equal-width pills inside `flex gap-1`. Each pill: `flex-1 text-center text-[11.5px] py-1 rounded-md border border-edge text-ink-muted`. First pill (the "true" label) gets a tinted state using the **config's colour**, not the global accent:
    ```js
    style="{ background: `color-mix(in oklab, ${config.color}, white 90%)`, color: `color-mix(in oklab, ${config.color}, black 30%)`, borderColor: `color-mix(in oklab, ${config.color}, white 70%)` }"
    ```
    Add `class="font-medium"` to the active pill.

  - **medication** — `flex items-center gap-2`. Render each preset as: `text-[11.5px] px-2 py-0.5 rounded-md border border-edge bg-surface text-ink-muted tabular-nums`. Cap at 3 presets visible; if there are more, append `+N`.

#### Slot 4 — Actions

- `flex gap-0.5`, default `opacity-40`, on row hover/focus `opacity-100`, `transition-opacity duration-100`
- Two square icon buttons, 28×28, no border by default, hover `bg-subtle rounded-md`, icon stroke `1.8`, size 14×14:
  1. **Drag handle** — `cursor-grab`; the six-dot vertical grip glyph (see SVG path in the mock). For now, hook it up as `aria-label="Reorder"` but the actual drag interaction can be a follow-up (mention this as a TODO in the PR description). Do not wire any DnD library.
  2. **Delete** — destructive. On hover: `hover:bg-danger-tint hover:text-danger`. Click stops propagation (so the row doesn't expand) and fires the existing `delete` event with `confirm()` flow already implemented in `DataPointsView.vue`.

**Row click behaviour:** clicking anywhere on the row that isn't an action button toggles `expanded` for that row. Only one row can be expanded at a time — opening one collapses any other. Keyboard: `Enter` / `Space` on the focused row also toggles.

### State 3 — Row, expanded (the editor)

When `expandedId === config.id`, the row swaps to a different visual layout. **Same outer element, different inner template.** Transition with a brief `max-height` + `opacity` reveal (200ms ease) — Tailwind `transition-all`.

**Container differences when expanded:**
- Grid changes to `grid-cols-1` (single column)
- Padding `p-0` (children handle their own)
- Background `bg-surface` (not `bg-raised` — slight elevation against the rest of the list)
- Border becomes `border-accent`
- Add a soft glow: `shadow-[0_0_0_3px_var(--color-accent-tint)]`

**Three stacked sub-sections inside the expanded row:**

#### Expanded · head

- `grid grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-edge`
- Icon (md), then meta block (`label` + `sub` same as collapsed), then on the right:
  - **Locked pill** (only shown when `editingLocked === true`):
    - `inline-flex items-center gap-1.5 text-[11px] text-warn bg-warn-tint border border-warn/30 px-2 py-0.5 rounded-full`
    - Copy: `🔒 {{ t('dataPoints.editor.lockedRowPill', { n: storedDaysCount }) }}`
    - English: `"Has {n} days of data"` (new key)
  - **Collapse caret** — `<button>` with a chevron-up SVG, `icon-btn` styling. Clicking collapses the row (same as clicking the head).

#### Expanded · body

A **two-column grid**: `grid grid-cols-[1.05fr_0.95fr]`. On screens under 768px, fall through to `grid-cols-1`.

**Left column (form) — `p-4`:**

This is the existing `<DataPointEditor>` form **without its outer wrapper** (`bg-raised rounded-card border shadow-card p-5`) and **without its `<h3>` title** (the row head already names the tracker). All current form fields, including the type picker, range min/max/step, string placeholder, multi-string options, boolean labels, medication name + dosage presets, are reused as-is. Two adjustments:

1. The label + icon + colour row is unchanged but the colour input becomes a **swatch picker** instead of `<input type="color">`. Render six fixed swatches from the existing accent palette:
   - `#4f46e5` (indigo — default)
   - `#7c3aed` (violet)
   - `#0d9488` (teal)
   - `#e11d48` (rose)
   - `#d97706` (amber)
   - `#475569` (slate)
   Each swatch: 24×24 `rounded-full`, `border-2 border-surface`, `shadow-[0_0_0_1px_var(--color-edge)]`. Selected state: `shadow-[0_0_0_2px_var(--color-accent)]`. Plus one extra slot at the end labelled "Custom…" that opens the existing `<input type="color">` in a popover. Persisted value remains a hex string in `config.color`, so the data shape is unchanged.

2. When `locked === true`, replace the **yellow warning banner** with **per-field disabled states** plus the locked pill in the head. Disabled fields use `opacity-60 cursor-not-allowed select-none` (mirrors the existing locked-type display). For the multi-string options field specifically, render the chips as **read-only chips in selected state** with a small note `<p class="text-[11px] text-ink-faint mt-1">{{ t('dataPoints.editor.lockedFieldHint') }}</p>` — English: `"Locked — this tracker already has data."`

**Right column (live preview) — `p-4 bg-subtle border-l border-edge`:**

- Eyebrow: `<div class="text-[10px] font-semibold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">` with a 6×6 green dot (`bg-ok rounded-full`) before the text. Copy: "Live preview" (new i18n key, English: "Live preview").
- Below it, a faux diary-row card: `bg-surface border border-edge rounded-card shadow-card p-3.5`. Inside, render the **actual `<DataPointField>` component** bound to a local `ref` that holds a sample value. This way the preview is the real component, not a separate render. Initialise with a representative sample:
  - range: `Math.round((min + max) / 2)`
  - string: empty (shows placeholder)
  - multi-string: `[options[0]]` if any
  - boolean: `true`
  - medication: `{ amount: parseFirstPreset(), unit: 'mg', time: '08:00' }`
- Updates as the user types in the left column — feed the same `config` + buildConfig() output into the preview so it reflects the current form state, not the saved state.

#### Expanded · foot

- `flex justify-between items-center px-4 py-2.5 border-t border-edge bg-subtle`
- Left: a "Delete this tracker" plain-text link button — `text-xs text-danger hover:underline`. Only shown when editing an existing config (not for the draft new row). Click triggers the same delete confirm + `delete` event already implemented in `DataPointsView.vue`.
- Right: two buttons, `gap-2`
  - "Cancel" — existing border-only button styling
  - "Save changes" / "Add data point" — primary button. Copy mirrors the current `dataPoints.editor.save` / `dataPoints.editor.add` keys.

### Add row (collapsed state, end of list)

A full-width dashed-border button below the last row:
- `w-full mt-1.5 flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-edge-strong rounded-card text-ink-muted text-sm font-medium`
- Hover: `hover:border-accent hover:bg-accent-tint hover:text-accent-dim transition-colors duration-100`
- Copy: "+ Add another data point" (new i18n key, English: `"+ Add another data point"`)
- Click: same handler as the top-right "+ Add" — inserts a draft row at the top, expanded, with the form empty and `type='range'` defaulted (preserving current behaviour).

---

## Interactions & behaviour

- **Row toggle.** Clicking any row collapses any currently-open row and opens the clicked one. Toggling closed (clicking the same row or its caret) returns to the all-collapsed state. State lives in `DataPointList.vue` as `const expandedId = ref<string | null>(null)`.
- **Add.** Either "+ Add" button enters "draft mode" — `expandedId.value = '__draft__'` and a synthetic config object (no id, default values) is rendered as the first row in expanded state. Saving calls `datapoints.addConfig({ ...id, ...createdAt })` (same as today). Cancelling discards.
- **Edit lock.** Existing `editingLocked` rule (any diary entry has a non-null value for this config id) still applies — the locked pill appears in the head and form fields render in their disabled/read-only state. The previous yellow banner is removed.
- **Delete.** Same `confirm()` + `t('dataPoints.deleteConfirm')` flow as today. Reachable from the collapsed row's delete icon and from the expanded foot link. After delete, collapse if the deleted row was open.
- **Drag-to-reorder.** Not in scope for this change — render the handle, give it `aria-label="Reorder"` and `cursor-grab`, but do not implement the DnD itself. Note it in the PR as a follow-up.
- **Animation.** Expand/collapse: 200ms ease on `max-height` + `opacity`, content fades in at 80–120ms. Respect the existing `:root[data-animations="off"]` toggle — that selector already disables all transitions globally, no extra work needed.
- **Empty state.** When `configs.length === 0`, show the existing empty message and a primary "+ Add data point" button beneath it. No dashed row.
- **Focus management.** When a row expands, move focus to the first input in the form (label field). When it collapses, return focus to the row's clickable surface.
- **Only one open.** Strictly one expanded row at a time, matching the design.

## State management

In `DataPointList.vue` (new responsibilities):
- `const expandedId = ref<string | null>(null)` — id of the currently open row, or `'__draft__'`, or null.
- `function toggle(id: string)` — opens/closes a row, ensures single-open.
- Receive `configs` from the view as today. Emit `edit` and `delete` upward as today, **plus** a new `add` emit so the view can prepend a draft config to its local list (or the view passes a `draftConfig` prop in — either is fine; pick whichever keeps `DataPointsView.vue` simpler).

In `DataPointsView.vue`:
- Drop `showEditor`, `editingConfig`, `editingLocked` refs — those become per-row state owned by the list.
- Keep `hasStoredData()`; pass `lockedIds` (a `Set<string>` or a function prop) to the list so it can derive `editingLocked` per row.
- Keep `handleSave` and `handleDelete` (unchanged signatures).

No changes to stores (`datapoints.ts`, `diary.ts`), types (`types/index.ts`), or storage. The shape of `DataPointConfig` is identical.

---

## Design tokens

Every value in the mock maps directly to an existing token from `src/assets/main.css`. **Do not add new tokens.** Reference list of what's used:

### Colours (all via Tailwind classes that wrap these CSS variables)

| Token | Usage |
|---|---|
| `--color-surface` | Expanded row background, preview card inside diary preview |
| `--color-raised` | Default (collapsed) row background |
| `--color-subtle` | Hover background, expanded foot, right preview panel background |
| `--color-accent` | Primary button, focus ring, expanded row border, segmented "on" indicator |
| `--color-accent-dim` | Primary hover, selected chip text |
| `--color-accent-tint` | Selected chip background, expanded row glow ring, dashed "add" hover |
| `--color-ink` | Primary text, label |
| `--color-ink-muted` | Sub text, default button text, locked pill icon |
| `--color-ink-faint` | Placeholder text, sub-meta lines, scale endpoints |
| `--color-edge` | Default border, chip border, dashed add border (regular) |
| `--color-edge-strong` | Dashed add border (idle, slightly stronger) |
| `--color-warn`, `--color-warn-tint` | Locked pill |
| `--color-danger`, `--color-danger-tint` | Delete states |
| `--color-ok` | Live-preview eyebrow dot |

### Per-tracker colours (in `config.color`)

Hex values stored on each `DataPointConfig.color`. The preview components and the icon disc all consume this hex directly via inline `style` — no token needed. Mock uses:
- `#6366f1` (mood / indigo-500)
- `#0d9488` (sleep / teal-600)
- `#d97706` (activity / amber-600)
- `#16a34a` (meditated / green-600)
- `#e11d48` (sertraline / rose-600)

The new swatch picker offers six fixed values listed in *Expanded · body* above; the legacy `<input type="color">` becomes the "Custom…" affordance.

### Radii

| Token | Usage |
|---|---|
| `--radius-card` (0.5rem) | Rows, preview cards |
| `--radius-input` (0.375rem) | Buttons, inputs, small option pills |
| `--radius-pill` (9999px) | Icon disc, chips, locked pill, range scale, swatch |

### Shadows

| Token | Usage |
|---|---|
| `--shadow-card` | Live preview's faux diary-row card |
| (custom) `0 0 0 3px var(--color-accent-tint)` | Expanded row glow — inline, not a token |

### Typography

| Class | Size | Weight | Used for |
|---|---|---|---|
| `text-xl font-semibold` | 20px / 600 | Page title |
| `text-sm font-semibold` | 14px / 600 | Row label, section headings |
| `text-sm` | 14px / 400 | Form inputs |
| `text-xs` | 12px / 400 | Helper text under page title, buttons |
| `text-[11.5px]` | 11.5px | Sub line under label, mini pills |
| `text-[11px] font-medium` | 11px / 500 | Form field labels (existing `label-xs` pattern) |
| `text-[10px] uppercase tracking-wider font-semibold` | 10px | "Live preview" eyebrow |

Font family is inherited (`system-ui, -apple-system, "Segoe UI", sans-serif`) — same as the rest of the app. No new fonts.

### Spacing

- Row padding: `px-3.5 py-3` (14px / 12px)
- Row grid gap: `gap-3.5` (14px)
- List gap between rows: `gap-1.5` (6px)
- Expanded head padding: `px-4 py-3.5`
- Expanded body padding: `p-4` per column
- Expanded foot padding: `px-4 py-2.5`
- Form fields: `mb-3` between fields, `gap-2.5` inside grid pairs

---

## i18n additions

Add to `src/i18n/locales/en.ts` under the `dataPoints` block:

```ts
dataPoints: {
  // …existing keys
  helper: 'Tap a row to edit · drag to reorder',
  addAnother: '+ Add another data point',
  sub: {
    rangeStep: 'step {step}',
    multiOptions: '{n} option | {n} options',
    medPresetsJoin: ', ',
  },
  preview: {
    stringFallback: 'Free-form text',
    livePreview: 'Live preview',
  },
  editor: {
    // …existing keys
    lockedRowPill: 'Has {n} days of data',
    lockedFieldHint: 'Locked — this tracker already has data.',
  },
},
```

Remove the existing `dataPoints.editor.lockedWarning` (the inline banner is gone). Search and remove any remaining usages.

---

## Accessibility

- Row container: `role="button"`, `tabindex="0"`, `aria-expanded` reflecting state, `aria-controls` pointing to the body div id.
- Icon-only buttons (drag handle, delete, collapse caret) get `aria-label`s via i18n.
- Locked pill: include the count in the visible label (already does).
- The new colour swatches are radio-equivalent — wrap in `role="radiogroup"` with `aria-label="Colour"`; each swatch `role="radio"` + `aria-checked`.
- Focus rings stay on for keyboard users via `focus-visible:ring-2 focus-visible:ring-accent/30`.

## Responsive behaviour

- ≥ 640px (sm): full layout as designed.
- < 640px: hide the **collapsed-row preview slot** (`hidden sm:block` on it); rows become icon + meta + actions only. Expanded body becomes single column (`md:grid-cols-[1.05fr_0.95fr]`), with the live preview stacking below the form.
- The page itself respects the existing `--width-content` variable; nothing here should overflow at the narrow setting (36rem).

## Out of scope (do not implement)

- Drag-to-reorder (placeholder only; real DnD is a follow-up).
- The tracker-card grid layout (Variant A) and the rail-and-detail layout (Variant C) in the mock file — they are reference only.
- Stats like "logged 32 / 38 days" shown on the variant A cards. Variant B does not show usage stats in the row.
- The filter chip bar shown in variant A.

## Acceptance criteria

1. The Data Points page renders the list with the new compact rows, including per-type previews, in light, dark, and cozy moods, with both `useEmojis: true` and `false`.
2. Clicking a row expands it in place; no modal, no page transition, no other row remains open.
3. Editing an existing tracker that has stored data shows the locked pill in the head and disabled fields in the form — **no separate yellow banner**.
4. The live preview pane reflects in-progress form edits in real time, using the real `<DataPointField>` component.
5. Saving an edit dispatches `datapoints.updateConfig` with the same patch logic as today (full config when unlocked, label/colour/icon only when locked).
6. Adding a new tracker via either "+ Add" button opens a draft row in expanded state; save calls `datapoints.addConfig` with a fresh `id` + `createdAt`.
7. Delete from either the collapsed row or the expanded foot triggers the existing `confirm()` flow.
8. `npm run type-check` passes.
9. Existing E2E tests still pass; add a Playwright case that opens a row, edits the label, saves, and asserts the row's label updated.

## Notes for the implementer

- The current `DataPointEditor.vue` already has all the field-specific logic (type picker, range min/max, options string, etc.). The main mechanical change is removing its outer chrome and shifting the buttons to a separate foot strip that lives in `DataPointList.vue` rather than the editor — or, simpler, leave the buttons inside the editor and pass a `compact` prop that strips its outer card. Either is fine.
- The new `<DataPointPreview>` component should be tiny — about 60 lines total — because it's a switch over `config.type` rendering small static markup. No state, no emits.
- For the live-preview pane, mount the real `<DataPointField>` with a `v-model` to a local `ref(initialSampleValue)`. When the user changes the type in the form, swap the sample value to a sensible default for that type (the existing `buildConfig()` switch is a useful reference).
- Keep the type-picker grid (the 5-button row with emoji + label) exactly as it is today — it works and it matches the mock.
- The animations toggle (`data-animations="off"` on `:root`) already neutralises transitions globally via the existing CSS in `main.css`; the new expand/collapse transition will respect it automatically, no extra check needed.
