# Enhancing Volunteer Portal State Management with Redux Toolkit and RTK Query

## Executive Summary: Why Redux Toolkit + RTK Query for the Volunteer Portal

The volunteer portal has reached a level of maturity where server‑centric features—authentication, profiles, shift scheduling, and hour logging—must scale across thousands of volunteers while remaining responsive and predictable. Today’s React hooks plus Context approach can deliver functionality, but as shared state grows and cross‑feature coupling increases, the costs compound in re‑renders, fragmented caching, and subtle race conditions. Redux Toolkit (RTK) provides a stable, centralized store with opinionated patterns for predictable updates and debugging. RTK Query (RTKQ), an optional addition to RTK, then becomes the data‑fetching and caching layer for server state, removing boilerplate, de‑duplicating requests, tracking loading and errors, and managing cache lifetimes out of the box.[^3]

Shifting to RTK + RTKQ unlocks specific benefits for a volunteer platform:

- Shared access to consistent volunteer, opportunity, and sign‑up data across components without prop drilling.
- Centralized caching and de‑duplication for paginated lists and detail views, reducing redundant network calls.
- Predictable state transitions and powerful developer tooling for troubleshooting complex interactions (e.g., scheduling conflicts, cascading profile updates).
- A path to strong TypeScript typing across slices, selectors, and RTK Query endpoints, improving maintainability at scale.[^8][^9]
- Runtime and render performance strategies documented by the Redux team—normalized state, memoized selectors, and careful subscription design—to support thousands of members without degrading user experience.[^7][^10]

At a strategic level, adopting RTK + RTK Query is not about chasing trends. It is about operationalizing a disciplined architecture for server data that pays off in fewer bugs, faster iteration, and a platform ready to grow to 5,000+ volunteers.[^3][^7]

## Current State Assessment: React Hooks + Context vs Redux Toolkit

In many React applications, local state (useState) and Context (useContext) are the default mechanisms for sharing data like auth status or selected organization. This works well at small scale and in narrow scopes. However, as the portal’s shared state begins to include large collections, cross‑feature relationships, and server‑derived data that must be cached and synchronized, the limitations emerge.

Context excels at simple global values but can trigger expensive re‑renders when the provider value changes frequently, especially in deep component trees. Without a dedicated data‑fetching layer, logic sprawls across components: multiple useEffect hooks read and write overlapping slices of state, duplicate network calls appear, and race conditions slip in during fast navigation or unreliable networks. Debugging becomes harder because there is no centralized timeline of actions and state transitions.

By contrast, Redux Toolkit defines a single store with reducers and middleware, with React‑Redux’s hooks providing selective subscriptions. The model is opinionated: updates flow through dispatched actions; reducers and selectors are typed; middleware can encapsulate side effects. That predictability yields a clear audit trail and isolates changes, making it easier to reason about state transitions at scale. For large applications, RTK’s normalized state shape and selectors (via Reselect) are a practical foundation for performance and maintainability.[^7][^10]

To crystallize the trade‑offs, Table 1 compares hooks/Context with Redux Toolkit across critical dimensions.

Table 1. Current hooks/Context approach vs Redux Toolkit for a growing volunteer portal

| Dimension | Hooks + Context | Redux Toolkit (RTK) | Impact on volunteer portal |
|---|---|---|---|
| State locality vs sharing | Local state is easy; shared Context works for simple values | Centralized store with selective subscriptions | Fewer prop-drilling cascades; consistent shared data |
| Re-render control | Re-renders when provider value changes; difficult to optimize deep trees | Memoized selectors and granular subscriptions minimize re-renders | Better UX in lists and details under load |
| Server-state management | Custom useEffect patterns, manual caching and dedupe | RTK Query provides fetching, caching, dedupe, loading/error tracking | Less boilerplate; fewer bugs; consistent cache behavior[^3] |
| Debugging & dev tooling | Limited timeline; instrumentation is ad hoc | Redux DevTools, action replay, time-travel | Faster troubleshooting across features (auth, scheduling) |
| Testability | Logic scattered across components | Pure reducers and selector functions are easy to test | More robust regressions and refactors |
| Type safety | Ad hoc; relies on component prop types | Typed store, slices, selectors; RTKQ endpoints typed end-to-end | Safer refactors in a large codebase[^8][^9] |
| Scalability | Easy to start, hard to maintain as complexity grows | Scales via normalization, middleware, and patterns | Sustainable growth to thousands of volunteers[^7][^10] |

The decision is not about abandoning hooks. It is about drawing boundaries: keep local UI state in React, move shared app and server state into Redux Toolkit, and let RTK Query handle data fetching and caching. The Redux community has repeatedly shown that this pattern scales comfortably to large apps, as documented in their performance guidance and normalization recommendations.[^7][^10]

## Data Layer Strategy: RTK Query Patterns for Supabase

RTK Query is a purpose‑built data fetching and caching library that fits naturally with Supabase. You define endpoints—queries for reads and mutations for writes—then consume auto‑generated hooks like useGetVolunteersQuery and useUpdateVolunteerMutation. RTK Query tracks loading state, caches results by endpoint and arguments, de‑duplicates identical requests, and manages cache lifetimes. For server state, this removes a lot of bespoke logic and centralizes data flow.[^3]

There are two robust integration patterns for Supabase:

1) Standard RTK Query with fetchBaseQuery against a single Supabase REST endpoint. This is the simplest path: define a base URL that points at your Supabase project’s REST surface and use fetchBaseQuery to perform requests. You still handle authentication headers in fetchBaseQuery and transform responses per endpoint. This approach aligns with RTK Query’s guidance: one API slice per base URL.[^3][^2]

2) Custom baseQuery that calls Supabase SDK methods directly. Some teams prefer this for ergonomic access to Supabase features like range() pagination or single() selections. The custom baseQuery can encapsulate auth, error handling, and parameter serialization, then hand typed responses back to RTK Query for caching and hooks. This reduces boilerplate at the endpoint level while retaining RTKQ’s cache model and lifecycle.[^4][^13]

Authentication should be attached in the baseQuery via an Authorization header sourced from the Supabase session. When a session changes (e.g., refresh or logout), the API slice can force refetches or clear stale cache entries for consistency, using RTKQ’s invalidation and re‑fetch controls.[^2][^3]

A multi‑schema or multi‑tenant portal can scale cleanly by defining separate API slices per base URL or per tenant subdomain, keeping concerns isolated and caching scopes bounded.[^3]

To choose between patterns, Table 2 summarizes trade‑offs.

Table 2. Supabase + RTK Query integration patterns

| Pattern | Ergonomics | Typing & Transform | Auth & Error Handling | Testing & Migration |
|---|---|---|---|---|
| Standard RTKQ with fetchBaseQuery against Supabase REST | Simple setup; aligns with RTKQ docs | transformResponse covers shape normalization; pagination via query params | Add auth header in fetchBaseQuery; uniform fetch error model | Easy to test endpoints via mock fetch; straightforward migration[^3][^2] |
| Custom baseQuery calling Supabase SDK methods | More ergonomic for range(), single(), and SDK nuances | Strongly typed responses from SDK; transform as needed | Encapsulate SDK auth; unify PostgREST/Auth errors | Requires mocking SDK; migrating existing SDK code is natural[^4][^13] |

Both patterns benefit from RTKQ’s automatic hook generation, de‑duplication, and cache lifetime behavior. The custom baseQuery path leans into Supabase’s SDK ergonomics; the standard path leans into fetch consistency and HTTP semantics. Either approach will shrink component‑level data logic and clarify data ownership.

## Caching Strategy for Volunteer Data

RTK Query’s cache model is driven by endpoint definitions and serialized query arguments. Multiple components subscribing to the same query share the same cached data, and redundant requests are automatically de‑duped. Data remains in cache as long as there is at least one subscriber; once all subscribers unsubscribe, a timer starts (default 60 seconds), after which the entry is removed if no new subscriptions appear. You can adjust keepUnusedDataFor globally or per endpoint to tune how long to keep data around.[^1]

Beyond passive caching, RTK Query supports proactive and automatic refreshing:

- refetchOnMountOrArgChange can encourage a refetch when a component mounts or arguments change. Set to true to always refetch, or supply a numeric threshold in seconds to refetch only if enough time has elapsed since the last fetch, otherwise serve cached data.[^1]
- refetchOnFocus and refetchOnReconnect can refresh subscribed queries when the app regains focus or reconnects to the network. These require setupListeners to be configured in the store.[^1]
- Cache tags enable automatic invalidation: mutations can provide tags that invalidate related queries, prompting RTKQ to refetch affected endpoints and keep caches coherent after writes.[^2]

Manual cache updates remain useful for optimistic UI. After a successful mutation, you can patch the cache to reflect the write immediately, avoiding flicker and reducing perceived latency. RTKQ’s manual update APIs make these localized edits straightforward without re‑fetching the entire dataset.[^12]

To help select values per data type, Table 3 outlines recommended caching settings.

Table 3. Recommended caching settings by volunteer data type

| Data Type | keepUnusedDataFor | refetchOnMountOrArgChange | refetchOnFocus | refetchOnReconnect | Cache Tags & Invalidation |
|---|---|---|---|---|---|
| Auth/session | Short (e.g., 15–30s) or session‑scoped | true | true | true | Invalidate session tags on logout/refresh; re‑fetch user profile on auth change[^1][^2] |
| Volunteer profile | Moderate (e.g., 60–120s) | Threshold in seconds (e.g., 30s) | true | true | Invalidate profile tags after profile mutations; patch cache on update[^1][^12] |
| Opportunities list | Moderate (e.g., 120–180s) | Threshold in seconds (e.g., 60s) | Optional | true | Invalidate list tags on create/update/delete opportunity; re‑fetch lists[^1][^2] |
| Sign‑ups/shift assignments | Short to moderate (e.g., 30–90s) | Threshold in seconds (e.g., 30s) | true | true | Invalidate tags on sign‑up and cancellation; manual patch for optimistic UI[^1][^12] |
| Hours tracking | Short (e.g., 30–60s) | Threshold in seconds (e.g., 30s) | Optional | true | Invalidate tags on hour submissions; manual patch on submit[^1][^12] |

These defaults balance freshness and performance. For example, the opportunities list rarely needs second‑by‑second freshness, so a 2–3 minute cache window with a 60‑second refetch threshold prevents redundant network calls while keeping data reasonably current. Meanwhile, sign‑ups benefit from short cache windows and focus/reconnect triggers to ensure volunteers see accurate assignment states after navigation or transient network interruptions.

If your portal subscribes to Supabase realtime changes, you can stream updates into the cache using RTKQ lifecycle hooks—consuming websocket messages to patch or insert entities after the initial fetch. This blends well with manual cache updates for an ultimately consistent experience without spamming the network.[^3]

Remember that RTKQ’s cache is keyed per endpoint and arguments; it is not a fully normalized cache that de‑duplicates identical items across different endpoints. Where needed, use transformResponse to normalize data or employ selectFromResult in components to subscribe to minimal slices of data.[^1]

## Type Safety Improvements with TypeScript

TypeScript amplifies the benefits of RTK and RTK Query by providing end‑to‑end type safety across the store, slices, selectors, and API endpoints. The Redux TypeScript guidance recommends inferring RootState and AppDispatch directly from the configured store, defining typed hooks (useAppSelector, useAppDispatch) in a central hooks file, and leveraging withTypes to ensure usage aligns with the store’s dispatch semantics.[^8][^9]

Concretely:

- Define a typed store and export inferred types: RootState and AppDispatch. Build pre‑typed hooks that use withTypes to avoid repetitive casting in components and to ensure thunk dispatching works without friction.[^8]
- Type slices by specifying initial state interfaces and PayloadAction generics for actions. In extraReducers, prefer the builder form so action types are inferred correctly; for createAsyncThunk, annotate argument and return types for safe async logic.[^9]
- Apply Reselect’s createSelector to build memoized selectors. This avoids unnecessary re‑computations and stabilizes reference equality for lists and derived data, which is crucial for large volunteer cohorts and detailed views.[^7][^14]

With Supabase, generate database types and derive your domain types (e.g., Volunteer, Opportunity) from the generated Tables<T> definitions. Typed endpoints then produce and consume these domain types, improving correctness and making API refactors low‑risk. Table 4 summarizes where to apply typing and the benefits.

Table 4. TypeScript typing surfaces and benefits

| Surface | How to type | Benefit |
|---|---|---|
| Store (RootState, AppDispatch) | Infer from configureStore; export types | Central source of truth; automatic updates across the app[^8] |
| React Redux hooks | Define useAppSelector/useAppDispatch via withTypes | Safer selectors and thunk dispatch; fewer casts[^8] |
| Slices (state/actions) | Interface for state; PayloadAction<T> for actions | Immutable updates and safe action payloads[^9] |
| createAsyncThunk | Type arg and return; customize thunkApi if needed | Correct async logic and error handling[^9] |
| Entity adapters | createEntityAdapter<T> with id selector | Normalized collections with generated selectors[^9] |
| Selectors | createSelector input/output selectors | Memoized derivations; fewer re‑renders[^7][^14] |
| RTK Query endpoints | Typed baseQuery, args, transformResponse | End‑to‑end type safety across API[^9] |
| Supabase types | Generate database.types; extract Tables<T> | Domain correctness and easier refactors[^4] |

The cumulative effect is confidence at scale: type errors surface early, refactors are straightforward, and developer ergonomics remain strong even as the codebase grows.

## Scalability for a 5,000+ Member Community

Scaling to thousands of volunteers means handling large lists, frequent updates, and complex derivations without compromising UX. Redux’s own performance guidance emphasizes that the architecture itself is not the bottleneck—implementation choices are. By normalizing state, designing selectors carefully, and optimizing subscriptions, Redux scales well to large apps.[^7][^10]

Three practices are foundational:

- Normalize state using createEntityAdapter. Store collections as { ids: string[], entities: Record<string, T> }, which enables O(1) lookups by ID, avoids duplicated nested objects, and simplifies updates. The adapter provides CRUD reducers and generated selectors like selectAll and selectById.[^7][^15]
- Memoize derived data with createSelector. Derived lists, filtered subsets, and aggregates should be memoized so they recalculate only when inputs change, preventing expensive re‑computations and avoiding new reference churn that forces re‑renders.[^14][^7]
- Optimize component subscriptions. Use list‑items that select by ID rather than rendering entire collections in a single component, and apply React.memo and shallowEqual where appropriate to avoid unnecessary child re‑renders when parent state changes slightly.[^7][^16][^11]

Rendering performance is only part of the story. You also need to manage cache lifetimes, batch dispatches when multiple updates occur, and use middleware for reactive logic that would otherwise leak into components. RTK Query’s cache lifetime and refetch behaviors provide a consistent baseline, while the listener middleware pattern (createListenerMiddleware) offers a clean place for cross‑cutting reactions to actions—such as invalidating derived caches when an entity changes—without coupling logic to UI components.[^1][^7]

Table 5 maps common scalability concerns to mitigations.

Table 5. Scalability concerns and practical mitigations

| Concern | Symptom | Mitigation | References |
|---|---|---|---|
| Large collections | Slow lists, cascading re-renders | Normalize with entity adapters; ID-based child selectors | [^7][^15] |
| Derived data recalculation | Expensive filter/sort runs on every render | Memoize with createSelector; stable references | [^14][^7] |
| Excessive re-renders | UI jank during updates | React.memo; shallowEqual in useSelector; granular subscriptions | [^16][^11][^7] |
| Memory pressure from caching | Long sessions with many cached datasets | Tune keepUnusedDataFor; cache abbreviated records; paginate | [^1][^10] |
| Cascading dispatches | Multiple actions trigger many renders | Batch updates; consolidate actions where feasible | [^10] |
| Cross-feature consistency | Stale derived caches after mutations | Cache tags for invalidation; listener middleware reactions | [^2][^7] |

Performance at scale is a habit, not a single setting. These patterns, practiced consistently, yield stable UX under load while keeping code testable and maintainable.

## Migration Roadmap from Hooks + Context to RTK + RTK Query

Migrating an existing portal requires a measured approach to avoid disrupting ongoing feature work. The path below prioritizes quick wins and incremental adoption:

1) Establish the store and typed hooks. Configure the Redux store, export typed RootState and AppDispatch, and define useAppSelector/useAppDispatch with withTypes. This step centralizes future state without changing existing components immediately.[^8][^9]

2) Introduce the first API slice for Supabase. Use either fetchBaseQuery against Supabase’s REST endpoint or a custom baseQuery that calls the SDK, and add a small subset of endpoints (e.g., getVolunteers, updateVolunteer). Wire authentication in the baseQuery and ensure setupListeners is configured to enable refetchOnFocus/refetchOnReconnect.[^3][^4][^2][^13]

3) Migrate high‑impact, read‑heavy flows first. Prioritize lists and detail views for volunteers, opportunities, and sign‑ups. Replace useEffect boilerplate with auto‑generated hooks, and standardize loading/error states. Components begin to shrink and data logic consolidates.[^3]

4) Add cache tags and manual updates where needed. Mutations should provide tags so dependent queries invalidate and refetch automatically. For optimistic updates, patch the cache after successful writes to improve perceived performance.[^2][^12]

5) Normalize collections and introduce memoized selectors. Convert arrays to entity adapters for major datasets (volunteers, opportunities) and create memoized selectors for filtered views. Update components to select by ID and avoid re‑rendering siblings unnecessarily.[^7][^15][^14]

6) Remove Contexts that duplicate RTK state. As confidence grows, deprecate Context providers whose responsibilities have moved into the store or RTK Query cache. The result is simpler composition and clearer data ownership.

Throughout, maintain development rigor: run existing tests, use Redux DevTools for regression inspection, and lean on typed hooks and selectors to catch issues early.[^9]

## Risks, Trade-offs, and Mitigations

No architecture is free of trade‑offs. The key is to anticipate and manage them.

- RTK Query’s cache is not normalized across endpoints. Identical items returned by different queries are stored independently. Mitigate by transforming responses (e.g., normalize per endpoint), using selectFromResult to subscribe to minimal slices, and employing cache tags for consistency.[^1][^2]
- Caching remote data can grow memory in long sessions. Mitigate by tuning keepUnusedDataFor, caching abbreviated records for lists, and paginating datasets so only needed data remains in memory.[^10][^1]
- Over‑rendering remains a risk if selectors return new references unnecessarily or subscriptions are too broad. Mitigate with createSelector memoization and granular useSelector calls that select by ID.[^7][^14][^11]
- Middleware misuse can complicate logic. Use createListenerMiddleware judiciously to handle reactive patterns, and keep side effects explicit and testable.[^7]
- Authentication flows can invalidate caches unexpectedly. Structure auth changes to clear or invalidate sensitive tags and force refetches where needed, keeping session and profile views consistent.[^1][^2][^3]

The net effect is a predictable, maintainable system with clear places to fix issues as they arise.

## Appendix: Implementation Patterns and Reference Snippets

The following patterns serve as concrete building blocks when implementing the migration.

Typed store and hooks (TypeScript):

```ts
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, useStore } from 'react-redux';

export const store = configureStore({
  reducer: {
    // your slices
  },
  middleware: (getDefault) => getDefault(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected) =>
  useSelector(selector);
export const useAppStore = () => useStore<RootState>();
```

RTK Query API slice with Supabase (fetchBaseQuery):

```ts
// api/supabaseApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import fetchBaseQuery from '@reduxjs/toolkit/query/fetchBaseQuery';
import { supabaseUrl, supabaseAnonKey } from '@/config';

export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${supabaseUrl}/rest/v1`,
    prepareHeaders: (headers) => {
      headers.set('apikey', supabaseAnonKey);
      headers.set('Authorization', `Bearer ${sessionToken}`);
      return headers;
    },
  }),
  tagTypes: ['Volunteer', 'Opportunity', 'Signup'],
  endpoints: (builder) => ({
    getVolunteers: builder.query<Volunteer[], { page?: number; limit?: number }>({
      query: ({ page = 0, limit = 20 }) => ({
        url: `volunteers?select=*&offset=${page * limit}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Volunteer' as const, id })), { type: 'Volunteer', id: 'LIST' }]
          : [{ type: 'Volunteer', id: 'LIST' }],
    }),
    updateVolunteer: builder.mutation<Volunteer, Partial<Volunteer> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `volunteers?id=eq.${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Volunteer', id: arg.id }],
    }),
  }),
});

export const { useGetVolunteersQuery, useUpdateVolunteerMutation } = supabaseApi;
```

Custom baseQuery calling Supabase SDK methods:

```ts
// api/supabaseBaseQuery.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SupabaseQueryArgs = {
  path: string; // e.g., 'volunteers'
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  params?: Record<string, any>;
  body?: Record<string, any>;
};

const supabaseBaseQuery =
  ({ supabase }: { supabase: SupabaseClient }) =>
  async ({ path, method = 'GET', params, body }: SupabaseQueryArgs) => {
    let query = (supabase as any).from(path);
    if (method === 'GET' && params) {
      query = query.select('*').range(params.offset ?? 0, params.end ?? (params.offset ?? 0) + (params.limit ?? 20) - 1);
    } else if (method === 'PATCH') {
      query = query.update(body);
    } else if (method === 'POST') {
      query = query.insert(body);
    } else if (method === 'DELETE') {
      query = query.delete();
    }
    const { data, error } = await query;
    if (error) return { error };
    return { data };
  };

export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: supabaseBaseQuery({ supabase }),
  tagTypes: ['Volunteer', 'Opportunity', 'Signup'],
  endpoints: (builder) => ({
    getVolunteers: builder.query<Volunteer[], { page?: number; limit?: number }>({
      query: ({ page = 0, limit = 20 }) => ({
        path: 'volunteers',
        method: 'GET',
        params: { offset: page * limit, limit },
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Volunteer' as const, id })), { type: 'Volunteer', id: 'LIST' }]
          : [{ type: 'Volunteer', id: 'LIST' }],
    }),
    updateVolunteer: builder.mutation<Volunteer, Partial<Volunteer> & { id: string }>({
      query: ({ id, ...patch }) => ({ path: 'volunteers', method: 'PATCH', body: patch, params: { id } }),
      invalidatesTags: (result, error, arg) => [{ type: 'Volunteer', id: arg.id }],
    }),
  }),
});

export const { useGetVolunteersQuery, useUpdateVolunteerMutation } = supabaseApi;
```

Manual cache updates and optimistic UI:

```ts
// After a successful mutation
dispatch(
  supabaseApi.util.updateQueryData('getVolunteers', { page: 0, limit: 20 }, (draft) => {
    const idx = draft.findIndex((v) => v.id === updated.id);
    if (idx !== -1) draft[idx] = updated;
  })
);
```

Normalized slice with createEntityAdapter:

```ts
// slices/volunteersSlice.ts
import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';

type Volunteer = { id: string; name: string; email: string; status: 'active' | 'inactive' };
const volunteersAdapter = createEntityAdapter<Volunteer>({
  selectId: (v) => v.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const slice = createSlice({
  name: 'volunteers',
  initialState: volunteersAdapter.getInitialState(),
  reducers: {
    upsertMany: volunteersAdapter.upsertMany,
    updateOne: volunteersAdapter.updateOne,
  },
});

export const { upsertMany, updateOne } = slice.actions;
export const volunteersReducer = slice.reducer;
export const { selectAll: selectAllVolunteers, selectById: selectVolunteerById } = volunteersAdapter.getSelectors();
```

Memoized selector example:

```ts
// selectors/volunteersSelectors.ts
import { createSelector } from 'reselect';
import { RootState } from '@/app/store';

export const selectVolunteersState = (s: RootState) => s.volunteers;

export const selectActiveVolunteers = createSelector(selectVolunteersState, (state) =>
  state.ids.map((id) => state.entities[id]).filter(Boolean)
);
```

## Information Gaps

Several implementation details will influence the exact shape of the final solution but are not specified here:

- Current code structure, component hierarchy, and identified pain points.
- Exact Supabase schema (tables, relationships, policies) and auth model.
- Concrete performance bottlenecks observed (re‑render hotspots, network duplication).
- Team proficiency with TypeScript and Redux Toolkit; appetite for migration effort.
- Reliability requirements and offline needs (e.g., whether hours entry must work offline).
- Non‑functional constraints such as bundle size budgets and deployment environment.

Filling these gaps will allow precise endpoint definitions, cache settings, and migration sequencing tailored to the volunteer portal’s realities.

## Conclusion

Redux Toolkit with RTK Query provides a disciplined architecture for managing server and shared state in a volunteer portal destined for scale. The hooks‑plus‑Context approach is an excellent starting point, but as data relationships grow complex and caching demands rise, the costs become apparent. RTK centralizes state transitions and debugging; RTK Query removes data‑fetching boilerplate, de‑duplicates requests, and manages cache lifetimes with well‑defined behaviors. When combined with TypeScript, normalized collections, and memoized selectors, the portal can comfortably serve thousands of volunteers while retaining a responsive, predictable user experience. A staged migration—starting with the store and a single API slice, then moving high‑impact features, cache tags, and normalization—delivers early wins without undue risk. The result is a robust platform foundation that supports growth, reduces bugs, and accelerates future feature development.

---

## References

[^1]: Cache Behavior | Redux Toolkit — RTK Query. https://redux-toolkit.js.org/rtk-query/usage/cache-behavior  
[^2]: Redux Essentials, Part 8: RTK Query Advanced Patterns. https://redux.js.org/tutorials/essentials/part-8-rtk-query-advanced  
[^3]: RTK Query Overview — Redux Toolkit. https://redux-toolkit.js.org/rtk-query/overview  
[^4]: Supabase + RTK Query + TypeScript like an absolute Chad! https://medium.com/@donald.walters/supabase-rtk-query-typescript-like-an-absolute-chad-6f477a32b0cc  
[^5]: How to use Redux RTK Query with Supabase — Stack Overflow. https://stackoverflow.com/questions/70700188/how-to-use-redux-rtk-query-with-supabase  
[^6]: How to use RTK-Query with Supabase — Stack Overflow. https://stackoverflow.com/questions/74594866/how-to-use-rtk-query-with-supabase  
[^7]: Redux Essentials, Part 6: Performance, Normalizing Data, and Reactive Logic. https://redux.js.org/tutorials/essentials/part-6-performance-normalization  
[^8]: Usage With TypeScript — Redux. https://redux.js.org/usage/usage-with-typescript  
[^9]: Usage With TypeScript — Redux Toolkit. https://redux-toolkit.js.org/usage/usage-with-typescript  
[^10]: Performance — Redux FAQ. https://redux.js.org/faq/performance  
[^11]: React Redux Hooks: Equality Comparisons and Updates. https://react-redux.js.org/api/hooks#equality-comparisons-and-updates  
[^12]: Manual Cache Updates — Redux Toolkit RTK Query. https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates  
[^13]: Customizing Queries: Using a Third-Party SDK — RTK Query. https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#using-a-third-party-sdk  
[^14]: Reselect GitHub. https://github.com/reduxjs/reselect  
[^15]: createEntityAdapter API — Redux Toolkit. https://redux-toolkit.js.org/api/createEntityAdapter  
[^16]: React.memo — React Docs. https://react.dev/reference/react/memo