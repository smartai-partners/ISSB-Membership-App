# Admin Dashboard User Management: Hierarchical Component Architecture Analysis and Supabase Adaptation Blueprint

## Executive Summary and Objectives

The current Admin Dashboard and User Management implementation presents a strong foundation for administrative control and oversight. The architecture is organized around six major feature components—AdminDashboard, UserManagement, MembershipManagement, EventManagement, ApplicationReview, and SystemSettings—each designed to encapsulate its domain’s state and interactions. Together, they cover end-to-end administrative workflows: summarizing operational metrics, performing user and membership CRUD, orchestrating event lifecycles, managing application reviews, and configuring system-level settings.

However, the existing design exhibits classic monolithic tendencies. These components frequently blend presentation, state management, data access, business logic, and side effects in a single file. As a result, the risk of regressions rises with each incremental feature, developer onboarding becomes more complex, and performance can degrade due to broad re-render surfaces and duplicated data fetching.

This blueprint proposes a shift to a hierarchical, layered architecture that emphasizes separation of concerns and composable patterns. At its core, the approach separates Page orchestration from feature modules, introduces hooks for data access and side effects, defines services for business logic, and standardizes presentational UI components. This structure improves maintainability by clarifying responsibilities and making flows testable. It also enhances user experience through consistent, accessible UI patterns and real-time updates that are consolidated rather than duplicated across the tree.

The blueprint is adapted to the current Supabase stack, aligning components with role-based access control and permissions, adopting transaction-safe edge functions for critical flows, and incorporating real-time subscriptions for time-sensitive updates. The outcome is a pragmatic migration path that is incremental, low-risk, and focused on reusable architectural patterns that can be extended across the volunteer portal and the wider admin dashboard ecosystem.[^6][^7]

![Admin dashboard baseline capabilities and entry point](/workspace/browser/screenshots/admin_dashboard.png)

### Scope and Assumptions

The scope centers on the six admin feature components and their immediate data flows. The stack remains React with TypeScript, styled using TailwindCSS, and supported by a Supabase backend. Role-based access control (RBAC) governs route access and component-level permissions. Critical workflows—capacity-managed signups/withdrawals, volunteer hour approvals, and waiver calculations—continue to run through Supabase Edge Functions to preserve transactional safety. The plan assumes incremental migration with minimal disruption to production deployments and user experience.[^7]

Information gaps exist. Detailed line-by-line internal wiring of certain components, the complete production code for every helper, and exact row-level security (RLS) policy shapes are not fully visible in the provided context. Real-time subscription strategies are implemented in parts of the volunteer portal but require consolidation here. Where uncertainties exist, the blueprint flags them and proposes mitigations and discovery tasks during implementation.

---

## Baseline Architecture: Admin Dashboard and User Management

The baseline comprises six primary components, each reflecting a domain-first boundary:

- AdminDashboard: Overview metrics and quick actions; a navigation hub and status snapshot for operators.
- UserManagement: Centralized user CRUD with advanced table operations—sorting, filtering, pagination—bulk actions, and modals for create/edit; heavy use of local state and permissions to guard UI and operations.
- MembershipManagement: Membership lifecycle and revenue tracking, with tier management, auto-renewal configuration, and bulk operations; also state-heavy with statistics derived locally.
- EventManagement: Event creation and editing, capacity and registration tracking, attendance analytics, and bulk lifecycle operations; local filtering and search.
- ApplicationReview: Multi-step application review with document and reference verification, communication workflows, and security alerts; substantial orchestration logic embedded in the component.
- SystemSettings: System health monitoring, settings management across varied types (string, number, boolean, JSON, date), backups, email configuration, and maintenance mode; tabbed interface with breadth of responsibilities.

These components share recurring patterns:
- Protected routing and role-based guards ensure only administrators access administrative surfaces.
- Permission checks gate actions at both route and component levels.
- Tables, filters, modals, and forms are consistent UI building blocks.
- Loading states, empty states, skeletons, and toasts provide user feedback patterns.

Data flows today are a mix of mock API integration points and direct Supabase interaction. The components are “integration-ready,” with clear placeholders for production services, but are not yet decoupled from UI. As a result, a new table pattern, form validation rule, or real-time subscription typically requires edits in multiple places.

The current design yields several maintainability challenges:
- High coupling between UI and logic due to embedded data access and side effects.
- Broad re-render surfaces because state is component-local and not isolated via hooks.
- Duplicate queries and inconsistent status handling across entities, especially where casing variants and mapping logic appear.
- Testing difficulty introduced by monolithic components with implicit dependencies.

![Admin dashboard metrics and quick actions view](/workspace/browser/screenshots/admin_dashboard_statistics.png)

![Memberships management page illustrating table-driven workflows](/workspace/browser/screenshots/memberships_management_page.png)

To ground responsibilities and issues, Table 1 summarizes each major component’s role and current coupling.

Table 1 — Admin Component Responsibilities and Current Coupling

| Component               | Primary Responsibilities                                     | Data Access                  | Local State/Side Effects                      | Key Issues Noted                                                                 |
|------------------------|---------------------------------------------------------------|------------------------------|-----------------------------------------------|----------------------------------------------------------------------------------|
| AdminDashboard         | Overview stats, recent activity, quick actions               | Mock API integration points  | Stats loading, periodic refresh                | Orchestration acceptable; data logic should move to hooks/services               |
| UserManagement         | User CRUD, advanced table ops, bulk actions, modals         | Mock API integration points  | Filtering, sorting, pagination, selection      | Heavy mixing of data, UI, and business logic; broad re-render surface            |
| MembershipManagement   | Membership lifecycle, revenue analytics, tiers, renewals    | Mock API integration points  | Stats computation, search, bulk operations     | Local derivation of analytics; duplication risk across entities                  |
| EventManagement        | Event CRUD, capacity/registration tracking, attendance      | Mock API integration points  | Filtering, search, bulk lifecycle operations   | Per-entity logic embedded; opportunity for reusable table patterns               |
| ApplicationReview      | Multi-step review workflow, verifications, communications   | Mock API integration points  | Review tracking, email communication flows     | Complex orchestration embedded; candidates for service orchestration             |
| SystemSettings         | System health, typed settings, backups, email, maintenance  | Mock API integration points  | Tabbed navigation, form handling, state checks | Broad responsibilities; strong case for hook/service extraction                  |

### Routing, Guards, and Permissions

Protected routes and role-based guards are central to the baseline. Route protection ensures only authenticated administrators access admin features, with specific permissions gating domain-specific sections: users, memberships, events, applications, settings, reports, notifications, and volunteer operations. These guards provide a reliable enforcement mechanism at the route boundary.

On the component side, permission checks govern visibility and action availability, typically via a usePermission store. Actions such as create, edit, or delete are hidden or disabled when the current user lacks the required permission. This pattern reduces accidental misuse and creates a consistent permission-driven UX across admin features.

### Current Component Inventory (Admin)

To visualize how today’s admin pages surface capabilities, Table 2 catalogs primary admin components, their dependencies, and key features. The inventory reflects a comprehensive suite with substantial overlap in table patterns, filters, and feedback UI.

Table 2 — Admin Component Inventory

| Component               | Core Features                                                                                           | Key Dependencies                               | Notes                                                                                 |
|------------------------|---------------------------------------------------------------------------------------------------------|-----------------------------------------------|---------------------------------------------------------------------------------------|
| AdminDashboard         | Stats cards, recent activity feed, quick actions, refresh                                               | Auth, permission store, Card, Table, Button    | Good orchestration surface; data logic to be moved into hooks/services                |
| UserManagement         | Advanced table ops (sort/filter/page), bulk ops, create/edit modals, role/tier/status management       | Auth, permission store, Table, Modal, Button   | High coupling and state mixing; prime candidate for refactor                          |
| MembershipManagement   | Membership stats, revenue analytics, tier management, renewals, bulk ops                                | Auth, permission store, Table, Modal, Button   | Local stats derivation; opportunity for standardized analytics hooks                   |
| EventManagement        | Event forms, capacity/registration tracking, attendance analytics, bulk publish/cancel/delete           | Auth, permission store, Table, Modal, Button   | Repetitive filters/search; reusable FilterBar and headless table recommended          |
| ApplicationReview      | Multi-step review with checklists, document/reference verification, email communication, security alerts| Auth, permission store, Table, Modal, Button   | Complex workflow; service orchestration will reduce component complexity              |
| SystemSettings         | System health monitoring, typed settings, backups, email config, maintenance mode                       | Auth, permission store, Forms, Tabs, Button    | Broad responsibilities; hook/service extraction essential for maintainability         |

---

## Hierarchical Component Responsibility Model

The proposed hierarchy brings clarity and scalability by separating roles and boundaries:

- Pages: Orchestrate flows and compose feature modules. They should be slim and declarative, delegating data access and business logic to hooks and services.
- Feature modules: Represent domain boundaries (users, memberships, events, applications, settings). They orchestrate within the domain and export public APIs (components and hooks).
- Entities: Define shared domain types, enums, and DTOs. They enforce consistent naming, casing, and contracts.
- UI components: Presentational building blocks (Card, Table, Button, Input, Modal, Tabs) designed for accessibility and reuse; ideally headless or lightly skinned to support diverse contexts.
- Hooks: Encapsulate data access, side effects, and subscriptions. They memoize, select, and expose minimal APIs to components.
- Services: Implement business workflows and coordinate API calls. They orchestrate across hooks and entities for transactional flows.

This layering fosters testability, composability, and scaling. Pages become easy to reason about, features modular, and UI consistent. Hooks and services can be tested in isolation, mocked, or replaced without affecting presentation. The model aligns well with Supabase: RLS governs data access at the database layer; edge functions encapsulate transactional flows; and real-time subscriptions are consolidated via hooks to reduce channel proliferation.[^7]

![Memberships table illustrating presentational patterns amenable to headless design](/workspace/browser/screenshots/memberships_after_refresh.png)

Table 3 — Responsibility Layering Map

| Layer               | Role                                                                                   | Typical Contents                                    | Public API Surface                                 |
|--------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------|----------------------------------------------------|
| Pages              | Route orchestration; compose features                                                   | Route component, feature imports                    | Page component; minimal local state                |
| Features           | Domain orchestration and exports                                                        | Components, hooks, services for a domain            | Named exports (components/hooks)                   |
| Entities           | Domain types, enums, DTOs, schemas                                                      | TypeScript interfaces/enums; runtime validation     | Re-exported types and schemas                      |
| UI components      | Presentational rendering                                                                | Card, Table, Button, Input, Modal, Tabs, Badge      | Props-only APIs; no data or business logic         |
| Hooks              | Data access and side effects                                                            | useX queries/mutations; subscriptions               | Data functions; callbacks; state selectors         |
| Services           | Business workflow coordination                                                          | Orchestration across hooks; edge function calls     | Functions for workflows; not UI-aware              |

### Separation of Concerns Patterns

- Presentational components: Dumb rendering and interaction; no data access. They accept typed props and emit events.
- Hooks for data access: Centralize Supabase queries and edge function invocations; handle pagination, filtering, and selection via memoized selectors.
- Service modules: Implement cross-feature workflows (e.g., membership renewals, event lifecycles) and encapsulate transactional logic.
- Permission-first composition: Gates and guards define what users can see and do; components receive permission contexts via props or hooks.

### Component Interaction Flows

Data and event flows adhere to predictable patterns:
- Page → Feature component → Hook → Service → Supabase/Edge function. Each boundary is explicit and typed.
- CRUD flows rely on hooks for mutations and services for orchestration; UI components only emit intent (create, edit, delete) with validation feedback.
- Optimistic updates can be scoped to hooks to reduce re-render surface and improve responsiveness.
- Real-time subscriptions are consolidated at the feature level (or page level when appropriate) to minimize channels and ensure consistent updates.

---

## Adaptation to Supabase-based Islamic Society Volunteer Portal

Adapting the hierarchical model to the volunteer portal enhances both maintainability and UX. The volunteer domain benefits from precise orchestration of signups, capacity, approvals, and analytics.

- Transactional flows: Edge functions manage capacity-safe signups/withdrawals, waiver recalculations after approvals, and analytics aggregation. These functions serve as the canonical endpoints for business-critical operations.[^1][^2][^3][^4]
- Real-time updates: Consolidate subscriptions at the page or feature level to reduce per-card channels. Selected entities—opportunities, signups, hours—should emit updates through memoized selectors rather than local component state.
- Permission-aware UI: Use guards and permission checks to drive visibility and actions in volunteer-related admin views (approvals, analytics, capacity management).

![Volunteer management analytics view illustrating current capabilities](/workspace/browser/screenshots/admin_dashboard_for_memberships.png)

![Member volunteer portal baseline (before architectural changes)](/workspace/browser/screenshots/final_volunteers_page_state.png)

Table 4 — Feature-to-Edge Function Mapping

| Admin Workflow                        | Edge Function                 | Required Data                          | Success/Error Outcomes                                  |
|--------------------------------------|-------------------------------|----------------------------------------|----------------------------------------------------------|
| Capacity-managed signup/withdraw     | manage-opportunity-capacity   | opportunityId, memberId, action        | ok + updated opportunity; capacity violations handled     |
| Volunteer hour approval/rejection    | approve-volunteer-hours       | hourId, decision, note (optional)      | ok + status; waiver recalculation if applicable          |
| Waiver recalculation                 | calculate-volunteer-waiver    | memberId                               | approvedHours, threshold, percent, eligible, applied     |
| Program analytics overview           | volunteer-analytics           | none (scope-level)                     | totals, utilization, top opportunities, activity feed    |

Table 5 — Real-time Subscription Plan

| Entity               | Subscription Scope                   | Update Strategy                                  | Memoization Target                     |
|----------------------|--------------------------------------|--------------------------------------------------|----------------------------------------|
| Opportunities        | Page-level (filtered set)            | Debounced updates; per-ID selectors for cards    | Filtered lists; stable reference keys  |
| Signups              | Feature-level (my signups)           | Push updates to sign-up rows and badges          | Row selectors by member/opportunity    |
| Hours                | Feature-level (admin approvals)      | Approvals trigger recompute of waiver progress   | Approval queue selector                |

### Edge Function Integration Patterns

- Typed request/response contracts: Hooks and services should define exact payload shapes and validate responses using runtime schemas (e.g., Zod) for consistency.
- Error handling and feedback: Mutations return structured outcomes with user-friendly messages; toasts communicate success or failure without blocking workflows.
- Optimistic updates: Apply optimistic states for quick UX feedback (e.g., updating sign-up status or approval queue rows), then reconcile with server responses.

### Real-time and Performance Considerations

- Subscription consolidation: Replace per-card channels with page/feature-level subscriptions and per-ID selectors to reduce overhead.
- Memoization strategies: Filter results, list items, and row selections should be memoized to avoid re-render cascades.
- List virtualization: For large datasets—member lists, event rosters—consider virtualization to improve scroll performance and responsiveness.

---

## Reusable Architectural Patterns Across the Admin Dashboard

The admin suite demonstrates several patterns that can be standardized and reused across domains:

- Permission-first composition: Gate routes and UI actions with RBAC. Guards define the outer boundary; per-component checks determine availability.
- Advanced table patterns: Sorting, filtering, pagination, bulk selection, and row actions appear repeatedly and should be abstracted into headless table components.
- Modal-driven forms and validations: Create/edit forms in modals reduce navigation friction. Standardize validation schemas and error feedback.
- Statistics dashboards and activity feeds: Common cards, skeletons, empty states, and refresh mechanisms can be unified to deliver consistent UX.

![Consistent data tables and action affordances across admin pages](/workspace/browser/screenshots/admin_users_page_attempt.png)

![Feedback patterns (edit modal) suitable for standardization](/workspace/browser/screenshots/after_edit_click.png)

![Confirmation patterns (delete) suitable for standardization](/workspace/browser/screenshots/delete_confirmation.png)

Table 6 — Pattern Catalog

| Pattern                     | Problem                                       | Solution                                                    | Reuse Scope                              | Risks/Notes                                        |
|----------------------------|-----------------------------------------------|-------------------------------------------------------------|-------------------------------------------|----------------------------------------------------|
| Permission-first composition| Variable access and action visibility          | Route guards + component-level permission checks            | All admin features                         | Maintain permission dictionary consistency         |
| Advanced table patterns    | Repetitive list ops across domains            | Headless table + hooks for sort/filter/page/bulk            | Users, memberships, events, applications   | Ensure flexible cell rendering and actions         |
| Modal-driven forms         | Navigation friction for create/edit           | Modal forms + consistent validation and feedback            | All domains                                | Watch for deep nesting; standardize focus management |
| Stats cards + activity feed| Dispersed metrics and recent events           | Common card styles, skeletons, and feed components          | AdminDashboard, admin summaries            | Centralize data sources to avoid divergence        |
| Toast feedback             | Ad hoc alerts and confirmations               | Centralized toaster system                                  | All features                               | Standardize intent colors and durations            |

### Shared Component Inventory

A proposed shared component inventory reinforces reuse and consistency across admin features:

Table 7 — Shared UI Components

| Component         | Variants/States                                  | Dependencies      | Primary Use Cases                                  |
|-------------------|---------------------------------------------------|-------------------|----------------------------------------------------|
| Table             | Sortable columns, row actions, selection         | Headless + Tailwind| Lists across users, memberships, events            |
| FilterBar         | Search input, multi-select, toggles              | Headless controls | Domain-specific filters for tables                 |
| Pagination        | Page size, navigation                            | Hooks + Tailwind  | Long lists                                         |
| Modal             | Sizes, close behaviors                           | Headless dialog   | Create/edit forms, confirmations                   |
| Button            | Sizes, variants, icons                           | Tailwind          | Actions across features                            |
| Input             | States (error, disabled)                         | Tailwind          | Search fields and form inputs                      |
| Badge             | Intent colors, dot indicators                    | Tailwind          | Status tags across entities                        |
| ProgressBar       | Determinate/indeterminate                        | Tailwind          | Capacity and waiver progress indicators            |
| Card              | Header/footer slots, media                       | Tailwind          | Stat cards and content panels                      |
| Skeleton          | Shimmer/novelty                                  | Tailwind          | Loading placeholders                               |
| Toast/Alert       | Intents, dismissible                             | Toaster system    | Success/error feedback                             |
| Tabs              | Keyboard semantics                               | Headless tabs     | System settings, admin summaries                   |

---

## Refactoring Plan and Migration Strategy

A pragmatic, phased migration minimizes risk while delivering incremental improvements. The plan prioritizes extraction of services and hooks, division of presentational components, normalization of types and DTOs, performance optimizations, and test coverage.

Table 8 — Migration Timeline and Priorities

| Phase | Scope                                      | Tasks                                                                                      | Acceptance Criteria                                                                 |
|-------|--------------------------------------------|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| 1     | Services extraction                         | capacityService, hoursService, signupService, waiverService, analyticsService              | Edge function calls consolidated; typed contracts; tests green                      |
| 2     | Hooks for data access                       | useUsers, useMemberships, useEvents, useApplications, useSettings                          | Components no longer call Supabase directly; hooks memoized                         |
| 3     | Presentational split                        | Card, Table, FilterBar, Modal, Badge, ProgressBar as pure components                       | UI components accept typed props; no data logic imports                             |
| 4     | Pages as orchestrators                      | UsersPage, MembershipsPage, EventsPage, ApplicationsPage, SettingsPage                     | Pages <200 LOC; routing tests pass; orchestration via hooks/services                |
| 5     | Status normalization                        | Canonical status enums; update payloads to uppercase                                       | No case-based branches in UI; schema alignment                                      |
| 6     | Performance optimization                    | Page/feature-level subscriptions; list virtualization; memoized selectors                  | Stable performance metrics; reduced re-renders; no visual regressions               |
| 7     | Tests & QA                                  | Unit tests for hooks/services; e2e flows for CRUD, approvals, bulk ops                     | CI gates in place; manual checklist passed                                          |
| 8     | Documentation & rollout                     | Component READMEs, runbooks; developer onboarding; feature flags                           | Docs complete; phased rollout; rollback plans documented                            |

### Risk and Rollback

- Backward-compatible APIs: Maintain existing props and events until components fully migrated; deprecate gradually.
- Feature flags: Gate new services/hooks; disable quickly if issues arise.
- Telemetry: Monitor error rates and performance during rollout; establish dashboards for visibility.
- Service-level rollback: Disable new hooks/services first; revert UI changes only if necessary.

---

## Testing, Observability, and Accessibility

Quality gates are essential for sustainable refactoring. Unit tests cover hooks and services; integration tests validate component interactions; end-to-end tests confirm critical admin flows; accessibility checks ensure inclusive UX; performance monitoring validates improvements.

Table 9 — Test Coverage Matrix

| Component/Service            | Unit Tests                         | Integration Tests                        | E2E Flows                                       | Accessibility Checks                         |
|------------------------------|------------------------------------|------------------------------------------|-------------------------------------------------|----------------------------------------------|
| useUsers / usersService      | Filtering, sorting, CRUD           | Table interactions with mocks            | Create/edit/delete user; bulk ops               | Keyboard navigation on table; ARIA roles      |
| useMemberships / membershipsService | Stats derivation, renewals     | Modal form handling                      | Tier changes; renewal configuration             | Form labels; focus management                 |
| useEvents / eventsService    | Capacity calculations, lifecycle   | Filtering/search interactions            | Publish/cancel/delete; attendance analytics     | Dialog semantics; table headers               |
| useApplications / applicationService | Review transitions       | Checklist interactions                   | Approve/reject; communication workflows         | Status semantics; screen reader clarity       |
| useSettings / settingsService| Type validation, backups           | Tabbed navigation                         | Update settings; maintenance mode toggles       | Tabs keyboard semantics                       |
| Edge function wrappers       | Contract validation                | Error handling and toasts                 | Capacity signup/withdraw; approvals             | Feedback clarity; alert intents               |

### Observability Plan

- Lightweight timing logs around service calls for performance insight.
- Rerender count tracking for critical flows (CRUD, approvals, bulk ops) to validate optimization impact.
- Telemetry integration for error rates and success/failure outcomes across mutations.

---

## Implementation Roadmap and Success Metrics

A phased rollout aligns development with user impact and risk mitigation. Start with high-coupling, high-value areas (UserManagement) to deliver early wins. Follow with adjacent domains, standardizing UI and data patterns as you go.

Table 10 — Roadmap and Milestones

| Phase | Scope                                      | Owner            | Success Metrics                                                             | Dependencies                     |
|-------|--------------------------------------------|------------------|------------------------------------------------------------------------------|----------------------------------|
| 1     | Services extraction (volunteer + admin)    | Frontend/Backend | Reduced duplicated queries; typed contracts; passing unit tests             | Edge functions; types            |
| 2     | Hooks for data access                      | Frontend         | Slimmer components; consistent data access; improved testability            | Services                         |
| 3     | Presentational split                       | Frontend         | Reusable UI kit; consistent visuals; zero data logic in UI                  | Hooks/services                   |
| 4     | Pages as orchestrators                     | Frontend         | Page LOC reduction; routing tests green; orchestration clarity              | Hooks/services                   |
| 5     | Status normalization                       | Backend/Frontend | No case-based branches; schema alignment; simplified comparisons            | Entities/DTOs                    |
| 6     | Performance optimization                   | Frontend         | Fewer subscriptions; lower rerenders; stable or improved performance        | Phases 1–4                       |
| 7     | Tests & QA                                 | QA/Frontend      | CI gates enforced; manual checklist passed                                  | Phases 1–6                       |
| 8     | Documentation & rollout                    | Tech Lead/PM     | Docs and onboarding complete; feature flags; rollback plans in place        | Phases 1–7                       |

Success metrics to track:
- Time-to-implement for new features.
- Reduction in duplicated queries and state.
- Consistency of UI and interactions.
- Developer ergonomics and onboarding time.
- Regression rates in critical workflows.
- Performance stability and rerender counts.

![Final verification point for admin users page state](/workspace/browser/screenshots/final_users_page_state.png)

---

## Information Gaps and Assumptions

- The full Admin Dashboard User Management plan text and diagram were not provided; analysis is based on implemented components and route documentation.
- Detailed wiring of all helper functions and edge cases within components is not fully visible; refactor specifics will be validated during Phase 1–2.
- Supabase schema exports and RLS policy texts are partially referenced; final integration may require schema and policy adjustments.
- Real-time subscription strategy is implemented in volunteer pages; consolidation for admin workflows will be confirmed during Phase 6.
- Performance metrics are not available; baselines will be established and targets defined prior to rollout.

These gaps do not hinder initial phases but must be closed before Phase 5–8 to ensure type safety, performance, and security guarantees.

---

## References

[^1]: Supabase Edge Function: manage-opportunity-capacity — https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/manage-opportunity-capacity  
[^2]: Supabase Edge Function: calculate-volunteer-waiver — https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/calculate-volunteer-waiver  
[^3]: Supabase Edge Function: approve-volunteer-hours — https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/approve-volunteer-hours  
[^4]: Supabase Edge Function: volunteer-analytics — https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/volunteer-analytics  
[^5]: Production Portal (Member Volunteer Page) — https://fvkx52b660xj.space.minimax.io/volunteers  
[^6]: Production Portal (Admin Volunteer Management) — https://fvkx52b660xj.space.minimax.io/admin/volunteers  
[^7]: Supabase Dashboard — https://lsyimggqennkyxgajzvn.supabase.co  
[^8]: Production Portal (Home) — https://fvkx52b660xj.space.minimax.io