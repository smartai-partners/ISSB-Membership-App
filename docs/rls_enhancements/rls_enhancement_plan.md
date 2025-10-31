# Enhanced Supabase Row Level Security (RLS) Policy Recommendations Based on RBAC

## Executive Summary and Objectives

The current Row Level Security (RLS) posture across the platform’s core tables is dangerously permissive. In practice, most policies evaluate to “public can view all” and “public can manage all,” effectively disabling access control for a large class of sensitive operations. This exposes personally identifiable information (PII), volunteer data, donations, applications, system settings, and audit logs to unrestricted read access and allows mutations by unauthenticated callers in several tables.

The high-level objectives of the proposed enhancement are to eliminate public over-permissioning, implement a coherent Role-Based Access Control (RBAC) model in RLS, and ensure that the platform’s systems, including Edge Functions, operate securely without policy regressions. The plan aligns with the principle of least privilege by defaulting to deny, introducing a minimal set of helper functions to centralize role checks and role memberships, and explicitly designing policies to work with Edge Functions’ dual authentication layers.

Outcome goals:
- Secure-by-default access control across profiles, memberships, events and registrations, volunteer objects, donations, applications, system settings, and audit logs.
- No regressions for legitimate Edge Function flows, including anon-invoked functions that use service_role internally.
- A clean separation of concerns: application-level business rules remain in application code, while RLS enforces authorization at the database layer based on role and resource relationships.

To illustrate the target end-state, Table 1 summarizes the intended RLS posture by table and operation.

Table 1: Target RLS posture by table and operation (SELECT/INSERT/UPDATE/DELETE)

| Table                    | SELECT                                      | INSERT                                      | UPDATE                                      | DELETE                                      |
|--------------------------|---------------------------------------------|---------------------------------------------|---------------------------------------------|---------------------------------------------|
| profiles                 | Owner or admin; board sees limited fields   | Authenticated only (self-profile create)    | Owner or admin                              | Admin only                                  |
| memberships              | Owner; board (limited); admin               | Authenticated (self) via app flow           | Owner (own fields); admin manages all       | Admin only                                  |
| family_members           | Owner; board (limited); admin               | Owner (via membership ownership)            | Owner; admin                                | Admin only                                  |
| events                   | Published events: public; draft: admin/board; admin manages all | Admin/board only                      | Admin/board only                            | Admin/board only                            |
| event_registrations      | Owner; admin/board                          | Authenticated (self)                        | Owner (self, limited fields); admin/board   | Owner (self cancel); admin/board            |
| volunteer_opportunities  | Open: public read; draft/closed: admin only | Admin/board only                             | Admin/board only                            | Admin/board only                            |
| volunteer_signups        | Owner; admin                                | Authenticated (self)                        | Owner (self, limited); admin                | Owner (self cancel); admin                  |
| volunteer_assignments    | Owner; admin                                | Admin only                                   | Admin only                                  | Admin only                                  |
| volunteer_hours          | Owner; admin/board                          | Owner (self)                                 | Owner (pending self edits); admin approval  | Admin only                                  |
| donations                | Owner (non-anonymous); admin; board (limited) | Authenticated (self) via payment flow     | Admin only                                  | Admin only                                  |
| applications             | Owner; admin/board                          | Authenticated (self)                         | Owner (self, limited); admin/board manages all | Admin/board only                         |
| system_settings          | Public settings: public; private: admin only | Admin only                                   | Admin only                                  | Admin only                                  |
| audit_logs               | Admin only                                  | Inserts allowed (no RLS restriction); admin read | Admin only                              | Admin only                                  |

### Scope

This report covers the following tables: profiles, memberships, family_members, events, event_registrations, volunteer_opportunities, volunteer_signups, volunteer_assignments, volunteer_hours, donations, applications, system_settings, audit_logs. Edge Functions and storage.objects policies are considered insofar as they interact with the above tables.

### Non-goals

Business rule design and application workflow logic remain outside the scope of RLS. RLS is only concerned with authorization: who can perform which operations on which rows. Decisions such as application approval criteria, event publishing workflows, and donation processing are enforced by application services and Edge Functions, while RLS enforces access constraints based on roles and resource relationships.

## Current RLS Posture: Evidence and Risks

Two migration files reveal the current RLS configuration and its extremes. One set “public can view all” and “public can manage all” across multiple tables, effectively disabling access control. Another enhanced the volunteer system with a pattern that allows both authenticated and anonymous actors near-unrestricted operations on volunteer_opportunities and volunteer_signups.

Exemplar policy patterns currently in place:
- profiles: “Public can view all profiles” and “Public can manage all profiles.”
- memberships: “Public can view all memberships” and “Public can manage all memberships.”
- volunteer_opportunities and volunteer_signups: broad SELECT and permissive INSERT/UPDATE/DELETE allowing anon/authenticated users, including service_role.

The result is an environment where PII in profiles and applications can be read by anyone; memberships and family members are exposed; event registrations and volunteer data can be mutated by anonymous callers; donations can be enumerated; system settings can be read and managed by the public; and audit logs can be read. The risk is data leakage and tampering at scale.

Table 2 summarizes current policies and the associated risk levels.

Table 2: Current policies and risk heatmap

| Table                   | Current SELECT policy                 | Current INSERT policy                     | Current UPDATE policy                     | Current DELETE policy                     | Risk level |
|-------------------------|---------------------------------------|-------------------------------------------|-------------------------------------------|-------------------------------------------|-----------|
| profiles                | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| memberships             | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| family_members          | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| events                  | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | High      |
| event_registrations     | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | High      |
| volunteer_opportunities | Read for anon/authenticated/service_role | Insert for anon/authenticated/service_role | Update for anon/authenticated/service_role | Delete for anon/authenticated/service_role | High      |
| volunteer_signups       | Read for anon/authenticated/service_role | Insert for anon/authenticated/service_role | Update for anon/authenticated/service_role | Delete for anon/authenticated/service_role | High      |
| volunteer_assignments   | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | High      |
| volunteer_hours         | Public can manage all                 | Public can manage all                     | Public can manage all                     | Public can manage all                     | High      |
| donations               | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| applications            | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| system_settings         | Public can view all                   | Public can manage all                     | Public can manage all                     | Public can manage all                     | Critical  |
| audit_logs              | Public can view all                   | Allow creation                            | N/A                                       | N/A                                       | High      |

### Root Causes

Policies were simplified to avoid circular dependencies and Edge Function integration pitfalls, resulting in blanket public permissions. Overuse of auth.role() checks without correlated resource ownership checks further broadened access. Insert policies allowed broad creation with insufficient checks for who can insert and under what conditions.

### Exploit Scenarios

- An attacker reads all profiles and applications to harvest PII.
- Anonymous callers create or modify volunteer signups, hours, and assignments, polluting volunteer records.
- Donations are enumerated and potentially manipulated, including payment metadata.
- System settings are altered, compromising platform behavior.
- Audit logs are exposed, revealing sensitive activity metadata.

## RBAC Alignment: Roles, Permissions, and Least Privilege

Core roles are defined in profiles.role: admin, board, member, student, applicant. This report treats admin and board as elevated roles with scoped administrative capabilities across tables. Members, students, and applicants have self-service and limited visibility privileges. The principle of least privilege drives the mapping of role-to-permission-to-resource.

Table 3: Role-to-permission mapping matrix

| Table                   | Admin                                      | Board                                       | Member/Student                              | Applicant                           |
|-------------------------|--------------------------------------------|---------------------------------------------|---------------------------------------------|-------------------------------------|
| profiles                | Read/manage all                            | Read limited; no manage                      | Read/manage own only                        | Read/manage own only (if applicable)|
| memberships             | Read/manage all                            | Read all (limited fields), manage none       | Read/manage own only                        | N/A                                 |
| family_members          | Read/manage all                            | Read limited; manage none                    | Read/manage own via membership              | N/A                                 |
| events                  | Manage all                                 | Manage published/draft as permitted          | Read published only                         | Read published only                 |
| event_registrations     | Manage all                                 | Read all; manage limited                      | Read/manage own only                        | Read/manage own only                |
| volunteer_opportunities | Manage all                                 | Manage as permitted                           | Read open only                              | Read open only                      |
| volunteer_signups       | Manage all                                 | Read limited                                  | Read/manage own only                        | Read/manage own only                |
| volunteer_assignments   | Manage all                                 | Read limited                                  | Read own only                               | N/A                                 |
| volunteer_hours         | Manage all                                 | Read limited; approve own-area assignments    | Read/manage own only                        | N/A                                 |
| donations               | Manage all                                 | Read limited (non-anonymous only)             | Read/manage own only                        | N/A                                 |
| applications            | Manage all                                 | Manage review workflow                        | N/A                                         | Read/manage own only                |
| system_settings         | Manage all                                 | Read public settings                          | Read public settings                        | Read public settings                |
| audit_logs              | Read/manage all                            | Read limited                                  | N/A                                         | N/A                                 |

### Permission Granularity

Permissions are scoped at the operation level (SELECT, INSERT, UPDATE, DELETE) and tied to resource relationships (e.g., user_id equals auth.uid() for self-service, created_by or allowed tiers for events). INSERT is restricted to authenticated users and tightly controlled by business rules enforced via application flows; UPDATE includes immutable field constraints and status-transition guards; DELETE is limited to admins for high-risk tables (profiles, applications, donations, system_settings, audit_logs).

### Exception Handling

Public read is permitted for specific resources where the business model requires it: published events and open volunteer opportunities. System settings marked public are readable by all, but only admins can manage settings. Applications remain self-service for applicants but become restricted to owner and elevated roles once submitted.

## Policy Design Principles and Helpers

RLS policies should be simple, composable, and performant. To avoid repeated subselects and potential circular dependencies, define helper functions that centralize role checks and role membership lookups. This approach minimizes policy complexity, reduces duplication, and provides a stable anchor if table schemas evolve.

Key helpers:
- is_admin(): returns true if the caller’s profile role is admin.
- is_board(): returns true if the caller’s profile role is board.
- has_role(role text): returns true if the caller’s profile role matches the provided role text.
- has_any_role(roles text[]): returns true if the caller’s profile role is in the provided array.

Role membership checks must use stable queries against profiles, guarding against null auth.uid() and ambiguous role values. Admin checks should be explicit and limited in number to avoid over-broad elevation.

Prefer explicit USING and WITH CHECK clauses for each operation rather than catch-all “FOR ALL” policies. This clarity helps auditors and developers reason about intent.

Finally, ensure policies account for Edge Functions’ dual authentication layers. Even when Edge Functions use service_role internally to perform database operations, RLS sees the original caller’s role. Therefore, INSERT and UPDATE policies that need to support Edge Function-originated flows should allow both anon and authenticated callers in combination with ownership or role checks.

Table 4: Helper function spec cheat sheet

| Function         | Inputs       | Returns | Notes                                                                 |
|------------------|--------------|---------|-----------------------------------------------------------------------|
| is_admin()       | None         | Boolean | True if EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') |
| is_board()       | None         | Boolean | True if role = 'board' in profiles                                    |
| has_role(role)   | text         | Boolean | True if role matches profiles.role for auth.uid()                     |
| has_any_role(roles) | text[]    | Boolean | True if profiles.role IN roles                                        |

### Circular Dependency Avoidance

Helper functions should query profiles using simple EXISTS patterns and handle null auth.uid() gracefully. Avoid cross-table policy dependencies that cause tight coupling. Policies should not rely on row-level data from unrelated tables unless necessary for the resource relationship.

### Edge Function Compatibility

Allow both anon and authenticated roles in INSERT policies for flows invoked by Edge Functions, combined with ownership or role checks. Avoid service_role-only policies for operations that originate from frontend clients calling Edge Functions. This alignment prevents “new row violates row-level security policy” errors and preserves the intended caller context in RLS evaluation.

## Resource-Specific RLS Policy Recommendations

The following recommendations translate the RBAC model into RLS policy patterns per table. Each pattern specifies who can perform which operation and under what conditions. Public read is limited to published events and open volunteer opportunities. Elevated roles have scoped administrative capabilities.

### Profiles

- SELECT: Owner (auth.uid() = id) or is_admin().
- INSERT: Authenticated users creating their own profile via application flow (WITH CHECK auth.uid() = id).
- UPDATE: Owner or is_admin().
- DELETE: is_admin() only.

Rationale: profiles contains PII and role elevation levers. Owners can manage their data; only admins can delete.

### Memberships

- SELECT: Owner (user_id = auth.uid()), is_board() (limited fields), or is_admin().
- INSERT: Authenticated users only (WITH CHECK user_id = auth.uid()).
- UPDATE: Owner may update limited non-critical fields; is_admin() manages all.
- DELETE: is_admin() only.

Rationale: membership records contain payment metadata and status fields that should not be broadly writable.

### Family Members

- SELECT: Owner via membership ownership, is_board() (limited fields), or is_admin().
- INSERT: Owner via membership ownership (WITH CHECK memberships.user_id = auth.uid()).
- UPDATE: Owner or is_admin().
- DELETE: is_admin() only.

Rationale: family PII should be restricted to the membership owner and admins.

### Events

- SELECT: Public read for status = 'published'; draft/cancelled/completed: is_admin() or is_board().
- INSERT: is_admin() or is_board().
- UPDATE/DELETE: is_admin() or is_board().

Rationale: public discoverability for published events only; administrative management of drafts and lifecycle.

### Event Registrations

- SELECT: Owner (user_id = auth.uid()), is_admin(), or is_board().
- INSERT: Authenticated users only (WITH CHECK user_id = auth.uid()).
- UPDATE: Owner may update selected fields (e.g., cancellation); is_admin() or is_board() manage all.
- DELETE: Owner (self cancel) or is_admin()/is_board().

Rationale: registrations are personal and should not be broadly readable or modifiable.

### Volunteer Opportunities

- SELECT: Public read when status = 'open'; admin-only for draft/closed/cancelled.
- INSERT/UPDATE/DELETE: is_admin() or is_board().

Rationale: public visibility for open opportunities; administrative control over lifecycle and unpublished data.

### Volunteer Signups

- SELECT: Owner (member_id = auth.uid()) or is_admin().
- INSERT: Authenticated users only (WITH CHECK member_id = auth.uid()).
- UPDATE: Owner may update limited fields (e.g., cancellation); is_admin() manages all.
- DELETE: Owner (self cancel) or is_admin().

Rationale: self-service signups with admin oversight.

### Volunteer Assignments

- SELECT: Owner (user_id = auth.uid()) or is_admin().
- INSERT/UPDATE/DELETE: is_admin() only.

Rationale: assignments are administrative instruments; only admins manage them.

### Volunteer Hours

- SELECT: Owner (user_id = auth.uid()) or is_admin() or is_board().
- INSERT: Owner (WITH CHECK user_id = auth.uid()).
- UPDATE: Owner may edit pending entries; is_admin() approves/rejects.
- DELETE: is_admin() only.

Rationale: hour entries are personal until approved; admin controls final state.

### Donations

- SELECT: Owner (user_id = auth.uid()) if not is_anonymous; is_admin(); is_board() limited to non-anonymous.
- INSERT: Authenticated users only (WITH CHECK user_id = auth.uid()).
- UPDATE/DELETE: is_admin() only.

Rationale: protect donor privacy; restrict mutations to admins.

### Applications

- SELECT: Owner (user_id = auth.uid()), is_admin(), or is_board().
- INSERT: Authenticated users only (WITH CHECK user_id = auth.uid()).
- UPDATE: Owner may update selected fields prior to review; is_admin() or is_board() manage all.
- DELETE: is_admin() or is_board() only.

Rationale: applications contain sensitive data and require strict visibility and mutation controls.

### System Settings

- SELECT: Public read for is_public = true; admin-only for private settings.
- INSERT/UPDATE/DELETE: is_admin() only.

Rationale: public settings may be disclosed; private settings are strictly admin-only.

### Audit Logs

- SELECT: is_admin() only.
- INSERT: Inserts should be allowed without restriction by RLS (application/Edge Functions manage creation).
- UPDATE/DELETE: is_admin() only (if needed).

Rationale: audit logs record sensitive activity; only admins should read and manage them.

Table 5: Policy matrix by table and operation

| Table                   | SELECT condition                                           | INSERT condition                                 | UPDATE condition                                          | DELETE condition          |
|-------------------------|------------------------------------------------------------|--------------------------------------------------|-----------------------------------------------------------|---------------------------|
| profiles                | auth.uid() = id OR is_admin()                              | auth.uid() = id                                   | auth.uid() = id OR is_admin()                             | is_admin()                |
| memberships             | user_id = auth.uid() OR is_board() OR is_admin()          | user_id = auth.uid()                              | user_id = auth.uid() (limited) OR is_admin()              | is_admin()                |
| family_members          | EXISTS memberships WHERE id = membership_id AND user_id = auth.uid() OR is_board() OR is_admin() | EXISTS memberships WHERE user_id = auth.uid()     | EXISTS memberships WHERE user_id = auth.uid() OR is_admin() | is_admin()              |
| events                  | status = 'published' OR is_admin() OR is_board()          | is_admin() OR is_board()                          | is_admin() OR is_board()                                  | is_admin() OR is_board()  |
| event_registrations     | user_id = auth.uid() OR is_admin() OR is_board()          | user_id = auth.uid()                              | user_id = auth.uid() (limited) OR is_admin() OR is_board() | user_id = auth.uid() OR is_admin() |
| volunteer_opportunities | status = 'open' OR is_admin() OR is_board()               | is_admin() OR is_board()                          | is_admin() OR is_board()                                  | is_admin() OR is_board()  |
| volunteer_signups       | member_id = auth.uid() OR is_admin()                       | member_id = auth.uid()                            | member_id = auth.uid() (limited) OR is_admin()            | member_id = auth.uid() OR is_admin() |
| volunteer_assignments   | user_id = auth.uid() OR is_admin()                         | is_admin()                                        | is_admin()                                                | is_admin()                |
| volunteer_hours         | user_id = auth.uid() OR is_admin() OR is_board()          | user_id = auth.uid()                              | user_id = auth.uid() AND status = 'pending' OR is_admin() | is_admin()                |
| donations               | (user_id = auth.uid() AND is_anonymous = false) OR is_admin() OR (is_board() AND is_anonymous = false) | user_id = auth.uid()                              | is_admin()                                                | is_admin()                |
| applications            | user_id = auth.uid() OR is_admin() OR is_board()          | user_id = auth.uid()                              | user_id = auth.uid() (limited) OR is_admin() OR is_board() | is_admin() OR is_board()  |
| system_settings         | is_public = true OR is_admin()                             | is_admin()                                        | is_admin()                                                | is_admin()                |
| audit_logs              | is_admin()                                                 | Allow inserts without RLS restriction            | is_admin()                                                | is_admin()                |

## Dynamic Role Checking and Multi-Role Scenarios

The platform defines multiple roles in profiles.role, with admin and board carrying elevated privileges. Many users will present combinations of roles or tier-based memberships, which require coherent resolution logic in policies:

- Role precedence: admin > board > member/student > applicant for administrative actions; self-service for own resources where applicable.
- Membership tier effects: allowed_tiers on events restricts public read to published events; only board/admin can view drafts regardless of tier. Volunteer visibility is unaffected by tier except where explicit resource ownership applies.
- Edge Functions: authentication flow preserves the caller’s role context even when service_role is used internally. Policies must allow both anon and authenticated for INSERT operations that originate from client-invoked Edge Functions, combined with ownership or role checks.

Table 6: Multi-role resolution examples

| Scenario                                                | Expected policy outcome                                   | Notes                                                                 |
|---------------------------------------------------------|-----------------------------------------------------------|-----------------------------------------------------------------------|
| User is both board and member                           | Board permissions apply for administrative tables         | Precedence resolves to board for admin-related actions                |
| Student with family membership                          | Family tier affects event access via allowed_tiers        | Read published events per allowed_tiers; draft access requires board/admin |
| Applicant submitting application                        | Self-service INSERT; no board/admin visibility until review | SELECT restricted to owner until status changes                       |
| Frontend-invoked Edge Function creating volunteer signup | INSERT allowed for anon + authenticated + service_role    | Ownership check member_id = auth.uid() ensures self-service constraint |
| Admin updating system_settings                          | Admin-only for all operations                             | No public read for private settings                                   |

### Role Precedence Logic

For administrative actions, admin and board roles supersede member/student/applicant privileges. For self-service operations, ownership (user_id = auth.uid()) or membership linkage takes precedence. Board visibility is limited in some tables (e.g., memberships, family_members, donations) to non-sensitive fields or non-anonymous records.

### Edge Function Context Preservation

Policies that allow both anon and authenticated callers for INSERT/UPDATE operations, combined with ownership or role checks, ensure Edge Functions operate reliably. This design prevents policy rejections while maintaining least privilege.

## Migration and Rollout Plan

A phased migration minimizes risk and enables measurable validation at each step. Replace blanket public policies with least-privilege defaults, introduce helper functions, and enable strict mode in stages. Maintain rollback scripts for rapid reversal in case of critical failures.

Table 7: Rollout checklist by phase

| Phase | Actions                                                                                          | Validation steps                                                   | Rollback criteria                                  |
|------:|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|----------------------------------------------------|
| 1     | Add helper functions (is_admin, is_board, has_role, has_any_role)                               | Unit tests for helpers; verify queries use auth.uid() correctly    | Drop functions if misbehavior detected             |
| 2     | Create new policies alongside existing ones; dual-write period                                   | Compare results of old vs new policies on SELECT/INSERT/UPDATE     | Revert to old policies if discrepancies found      |
| 3     | Enable strict mode per table; monitor error rates                                                | Check RLS error logs; ensure Edge Function flows still work        | Disable strict mode on affected tables             |
| 4     | Remove deprecated public policies                                                                | Verify no regressions in application workflows                     | Reinstate deprecated policies temporarily          |
| 5     | Performance tuning: indexes, simplified EXISTS clauses, minimized cross-table checks             | Measure query latency; confirm EXPLAIN plans are acceptable        | Revert index additions if negative impact          |
| 6     | Finalize and document operational runbooks                                                        | Dry-run audits; finalize policy documentation                      | Rollback to prior stable release if needed         |

### Migration Steps

- Add helper functions for role checks and membership lookups.
- Create new per-operation policies with least-privilege constraints.
- Enable strict RLS per table; ensure Edge Functions operate with anon + authenticated allowances where necessary.
- Remove deprecated public policies once dual-write and strict mode validation pass.

### Rollback Procedures

- Maintain explicit rollback scripts to re-enable previous policies if critical failures occur.
- Use feature flags or table-level strict mode toggles to isolate regressions quickly.

## Testing and Validation

Policy validation must be comprehensive and operation-centered. Establish a test matrix that includes each table, operation (SELECT/INSERT/UPDATE/DELETE), and role (admin, board, member, student, applicant, anon, authenticated, service_role). Edge Function integration tests must confirm that anon-invoked functions can write where intended and that RLS rejects unauthorized operations.

Table 8: Test matrix (abbreviated)

| Table                   | Operation | Role           | Expected outcome                         | Actual | Notes                         |
|-------------------------|-----------|----------------|------------------------------------------|--------|-------------------------------|
| profiles                | SELECT    | owner          | Allow                                    |        |                               |
| profiles                | SELECT    | anon           | Deny                                     |        |                               |
| memberships             | UPDATE    | member (owner) | Allow limited fields                     |        |                               |
| memberships             | UPDATE    | board          | Deny                                     |        |                               |
| events                  | SELECT    | anon           | Allow if status = 'published'            |        |                               |
| events                  | INSERT    | board          | Allow                                    |        |                               |
| event_registrations     | SELECT    | board          | Allow                                    |        | Limited visibility            |
| volunteer_opportunities | SELECT    | anon           | Allow if status = 'open'                 |        |                               |
| volunteer_opportunities | UPDATE    | anon           | Deny                                     |        |                               |
| volunteer_signups       | INSERT    | authenticated  | Allow if member_id = auth.uid()          |        |                               |
| volunteer_signups       | INSERT    | anon           | Allow (Edge Function flow)               |        | Must include ownership check  |
| volunteer_assignments   | DELETE    | admin          | Allow                                    |        |                               |
| volunteer_hours         | UPDATE    | member (owner) | Allow if status = 'pending'              |        |                               |
| donations               | SELECT    | board          | Allow if non-anonymous                   |        |                               |
| applications            | SELECT    | applicant      | Allow if owner                           |        |                               |
| system_settings         | SELECT    | anon           | Allow if is_public = true                |        |                               |
| audit_logs              | SELECT    | admin          | Allow                                    |        |                               |

### RLS Regression Tests

Validate least-privilege outcomes by ensuring:
- Public reads are restricted to published events and open volunteer opportunities only.
- PII and sensitive records (profiles, applications, donations, system_settings, audit_logs) are not readable by anon.
- Self-service operations require ownership checks and authenticated roles.
- Admin-only operations reject board/member roles.

### Edge Function Integration Tests

- Invoke functions that INSERT into volunteer_signups and volunteer_hours as anon and authenticated callers; confirm success with ownership checks.
- Confirm that service_role-only policies are avoided for operations originating from anon clients.
- Test UPDATE flows through Edge Functions to ensure WITH CHECK constraints are respected.

## Monitoring, Auditing, and Governance

Audit logs must capture RLS policy enforcement actions for sensitive tables. Establish dashboards and alerts for policy violations and permission denials. Governance includes periodic reviews of role definitions, permissions, and settings visibility to ensure the platform’s security posture remains aligned with business needs.

Table 9: Audit event mapping

| Table                   | Operations to log                | Frequency | Alert thresholds                         |
|-------------------------|----------------------------------|-----------|------------------------------------------|
| profiles                | SELECT, UPDATE, DELETE           | Continuous| Multiple denies per hour on same user    |
| memberships             | SELECT, UPDATE, DELETE           | Continuous| Unusual access patterns by role          |
| family_members          | SELECT, UPDATE, DELETE           | Continuous| Bulk reads from non-owner roles          |
| events                  | INSERT, UPDATE, DELETE           | Continuous| Draft access by non-admin/non-board      |
| event_registrations     | SELECT, UPDATE, DELETE           | Continuous| Multiple updates by non-owner            |
| volunteer_opportunities | INSERT, UPDATE, DELETE           | Continuous| Non-admin changes to draft/closed        |
| volunteer_signups       | INSERT, UPDATE, DELETE           | Continuous| High failure rate in INSERTs             |
| volunteer_assignments   | INSERT, UPDATE, DELETE           | Continuous| Non-admin mutations                      |
| volunteer_hours         | INSERT, UPDATE, DELETE           | Continuous| Admin approval spikes                    |
| donations               | SELECT, UPDATE, DELETE           | Continuous| Anonymous reads attempts                 |
| applications            | SELECT, UPDATE, DELETE           | Continuous| Non-owner reads                          |
| system_settings         | INSERT, UPDATE, DELETE           | Continuous| Any change by non-admin                  |
| audit_logs              | SELECT, UPDATE, DELETE           | Continuous| Non-admin reads                          |

### Audit Coverage

Ensure inserts into audit_logs are permitted without restrictive RLS so that application and database triggers can record activity reliably. Configure alerts for sensitive operations, especially on system_settings, donations, applications, profiles, and audit_logs.

## Implementation Timeline and Responsibilities

Delivery is structured across six phases with clear ownership and acceptance criteria. Security and database teams collaborate to implement helper functions and policies; QA validates regression tests; engineering manages Edge Function integration and application workflows.

Table 10: Milestone plan

| Phase | Owner                    | Start/End | Dependencies                      | Acceptance criteria                                        |
|------:|--------------------------|-----------|-----------------------------------|------------------------------------------------------------|
| 1     | Database Engineering     | Week 1    | None                              | Helpers created; unit tests pass                           |
| 2     | Database Engineering     | Week 2    | Phase 1                           | Dual-write policies verified against old policies          |
| 3     | Security Engineering     | Week 3    | Phase 2                           | Strict mode enabled; error rates within threshold          |
| 4     | Database Engineering     | Week 4    | Phase 3                           | Deprecated public policies removed; no regressions         |
| 5     | QA + Database Engineering| Week 5    | Phase 4                           | Performance tuned; EXPLAIN plans acceptable                |
| 6     | Security + Engineering   | Week 6    | Phase 5                           | Runbooks finalized; audit dashboards operational           |

### RACI

- Responsible: Database Engineering for helper functions and RLS policies; Security Engineering for validation and monitoring.
- Accountable: Security Leadership for approval of strict mode and removal of public policies.
- Consulted: Engineering Teams for Edge Function compatibility and application workflows.
- Informed: Product and QA for test planning and rollout timelines.

## Appendix: Schema Anchors and Status Enumerations

RLS conditions rely on schema columns and status enumerations that define resource lifecycle and access boundaries.

Key columns used in policies:
- profiles: id (UUID), role (text), status (text).
- memberships: user_id (UUID), tier (text), status (text).
- family_members: membership_id (UUID).
- events: status (text), allowed_tiers (text[]), created_by (UUID).
- event_registrations: user_id (UUID), event_id (UUID), status (text).
- volunteer_opportunities: status (text), created_by (UUID).
- volunteer_signups: member_id (UUID), opportunity_id (UUID), status (text).
- volunteer_assignments: user_id (UUID), opportunity_id (UUID), status (text).
- volunteer_hours: user_id (UUID), opportunity_id (UUID), assignment_id (UUID), status (text).
- donations: user_id (UUID), is_anonymous (boolean), payment_status (text).
- applications: user_id (UUID), status (text).
- system_settings: is_public (boolean), setting_type (text).
- audit_logs: user_id (UUID), action (text), entity_type (text), entity_id (UUID).

Status enumerations:
- profiles.status: active, inactive, suspended, pending.
- memberships.status: active, expired, cancelled, pending.
- events.status: draft, published, cancelled, completed.
- volunteer_opportunities.status: open, filled, closed, cancelled.
- volunteer_signups.status: PENDING, CONFIRMED, CANCELLED, COMPLETED.
- volunteer_assignments.status: assigned, completed, cancelled, no_show.
- volunteer_hours.status: pending, approved, rejected.
- donations.payment_status: pending, completed, failed, refunded.
- applications.status: pending, under_review, approved, rejected, withdrawn.
- system_settings.setting_type: string, number, boolean, json, date.

Table 11: Enumerations and policy use

| Column                         | Enum values                                      | Policy usage example                                           |
|--------------------------------|--------------------------------------------------|----------------------------------------------------------------|
| profiles.role                  | admin, board, member, student, applicant        | is_admin(), is_board(), has_role('member')                    |
| profiles.status                | active, inactive, suspended, pending            | May gate certain self-service operations                       |
| memberships.status             | active, expired, cancelled, pending             | Owner read only; admin manages                                 |
| events.status                  | draft, published, cancelled, completed          | Public read for published; admin/board manage drafts           |
| events.allowed_tiers           | student, individual, family                     | Public read if event.published AND tier allowed                |
| volunteer_opportunities.status | open, filled, closed, cancelled                 | Public read for open; admin-only for others                    |
| volunteer_signups.status       | PENDING, CONFIRMED, CANCELLED, COMPLETED        | Owner self-cancel; admin manage                                |
| volunteer_assignments.status   | assigned, completed, cancelled, no_show         | Admin-only management                                          |
| volunteer_hours.status         | pending, approved, rejected                     | Owner edits pending; admin approves/rejects                    |
| donations.is_anonymous         | true, false                                     | Board read only if false                                       |
| applications.status            | pending, under_review, approved, rejected, withdrawn | Owner read until submitted; admin/board manage workflow  |
| system_settings.is_public      | true, false                                     | Public read for true; admin-only for false                     |

### Key Columns for Ownership Checks

Owner checks rely on user_id or id matching auth.uid() across profiles, memberships, event_registrations, volunteer signups, assignments, hours, donations, and applications. Board/admin visibility leverages role checks via helper functions and limited field exposure for board in memberships, family_members, and donations.

## Information Gaps

Several gaps must be addressed to finalize policies and ensure consistent behavior:
- The exact mapping of RBAC permissions to roles and resources beyond the provided role set and general patterns.
- The relationship between member tiers (student/individual/family) and permission scopes, especially for event registration and volunteer opportunities.
- The canonical schema for volunteer_signups in the latest migrations versus the standalone table definition.
- Edge Functions’ precise write paths and how they interact with business tables and storage.objects.
- Performance considerations: index coverage for policy predicates and query plans at scale.
- Operational constraints for public read access (e.g., which system_settings are public, which events are published).

Resolving these gaps is necessary before production rollout to avoid regressions and ensure the policies align with platform workflows.

## Conclusion

The platform’s current RLS posture is incompatible with a secure, least-privilege design. This plan provides a structured, role-aligned approach to RLS that restores authorization boundaries, enables Edge Functions safely, and limits public exposure to only those resources that must be discoverable. By introducing helper functions, adopting per-operation policies, and enforcing resource-specific access controls, the database layer will enforce the intended RBAC model without relying on application logic alone. The phased migration and validation program reduces rollout risk, and the governance framework ensures ongoing oversight. With the identified information gaps resolved, the organization can transition confidently to a secure-by-default RLS configuration.