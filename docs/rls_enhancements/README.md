# From RBAC to Supabase RLS: A Role-Driven Security Blueprint

## Executive Summary: Why RLS Now

The current Row Level Security (RLS) configuration across core tables relies on blanket public permissions—allowing anonymous users to read and, in many cases, modify sensitive records. This posture creates an immediate and material risk of data leakage and tampering across profiles, memberships, family members, events, event registrations, volunteer systems, donations, applications, system settings, and audit logs.

The purpose of this blueprint is to replace permissive patterns with a role-driven, least-privilege model aligned to established Role-Based Access Control (RBAC) principles. The central objective is secure-by-default authorization at the database layer, ensuring each operation is explicitly permitted for the caller’s role and the specific resource in question.

We propose a phased migration with helper functions that enable dynamic role checks, per-operation policies with clear USING and WITH CHECK clauses, and explicit design to support Edge Function flows without widening permissions. The expected outcomes are immediate risk containment, a robust RBAC-aligned posture that scales, and zero regressions for legitimate Edge Function and application workflows.

Table 1: Target RLS posture by table and operation

| Table                  | SELECT                              | INSERT                                | UPDATE                                | DELETE                  |
|------------------------|-------------------------------------|---------------------------------------|---------------------------------------|-------------------------|
| profiles               | Owner or admin                      | Authenticated (self)                  | Owner or admin                        | Admin only              |
| memberships            | Owner; board (limited fields); admin| Authenticated (self)                  | Owner (limited); admin                | Admin only              |
| family_members         | Owner via membership; admin         | Owner via membership                  | Owner; admin                          | Admin only              |
| events                 | Public if published; admin/board    | Admin/board                           | Admin/board                           | Admin/board             |
| event_registrations    | Owner; admin/board                  | Authenticated (self)                  | Owner (limited); admin/board          | Owner; admin/board      |
| volunteer_opportunities| Public if open; admin/board         | Admin/board                           | Admin/board                           | Admin/board             |
| volunteer_signups      | Owner; admin                        | Authenticated (self)                  | Owner (limited); admin                | Owner; admin            |
| volunteer_assignments  | Owner; admin                        | Admin                                 | Admin                                 | Admin                   |
| volunteer_hours        | Owner; admin/board                  | Owner (self)                          | Owner (pending); admin approval       | Admin only              |
| donations              | Owner (non-anonymous); admin/board  | Authenticated (self)                  | Admin only                            | Admin only              |
| applications           | Owner; admin/board                  | Authenticated (self)                  | Owner (limited); admin/board          | Admin/board             |
| system_settings        | Public (is_public); admin (private) | Admin                                 | Admin                                 | Admin only              |
| audit_logs             | Admin                               | Insert allowed without RLS restriction| Admin                                 | Admin only              |

### Scope and Non-Goals

Scope covers all application tables with current or proposed RLS: profiles, memberships, family_members, events, event_registrations, volunteer_opportunities, volunteer_signups, volunteer_assignments, volunteer_hours, donations, applications, system_settings, audit_logs. It also considers Edge Function integration and related storage.objects policies insofar as they interact with these tables.

Non-goals include application workflow logic and business rules. RLS enforces authorization; business rule validation remains the responsibility of application services and Edge Functions.

## Current RLS Posture and Risks

Two classes of policies are in effect. The first set grants public read and manage permissions across most tables, creating an immediate exposure vector for PII and administrative records. The second—intended to simplify volunteer system access—permits anonymous and authenticated actors near-unrestricted operations on volunteer_opportunities and volunteer_signups, including insert, update, and delete.

The most critical exposures involve profiles, applications, donations, memberships/family_members, system settings, and audit logs. An attacker can enumerate and modify these records without authentication. Secondary risks include abuse of volunteer systems—mass signups, hour tampering, and assignment manipulation—which undermines program integrity and reporting.

Table 2: Policy risk heatmap (current vs. required)

| Table                   | Current SELECT         | Current INSERT         | Current UPDATE         | Current DELETE         | Risk |
|-------------------------|------------------------|------------------------|------------------------|------------------------|------|
| profiles                | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| memberships             | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| family_members          | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| events                  | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | High |
| event_registrations     | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | High |
| volunteer_opportunities | Read: anon/auth/service| Insert: anon/auth/service| Update: anon/auth/service| Delete: anon/auth/service| High |
| volunteer_signups       | Read: anon/auth/service| Insert: anon/auth/service| Update: anon/auth/service| Delete: anon/auth/service| High |
| volunteer_assignments   | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | High |
| volunteer_hours         | Public can manage all  | Public can manage all  | Public can manage all  | Public can manage all  | High |
| donations               | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| applications            | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| system_settings         | Public can view all    | Public can manage all  | Public can manage all  | Public can manage all  | Critical |
| audit_logs              | Public can view all    | Allowed (no RLS)       | N/A                    | N/A                    | High |

Immediate remediation requires replacing public-facing policies with least-privilege constraints, enabling secure-by-default behavior, and supporting Edge Functions without regressing access.

## RBAC Model Alignment

The RBAC model is anchored in the profiles.role field, which enumerates admin, board, member, student, and applicant. Admin and board roles have scoped administrative privileges across tables; members, students, and applicants have self-service capabilities tied to resource ownership. Least-privilege is enforced by default-deny semantics, explicit operation-level permissions, and constraints such as status = 'published' for public reads and owner checks for self-service.

Key relationships used in RLS conditions include ownership (id = auth.uid() for profiles), user linkage (user_id = auth.uid() across memberships, event_registrations, donations, volunteer_hours, and applications), created_by for events, and membership linkage for family_members.

Public read is intentionally limited to published events and open volunteer opportunities. System settings marked public are readable by all, but only admins can manage settings.

Table 3: Role-to-permission mapping matrix

| Table                   | Admin                              | Board                                | Member/Student                        | Applicant                  |
|-------------------------|------------------------------------|--------------------------------------|--------------------------------------|----------------------------|
| profiles                | Read/manage all                    | Read limited; no manage              | Read/manage own                      | Read/manage own            |
| memberships             | Read/manage all                    | Read limited                         | Read/manage own                      | N/A                        |
| family_members          | Read/manage all                    | Read limited                         | Read/manage own via membership       | N/A                        |
| events                  | Read/manage all                    | Read/manage                          | Read published                       | Read published             |
| event_registrations     | Read/manage all                    | Read/manage                          | Read/manage own                      | Read/manage own            |
| volunteer_opportunities | Read/manage all                    | Read/manage                          | Read open                            | Read open                  |
| volunteer_signups       | Read/manage all                    | Read limited                         | Read/manage own                      | Read/manage own            |
| volunteer_assignments   | Read/manage all                    | Read limited                         | Read own                             | N/A                        |
| volunteer_hours         | Read/manage all                    | Read limited                         | Read/manage own                      | N/A                        |
| donations               | Read/manage all                    | Read (non-anonymous)                 | Read/manage own                      | N/A                        |
| applications            | Read/manage all                    | Read/manage review                   | N/A                                  | Read/manage own            |
| system_settings         | Read/manage all                    | Read public                          | Read public                          | Read public                |
| audit_logs              | Read/manage all                    | N/A                                  | N/A                                  | N/A                        |

### Permission Granularity

Policies are defined per operation with explicit USING (read-time) and WITH CHECK (write-time) clauses. INSERT is restricted to authenticated users, with ownership checks or admin role requirements as appropriate. UPDATE rules include immutable field constraints and status-transition guards (e.g., pending hours editable by owner; admin only for approval). DELETE is limited to admin-only for high-risk tables (profiles, applications, donations, system_settings, audit_logs).

## Policy Design Principles and Helpers

To avoid circular dependencies and repeated subqueries, define helper functions that centralize role checks and role membership lookups:

- is_admin(): true if caller’s profile role is admin.
- is_board(): true if caller’s profile role is board.
- has_role(role): true if caller’s profile role matches role.
- has_any_role(roles): true if caller’s profile role is in roles.

These helpers reduce policy complexity, avoid ambiguous role lookups, and improve performance. They also provide a stable anchor for future schema changes.

Policies should prefer per-operation clarity over “FOR ALL,” enabling auditors and developers to reason about access by table and operation. Edge Functions often invoke the database with the service_role key while preserving the original caller’s role context; therefore, INSERT policies that originate from client-invoked functions must allow both anon and authenticated, combined with ownership or role checks, to prevent “new row violates row-level security policy” failures.

Table 4: Helper function specification

| Function       | Inputs  | Returns | Query pattern                                                          |
|----------------|---------|---------|-------------------------------------------------------------------------|
| is_admin()     | None    | Boolean | EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') |
| is_board()     | None    | Boolean | EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'board') |
| has_role(role) | text    | Boolean | EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = role)     |
| has_any_role(roles) | text[] | Boolean | EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(roles)) |

### Circular Dependency Avoidance

The helper functions must be simple, explicit, and guard against null auth.uid(). Policies should not depend on cross-table row-level data unless necessary for ownership or membership linkage. This minimizes coupling and reduces the risk of evaluation errors.

### Edge Function Compatibility

INCLUDE both anon and authenticated roles in INSERT policies where appropriate, combined with ownership/role checks. This preserves legitimate Edge Function flows, avoids runtime policy errors, and maintains least-privilege defaults.

## Resource-Specific RLS Policies

The following patterns translate the RBAC model into per-table policies. Public read is limited to published events and open volunteer opportunities. Admin and board have scoped administrative capabilities. INSERT rules are restricted to authenticated users and tightly controlled through ownership and role checks. UPDATE and DELETE rules enforce status constraints and immutability.

Table 5: Policy matrix by table and operation (abbrev.)

| Table                   | SELECT                                          | INSERT                                   | UPDATE                                                | DELETE        |
|-------------------------|-------------------------------------------------|------------------------------------------|-------------------------------------------------------|---------------|
| profiles                | auth.uid() = id OR is_admin()                   | auth.uid() = id                           | auth.uid() = id OR is_admin()                         | is_admin()    |
| memberships             | user_id = auth.uid() OR is_board() OR is_admin()| user_id = auth.uid()                      | user_id = auth.uid() (limited) OR is_admin()          | is_admin()    |
| family_members          | membership.owner OR is_board() OR is_admin()    | membership.owner                          | membership.owner OR is_admin()                        | is_admin()    |
| events                  | status = 'published' OR is_admin() OR is_board()| is_admin() OR is_board()                  | is_admin() OR is_board()                              | is_admin()/is_board() |
| event_registrations     | user_id = auth.uid() OR is_admin() OR is_board()| user_id = auth.uid()                      | user_id = auth.uid() (limited) OR is_admin()/is_board()| user_id = auth.uid() OR is_admin()/is_board() |
| volunteer_opportunities | status = 'open' OR is_admin() OR is_board()     | is_admin() OR is_board()                  | is_admin() OR is_board()                              | is_admin()/is_board() |
| volunteer_signups       | member_id = auth.uid() OR is_admin()            | member_id = auth.uid()                    | member_id = auth.uid() (limited) OR is_admin()        | member_id = auth.uid() OR is_admin() |
| volunteer_assignments   | user_id = auth.uid() OR is_admin()              | is_admin()                                | is_admin()                                            | is_admin()    |
| volunteer_hours         | user_id = auth.uid() OR is_admin() OR is_board()| user_id = auth.uid()                      | user_id = auth.uid() AND status = 'pending' OR is_admin() | is_admin()    |
| donations               | user_id = auth.uid() AND is_anonymous = false OR is_admin() OR (is_board() AND is_anonymous = false) | user_id = auth.uid() | is_admin()                                            | is_admin()    |
| applications            | user_id = auth.uid() OR is_admin() OR is_board()| user_id = auth.uid()                      | user_id = auth.uid() (limited) OR is_admin()/is_board() | is_admin()/is_board() |
| system_settings         | is_public = true OR is_admin()                  | is_admin()                                | is_admin()                                            | is_admin()    |
| audit_logs              | is_admin()                                      | Insert allowed without RLS restriction    | is_admin()                                            | is_admin()    |

### Profiles

- SELECT: Owner or is_admin().
- INSERT: Authenticated users creating their own profile via application flows (WITH CHECK auth.uid() = id).
- UPDATE: Owner or is_admin().
- DELETE: is_admin() only.

### Memberships

- SELECT: Owner; board (limited fields); admin.
- INSERT: Authenticated (self) via controlled flows.
- UPDATE: Owner (limited fields); admin.
- DELETE: Admin only.

### Family Members

- SELECT: Owner via membership ownership; board (limited); admin.
- INSERT: Owner via membership ownership.
- UPDATE: Owner; admin.
- DELETE: Admin only.

### Events

- SELECT: Public if status = 'published'; admin/board can read drafts.
- INSERT/UPDATE/DELETE: Admin/board only.

### Event Registrations

- SELECT: Owner; admin/board.
- INSERT: Authenticated (self).
- UPDATE: Owner (limited); admin/board.
- DELETE: Owner (self cancel); admin/board.

### Volunteer Opportunities

- SELECT: Public if status = 'open'; admin-only for drafts/closed/cancelled.
- INSERT/UPDATE/DELETE: Admin/board only.

### Volunteer Signups

- SELECT: Owner; admin.
- INSERT: Authenticated (self).
- UPDATE: Owner (limited fields such as cancellation); admin.
- DELETE: Owner (self cancel); admin.

### Volunteer Assignments

- SELECT: Owner; admin.
- INSERT/UPDATE/DELETE: Admin only.

### Volunteer Hours

- SELECT: Owner; admin/board.
- INSERT: Owner (self).
- UPDATE: Owner (pending); admin approval.
- DELETE: Admin only.

### Donations

- SELECT: Owner (non-anonymous); admin; board limited to non-anonymous.
- INSERT: Authenticated (self).
- UPDATE/DELETE: Admin only.

### Applications

- SELECT: Owner; admin/board.
- INSERT: Authenticated (self).
- UPDATE: Owner (limited fields prior to review); admin/board manage all.
- DELETE: Admin/board only.

### System Settings

- SELECT: Public settings readable; private settings admin-only.
- INSERT/UPDATE/DELETE: Admin only.

### Audit Logs

- SELECT: Admin only.
- INSERT: Allowed without RLS restriction (application writes).
- UPDATE/DELETE: Admin only.

## Dynamic Role Checking and Multi-Role Scenarios

Precedence rules apply where admin and board supersede member/student/applicant for administrative actions, while self-service operations rely on ownership checks. Membership tiers (student/individual/family) influence event access via allowed_tiers; only published events are visible to the public, with drafts restricted to admin/board. Board visibility is limited in memberships, family_members, and donations to non-sensitive fields and non-anonymous records.

Edge Functions’ dual authentication layers mean the database sees the original caller’s role even when the function uses service_role internally. Policies must include both anon and authenticated for INSERT operations in function flows, combined with ownership/role checks.

Table 6: Multi-role resolution examples

| Scenario                                              | Outcome                                                          |
|-------------------------------------------------------|------------------------------------------------------------------|
| User is both board and member                         | Board precedence applies for administrative tables               |
| Student with family membership                        | Event access via allowed_tiers; drafts require board/admin       |
| Applicant submits application                         | Self-service INSERT; SELECT restricted to owner until review     |
| Frontend invokes Edge Function to create signup       | INSERT allowed for anon/authenticated + service_role + ownership |

### Role Precedence Logic

For administrative actions, admin and board have priority. For self-service, ownership and membership linkage govern access. Board visibility is restricted to appropriate fields and non-anonymous records in sensitive domains.

### Edge Function Context Preservation

Allow both anon and authenticated in INSERT policies that originate from Edge Functions, combined with ownership or role checks, to ensure reliable execution without widening permissions.

## Migration and Rollout Plan

Adopt a phased approach to minimize risk and enable measurable validation.

- Phase 1: Add helper functions; validate query patterns and performance.
- Phase 2: Create new policies alongside existing ones; dual-write and compare behavior.
- Phase 3: Enable strict mode per table; monitor error rates and Edge Function flows.
- Phase 4: Remove deprecated public policies; ensure no regressions.
- Phase 5: Tune performance with indexes and simplified EXISTS clauses.
- Phase 6: Finalize operational runbooks and documentation.

Table 7: Rollout checklist

| Phase | Actions                                       | Validation                                    | Rollback                                    |
|------:|-----------------------------------------------|-----------------------------------------------|---------------------------------------------|
| 1     | Add helpers (is_admin, is_board, etc.)        | Unit tests; auth.uid() handling               | Drop helpers if misbehaving                 |
| 2     | Create new per-operation policies             | Compare with old policies on CRUD operations  | Retain old policies                         |
| 3     | Enable strict mode per table                  | Monitor RLS errors and function flows         | Disable strict mode on affected tables      |
| 4     | Remove deprecated public policies             | Confirm app/function workflows unaffected     | Reinstate deprecated policies temporarily  |
| 5     | Index tuning; minimize cross-table checks     | Validate EXPLAIN plans and latency            | Revert indexes if negative impact           |
| 6     | Runbooks; audits; documentation               | Dry-run audits; finalize policy docs          | Roll back to prior stable release           |

### Migration Steps

Deploy helper functions and introduce least-privilege per-operation policies. Enable strict RLS per table while preserving Edge Function flows via anon + authenticated allowances where necessary. Remove deprecated public policies once dual-write validation passes.

### Rollback Procedures

Maintain scripts and feature flags to revert policies quickly if critical failures occur. Isolate regressions by toggling strict mode per table and reinstating prior policies temporarily.

## Testing and Validation

Construct a comprehensive test matrix covering each table, operation, and role (admin, board, member, student, applicant, anon, authenticated, service_role). Verify least-privilege outcomes: public reads only for published events and open opportunities; PII and sensitive records not readable by anon; admin-only operations reject lower roles; self-service requires ownership.

Edge Function integration tests must confirm that anon-invoked functions can write where intended and that RLS denies unauthorized operations. Regression testing focuses on former public policy behaviors.

Table 8: Test matrix (sample)

| Table                | Operation | Role           | Expected                          |
|----------------------|-----------|----------------|-----------------------------------|
| profiles             | SELECT    | owner          | Allow                             |
| profiles             | SELECT    | anon           | Deny                              |
| memberships          | UPDATE    | member (owner) | Allow limited fields              |
| events               | INSERT    | board          | Allow                             |
| volunteer_signups    | INSERT    | authenticated  | Allow if member_id = auth.uid()   |
| volunteer_opportunities | SELECT | anon           | Allow if status = 'open'          |
| donations            | SELECT    | board          | Allow if non-anonymous            |
| applications         | SELECT    | applicant      | Allow if owner                    |
| system_settings      | SELECT    | anon           | Allow if is_public = true         |
| audit_logs           | SELECT    | admin          | Allow                             |

### RLS Regression Tests

Confirm that:
- Public reads are restricted to published events and open opportunities.
- PII (profiles, applications, donations) and sensitive tables (system_settings, audit_logs) are not readable by anon.
- Self-service operations require ownership checks and authenticated roles.
- Admin-only operations reject board/member roles.

### Edge Function Integration Tests

- Invoke functions that INSERT into volunteer_signups and volunteer_hours as anon/authenticated users; confirm success with ownership checks.
- Ensure INSERT policies allow anon + authenticated + service_role where necessary.
- Validate UPDATE flows through Edge Functions respect WITH CHECK constraints.

## Monitoring, Auditing, and Governance

Audit logs should capture RLS enforcement actions for sensitive tables, with dashboards and alerts tracking policy violations and permission denials. Governance includes periodic reviews of role definitions and permission scopes, and verification that system settings visibility aligns with policy.

Table 9: Audit event mapping

| Table             | Log operations                       | Frequency  | Alert thresholds                         |
|-------------------|--------------------------------------|------------|------------------------------------------|
| profiles          | SELECT/UPDATE/DELETE                 | Continuous | Multiple denies per user per hour        |
| memberships       | SELECT/UPDATE/DELETE                 | Continuous | Unusual access by role                   |
| family_members    | SELECT/UPDATE/DELETE                 | Continuous | Bulk reads by non-owner roles            |
| events            | INSERT/UPDATE/DELETE                 | Continuous | Draft access by non-admin/non-board      |
| event_registrations| SELECT/UPDATE/DELETE                | Continuous | Multiple updates by non-owner            |
| volunteer_opportunities| INSERT/UPDATE/DELETE           | Continuous | Non-admin changes to draft/closed        |
| volunteer_signups | INSERT/UPDATE/DELETE                 | Continuous | High INSERT failure rate                 |
| volunteer_assignments| INSERT/UPDATE/DELETE              | Continuous | Non-admin mutations                      |
| volunteer_hours   | INSERT/UPDATE/DELETE                 | Continuous | Approval spikes                          |
| donations         | SELECT/UPDATE/DELETE                 | Continuous | Anonymous reads attempts                 |
| applications      | SELECT/UPDATE/DELETE                 | Continuous | Non-owner reads                          |
| system_settings   | INSERT/UPDATE/DELETE                 | Continuous | Any change by non-admin                  |
| audit_logs        | SELECT/UPDATE/DELETE                 | Continuous | Non-admin reads                          |

### Audit Coverage

Permit inserts into audit_logs without restrictive RLS so application and database triggers can record activity reliably. Configure alerts for sensitive operations, especially on system_settings, donations, applications, profiles, and audit_logs.

## Implementation Timeline and Responsibilities

- Database Engineering: helper functions, per-operation policies, index tuning.
- Security Engineering: validation, monitoring, and governance.
- QA: Edge Function integration and regression testing.
- Engineering: application workflows and function invocation patterns.

Table 10: Milestone plan

| Phase | Owner                  | Dependencies     | Acceptance criteria                               |
|------:|------------------------|------------------|---------------------------------------------------|
| 1     | Database Engineering   | None             | Helpers deployed; unit tests pass                 |
| 2     | Database Engineering   | Phase 1          | Dual-write policies validated                     |
| 3     | Security Engineering   | Phase 2          | Strict mode enabled; error rates within threshold |
| 4     | Database Engineering   | Phase 3          | Deprecated policies removed; no regressions       |
| 5     | QA + Database Engineering | Phase 4      | Performance tuned; EXPLAIN plans acceptable       |
| 6     | Security + Engineering | Phase 5          | Runbooks finalized; audit dashboards operational  |

### RACI

- Responsible: Database Engineering and Security Engineering.
- Accountable: Security Leadership.
- Consulted: Engineering Teams.
- Informed: Product and QA.

## Appendix: Schema Anchors and Status Enumerations

RLS policies rely on specific columns and enumerations for ownership checks and lifecycle states. Key columns include id (profiles), user_id (memberships, event_registrations, volunteer_hours, donations, applications), membership_id (family_members), created_by (events), status across multiple tables (events, volunteer systems, applications), and is_public (system_settings).

Status enumerations drive lifecycle visibility:
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

| Column                         | Enum values                                           | Policy use                                           |
|--------------------------------|-------------------------------------------------------|------------------------------------------------------|
| profiles.role                  | admin, board, member, student, applicant             | is_admin(), is_board(), has_role()                   |
| profiles.status                | active, inactive, suspended, pending                  | Self-service gating (optional)                       |
| memberships.status             | active, expired, cancelled, pending                   | Admin/board visibility; owner read                   |
| events.status                  | draft, published, cancelled, completed                | Public read if published; admin/board manage         |
| volunteer_opportunities.status | open, filled, closed, cancelled                       | Public read if open; admin-only otherwise            |
| volunteer_signups.status       | PENDING, CONFIRMED, CANCELLED, COMPLETED              | Self-cancel; admin manage                            |
| volunteer_assignments.status   | assigned, completed, cancelled, no_show               | Admin-only management                                |
| volunteer_hours.status         | pending, approved, rejected                           | Owner edit pending; admin approval                   |
| donations.is_anonymous         | true, false                                           | Board read only if false                             |
| applications.status            | pending, under_review, approved, rejected, withdrawn  | Owner read until review; admin/board manage          |
| system_settings.is_public      | true, false                                           | Public read if true; admin-only otherwise            |

### Ownership Checks

Resource ownership checks typically equate the caller’s user identifier to the row’s user_id or id (e.g., profiles.id = auth.uid()). Board/admin visibility leverages helper functions and, where appropriate, limited field exposure for non-admin roles.

## Information Gaps

To finalize policies and ensure consistent behavior across environments, the following gaps must be addressed:
- Explicit RBAC permission-to-resource mapping beyond role enumerations and general patterns.
- Definitive role-to-tier mapping and constraints (student/individual/family) for events and volunteer systems.
- Canonical current schema for volunteer_signups, including latest migrations versus the standalone definition.
- Edge Functions’ detailed write paths and interactions with storage.objects and business tables.
- Performance considerations for policy predicates and index coverage at scale.
- Operational definitions for public read (which system_settings are public; which events are published).

Resolving these items is necessary for production rollout without regressions.

## Conclusion

Replacing blanket public RLS with a role-driven, least-privilege model is the most direct path to secure-by-default authorization. Centralized helper functions, per-operation policies, and precise ownership checks establish a coherent RBAC-aligned posture that is easier to reason about, audit, and maintain. Edge Function compatibility is ensured by acknowledging dual authentication layers and structuring INSERT policies accordingly. With a disciplined migration plan and comprehensive validation, the platform can eliminate widespread exposure while preserving all legitimate application workflows.