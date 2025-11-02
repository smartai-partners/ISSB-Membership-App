# Phase 3C.2 - Comprehensive Manual Testing Guide

**Deployed URL**: https://1dnr11xqb8pk.space.minimax.io
**Test Date**: 2025-11-02
**Purpose**: Validate all Phase 3C.2 Advanced Filtering & Issue Management features

---

## Pre-Test Setup

1. **Login Credentials**: Login with an admin account to access admin features
2. **Navigation**: Admin Dashboard → Accessibility Audit section
3. **Expected Page**: Enhanced Admin Accessibility Audit page with:
   - Filter panel on the left side
   - Bulk operations toolbar above the table
   - Enhanced issue table with selection checkboxes
   - Dashboard metrics at the top

---

## Test Pathway 1: Advanced Multi-Criteria Filtering

### Test 1.1: Individual Filters
**Purpose**: Verify each filter works independently

1. **Severity Filter**:
   - Click "Severity" dropdown in filter panel
   - Select "Critical"
   - ✅ Verify: Table updates to show only critical severity issues
   - Click "Clear All Filters"
   - ✅ Verify: Table shows all issues again

2. **Status Filter**:
   - Click "Status" dropdown
   - Select "Open"
   - ✅ Verify: Table shows only open issues
   - Clear filters

3. **Component Filter**:
   - Click "Component" dropdown
   - Select "Navigation"
   - ✅ Verify: Table shows only Navigation component issues
   - Clear filters

4. **Assignee Filter**:
   - Click "Assigned To" dropdown
   - Select a team member (e.g., "Alice Johnson")
   - ✅ Verify: Table shows only issues assigned to that person
   - Clear filters

5. **WCAG Level Filter**:
   - Click "WCAG Level" dropdown
   - Select "AA"
   - ✅ Verify: Table shows only WCAG AA issues
   - Clear filters

6. **Priority Filter**:
   - Click "Priority" dropdown
   - Select "High"
   - ✅ Verify: Table shows only high priority issues
   - Clear filters

### Test 1.2: Combined Filters
**Purpose**: Verify multiple filters work together (AND logic)

1. Apply Severity: "Critical" AND Status: "Open"
   - ✅ Verify: Table shows only issues that are BOTH critical AND open

2. Add Component: "Navigation" to the above
   - ✅ Verify: Table shows only issues matching ALL THREE criteria

3. Click "Clear All Filters"
   - ✅ Verify: All filters reset, table shows all issues

### Test 1.3: Search Functionality

1. Type "color contrast" in search box
   - ✅ Verify: Table filters to show only issues with "color contrast" in title/description

2. Clear search
   - ✅ Verify: All issues displayed again

### Test 1.4: Date Range Filtering

1. Click "Date Range" in filter panel
2. Select a start date and end date
   - ✅ Verify: Table shows only issues within that date range

3. Clear date filter
   - ✅ Verify: All dates shown again

---

## Test Pathway 2: Filter Presets

### Test 2.1: Create Filter Preset

1. Set filters:
   - Severity: "Critical"
   - Status: "Open"
   - Priority: "High"

2. Click "Save Preset" button in filter panel

3. Enter preset name: "Critical Open High Priority"

4. Click Save
   - ✅ Verify: Success toast message appears
   - ✅ Verify: Preset appears in saved presets list

### Test 2.2: Load Filter Preset

1. Click "Clear All Filters" to reset

2. Click "Load Preset" dropdown

3. Select "Critical Open High Priority"
   - ✅ Verify: All three filters restore (Severity=Critical, Status=Open, Priority=High)
   - ✅ Verify: Table updates with filtered results

### Test 2.3: Delete Filter Preset

1. Find the preset management section

2. Click delete/trash icon next to "Critical Open High Priority"

3. Confirm deletion
   - ✅ Verify: Success message appears
   - ✅ Verify: Preset removed from list

---

## Test Pathway 3: Bulk Operations - Selection

### Test 3.1: Individual Selection

1. Click checkbox for first issue in table
   - ✅ Verify: Checkbox is checked
   - ✅ Verify: Bulk operations toolbar shows "1 selected"

2. Click checkbox for second issue
   - ✅ Verify: Both checkboxes checked
   - ✅ Verify: Toolbar shows "2 selected"

3. Click checkbox again to deselect
   - ✅ Verify: Issue deselected
   - ✅ Verify: Count updates

### Test 3.2: Select All

1. Click "Select All" checkbox in table header
   - ✅ Verify: All visible issues are selected
   - ✅ Verify: Toolbar shows count (e.g., "20 selected" if 20 rows visible)

2. Click "Select All" again to deselect
   - ✅ Verify: All checkboxes unchecked
   - ✅ Verify: Toolbar shows "0 selected"

---

## Test Pathway 4: Bulk Status Updates

### Test 4.1: Update Multiple Issues to In Progress

1. Select 2-3 issues using checkboxes

2. Click "Update Status" button in bulk toolbar

3. Select "In Progress" from dropdown

4. Click Confirm/Save
   - ✅ Verify: Success toast message (e.g., "3 issues updated successfully")
   - ✅ Verify: Selected issues now show "In Progress" status badge
   - ✅ Verify: Status badge colors are correct (blue for in_progress)

### Test 4.2: Update to Different Status

1. Select different issues

2. Update status to "Resolved"
   - ✅ Verify: Issues update to green "Resolved" badge

---

## Test Pathway 5: Bulk Assignee Changes

### Test 5.1: Assign Multiple Issues to Team Member

1. Select 2-3 unassigned or differently assigned issues

2. Click "Update Assignee" button in bulk toolbar

3. Select a team member (e.g., "Alice Johnson")

4. Click Confirm
   - ✅ Verify: Success message appears
   - ✅ Verify: Selected issues now show the assigned team member's name
   - ✅ Verify: Assignee badge/label displays correctly

### Test 5.2: Reassign Issues

1. Select issues currently assigned to Alice

2. Reassign to "Bob Smith"
   - ✅ Verify: Issues successfully reassigned

---

## Test Pathway 6: Bulk CSV Export

### Test 6.1: Export Selected Issues

1. Select 3-5 issues using checkboxes

2. Click "Export CSV" button in bulk toolbar
   - ✅ Verify: CSV file downloads automatically
   - ✅ Verify: Filename is descriptive (e.g., "accessibility-issues-2025-11-02.csv")

3. Open downloaded CSV file
   - ✅ Verify: Contains all expected columns (ID, Title, Description, Severity, Status, Assignee, etc.)
   - ✅ Verify: Contains only the selected issues (3-5 rows)
   - ✅ Verify: Data is accurate and matches table display

### Test 6.2: Export All Issues

1. Click "Select All" to select all visible issues

2. Click "Export CSV"
   - ✅ Verify: CSV contains all visible issues
   - ✅ Verify: Data integrity maintained

---

## Test Pathway 7: Enhanced Issue Detail Modal

### Test 7.1: Open Modal and Verify Tabs

1. Click on any issue row in the table
   - ✅ Verify: Enhanced modal opens
   - ✅ Verify: Modal title shows issue title
   - ✅ Verify: Tab navigation visible with: Details, Timeline, Screenshots, Code Example

### Test 7.2: Details Tab

1. Verify Details tab (should be active by default)
   - ✅ Verify: Displays issue information (Title, Description, Severity, Status, etc.)
   - ✅ Verify: Displays WCAG criteria
   - ✅ Verify: Shows assigned team member
   - ✅ Verify: Shows priority level
   - ✅ Verify: All fields are properly formatted

### Test 7.3: Timeline Tab

1. Click "Timeline" tab
   - ✅ Verify: Timeline view displays
   - ✅ Verify: Shows chronological history of changes
   - ✅ Verify: Each entry shows: timestamp, user, action, details
   - ✅ Verify: Entries are sorted by date (newest first or oldest first)
   - ✅ Verify: Icons/indicators show action types (created, updated, assigned, status changed)

### Test 7.4: Screenshots Tab

1. Click "Screenshots" tab
   - ✅ Verify: Screenshots section displays
   - ✅ Verify: If screenshots exist, they are displayed as thumbnails or full images
   - ✅ Verify: Can click to view full-size if thumbnails
   - ✅ Verify: If no screenshots, shows appropriate message

### Test 7.5: Code Example Tab

1. Click "Code Example" tab
   - ✅ Verify: Code example section displays
   - ✅ Verify: If code example exists, it's displayed with syntax highlighting
   - ✅ Verify: Code is properly formatted
   - ✅ Verify: If no code example, shows appropriate message

### Test 7.6: Edit Issue in Modal

1. Switch back to "Details" tab

2. Click "Edit" or modify fields (if editable in modal)

3. Change Severity from "Critical" to "High"

4. Change Status from "Open" to "Assigned"

5. Click "Save"
   - ✅ Verify: Success message appears
   - ✅ Verify: Modal closes or stays open with updated data
   - ✅ Verify: Table row updates to reflect changes

6. Reopen the modal
   - ✅ Verify: Changes persisted correctly

### Test 7.7: Close Modal

1. Click "X" or "Close" button
   - ✅ Verify: Modal closes smoothly
   - ✅ Verify: Table remains in correct state

---

## Test Pathway 8: Team Member Management

### Test 8.1: View Team Members

1. Look for team member dropdown in assignee filter or bulk operations
   - ✅ Verify: Team member list loads
   - ✅ Verify: Shows all team members (Alice Johnson, Bob Smith, etc.)
   - ✅ Verify: Names display correctly

### Test 8.2: Assign Issues to Different Team Members

1. Select an issue

2. Assign to "Alice Johnson"
   - ✅ Verify: Assignment successful

3. Select different issue

4. Assign to "Bob Smith"
   - ✅ Verify: Assignment successful

5. Filter by assignee "Alice Johnson"
   - ✅ Verify: Shows only Alice's issues

---

## Test Pathway 9: Analytics & Progress Visualization

### Test 9.1: Dashboard Metrics

1. Scroll to top of Accessibility Audit page
   - ✅ Verify: Dashboard shows metrics cards:
     - Total Issues
     - Critical Issues
     - Open Issues
     - In Progress Issues
     - Resolved Issues
   - ✅ Verify: Numbers are accurate
   - ✅ Verify: Numbers update when filters are applied

### Test 9.2: Progress Tracking

1. Apply filter to show only "In Progress" issues
   - ✅ Verify: Metrics update to show filtered counts

2. Update an issue status from "Open" to "In Progress"
   - ✅ Verify: Metrics update in real-time or after refresh

---

## Test Pathway 10: Responsive Design

### Test 10.1: Desktop View (1920x1080)

1. Verify layout at full desktop resolution
   - ✅ Verify: Filter panel visible on left
   - ✅ Verify: Table has adequate width
   - ✅ Verify: All columns visible
   - ✅ Verify: No horizontal scrolling required

### Test 10.2: Laptop View (1366x768)

1. Resize browser to 1366px width
   - ✅ Verify: Layout adapts gracefully
   - ✅ Verify: Filter panel remains functional
   - ✅ Verify: Table columns may condense but remain readable

### Test 10.3: Tablet View (768px width)

1. Resize browser to tablet size
   - ✅ Verify: Filter panel may collapse to drawer/sidebar
   - ✅ Verify: Table remains functional (may require horizontal scroll)
   - ✅ Verify: Bulk toolbar adapts to smaller screen
   - ✅ Verify: Modals fill screen appropriately

### Test 10.4: Mobile View (375px width)

1. Resize to mobile size
   - ✅ Verify: UI remains usable
   - ✅ Verify: Filters accessible via hamburger menu or drawer
   - ✅ Verify: Table adapts (stacked cards or horizontal scroll)
   - ✅ Verify: Bulk operations accessible
   - ✅ Verify: Modals are full-screen

---

## Test Pathway 11: Phase 3C.1 Backward Compatibility

### Test 11.1: Verify Original Features Still Work

1. **Audit List**: Verify audit list displays (if Phase 3C.1 had this)
2. **Create New Audit**: Try creating a new accessibility audit
   - ✅ Verify: Form works
   - ✅ Verify: Audit saves successfully

3. **View Audit Details**: Click on an audit (not issue)
   - ✅ Verify: Audit detail modal/page opens
   - ✅ Verify: All audit info displays

4. **Create New Issue**: Add a new issue to an audit
   - ✅ Verify: Issue creation form works
   - ✅ Verify: New issue appears in table

5. **Edit Existing Issue**: Edit an issue using the original interface
   - ✅ Verify: Changes save correctly

6. **Delete Issue**: Delete an issue
   - ✅ Verify: Deletion works
   - ✅ Verify: Confirmation dialog appears
   - ✅ Verify: Issue removed from list

---

## Test Pathway 12: Error Handling & Edge Cases

### Test 12.1: Network Error Simulation

1. Open browser DevTools → Network tab
2. Throttle to "Offline" mode
3. Try to load data
   - ✅ Verify: Error message displays
   - ✅ Verify: User-friendly error (not technical stack trace)

4. Restore network
5. Refresh page
   - ✅ Verify: Data loads successfully

### Test 12.2: Empty States

1. Apply filters that result in no matches
   - ✅ Verify: "No issues found" message displays
   - ✅ Verify: Helpful message (e.g., "Try adjusting your filters")

2. Open issue detail modal for issue with no screenshots
   - ✅ Verify: Screenshots tab shows "No screenshots available" message

3. Open issue detail modal for issue with no code example
   - ✅ Verify: Code Example tab shows appropriate empty state

### Test 12.3: Validation

1. Try to save filter preset with empty name
   - ✅ Verify: Validation error appears
   - ✅ Verify: Cannot save with empty name

2. Try to select 0 issues and click bulk operations
   - ✅ Verify: Bulk operation buttons are disabled or show error

---

## Test Completion Checklist

After completing all test pathways above, verify:

- [ ] All Phase 3C.2 features tested
- [ ] All Phase 3C.1 features still work
- [ ] No console errors in browser DevTools
- [ ] No visual layout breaks
- [ ] All success/error messages display correctly
- [ ] Responsive design works across all screen sizes
- [ ] Data persists correctly across page refreshes
- [ ] All interactive elements are accessible via keyboard
- [ ] Loading states display during data fetching

---

## Bug Reporting Template

If you find any issues, document them using this format:

**Bug #**: [number]
**Severity**: Critical / High / Medium / Low
**Feature**: [e.g., "Advanced Filtering - Severity Filter"]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happened]
**Screenshots**: [If applicable]
**Browser**: [Chrome/Firefox/Safari version]
**Notes**: [Any additional context]

---

## Success Criteria

Phase 3C.2 implementation is considered successful if:

✅ All 12 test pathways pass completely
✅ Zero critical bugs found
✅ Maximum 2 medium severity bugs (acceptable for v1)
✅ Phase 3C.1 features remain 100% functional
✅ Responsive design works on all tested screen sizes
✅ No console errors during normal usage
✅ Performance is acceptable (page loads < 3 seconds, interactions < 500ms)

---

**End of Testing Guide**
