# Checklist Manager

A browser-only checklist workspace built from `checklist requirement.md`. It supports multiple pages, five-level nested lists, view/edit modes, draggable sections and sibling items, 10% grid resizing, themes, custom colors, and LocalStorage persistence.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Use `npm.cmd run build` for a production build and `npm.cmd run check` for the TypeScript validation pass.

## Project structure

- `src/store/checklistStore.ts` owns application state, LocalStorage writes, and view/edit save semantics.
- `src/data/tree.ts` contains immutable hierarchy operations such as checkbox propagation, stable completed-item sorting, highlighting, and sibling reordering.
- `src/data/defaults.ts` and `src/data/themes.ts` contain starter content and theme definitions.
- `src/data/migrations.ts` initializes saved layouts and migrates the old shared background to individual page colors without losing checklist data.
- `src/data/sectionSizing.ts` defines content-fitting height rules; `src/hooks/useSectionAutoHeight.ts` measures rendered content and applies those rules.
- `src/data/gridLayout.ts` owns explicit grid coordinates, open-space placement, collision checks, and growth spacing. Existing LocalStorage data receives initial positions automatically.
- `src/data/sectionCopy.ts` creates independent section duplicates with fresh checklist IDs and available grid positions.
- `src/components/Dropdown.tsx` supplies shared styled menus with keyboard navigation for pages and container colors.
- `src/components/` keeps the header, layout editor, section cards, checklist rows, and reusable controls independent.
- `src/styles.css` contains the responsive ten-column grid and component-level styling; Tailwind is wired through Vite for utility use and future extension.

Edit-mode changes remain in memory until **Save** is selected. View-mode actions such as checking, highlighting, or expanding an item are persisted immediately. The app warns before unloading while edit-mode changes are unsaved.

Each checklist page has its own background color. Layout Studio previews and updates only the active page; new pages start white. Older saved pages inherit their former shared background on load, after which their colors are independent.

Containers grow in 10% steps only when their content exceeds the current height. Their Add item footer remains pinned to the bottom. Desktop positions support deliberate gaps and vertically stacked cards; mobile shows a readable single-column layout while retaining those saved positions.

Container height has no maximum. Occupied drops resolve to the nearest free grid position without moving other cards, and pointer-driven edge scrolling runs at a gentle pace while dragging.

Use **Copy section** on any container, then **Paste section** in Layout Studio to duplicate it on the current page or another page. The in-app copy buffer preserves the captured contents until refresh or Clear data; pasted sections are saved with the rest of the page.
