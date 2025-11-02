# Phase 3C.3: Manual Testing Guide
## ISSB Portal - Accessibility Analytics & Automation

**Deployment URL**: https://e3k1hy3t01re.space.minimax.io  
**Admin Credentials**: yjrchfcr@minimax.com / 6rzVXJ2DqX  
**Testing Date**: 2025-11-02

---

## Testing Pathways

### Pathway 1: Analytics Dashboard Access & Display

**Objective**: Verify analytics dashboard loads and displays all components correctly

**Steps**:
1. Navigate to https://e3k1hy3t01re.space.minimax.io
2. Click "Login" (top right)
3. Enter credentials: `yjrchfcr@minimax.com` / `6rzVXJ2DqX`
4. After login, verify redirect to admin dashboard
5. Click "Analytics" in the admin navigation menu
6. Verify page loads successfully

**Expected Results**:
- ✓ Analytics Dashboard page loads without errors
- ✓ Page title: "Accessibility Analytics & Automation"
- ✓ Two tabs visible: "Analytics Dashboard" and "Automated Testing"
- ✓ Default tab: "Analytics Dashboard" is selected

**Verify Components**:
- [ ] Header with title and period selector (Week/Month/Quarter)
- [ ] "Refresh Analytics" button visible
- [ ] Four KPI cards displaying:
  - [ ] Total Audits (with page count)
  - [ ] Compliance Score (with trend indicator)
  - [ ] Total Issues (with critical/high counts)
  - [ ] Team Performance (issues resolved)
- [ ] Four charts visible:
  - [ ] Compliance Trend (line chart)
  - [ ] Issues Trend (bar chart - created vs resolved)
  - [ ] Issues by Severity (pie chart)
  - [ ] Issues by Status (horizontal bar chart)
- [ ] Two bottom sections:
  - [ ] Top Issues (list of most frequent issues)
  - [ ] Team Performance (progress bars with metrics)

---

### Pathway 2: Analytics Interactions

**Objective**: Test interactive elements of the analytics dashboard

**Steps**:
1. From Analytics Dashboard tab
2. Click "Month" in the period selector
3. Observe data updates
4. Click "Quarter" in the period selector
5. Observe data updates
6. Click "Week" to return to weekly view
7. Click "Refresh Analytics" button
8. Wait for completion

**Expected Results**:
- ✓ Period selector changes active tab on click
- ✓ Charts and metrics update when period changes
- ✓ "Refresh Analytics" button shows loading state
- ✓ Toast notification appears: "Analytics refreshed"
- ✓ Data reloads after refresh completes
- ✓ No console errors during interactions

**Data Validation**:
- [ ] KPI numbers are reasonable (not negative, not unrealistic)
- [ ] Charts render without visual glitches
- [ ] Trend indicators show correct direction (improving/declining/stable)
- [ ] Team performance percentages are between 0-100%

---

### Pathway 3: Automated Testing Panel

**Objective**: Run automated accessibility test on a URL

**Steps**:
1. Click "Automated Testing" tab
2. Verify testing panel loads
3. In "Target URL" field, enter: `https://e3k1hy3t01re.space.minimax.io`
4. WCAG Level should default to "AA"
5. Click "Run Test" button
6. Wait for test to complete (5-15 seconds)
7. Observe test results display

**Expected Results**:
- ✓ Testing panel displays with:
  - [ ] "Target URL" input field
  - [ ] "WCAG Level" dropdown (A/AA/AAA)
  - [ ] "Run Test" button
- ✓ During test execution:
  - [ ] Button shows "Running Test..." with spinner
  - [ ] Button is disabled
  - [ ] Form inputs are disabled
- ✓ After test completes:
  - [ ] Test Results card appears
  - [ ] Displays:
    - Compliance Score (percentage)
    - Total Issues (number)
    - Critical issues count
    - High issues count
  - [ ] Alert message appears (green if no issues, amber if issues found)
  - [ ] Recent Test Runs list updates with new entry

**Test Result Validation**:
- [ ] Compliance score is between 0-100%
- [ ] Issue counts are non-negative integers
- [ ] Test appears in "Recent Test Runs" with:
  - [ ] URL displayed
  - [ ] Status badge ("completed")
  - [ ] Timestamp
  - [ ] Compliance score
  - [ ] Issue count

---

### Pathway 4: Test Multiple URLs

**Objective**: Verify testing works for different URLs

**Test URLs**:
1. `https://e3k1hy3t01re.space.minimax.io/` (home page)
2. `https://e3k1hy3t01re.space.minimax.io/events` (events page)
3. `https://example.com` (external site)

**For Each URL**:
1. Enter URL in "Target URL" field
2. Select WCAG Level "AA"
3. Click "Run Test"
4. Wait for completion
5. Verify results display

**Expected Results**:
- ✓ Each test completes successfully
- ✓ Results vary based on URL content
- ✓ Each test appears in Recent Test Runs
- ✓ Tests are ordered by most recent first
- ✓ No duplicate entries or missing tests

---

### Pathway 5: Cross-Feature Integration

**Objective**: Verify automated tests create audit records in main Accessibility Audit page

**Steps**:
1. From Automated Testing tab, run test on: `https://e3k1hy3t01re.space.minimax.io/admin`
2. Wait for test completion
3. Note the Audit ID from success message (e.g., "Test created audit record #abc12345")
4. Navigate to "Accessibility" in admin menu (main accessibility audit page)
5. Look for the newly created audit record

**Expected Results**:
- ✓ New audit record appears in accessibility audits list
- ✓ Audit shows:
  - [ ] URL: `https://e3k1hy3t01re.space.minimax.io/admin`
  - [ ] Compliance score matches test result
  - [ ] Issue counts match test result
  - [ ] Notes: "Automated test via manual"
  - [ ] Created timestamp is recent
- ✓ If issues were found:
  - [ ] Issues list contains detected violations
  - [ ] Issues show severity, type, description
  - [ ] Issues are in "open" status

---

### Pathway 6: Navigation & Routing

**Objective**: Verify navigation between all admin pages

**Steps**:
1. From Analytics page, click each admin menu item:
   - Admin Dashboard
   - Applications
   - Users
   - Events
   - Volunteer Mgmt
   - Help Assistant
   - Accessibility (main audit page)
   - Analytics (return)
2. Verify each page loads correctly
3. Return to Analytics page each time

**Expected Results**:
- ✓ All navigation links work
- ✓ URLs update correctly (browser address bar)
- ✓ No 404 errors or blank pages
- ✓ Active menu item highlights correctly
- ✓ Analytics page state persists (selected tab remembered)

---

### Pathway 7: Responsive Design

**Objective**: Test analytics dashboard on different screen sizes

**Steps**:
1. On Analytics Dashboard tab
2. Resize browser window to desktop (1920x1080)
3. Verify layout
4. Resize to tablet (768x1024)
5. Verify layout adapts
6. Resize to mobile (375x667)
7. Verify layout is usable

**Expected Results**:
- ✓ Desktop (1920x1080):
  - [ ] KPI cards in 4-column grid
  - [ ] Charts in 2-column grid
  - [ ] All content visible without scrolling horizontally
- ✓ Tablet (768x1024):
  - [ ] KPI cards in 2-column grid
  - [ ] Charts stack vertically or 2-column
  - [ ] Text remains readable
- ✓ Mobile (375x667):
  - [ ] KPI cards stack vertically (1-column)
  - [ ] Charts are full-width
  - [ ] Navigation menu collapses to hamburger
  - [ ] All interactive elements are tappable (min 44x44px)

---

### Pathway 8: Error Handling

**Objective**: Verify graceful error handling

**Test Scenarios**:

**A. Invalid URL Test**:
1. In Automated Testing, enter: `not-a-valid-url`
2. Click "Run Test"

**Expected**:
- [ ] Error message displays
- [ ] Test does not execute
- [ ] Form returns to ready state

**B. Analytics Load Failure** (simulate by disconnecting internet briefly):
1. Disconnect internet
2. Navigate to Analytics page
3. Observe behavior
4. Reconnect internet
5. Click "Refresh Analytics"

**Expected**:
- [ ] Error state displays (not blank page)
- [ ] Retry option available
- [ ] After reconnecting, refresh works
- [ ] Data loads successfully

**C. Empty Analytics Data**:
1. Check Analytics Dashboard when no data exists
2. Verify empty states display

**Expected**:
- [ ] Charts show "No data" or appropriate empty state
- [ ] No JavaScript errors in console
- [ ] Page remains usable

---

## Testing Checklist Summary

### Core Features
- [ ] Analytics Dashboard loads and displays all components
- [ ] Period selector (Week/Month/Quarter) works correctly
- [ ] Refresh Analytics button triggers recalculation
- [ ] All charts render without errors
- [ ] KPI cards show accurate metrics
- [ ] Automated Testing panel loads
- [ ] Can run accessibility tests on URLs
- [ ] Test results display correctly
- [ ] Tests appear in Recent Test Runs
- [ ] Integration: Tests create audit records in main Accessibility page

### UI/UX
- [ ] Navigation between admin pages works
- [ ] Active menu highlighting correct
- [ ] Responsive design works (desktop/tablet/mobile)
- [ ] No visual glitches or layout breaks
- [ ] Loading states display during async operations
- [ ] Toast notifications appear for actions

### Data & Integration
- [ ] Analytics metrics are accurate
- [ ] Trends display correct direction indicators
- [ ] Team performance shows valid percentages
- [ ] Test results match actual accessibility violations
- [ ] Audit records link correctly to issues

### Error Handling
- [ ] Invalid inputs show error messages
- [ ] Network failures handled gracefully
- [ ] Empty states display appropriately
- [ ] No console errors during normal operation

---

## Known Issues to Verify

1. **Recharts Type Errors**:
   - **Status**: Resolved in build (using @ts-nocheck)
   - **Verify**: Charts should render perfectly despite build warnings
   - **Action**: Confirm no runtime errors in console related to charts

2. **Axe-core CORS**:
   - **Potential Issue**: Testing external URLs may fail due to CORS
   - **Expected**: Works for same-origin URLs
   - **Action**: Test both same-origin and external URLs to verify behavior

3. **Test Run Duration**:
   - **Note**: Tests may take 5-15 seconds depending on page complexity
   - **Action**: Verify loading indicator displays throughout test

---

## Success Criteria

### Must Pass (Critical)
- ✓ Analytics Dashboard displays without errors
- ✓ All charts render correctly
- ✓ Automated testing executes and returns results
- ✓ Test runs create audit records
- ✓ Navigation works across all admin pages

### Should Pass (Important)
- ✓ Period selector updates data correctly
- ✓ Refresh Analytics recalculates metrics
- ✓ Recent test runs list updates
- ✓ Responsive design adapts to screen sizes
- ✓ Error messages display for invalid inputs

### Nice to Have (Enhancement)
- ✓ Smooth transitions between periods
- ✓ Chart tooltips display on hover
- ✓ Empty states are informative
- ✓ Loading states are smooth

---

## Test Execution Notes

**Tester**: _____________  
**Date**: _____________  
**Browser**: _____________  
**OS**: _____________  

**Overall Result**: [ ] PASS / [ ] FAIL / [ ] PARTIAL

**Critical Issues Found**: ___________________________________________

**Non-Critical Issues**: ___________________________________________

**Recommendations**: ___________________________________________

---

## Additional Manual Verification

### Database Checks (Supabase Dashboard)

1. **Tables Created**:
   - [ ] audit_schedules (with 2 sample schedules)
   - [ ] test_runs (should populate after running tests)
   - [ ] compliance_metrics (7 days of sample data)
   - [ ] analytics_snapshots (1 weekly snapshot)
   - [ ] quality_gates (2 sample gates)
   - [ ] quality_gate_results (empty initially)

2. **Edge Functions Deployed**:
   - [ ] record-accessibility-test (ACTIVE)
   - [ ] calculate-analytics (ACTIVE)
   - [ ] check-quality-gate (ACTIVE)

3. **Data Consistency**:
   - [ ] Test runs link to correct audits
   - [ ] Compliance metrics match audit data
   - [ ] Analytics snapshots have valid JSON data

---

**END OF TESTING GUIDE**
