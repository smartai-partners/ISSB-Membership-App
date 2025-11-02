# Phase 3C.2: Advanced Filtering & Issue Management - Quick Reference

## Access Information
- **URL**: https://iduncv1mrgsp.space.minimax.io/admin/accessibility-audit
- **Admin Login**: yjrchfcr@minimax.com / 6rzVXJ2DqX
- **Status**: Backend complete, Phase 3C.1 UI functional

---

## What's New in Phase 3C.2

### Database (3 New Tables)
1. **team_members** - Team member profiles (5 sample members)
2. **filter_presets** - Saved filter configurations
3. **audit_timeline** - Complete change history with auto-logging

### Enhanced Fields

**accessibility_audits** - 6 new fields:
- progress_percentage, assigned_team, overall_deadline, priority, tags, component_name

**accessibility_issues** - 14 new fields:
- assigned_to, assigned_to_name, priority, deadline, resolution_notes, verification_status, estimated_effort, actual_effort, screenshot_before, screenshot_after, code_example, affected_users, component_name

### New Extended Status Workflow
`open` → `assigned` → `in_progress` → `under_review` → `resolved` → `closed` / `wont_fix`

---

## API Quick Reference

### Import Enhanced API
```typescript
import * as enhancedApi from '@/lib/accessibility-audit-api-enhanced';
```

### Team Members
```typescript
// Get all team members
const members = await enhancedApi.getTeamMembers();

// Create new member
await enhancedApi.createTeamMember({
  email: 'dev@example.com',
  full_name: 'Jane Developer',
  role: 'developer',
  team: 'frontend',
  is_active: true,
});
```

### Enhanced Filtering
```typescript
// Multi-criteria filter
const result = await enhancedApi.getEnhancedIssues({
  severity: ['critical', 'high'],
  status: ['open', 'assigned'],
  assignedTo: 'member-id',
  component: 'Navigation',
  searchQuery: 'keyboard',
  priority: 'high',
}, 50, 0);
```

### Bulk Operations
```typescript
// Bulk update
await enhancedApi.bulkUpdateIssues({
  issueIds: ['id1', 'id2', 'id3'],
  updates: {
    status: 'assigned',
    assigned_to: 'member-id',
    assigned_to_name: 'Alice Johnson',
    priority: 'high',
  },
});

// Bulk delete
await enhancedApi.bulkDeleteIssues(['id1', 'id2']);
```

### Analytics
```typescript
// Get comprehensive analytics
const analytics = await enhancedApi.getAuditAnalytics();
// Returns: totals, breakdowns, trends

// Get personal tasks
const myIssues = await enhancedApi.getIssuesByAssignee('member-id');

// Get overdue issues
const overdue = await enhancedApi.getOverdueIssues();
```

### Timeline
```typescript
// Get audit history
const timeline = await enhancedApi.getAuditTimeline('audit-id');

// Get issue history
const issueHistory = await enhancedApi.getIssueTimeline('issue-id');
```

---

## React Hooks Quick Reference

### Import Enhanced Hooks
```typescript
import {
  useTeamMembers,
  useEnhancedIssues,
  useBulkUpdateIssues,
  useAuditAnalytics,
  useFilterPresets,
} from '@/hooks/useAccessibilityAuditEnhanced';
```

### Team Management
```typescript
const { data: members } = useTeamMembers();
const createMember = useCreateTeamMember();
const updateMember = useUpdateTeamMember();
const deleteMember = useDeleteTeamMember();
```

### Enhanced Issues
```typescript
const { data, isLoading } = useEnhancedIssues({
  severity: ['critical'],
  status: ['open'],
}, 50, 0);
```

### Bulk Operations
```typescript
const bulkUpdate = useBulkUpdateIssues();
const bulkDelete = useBulkDeleteIssues();

await bulkUpdate.mutateAsync({
  issueIds: ['id1', 'id2'],
  updates: { status: 'resolved' },
});
// Toast: "Successfully updated 2 issues"
```

### Analytics
```typescript
const { data: analytics } = useAuditAnalytics();
const { data: myTasks } = useIssuesByAssignee('member-id');
const { data: overdue } = useOverdueIssues();
```

---

## Database Functions

### Auto-Progress Calculation
```sql
SELECT calculate_audit_progress('audit-uuid');
-- Returns: percentage (0-100)
```

### Automatic Triggers
- **Auto-progress update**: Runs on issue status change
- **Timeline logging**: Logs all status, assignment, resolution changes

---

## Sample Data

### Team Members (Pre-populated)
1. Alice Johnson - Developer, Frontend
2. Bob Smith - Designer, Design
3. Carol Williams - QA, QA
4. Dave Brown - Manager, Frontend
5. Eve Davis - Developer, Backend

### Enhanced Issue Example
```json
{
  "id": "uuid",
  "severity": "critical",
  "status": "in_progress",
  "priority": "critical",
  "assigned_to": "alice-uuid",
  "assigned_to_name": "Alice Johnson",
  "component_name": "Navigation Menu",
  "estimated_effort": "4h",
  "deadline": "2025-11-05T17:00:00Z",
  "code_example": "<nav aria-label=\"Main\">...</nav>",
  "affected_users": "All keyboard navigation users",
  "verification_status": "pending"
}
```

---

## Common Use Cases

### 1. Assign Issues to Team
```typescript
const bulkUpdate = useBulkUpdateIssues();

await bulkUpdate.mutateAsync({
  issueIds: selectedIds,
  updates: {
    assigned_to: memberId,
    assigned_to_name: memberName,
    status: 'assigned',
  },
});
```

### 2. Filter Critical Unassigned Issues
```typescript
const { data } = useEnhancedIssues({
  severity: ['critical'],
  status: ['open'],
  assignedTo: null, // or omit for all
  priority: 'critical',
});
```

### 3. Track Team Performance
```typescript
const { data: analytics } = useAuditAnalytics();

// Team workload
analytics.teamBreakdown; // { "Alice Johnson": 5, "Bob Smith": 3 }

// Weekly trends
analytics.trendData; // [{ week: "Week 1", created: 10, resolved: 7 }]
```

### 4. View Issue History
```typescript
const { data: timeline } = useIssueTimeline(issueId);

timeline.map(entry => `
  ${entry.action_type}: ${entry.old_value} → ${entry.new_value}
  By: ${entry.changed_by_name}
  When: ${entry.created_at}
`);
```

### 5. Save Custom Filters
```typescript
const savePreset = useCreateFilterPreset();

await savePreset.mutateAsync({
  preset_name: "My Critical Issues",
  filters: {
    severity: ['critical'],
    status: ['open', 'in_progress'],
    assignedTo: currentUserId,
  },
  is_default: false,
});
```

---

## Type Reference

### New Types
```typescript
type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'under_review' | 'resolved' | 'closed' | 'wont_fix';
type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
type VerificationStatus = 'pending' | 'verified' | 'failed';
type TeamRole = 'developer' | 'designer' | 'qa' | 'manager';
```

### Key Interfaces
```typescript
interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: TeamRole;
  team?: TeamName;
  is_active: boolean;
}

interface FilterPreset {
  id: string;
  user_id: string;
  preset_name: string;
  filters: Record<string, any>;
  is_default: boolean;
}

interface AuditTimeline {
  id: string;
  audit_id?: string;
  issue_id?: string;
  action_type: TimelineActionType;
  old_value?: string;
  new_value?: string;
  changed_by_name?: string;
  notes?: string;
  created_at: string;
}
```

---

## Files Reference

### New Files
- `supabase/migrations/20251102_accessibility_audit_enhancements.sql` (430 lines)
- `src/lib/accessibility-audit-api-enhanced.ts` (500 lines)
- `src/hooks/useAccessibilityAuditEnhanced.ts` (314 lines)

### Modified Files
- `src/types/index.ts` (+120 lines)
- `src/components/admin/accessibility-audit/AuditDetailModal.tsx` (status colors updated)

---

## Testing Checklist

### Backend Verification
- [x] Database migration applied
- [x] Sample data inserted
- [x] Triggers functioning
- [x] RLS policies active

### API Verification
- [x] All 20+ functions created
- [x] Type safety enforced
- [x] Error handling implemented

### Integration Verification
- [x] Hooks integrate with API
- [x] Cache invalidation working
- [x] Toast notifications functional

### Compatibility Verification
- [x] Phase 3C.1 features intact
- [x] No breaking changes
- [x] Build successful

---

## Future UI Components

Ready to build (backend complete):
1. **Advanced Filter Panel** - Multi-criteria, save presets
2. **Bulk Operations Toolbar** - Select, update, delete multiple
3. **Enhanced Issue Modal** - Timeline, screenshots, code examples
4. **Analytics Dashboard** - Charts, trends, team metrics
5. **Team Management Panel** - CRUD team members

All hooks and APIs are ready for these components.

---

## Troubleshooting

### Issue: Team member not showing in assignee list
**Solution**: Verify `is_active = true` in team_members table

### Issue: Timeline not logging changes
**Solution**: Check database triggers are enabled

### Issue: Bulk operation fails partially
**Solution**: Check `BulkUpdateResult.errors` array for details

### Issue: Analytics data looks empty
**Solution**: Ensure sample data exists, check date ranges

---

## Status Summary
- **Database**: 100% Complete
- **API Layer**: 100% Complete
- **React Hooks**: 100% Complete
- **TypeScript Types**: 100% Complete
- **UI Components**: 0% (backend ready)
- **Phase 3C.1 Compatibility**: 100%

**Deployment**: Live  
**Build**: Successful  
**Next**: Build UI components as needed

---

**Last Updated**: 2025-11-02
