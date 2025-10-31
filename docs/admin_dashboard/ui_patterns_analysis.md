# shadcn/ui Alignment and Component Patterns for Volunteer Portal Admin User Management

## Executive Summary: Why shadcn/ui for Admin User Management

shadcn/ui is a code‑owned, accessible component set that adopts a copy‑paste distribution model and relies on Radix Primitives for behavior and Tailwind CSS for styling. It is designed to be customized within your repository rather than consumed as a black‑box package, which reduces lock‑in and keeps upgrade paths flexible. For a volunteer portal with enterprise ambitions, this approach aligns directly with our need to govern tokens, standardize interaction patterns, and improve accessibility without surrendering control to a heavyweight framework.

The portal’s Phase 1 already delivers robust infrastructure—Redux Toolkit state management, a tokenized design system via CSS variables, and RTK Query for server data—providing an ideal substrate for shadcn/ui’s headless, accessible components. Together, they enable reliable, maintainable admin interfaces: the Data Table for list‑centric workflows, Dialog/AlertDialog for critical actions, and Form + React Hook Form + Zod for robust validation.

Expected outcomes from adopting shadcn/ui patterns in our admin flows include:
- Accessibility uplift through built‑in ARIA behaviors, focus management, and keyboard navigation for complex widgets.
- Maintainability via a headless, code‑owned architecture with composition patterns (class‑variance‑authority, Slot, forwardRef), consistent tokenization, and clear APIs.
- Performance improvements through modular imports, lazy loading of heavy components (e.g., Data Table), and headless logic separation from presentation.

In short, shadcn/ui offers the right mix of flexibility and guardrails to scale our admin capabilities, especially in user management scenarios where tables, forms, and modal actions dominate day‑to‑day operations.[^1][^2][^6]

## Alignment with Phase 1 Implementation

Phase 1 introduced Redux Toolkit for predictable state management, RTK Query for server interaction with automatic caching and request deduplication, and a comprehensive design token system. These investments pair naturally with shadcn/ui’s philosophy:

- Design tokens to CSS variables: shadcn/ui uses semantic tokens (e.g., background, foreground, primary, muted, destructive, border, input, ring, radius) exposed as CSS variables. This dovetails with our existing token categories (colors, spacing, radius, shadows, transitions, z‑index, breakpoints), enabling a single source of truth for theming and dark mode.[^3][^4][^5]
- Headless logic and accessible primitives: Radix Primitives provide robust focus management, ARIA semantics, and keyboard interactions that are essential for admin widgets. shadcn/ui components wrap these primitives with Tailwind styling and a consistent API, allowing us to own the code while benefiting from battle‑tested behaviors.[^2][^6][^1]
- State management and data fetching: Our RTK Query endpoints (e.g., member profile, membership, volunteer opportunities, hours, events, donations, applications) cover much of the admin surface. Data Table patterns integrate cleanly with RTK Query through typed hooks, making server‑driven tables, pagination, sorting, and filtering straightforward.[^8][^9]

Where gaps exist, they are addressable with targeted migrations:
- Form validation: Adopt Form + React Hook Form + Zod across admin flows to enforce data quality and accessibility (aria‑invalid, data‑invalid, clear error messaging).[^16][^17][^18]
- Component parity: Introduce shadcn/ui’s Data Table, Dialog/AlertDialog, DropdownMenu, Command palette, Select, Checkbox, and Badge patterns to replace bespoke wrappers and ad hoc logic.[^8][^19][^20]
- Performance: Enforce modular imports, tree‑shaking, and lazy load heavy components. Extract headless logic from TanStack Table; co‑locate state; memoize stable subtrees.[^9][^11][^12]

To clarify alignment and migration scope, the following tables summarize Phase 1 features against shadcn/ui patterns and list high‑value migrations.

### Table 1. Phase 1 features vs shadcn/ui alignment

To illustrate how Phase 1 infrastructure supports shadcn/ui adoption, the table below maps each capability to alignment status and next steps.

| Phase 1 Feature | shadcn/ui Alignment | Notes | Migration/Action |
|---|---|---|---|
| Design tokens (CSS variables) | Strong | Semantic tokens used by shadcn/ui map to our token system | Finalize mapping; document light/dark scopes[^3][^4] |
| Redux Toolkit state | Strong | Works with any component architecture | Maintain typed hooks; co‑locate component state |
| RTK Query (server data) | Strong | Typed hooks and cache tags pair with table/filter patterns | Adopt Data Table patterns for lists; use tags for cache invalidation[^8][^9] |
| Accessibility baseline | Partial | shadcn/ui/Radix provide ARIA/focus/keyboard by default | Add CI checks; audit complex widgets[^6][^2] |
| Theming (light/dark) | Strong | CSS variables support theme switching | Validate contrast ratios and focus ring visibility[^3] |
| Forms (ad hoc) | Gap | shadcn/ui Forms + RHF + Zod provide robust patterns | Migrate to Form + RHF + Zod; standardized error patterns[^16][^17][^18] |
| Data tables (bespoke) | Gap | shadcn/ui Data Table built on TanStack Table | Replace wrappers; adopt headless table logic[^8][^9] |
| Dialogs/modals (mixed) | Gap | shadcn/ui Dialog/AlertDialog align with Radix | Replace legacy modals; enforce focus trap and ARIA[^19][^20] |

### Table 2. Migration candidates and priority

The backlog below identifies high‑impact components to prioritize for shadcn/ui refactors.

| Component | Current Pattern | Target Pattern | Effort | Risk | Owner | Notes |
|---|---|---|---|---|---|---|
| Data Table | Custom table wrappers | TanStack Table + shadcn/ui Table | Medium | Low‑Medium | Frontend | Sorting, filtering, pagination, selection[^8][^9] |
| Dialogs | Legacy modals | shadcn/ui Dialog / AlertDialog | Low‑Medium | Low | Frontend | Focus trap; keyboard nav; portal behavior[^19][^20] |
| Forms | Ad hoc inputs | Form + RHF + Zod | Medium | Low | Frontend | Error attributes; schema validation[^16][^17][^18] |
| Dropdown menus | Mixed behaviors | DropdownMenu (Radix‑backed) | Low | Low | Frontend | Contextual row actions; ARIA semantics[^6] |
| Command palette | Limited | Command for global actions | Medium | Low‑Medium | Frontend | Quick navigation; search patterns |
| Select/Checkbox/Badge | Inconsistent | shadcn/ui components | Low | Low | Frontend | Status, filters, bulk select |

### Design Tokens to CSS Variables Mapping

shadcn/ui components expect semantic tokens exposed as CSS variables, with light and dark scopes. Our Phase 1 token categories are compatible and only require formal mapping.

To make this concrete, Table 3 maps semantic tokens to CSS variables and their roles.

| Semantic token | CSS variable | Role | Scope |
|---|---|---|---|
| background | --background | Page/surface background | :root, .dark |
| foreground | --foreground | Text on background | :root, .dark |
| card | --card, --card-foreground | Card surface and text | :root, .dark |
| popover | --popover, --popover-foreground | Overlay surfaces (menus, dialogs) | :root, .dark |
| primary | --primary, --primary-foreground | Primary actions/badges | :root, .dark |
| secondary | --secondary, --secondary-foreground | Secondary actions | :root, .dark |
| muted | --muted, --muted-foreground | Subtle backgrounds/text | :root, .dark |
| accent | --accent, --accent-foreground | Emphasis accents | :root, .dark |
| destructive | --destructive, --destructive-foreground | Error/destructive states | :root, .dark |
| border | --border | Borders/dividers | :root, .dark |
| input | --input | Input backgrounds | :root, .dark |
| ring | --ring | Focus ring | :root, .dark |
| radius | --radius | Corner radius scale | :root, .dark |

Adopting this mapping yields two benefits: standardized styling across components and straightforward theming across light/dark modes with consistent ARIA and focus behavior baked into the primitives.[^3][^4][^6]

### State and Data Fetching Integration

Admin tables and forms benefit from typed server state. RTK Query provides auto‑generated hooks and cache tags that our Data Table and filter controls can consume directly. TanStack Table’s headless model keeps sorting, filtering, and pagination logic independent of rendering, letting us pair server data with client interaction patterns while maintaining type safety.[^9][^8][^11]

- Data flow: server fetch → RTK Query hook → TanStack state → shadcn/ui Table UI (headers, cells, pagination).
- Cache management: invalidate tags after mutations (create/update/delete), re‑fetch lists automatically.
- Type safety: typed endpoints plus ColumnDef definitions minimize runtime errors and simplify maintenance.

## Admin User Management Capability Map (Patterns)

Volunteer portal admins spend most of their time in list‑centric workflows, with frequent create/edit actions, occasional critical deletes, and periodic bulk operations. The component patterns below directly support these tasks.

- Data Table: Sorting, filtering, pagination, column visibility, row selection, contextual actions.
- Dialog/AlertDialog: Critical actions that require explicit confirmation and safe focus management.
- Forms: Create/edit flows for user profiles, roles, and status, with Zod validation and accessible error handling.
- DropdownMenu: Row‑level actions and column visibility toggles.
- Command palette: Quick navigation and high‑frequency admin actions.
- Multi‑select: Bulk operations across selected rows.
- Status indicators: Badge/Switch for role or status changes with minimal friction.

The shadcn/ui Data Table guide provides concrete integration patterns using TanStack Table and shadcn components for admin workflows.[^8] For bulk actions, shadcn’s button group pattern offers a clear UI to select all and execute batch operations.[^24] Multi‑select can be implemented using community components built atop shadcn’s Command pattern.[^25][^26]

### Table 4. Admin capability to component mapping

| Admin task | shadcn/ui component(s) | Pattern | Notes |
|---|---|---|---|
| User listing | Table, Data Table | Sort, filter, pagination, column visibility | Integrates with RTK Query hooks[^8][^9] |
| Edit user | Dialog + Form | Modal form with validation | Focus trap; confirm before submit[^16][^19] |
| Delete user | AlertDialog | Critical confirmation | Destructive styling; keyboard accessible[^20] |
| Bulk role change | Data Table + Checkbox + Button Group | Select all; batch apply | Clear counters; undo patterns[^24] |
| Column toggles | DropdownMenu + CheckboxItem | Per‑column visibility | Save per‑user preferences |
| Status toggle | Badge/Switch | Instant state change | Confirm for sensitive changes |
| Quick actions | Command palette | Search‑driven actions | Shorten admin navigation paths |

### Data Table Workflows

TanStack Table powers headless logic for sorting (getSortedRowModel), filtering (getFilteredRowModel), pagination (getPaginationRowModel), selection, and visibility. shadcn/ui Table components render headers, rows, and cells, with Button/Input/DropdownMenu/Checkbox supporting controls. Columns are defined via ColumnDef, enabling typed accessors, custom cells, and per‑column enablement for sorting/hiding. Admin UX is strengthened by discoverable sort indicators, filters with clear affordances, and status Badges for rapid scanning. This separation of logic and presentation is a core strength of the headless approach.[^8][^9][^11]

### Critical Actions (Delete/Role Change) via Dialog Patterns

Admin actions must be safe and accessible. shadcn/ui’s Dialog provides focus trapping, Esc‑to‑close, and portal rendering, while AlertDialog introduces explicit confirmation flows that interrupt the user with important content and expect a response. These patterns reduce accidental deletions and guide admins through high‑impact operations with destructive styling and clear confirm/cancel affordances.[^19][^20]

### Bulk Operations & Multi‑Select

For bulk operations, Data Table integrates row checkboxes with a button group that includes select‑all, delete, archive, and move actions. A well‑designed bulk UI exposes selected counts, provides confirmation modals when needed, and supports undo patterns where feasible. Multi‑select can be extended for tags and filters using Command‑based components for complex selection scenarios, and discussion threads in the community provide maintenance tips for height and layout quirks.[^24][^25][^26]

## Accessibility Evaluation (WCAG‑aligned)

Complex admin widgets are prone to accessibility regressions. shadcn/ui components mitigate this risk because they are built on Radix Primitives, which provide robust focus management, ARIA semantics, and keyboard interaction patterns. When combined with standardized tokens for focus rings, contrast, and radius, the result is an interface that respects Web Content Accessibility Guidelines (WCAG) while remaining customizable.[^6][^2][^29]

Key behaviors include:
- Focus management: focus traps in Dialog; roving tabindex in Menu/Listbox; initial focus set and restored on close.
- Keyboard interactions: Arrow key navigation, Enter/Space activation, Esc to close; type‑ahead where applicable.
- ARIA attributes: roles and states applied automatically (e.g., role=dialog, aria‑modal, aria‑expanded, aria‑controls).
- Form accessibility: aria‑invalid and data‑invalid attributes, visible error text and descriptions, predictable tab order.

To operationalize accessibility, the following table links component behaviors to WCAG concerns.

### Table 5. Accessibility behaviors by component

| Component | Focus management | Keyboard interactions | ARIA attributes | WCAG considerations |
|---|---|---|---|---|
| Dialog (Modal) | Trap and restore focus; portal; inert background | Esc to close; tab through content | role=dialog, aria‑modal | Clear title; escape; visible focus[^6] |
| Menu/MenuButton | Roving tabindex; group navigation | Arrow keys; Enter/Space | aria‑haspopup, aria‑expanded, aria‑controls | Outside click; separators; focus order[^6] |
| Combobox/Listbox | Focus on input; active‑descendant | Arrow keys; Esc | aria‑expanded, aria‑controls, aria‑activedescendant | Typing filter; announce count; mobile keyboards[^6] |
| Tabs | Tab to active; arrow keys switch tabs | Left/Right (or Up/Down) | role=tablist, role=tabpanel | Activation model; labels and orientation[^6] |
| Form controls | Predictable tab order; visible focus | Enter to submit; label association | aria‑invalid, aria‑describedby | Error text proximity; clear instructions[^16][^17][^29] |

Testing strategy:
- Automated: Axe DevTools and Lighthouse for rule violations and accessibility scores.[^29]
- Manual: NVDA and VoiceOver for screen reader workflows, including Dialog focus traps and menu navigation.
- CI gates: enforce accessibility checks on critical components with fail‑fast policies.

## Maintainability & Architecture Patterns

shadcn/ui components are built using patterns that favor composition and polymorphism:
- Class‑Variance‑Authority (CVA) for variant management and consistent APIs.
- Slot pattern via @radix-ui/react-slot to compose behavior without styling entanglement.
- forwardRef for element polymorphism and reduced wrapper complexity.

These patterns reduce duplication, stabilize APIs, and make it easier to extend components across admin surfaces.[^1][^5] The copy‑paste distribution model avoids vendor lock‑in; code lives in our repo and can be modified safely, with a straightforward upgrade path. Headless Component principles apply cleanly: logic in hooks/primitives, presentation via our tokens, and separation of concerns ensuring reuse and testability.[^5][^6]

Governance practices:
- Component registry: catalog variant APIs, usage examples, and theming hooks.
- PR templates: require forwardRef/asChild usage, variant naming conventions, and accessibility checks.
- CI quality gates: enforce lint rules for imports and a11y checks, visual regression for key components, and bundle budgets.

## Performance Strategy for Large Datasets and 5000+ Users

Admin performance hinges on minimizing JavaScript, loading heavy UI only when needed, and isolating state to reduce re‑renders. shadcn/ui’s copy‑paste model aids tree‑shaking: unused components simply are not imported. TanStack Table’s headless logic avoids coupling to a specific rendering engine, enabling lean UIs and modular imports. We should complement these patterns with lazy loading and careful state placement.[^8][^9][^11][^12]

### Table 6. Performance checklist and expected impact

| Area | Practice | Expected impact |
|---|---|---|
| Import strategy | Direct imports; avoid barrel index bloat | Smaller bundles; clearer dependencies[^8] |
| Tree‑shaking | ES modules; avoid side effects | Remove unused code paths[^8] |
| Lazy loading | React.lazy/Suspense for heavy components | Lower initial payload; faster first contentful paint |
| SSR/CSR split | Hydrate critical UI; defer non‑critical | Reduced time to interactive pressure |
| Memoization | React.memo/useMemo for stable subtrees | Fewer re‑renders; lower CPU |
| State placement | Co‑locate state; reduce prop drilling | Smaller update surfaces |
| Bundling | Bundle analyzer; import lint | Enforce budgets and hygiene |

### Table 7. Bundle footprint (indicative)

While actual bundle sizes depend on usage, comparative metrics help calibrate expectations. shadcn/ui and Radix are designed for small footprints, while heavier libraries trade size for breadth.

| Library | GitHub stars | Weekly downloads | Bundle size (gzipped, indicative) |
|---|---:|---:|---:|
| MUI | ~93.8K | ~4.46M | ~36 KB |
| Chakra UI | ~36.4K | ~1.83M | ~22 KB |
| Radix UI | ~9.9K | ~80K | ~12 KB |
| shadcn/ui | ~10K | ~70K | ~10 KB |

These figures reflect typical trade‑offs: the lightest options provide primitives and patterns with minimal runtime, whereas heavier libraries package more behavior and styling by default.[^12] Regardless of library, modularity and headless logic remain the most effective levers for performance.

## Comparative Analysis: shadcn/ui vs Traditional Libraries (Admin Context)

For admin contexts, design philosophy and customization matter as much as bundle size. Traditional libraries like MUI provide a comprehensive, well‑documented component set with strong theming systems but can feel restrictive for unique designs and increase payload. shadcn/ui prioritizes minimalism and flexibility; it is lighter and more adaptable but expects more manual styling and architecture decisions. For a code‑owned system with tokens and headless primitives, shadcn/ui often delivers the right balance of accessibility, control, and performance.[^21][^10][^15]

### Table 8. shadcn/ui vs MUI vs React‑admin‑kit

| Dimension | shadcn/ui | MUI (Material UI) | React‑admin‑kit (shadcn components on react‑admin) |
|---|---|---|---|
| Philosophy | Code‑owned, copy‑paste; headless‑first | Comprehensive library; Material Design aligned | Headless admin core with shadcn‑styled components |
| Customization | High; modify source; Tailwind utilities | Medium; theme overrides within Material constraints | High; components live in repo; shadcn patterns |
| Accessibility | Strong defaults via Radix | Strong baseline; varies by component | Inherits admin patterns; shadcn components |
| Bundle footprint | Smaller; copy‑paste and tree‑shakable | Larger; many packaged components | Depends on usage; headless core + shadcn |
| Maintenance | Local code ownership; flexible upgrades | Centralized; upgrade friction on major changes | Local component modifications; admin features bundled |
| Best fit | Unique designs; code ownership; tokens | Enterprise consistency; Material adherence | Admin frameworks with shadcn UI feel |

If we require a full‑featured admin framework with integrated patterns (CRUD, reference management, i18n) while retaining shadcn UI styling, React‑admin‑kit provides a viable path. It leverages react‑admin’s headless core and applies shadcn components, enabling a shadcn look and feel without rebuilding every pattern from scratch.[^15][^23]

## Migration Plan and Governance

Adoption should be staged and guarded by quality gates:

- Phase 0: Token finalization. Map our tokens to shadcn’s semantic CSS variables, validate contrast ratios, and document light/dark scopes.
- Phase 1: Audit. Inventory admin components, identify duplication, accessibility gaps, and performance hotspots; refine migration backlog.
- Phase 2: Pilot. Implement Data Table, Dialog/AlertDialog, and Form + RHF + Zod for a key admin surface (e.g., User Management).
- Phase 3: Registry. Create a component registry, conventions (CVA, Slot, forwardRef), Storybook stories, and CI quality gates (a11y linting, visual regression, bundle budgets).
- Phase 4: Scale. Extend coverage (DropdownMenu, Command, Multi‑select), retire bespoke utilities, codify contributor guides and changelogs.

### Table 9. Migration backlog and effort

| Component | Current issues | Target pattern | Effort | Risk | Owner |
|---|---|---|---|---|---|
| Data Table | Bespoke logic; inconsistent behaviors | TanStack Table + shadcn/ui | Medium | Medium | Frontend |
| Dialogs | Inconsistent focus/ARIA | shadcn Dialog/AlertDialog | Low‑Medium | Low | Frontend |
| Forms | Ad hoc validation | Form + RHF + Zod | Medium | Low | Frontend |
| Dropdown menus | Mixed ARIA | DropdownMenu (Radix‑backed) | Low | Low | Frontend |
| Command palette | Limited | Command | Medium | Medium | Frontend |
| Multi‑select | Inconsistent | Command‑based multi‑select | Medium | Medium | Frontend |

### Table 10. Governance matrix

| Convention | Tooling | Gate | Threshold |
|---|---|---|---|
| Variant APIs | CVA templates | Lint/PR checks | Predefined enums only |
| Accessibility | ESLint a11y; Storybook a11y | CI checks | No violations on critical paths |
| Theming | CSS variables; token registry | Visual regression | No token drift across themes |
| Performance | Bundle analyzer; import lint | Budget per route | Enforce target KB thresholds |
| Composition | forwardRef/asChild | Code review checklist | Required for complex widgets |

These gates keep quality high without heavy process, and they make token and API updates auditable.[^24][^8][^13]

## Information Gaps

Several inputs must be confirmed to calibrate the rollout:

- Component inventory and folder structure for admin surfaces.
- Performance baselines (e.g., Largest Contentful Paint, Time to Interactive) under load.
- Accessibility audit results (WCAG 2.x level, common violations).
- Team skill levels with Radix/Headless UI, CVA, Slot, and forwardRef patterns.
- Theming requirements (brand palettes, multi‑brand, light/dark strategy).
- Hosting and SSR/CSR topology affecting hydration and caching.
- Target browsers/devices and localization requirements.
- Legal/compliance constraints for library usage.

These gaps should be closed during Phase 0/1 to sharpen effort estimates and risk mitigations.

## Risks and Mitigations

Adopting shadcn/ui patterns introduces a few risks; each has an associated mitigation.

### Table 11. Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Community component variability (multi‑select) | Medium | Medium | Pin versions; document quirks; fall back to Command patterns | Frontend |
| Accessibility regressions in complex widgets | Medium | High | Prefer compound components; audit and test with Axe/NVDA/VoiceOver | Frontend/QA |
| Performance regressions (table, dialogs) | Medium | High | Lazy load; memoize; co‑locate state; enforce bundle budgets | Frontend |
| Team familiarity with headless primitives | Medium | Medium | Training on Radix; workshops on CVA/Slot; code reviews | Frontend |
| SSR/CSR hydration mismatches | Low‑Medium | Medium | Test hydration paths; defer non‑critical components; avoid dynamic class lists | Frontend |

Mitigations rely on CI quality gates, clear conventions, and an incremental rollout with Storybook isolation and visual regression checks.[^6][^13][^24]

## Appendix: Reference Patterns and APIs

This appendix summarizes key APIs and references to accelerate implementation.

- Data Table: useReactTable with getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel; column definitions with enableSorting/enableHiding; table methods for pagination and selection; flexRender for headers and cells.[^9][^11]
- Forms: useForm, Controller for controlled inputs, zodResolver for schema validation; aria‑invalid and data‑invalid attributes; Field components for accessible labeling and error text; useFieldArray for dynamic list inputs (e.g., email arrays).[^16][^17][^18]
- Theming: CSS variables for semantic tokens across :root and .dark scopes; validate focus ring visibility and contrast ratios to meet WCAG AA.[^3]
- Accessible video modals: use Dialog with captions and transcripts where applicable, ensuring keyboard navigation and proper labeling.[^29]

---

## References

[^1]: The Foundation for your Design System - shadcn/ui. https://ui.shadcn.com/  
[^2]: Radix UI Primitives. https://www.radix-ui.com/primitives  
[^3]: Theming – shadcn/ui. https://ui.shadcn.com/docs/theming  
[^4]: Shadcn UI React Components (Overview). https://www.shadcn.io/ui  
[^5]: Headless Component: a pattern for composing React UIs | Martin Fowler. https://martinfowler.com/articles/headless-component.html  
[^6]: Headless UI – Unstyled, fully accessible UI components. https://headlessui.com/  
[^7]: Building Custom React Components with Headless UI Patterns. https://medium.com/@ignatovich.dm/building-custom-react-components-with-headless-ui-patterns-a6f046f62763  
[^8]: Data Table - shadcn/ui. https://ui.shadcn.com/docs/components/data-table  
[^9]: TanStack Table Documentation. https://tanstack.com/table/v8/docs/introduction  
[^10]: TanStack Table Pagination API. https://tanstack.com/table/v8/docs/api/features/pagination  
[^11]: TanStack Table Filtering Guide. https://tanstack.com/table/v8/docs/guide/filters  
[^12]: 5 React UI Libraries for High-Performing Web Apps | Bits and Pieces. https://blog.bitsrc.io/5-react-ui-libraries-for-high-performing-web-apps-7b222d8c83ca  
[^13]: React UI libraries in 2025: Comparing shadcn/ui, Radix, Mantine, MUI, Chakra. https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra  
[^14]: Dialog - shadcn/ui. https://ui.shadcn.com/docs/components/dialog  
[^15]: Alert Dialog - shadcn/ui. https://ui.shadcn.com/docs/components/alert-dialog  
[^16]: React Hook Form - shadcn/ui. https://ui.shadcn.com/docs/forms/react-hook-form  
[^17]: React Hook Form Documentation. https://react-hook-form.com  
[^18]: Zod Documentation. https://zod.dev/  
[^19]: Shadcn Admin - shadcn/ui Template. https://www.shadcn.io/template/satnaing-shadcn-admin  
[^20]: Admin Dashboard UI built with Shadcn and Vite (GitHub). https://github.com/satnaing/shadcn-admin  
[^21]: Material UI vs. ShadCN UI - Which Should You be using in 2024? https://blog.openreplay.com/material-ui-vs-shadcn-ui/  
[^22]: Shadcn vs. Material UI (MUI): Detailed Comparison Guide. https://djangostars.com/blog/shadcn-ui-and-material-design-comparison/  
[^23]: React-admin With Shadcn UI - Marmelab. https://marmelab.com/blog/2025/04/23/react-admin-with-shadcn.html  
[^24]: React Button Group - Bulk Actions - shadcn.io. https://www.shadcn.io/patterns/button-group-actions-3  
[^25]: Multi-Select Component | shadcn/ui React TypeScript. https://shadcn-multi-select-component.vercel.app/  
[^26]: Adding a new multi select component · shadcn-ui/ui (GitHub Discussion #859). https://github.com/shadcn-ui/ui/discussions/859  
[^27]: Multiple Selector - shadcnui expansions. https://shadcnui-expansions.typeart.cc/docs/multiple-selector  
[^28]: Alt-Text and Beyond: Making Your Website Accessible with shadcn/ui. https://www.newline.co/@eyalcohen/alt-text-and-beyond-making-your-website-accessible-with-shadcnui--0dd38704  
[^29]: Introduction - shadcn/ui. https://ui.shadcn.com/docs