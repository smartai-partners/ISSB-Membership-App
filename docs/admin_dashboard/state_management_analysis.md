# State Management for an Admin Dashboard: Evaluating React Query + Zustand vs. RTK Query with User Management Focus

## Executive Summary and Recommendation Snapshot

Modern admin dashboards operate across two distinct categories of state: server state (remote data retrieved and mutated via APIs) and client UI state (local, ephemeral UI logic, preferences, and view controls). This separation is the central design principle behind the proposed React Query plus Zustand approach for user management. React Query (also known as TanStack Query) excels at server state through robust caching, invalidation, and synchronization primitives. Zustand is a lightweight client-state library that favors minimal boilerplate, selective subscriptions, and many small stores, making it well-suited for UI concerns like filters, panel visibility, and form state[^1][^2][^4][^5][^12].

Our current Redux Toolkit with RTK Query already provides a strong, integrated foundation for data fetching, caching, and store-based global client state. The most pragmatic path forward is not a wholesale replacement but an incremental adoption of React Query and Zustand patterns within the existing RTK/RTK Query codebase. Specifically, we should borrow React Query’s explicit stale-while-revalidate semantics, refined cache timing (staleTime, gcTime), optimistic mutation rollback, and query key factory conventions; and apply Zustand’s atomic selectors and event-driven actions for UI state in small, targeted stores. RTK Query’s providesTags/invalidatesTags, lifecycle hooks (onQueryStarted, onCacheEntryAdded), and cache utilities (updateQueryData, upsertQueryData) can replicate these patterns without fragmenting the stack[^1][^3][^5][^7][^9][^12].

Recommendation: Pursue Pattern Adoption inside RTK Query (P0), supplemented by selective Zustand introduction for complex UI state (P1). Avoid a full migration unless there is clear evidence of systemic friction—e.g., repeated difficulties managing client UI state within Redux or persistent perf/re-render hotspots tied to store-wide subscriptions. This phased stance minimizes risk, preserves established tooling, and realizes the ergonomic benefits of React Query and Zustand through RTK Query’s mature equivalents[^1][^3][^4][^9][^12].

To illustrate the intended division of responsibilities, Table 1 maps user management features to proposed libraries and the rationale.

Table 1. User management feature-to-state-library mapping

| Feature | Server State Tool | Client State Tool | Rationale |
|---|---|---|---|
| Auth session (token, profile) | RTK Query (profile query, token header) | Optional: Zustand for ephemeral UI (e.g., sessionBanner) | RTK Query centralizes auth flows and token injection; UI toggles remain local[^3][^5]. |
| Role/permission checks | RTK Query (profile includes roles) | Zustand for UI toggles (e.g., “show admin tools”) | Server remains source of truth; UI controls remain lightweight[^5]. |
| User list (filters, pagination, sort) | RTK Query with providesTags/invalidatesTags | Zustand filters store triggers query invalidation | Zustand holds UI state, triggers targeted invalidations in RTK Query[^1][^4]. |
| User details/edit | RTK Query for data and cache updates | Zustand for draft/edit UI state | Keep server data in RTK Query; UI draft state small and isolated[^1][^4]. |
| Optimistic updates | RTK Query onQueryStarted + updateQueryData | — | Use cache utilities for immediate updates and rollback[^1]. |
| Streaming presence | RTK Query onCacheEntryAdded | Zustand for transient UI (e.g., “live” indicator) | RTK Query manages streaming cache; UI indicators minimal[^1]. |

The key insight is that React Query’s strengths map cleanly to RTK Query’s feature set, while Zustand’s ergonomic benefits for UI state can be adopted incrementally without major architectural upheaval.

## Scope, Context, and Current State (Phase 1 RTK Query Baseline)

The scope of this analysis is user management within an admin dashboard: authentication (login/logout), session handling, role-based access control, user lists and details, and optimistic UI during mutation. In Phase 1, we established a Redux Toolkit store with RTK Query for server data and standard Redux slices for client auth state. The approach is well-documented and battle-tested: token handling via prepareHeaders in fetchBaseQuery; profile queries; protected routes; and polling for session refresh. Together, RTK Query and Redux Toolkit form a coherent, integrated solution for both server and client state, reducing the need for external orchestration[^3][^5][^8].

While our codebase is robust, certain friction points may still appear in complex UI flows: managing filter state across lists, composing local form drafts without triggering global re-renders, orchestrating optimistic updates with rollback cleanly, and tuning cache lifetimes for heavy lists. These are not flaws in RTK Query; rather, they are areas where adopting specific React Query and Zustand patterns can improve clarity and performance without abandoning our foundation[^1][^2][^4][^9][^12].

## Foundations: Server State vs Client UI State

The conceptual boundary is straightforward yet powerful. Server state is remote data fetched or mutated through APIs—users, roles, permissions, sessions. Its lifecycle revolves around caching, invalidation, background synchronization, and staleness. Client UI state includes ephemeral choices that never hit the server—current filter selection, column sort preference, modal open/close, draft edits. By keeping these categories separated, we reduce cross-coupling and avoid mixing server truth with transient UI concerns[^7][^12].

React Query and RTK Query both operate in the server state domain, albeit with different integration models. React Query is a standalone async state manager with cache hydration and a query client; RTK Query is deeply integrated into Redux and emits actions, reducers, and middleware as part of the store. Zustand serves client state with a hook-based API and encourages multiple small stores with atomic selectors. These differences lead to varied developer experiences, but the functional overlap in server-state handling is substantial[^1][^3][^6][^7][^12].

Table 2 organizes responsibilities and typical lifetime by category.

Table 2. State categories matrix

| State Category | Owner Library | Typical Data | Lifetime | Read/Write Patterns | Examples |
|---|---|---|---|---|---|
| Server state | React Query / RTK Query | Users, roles, sessions | Cache with stale-while-revalidate; invalidations/mutations | Query hooks; cache updates; invalidation tags | List users, edit profile, auth profile[^3][^12]. |
| Client UI state | Zustand (or Redux slices) | Filters, toggles, drafts | Session or component lifetime; no server sync | Selective subscriptions; event-driven actions | Filter panel, column sort, modal visibility[^4]. |
| URL state | React Router | Route params, query params | Tied to navigation | Loaders, outlets; useParams/useSearchParams | /users?page=2&role=admin. |

Separation at this level provides a blueprint for clean ownership, simpler testing, and deliberate tuning of cache lifecycles independent of UI controls.

## Comparative Evaluation: React Query + Zustand vs. RTK Query

This comparison centers on features relevant to user management: caching and invalidation, optimistic updates, SSR/hydration, developer experience, and performance characteristics.

- Caching and invalidation. React Query relies on query keys, staleTime, gcTime, and invalidateQueries to manage freshness; RTK Query uses providesTags/invalidatesTags for fine-grained cache control and keepUnusedDataFor timers for retention. Both implement stale-while-revalidate and background refetching[^1][^6][^9].
- Optimistic UI. React Query exposes mutation lifecycle callbacks for onMutate/onError/onSettled, enabling immediate cache updates and rollbacks. RTK Query achieves similar via onQueryStarted and updateQueryData/upsertQueryData with undo support[^1][^9].
- SSR/hydration. React Query offers queryClient.prefetchQuery and dehydration/hydration for server-rendered apps. RTK Query supports SSR within the Redux store and can initialize data prior to render; hydration patterns are well-documented in RTK’s advanced usage[^1][^3][^9].
- Developer experience. React Query’s standalone model reduces Redux ceremony and focuses on async state; RTK Query’s tight Redux integration standardizes data flows within a single store and offers powerful cache utilities and selectors[^3][^7][^9]. Zustand’s ergonomic hooks and atomic selectors shine for UI concerns[^4][^10].
- Performance. Zustand is lightweight and fast for selective subscriptions; Redux Toolkit has more overhead due to its integrated tooling but remains optimized. In the absence of internal benchmarks, qualitative claims are appropriate—Zustand tends to be faster for small, isolated client stores; RTK scales well within Redux’s structured ecosystem[^2][^11].

Table 3 synthesizes these differences.

Table 3. Feature comparison

| Feature | React Query + Zustand | RTK Query (with Redux Toolkit) | Notes |
|---|---|---|---|
| Caching | Query keys, staleTime, gcTime, invalidateQueries | providesTags/invalidatesTags, keepUnusedDataFor | Both support fine-grained invalidation; RTK adds tag-based control[^1][^6][^9]. |
| Optimistic updates | useMutation lifecycle | onQueryStarted + updateQueryData/upsertQueryData | Both support rollback; RTK leverages Immer-style drafts[^1][^9]. |
| SSR/hydration | prefetchQuery/dehydrate/hydrate | Redux-integrated SSR and hydration | Conceptual parity; mechanics differ due to store integration[^1][^3][^9]. |
| DX | Standalone async state; minimal boilerplate | Integrated store, selectors, middleware; consistent patterns | Choose based on existing stack and team familiarity[^3][^7]. |
| Client UI state | Zustand with atomic selectors | Redux slices; Zustand optionally for UI-only | Zustand simplifies selective subscriptions and small stores[^4][^10]. |
| Performance | Lightweight client updates; fast subscriptions | Structured global state; overhead for complex apps | No internal benchmarks available[^2][^11]. |

In practice, the overlap is extensive. React Query patterns can be mapped to RTK Query features; Zustand complements both by simplifying UI concerns.

## React Query Patterns We Can Adapt Into RTK Query

The most valuable React Query patterns translate directly to RTK Query equivalents without changing the core library.

- staleTime/gcTime vs keepUnusedDataFor. Treat “freshness” and retention similar to RTK Query’s keepUnusedDataFor. Set reasonable retention for lists and details; leverage background refetch to keep data current without heavy polling[^6][^9].
- Query Key Factory. Adopt a consistent naming scheme in RTK Query’s endpoint keys and query args; RTK’s tags (e.g., {type: 'User', id}) can act like query key segments for invalidation[^1][^6].
- Optimistic mutations with rollback. Use onQueryStarted to update cache via updateQueryData; if mutation fails, patchResult.undo() reverts the change—equivalent to React Query’s onError/onSettled flow[^1][^9].
- Selective re-renders. Use selectFromResult on useQuery hooks to derive minimal state for components; memoize outputs so only relevant changes trigger renders[^1].
- SSR hydration. For server-rendered routes, initialize data with RTK Query and hydrate the store prior to client render; this aligns conceptually with React Query’s dehydrate/hydrate approach[^1][^9].

Table 4 maps these patterns explicitly.

Table 4. Pattern mapping: React Query → RTK Query

| React Query Pattern | RTK Query Feature | Where Applied (Users) |
|---|---|---|
| staleTime/gcTime | keepUnusedDataFor; automated refetch | User list and details caching windows[^6][^9]. |
| Query Key Factory | providesTags/invalidatesTags | Tagging users, roles for targeted invalidation[^1]. |
| Optimistic rollback | onQueryStarted + updateQueryData (undo) | Edit user, role change, activate/deactivate[^1][^9]. |
| Selective re-render | selectFromResult | List table deriving filtered rows[^1]. |
| SSR hydration | Redux store hydration | Profile pages, dashboard home[^1][^9]. |

Adopting these patterns preserves our investment in RTK Query while achieving the clarity and guardrails typical of React Query.

## Zustand Patterns to Complement Redux Toolkit/RTK Query

Zustand’s ergonomic model for client UI state provides a practical complement to Redux Toolkit’s global store.

- Export custom hooks only; avoid raw store usage. Consumers receive explicit selectors, reducing accidental global subscriptions[^4].
- Prefer atomic selectors. Separate hooks for individual values prevent new object/array allocations from triggering unnecessary re-renders. For multi-slice reads, use shallow comparison or separate hooks[^4].
- Separate actions from state. Keep actions as a stable object within the store and expose them via a dedicated hook, allowing destructuring without subscribing to changing state[^4].
- Model actions as events. Favor event-driven methods (e.g., toggleRoleFilter) over direct setters, aligning with Redux style guidance[^4][^13].
- Keep stores small; compose via hooks. Prefer multiple small stores; combine logic in custom hooks rather than large monolithic slices[^4].
- Integrate with queries. Use a Zustand UI store to hold filter state and trigger query invalidations or refetches in RTK Query, keeping server data solely in RTK[^4].

Table 5 catalogs typical UI state candidates for Zustand.

Table 5. UI state candidates and ownership

| UI Concern | Library | Why Zustand | Interaction with RTK Query |
|---|---|---|---|
| Filter panel state | Zustand | Local, transient; selective subscriptions | Triggers invalidation of users list via tags[^1][^4]. |
| Column sort preference | Zustand | Per-user preference; no server sync | Read by component; server sorting done via RTK[^4]. |
| Draft edit state | Zustand | Isolated to editor; ephemeral | On save, mutation updates RTK cache[^1][^4]. |
| Modal visibility | Zustand | Fast toggle; minimal footprint | No server impact; purely UI[^4]. |
| Live indicator | Zustand | UI-only signal | Derived from streaming cache via RTK[^1][^4]. |

These patterns can be introduced incrementally in areas where Redux slices feel heavy or re-render hotspots persist.

## User Management Domain Patterns

User management presents a consistent set of flows where server and client state intersect. The following patterns show how to handle each within our current RTK Query baseline, borrowing ideas from React Query and Zustand as needed.

Table 6 summarizes ownership by feature.

Table 6. User flows: data ownership and triggers

| Flow | Server/Client Owners | Triggering Events |
|---|---|---|
| Login/Logout | Server: RTK Query auth endpoints; Client: Redux auth slice | Login form submit; logout action; token refresh[^5]. |
| Session refresh | Server: RTK Query profile; Client: Optional UI banner | Periodic polling; visibility change[^5]. |
| RBAC | Server: roles in profile; Client: UI toggles | Route navigation; feature access checks[^5]. |
| User list | Server: RTK Query users list; Client: Zustand filters | Filter changes; pagination; invalidations[^1][^4]. |
| User details/edit | Server: RTK Query details; Client: Zustand draft | Edit form updates; save mutation[^1][^4]. |
| Optimistic changes | Server: RTK Query cache update; Client: UI rollback | onQueryStarted, patchResult.undo()[^1]. |
| Streaming presence | Server: RTK Query onCacheEntryAdded; Client: Zustand indicator | WebSocket message; cache update[^1]. |

### Authentication and Session (Login, Logout, Profile, RBAC)

Leverage fetchBaseQuery’s prepareHeaders to inject tokens from the Redux store. Use RTK Query endpoints for profile queries, with polling intervals tuned for session refresh. Synchronize profile data into the Redux auth slice with extraReducers or matchers to track loading and user info. Protected routes check the presence of user info before granting access. Role checks derive from the profile, and UI features conditionally render based on roles[^3][^5][^14].

This approach keeps server truth in RTK Query and client metadata in Redux, ensuring consistent access control without duplicating server state.

### User List and Filters (List, Search, Pagination, Sort)

Model the users list endpoint with providesTags for general and per-entity tags. Hold UI filters in a small Zustand store; when filters change, trigger invalidation using RTK Query’s invalidatesTags for the relevant tag (e.g., 'UserList'). For list windows, tune keepUnusedDataFor to balance memory and retention, and employ selectFromResult to derive minimal state (filtered rows, total) for the table component, minimizing re-renders[^1][^4][^9].

The pattern ensures UI filters remain isolated and fast while RTK Query owns list data and targeted invalidations.

### User Details, Draft Edits, and Optimistic Updates

Fetch user details via a query endpoint; hold draft edits (e.g., role changes) in a Zustand store scoped to the editor component. On save, initiate an RTK Query mutation with onQueryStarted to optimistically update the details cache via updateQueryData. If the mutation fails, patchResult.undo() reverts the change, preserving consistency and reducing perceived latency[^1][^9].

This approach keeps server data authoritative in RTK Query while isolating UI drafts and providing robust rollback.

### Streaming Presence and Real-time Events

For WebSocket or streaming sources, use onCacheEntryAdded to attach to the cache entry lifecycle. Wait for cacheDataLoaded, then update cached data as messages arrive. Use a minimal Zustand store for transient UI indicators (e.g., “online”), ensuring no server data duplication. This pattern cleanly separates real-time server updates from UI state, and automatically cleans up when the cache entry is removed[^1][^9].

## Integration Architecture and Module Boundaries

Define module boundaries to avoid overlap and duplication. RTK Query “owns” all server data: users, roles, sessions, and related cache entries. Zustand owns purely UI state: filter selections, sort preferences, drafts, modals, and transient indicators. Redux slices remain for client auth metadata (user info, token, loading flags), integrating with RTK Query via prepareHeaders and matchers[^1][^4][^9].

Introduce a Query Key/Tag Factory to standardize naming across users, roles, permissions, and sessions. Adopt endpoint injection (injectEndpoints) to modularize endpoint definitions per domain and support code-splitting. Use selectFromResult widely for components that derive small slices of data from large queries, keeping render surfaces narrow[^1][^9].

Table 7 assigns ownership by domain.

Table 7. Module ownership map

| Domain | Owners | Boundary Rules |
|---|---|---|
| Auth | RTK Query endpoints + Redux auth slice | RTK Query fetches profile; Redux holds metadata; Zustand optional for UI banners[^5]. |
| Users | RTK Query endpoints | Zustand for filters/drafts; server data only via RTK[^1][^4]. |
| Roles/Permissions | RTK Query endpoints | UI toggles in Zustand; invalidations targeted via tags[^1]. |
| UI | Zustand stores | No server data; triggers RTK invalidations/refetches[^4]. |

This architecture keeps responsibilities explicit, minimizing cross-talk and re-renders.

## Performance and Rendering Considerations

Rendering performance is primarily a function of subscription scope and cache lifecycles. In Zustand, prefer atomic selectors to avoid subscribing to entire store objects; export custom hooks for each selected value. This yields fine-grained updates and minimal re-renders. In RTK Query, use selectFromResult to derive only the fields a component needs and leverage memoization so only changes to derived values trigger re-renders. For list endpoints, tune keepUnusedDataFor to avoid unnecessary refetches when users navigate away and return quickly; for rarely accessed resources, a shorter retention reduces memory footprint[^1][^4][^9][^11].

A qualitative comparison suggests Zustand is lightweight and fast for small, isolated UI stores, while Redux Toolkit provides structure and dev tooling at the cost of additional overhead. No internal benchmarks are available; performance improvements should be measured via controlled rollouts and component-level profiling before broad adoption[^2][^11].

Table 8 links common hotspots to mitigations.

Table 8. Hotspots and mitigations

| Hotspot | Symptom | Mitigation |
|---|---|---|
| Global store subscriptions | Many components re-render | Zustand atomic selectors; custom hooks only[^4]. |
| Large table re-renders | Slow list interactions | RTK Query selectFromResult; memoized derived rows[^1]. |
| Frequent refetches | Unnecessary network traffic | Tune keepUnusedDataFor; leverage background refetch[^9]. |
| Filter changes cause full re-render | UI jank | Zustand filter store; invalidation targeted via tags[^1][^4]. |

## Migration and Adoption Strategy

We propose a phased, low-risk path that avoids big-bang replacement:

- Phase 0: Establish conventions. Standardize query key/tag names, cache timings (keepUnusedDataFor), and selective subscription patterns across the codebase[^1].
- Phase 1: Introduce UI Zustand stores for filters/drafts where Redux feels heavy. Measure re-render reductions and developer ergonomics[^4].
- Phase 2: Bring React Query patterns into RTK Query. Use onQueryStarted for optimistic updates, selectFromResult for narrow subscriptions, and tag-based invalidations for targeted refetching[^1][^9].
- Phase 3: Evaluate hybrid adoption where friction persists (e.g., non-Redux contexts or complex client-only flows). Consider standalone React Query in tightly scoped modules if warranted[^2][^12].

Table 9 structures the plan.

Table 9. Adoption plan

| Phase | Goals | Changes | Owner | Success Metrics |
|---|---|---|---|---|
| 0 | Conventions | QueryKey/Tag factory; cache timings | Platform team | Reduced PR churn on data plumbing[^1]. |
| 1 | UI state ergonomics | Introduce Zustand filters/drafts | Feature teams | Fewer re-renders; faster filter interactions[^4]. |
| 2 | Server-state hygiene | Optimistic patterns; selective subscriptions | Feature teams | Lower latency on edits; stable list performance[^1]. |
| 3 | Hybrid evaluation | Selective React Query for client-only flows | Architecture council | Evidence-based decisions; minimal disruption[^2][^12]. |

This strategy maximizes existing investments in RTK/RTK Query and incrementally adopts patterns proven in React Query and Zustand.

## Risks, Trade-offs, and Governance

Adopting new patterns inside RTK Query reduces risk by maintaining a single, coherent data layer. However, introducing Zustand for client state creates an additional library to govern. Cache invalidation complexity can rise if tags and keys are inconsistent; governance around naming and lifetimes is essential. Developer experience may initially dip as teams learn new patterns; investment in docs, lint rules, and code review checklists will offset this. Finally, avoid premature optimization; scope changes to known hotspots, measure impact, and iterate[^1][^4][^10].

Table 10 captures the risk register.

Table 10. Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Inconsistent tags/keys | Medium | High | QueryKey/Tag factory; lint rules | Platform team[^1]. |
| Zustand sprawl | Low | Medium | Keep stores small; audit UI ownership | Feature teams[^4][^10]. |
| DX dip during adoption | Medium | Medium | Docs, examples, pair reviews | Architecture council |
| Performance regressions | Low | Medium | Measure before/after; phased rollout | Feature teams |
| Over-migration | Low | High | Evidence-based decisions; guardrails | Architecture council |

## KPIs, Experimentation Plan, and Next Steps

We will evaluate success via quantitative and qualitative metrics, with controlled experiments in representative modules (users list, user details).

- Performance. Track render counts and time-to-interaction in list and detail components; monitor network requests and cache hit rates.
- Reliability. Measure mutation error rates and rollback frequency; audit stale data incidents and cache staleness complaints.
- Developer experience. Observe time-to-implement for new endpoints and refactors; collect subjective ergonomics scores.

Table 11 defines KPIs and experiments.

Table 11. KPI matrix

| Metric | Baseline | Target | Instrumentation | Review Cadence |
|---|---|---|---|---|
| List render counts | TBD | -20% | Component profiling | Bi-weekly |
| Network requests/page load | TBD | -15% | Query analytics | Bi-weekly |
| Mutation rollback rate | TBD | <5% | Logging in onQueryStarted | Monthly |
| DX: time-to-endpoint | TBD | -25% | PR cycle time | Monthly |

Next steps: finalize the Query Key/Tag factory, pick pilot modules (users list and user details), implement the adoption plan, and review KPIs on a regular cadence. Close identified information gaps before broad rollout.

## Information Gaps

Several gaps must be resolved to tailor the analysis to our environment:

- Current codebase specifics for user management (slices, endpoints, cache timings, middleware, and any SSR framework usage).
- Concrete performance pain points (re-render hotspots, cache thrash, large lists) and telemetry.
- Bundle size constraints and tolerance for adding Zustand alongside Redux Toolkit.
- Security/compliance rules for JWT/session handling (refresh policies, storage, header propagation).
- Team skill distribution and appetite for introducing an additional library versus pattern adoption within RTK Query.
- Migration constraints (deadlines, rollback plans, risk tolerance).
- Existing test harness coverage and preferred tooling for integration/e2e tests.

Resolving these will enable precise tuning of cache policies, adoption scope, and governance.

## References

[^1]: Redux Essentials, Part 8: RTK Query Advanced Patterns. https://redux.js.org/tutorials/essentials/part-8-rtk-query-advanced  
[^2]: Zustand + React Query: A New Approach to State Management. https://medium.com/@freeyeon96/zustand-react-query-new-state-management-7aad6090af56  
[^3]: RTK Query Overview - Redux Toolkit. https://redux-toolkit.js.org/rtk-query/overview  
[^4]: Working with Zustand. https://tkdodo.eu/blog/working-with-zustand  
[^5]: Handling user authentication with Redux Toolkit. https://blog.logrocket.com/handling-user-authentication-redux-toolkit/  
[^6]: RTK Query Vs. React Query: A Comprehensive Comparison. https://www.dhiwise.com/post/rtk-query-vs-react-query-breaking-down-the-technicalities  
[^7]: Comparison | React Query vs SWR vs Apollo vs RTK Query - TanStack. https://tanstack.com/query/v5/docs/react/comparison  
[^8]: Queries - Redux Toolkit. https://redux-toolkit.js.org/rtk-query/usage/queries  
[^9]: Redux Essentials, Part 8: RTK Query Advanced Patterns (cache invalidation and lifecycle). https://redux.js.org/tutorials/essentials/part-8-rtk-query-advanced  
[^10]: State Management in React: Comparing Redux Toolkit vs. Zustand. https://dev.to/hamzakhan/state-management-in-react-comparing-redux-toolkit-vs-zustand-3no  
[^11]: Zustand vs Redux: A Comprehensive Comparison. https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/  
[^12]: React Query as a State Manager. https://tkdodo.eu/blog/react-query-as-a-state-manager  
[^13]: Redux Style Guide. https://redux.js.org/style-guide/  
[^14]: fetchBaseQuery API - Redux Toolkit. https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery