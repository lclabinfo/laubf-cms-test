# Development Notes

> Implementation notes, best practices, and technical decisions made during development. This is a living collection of lessons learned.

---

## 1. shadcn Data Table — Best Practices & Scalability Audit

How to use shadcn components so that visual changes propagate consistently, and an honest audit of where the current Messages implementation follows (or breaks) these rules.

### 1.1 The Core Principle: Three Layers

shadcn is built on a cascade. Changes flow downward through three layers:

```
Layer 1: Design tokens       (globals.css — CSS variables)
Layer 2: shadcn primitives   (components/ui/ — Badge, Button, Table, etc.)
Layer 3: Page compositions   (components/cms/messages/, app/cms/messages/)
```

**The rule:** Visual decisions should live as high in the cascade as possible. If you change a color in Layer 1, it should automatically update everything in Layers 2 and 3 without touching those files. If you change how a Badge looks in Layer 2, every page that uses Badge should update.

**When this breaks:** When you bypass the cascade by putting raw Tailwind classes on a shadcn component that override its variant system. That inline style is invisible to the layer above it — the Badge component doesn't know about it, the CSS variables don't control it, and the next page that needs the same look will have to copy-paste those classes.

### 1.2 Where to Put Customization

**Do: Use CSS variables in `globals.css` (Layer 1)**

This is your single source of truth for colors, radii, and spacing. Every shadcn component reads from these variables. Changing `--primary` updates every Button, Badge, and sidebar link at once.

**Do: Add variants to `components/ui/` files (Layer 2)**

If you need a new visual state that shadcn doesn't ship (e.g., a "warning" badge), add it as a variant inside the component's `cva()` definition. Every page that uses `variant="warning"` will get the same look, and future changes only require editing one file.

**Do: Compose shadcn primitives in shared components (Layer 2.5)**

For patterns you'll reuse across pages — like a DataTable with pagination, or a search input with an icon — create a shared component that wraps shadcn primitives. This is composition, not customization. The shared component calls `<Table>`, `<Button>`, `<Select>` — it doesn't redefine how they look.

**Don't: Add one-off Tailwind overrides to shadcn components in page code (Layer 3)**

This is where drift starts. If `columns.tsx` puts `className="border-orange-300 bg-orange-50 text-orange-700"` on a Badge, that orange style is trapped in that file. When Events needs the same "scheduled" badge, someone (or an AI model) will either copy the classes or invent a slightly different version.

### 1.3 Current Implementation: Audit

#### What's correct

**State ownership pattern.** All TanStack Table state lives in `page.tsx` and flows down via the `table` instance. The DataTable and Toolbar don't own state — they receive it. This means every future data table page follows the same pattern:

```
page.tsx        → owns useState + useReactTable
  Toolbar       → receives table instance, calls table.setFilterValue(), etc.
  DataTable     → receives table instance, renders rows
```

**Column definitions are separate from the table shell.** `columns.tsx` defines what renders in each cell. `data-table.tsx` defines the table structure and pagination. They're independent — you can swap column definitions without touching the table shell.

**Primitives are used correctly in most places.** Button variants (`ghost`, `outline`, `destructive`), Badge variants (`default`, `secondary`, `outline`), Dialog composition, DropdownMenu composition — these all use shadcn's built-in API the way it's intended. Changing Button's `outline` variant in `components/ui/button.tsx` will update every outline button across the app.

#### Resolved issues

**Fixed: DataTable moved to `components/ui/data-table.tsx`.** Previously in `components/cms/messages/data-table.tsx` — looked page-specific. Now lives alongside other shadcn primitives. Any page imports `import { DataTable } from "@/components/ui/data-table"`. The component also no longer re-exports TanStack hooks — pages import `useReactTable`, `getCoreRowModel`, etc. directly from `@tanstack/react-table`.

**Fixed: "scheduled" badge uses the `warning` variant.** Added `warning` variant to `components/ui/badge.tsx`. The status column now uses `variant="warning"` — no inline Tailwind. Changing the orange to amber requires editing one line in `badge.tsx`.

**Fixed: Shared status config in `lib/status.ts`.** `statusDisplay` maps `ContentStatus` → `{ label, variant }`. Columns import it: `import { statusDisplay } from "@/lib/status"`. When Events or Announcements need status badges, they use the same mapping.

#### Watch for later

**The toolbar is tightly coupled to Messages.** `toolbar.tsx` imports `Message` and `MessageStatus` types directly. The filter options are hardcoded to message-specific statuses. This is fine — the toolbar SHOULD be page-specific because each entity has different filters. But the reusable parts inside it (search input with icon, bulk action bar, filter badge chips) should be extractable.

This isn't an urgent problem — you can keep page-specific toolbars. But watch for copy-paste of the search input pattern. If you find yourself rebuilding the `<div className="relative"><Search /><Input className="pl-8" /></div>` pattern on 3+ pages, extract it to a shared `SearchInput` component.

### 1.4 How to Structure for Multiple Data Table Pages

The pattern that scales:

```
components/ui/
  data-table.tsx          ← Generic shell: table + pagination (shared)
  badge.tsx               ← With all status variants (warning, etc.)
  ... (other shadcn primitives)

lib/
  status.ts               ← Shared status → badge variant mapping
  messages-data.ts        ← Message-specific types + mock data
  events-data.ts          ← Event-specific types + mock data

components/cms/messages/
  columns.tsx             ← Message-specific column definitions
  toolbar.tsx             ← Message-specific filters + actions

components/cms/events/
  columns.tsx             ← Event-specific column definitions
  toolbar.tsx             ← Event-specific filters + actions

app/cms/messages/page.tsx ← Composes: Tabs + Toolbar + DataTable
app/cms/events/page.tsx   ← Composes: Toolbar + DataTable (same DataTable!)
```

**What's shared (change once, updates everywhere):**
- `data-table.tsx` — table structure, pagination, row selection, empty state
- `badge.tsx` variants — every status badge on every page
- CSS variables — every component's colors, radii, fonts

**What's page-specific (expected to differ per entity):**
- `columns.tsx` — different entities have different columns
- `toolbar.tsx` — different entities have different filters and actions
- `page.tsx` — different entities may or may not have tabs, different CTAs

### 1.5 The Cascade Test

Before shipping any data table page, ask:

1. **If I change `--primary` in globals.css**, do all buttons and badges update? (Yes if you used variants, no if you hardcoded colors.)

2. **If I change Badge's `secondary` variant in badge.tsx**, do all draft badges across all pages update? (Yes if they all use `variant="secondary"`, no if some use `className` overrides.)

3. **If I change the pagination layout in data-table.tsx**, does every table page update? (Yes if they all import the same DataTable, no if each page has its own copy.)

4. **If I change the "scheduled" color from orange to amber**, how many files do I touch? (Should be 1 — the `warning` variant in `badge.tsx`.)

If any answer is "no" or "N files", that's where the cascade is broken and drift will happen.
