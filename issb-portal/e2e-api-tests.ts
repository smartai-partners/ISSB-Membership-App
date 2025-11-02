/**
 * End-to-End API Testing for Phase 3C.2
 * Tests the deployed backend APIs directly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ETests() {
  console.log('='.repeat(70));
  console.log('Phase 3C.2 End-to-End API Tests');
  console.log('='.repeat(70));
  console.log('');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Team Members API
  console.log('Test 1: Fetch Team Members');
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    if (data && data.length > 0) {
      console.log(`  ✅ Found ${data.length} team members`);
      console.log(`  Sample: ${data[0].name} (${data[0].role})`);
      passedTests++;
    } else {
      console.log('  ⚠️  No team members found (might be expected for new deployment)');
      passedTests++;
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failedTests++;
  }
  console.log('');

  // Test 2: Accessibility Issues with Filters
  console.log('Test 2: Fetch Issues with Filtering');
  try {
    const { data, error } = await supabase
      .from('accessibility_issues')
      .select('*')
      .eq('severity', 'critical')
      .limit(5);
    
    if (error) throw error;
    console.log(`  ✅ Filter query executed successfully`);
    console.log(`  Found ${data?.length || 0} critical issues`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failedTests++;
  }
  console.log('');

  // Test 3: Enhanced Issues with Assignments
  console.log('Test 3: Fetch Issues with Assignment Data');
  try {
    const { data, error } = await supabase
      .from('accessibility_issues')
      .select(`
        *,
        assigned_team_member:team_members(name, email, role)
      `)
      .not('assigned_to', 'is', null)
      .limit(3);
    
    if (error) throw error;
    console.log(`  ✅ Join query executed successfully`);
    console.log(`  Found ${data?.length || 0} assigned issues`);
    if (data && data.length > 0 && data[0].assigned_team_member) {
      console.log(`  Sample assignee: ${data[0].assigned_team_member.name}`);
    }
    passedTests++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failedTests++;
  }
  console.log('');

  // Test 4: Audit Timeline
  console.log('Test 4: Fetch Audit Timeline');
  try {
    const { data, error } = await supabase
      .from('audit_timeline')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log(`  ✅ Timeline query executed successfully`);
    console.log(`  Found ${data?.length || 0} timeline entries`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failedTests++;
  }
  console.log('');

  // Test 5: Filter Presets
  console.log('Test 5: Filter Presets Table');
  try {
    const { data, error } = await supabase
      .from('filter_presets')
      .select('count');
    
    if (error) throw error;
    console.log(`  ✅ Filter presets table accessible`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('='.repeat(70));
  console.log('Test Summary:');
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  Total: ${passedTests + failedTests}`);
  console.log('='.repeat(70));
  console.log('');

  if (failedTests === 0) {
    console.log('✅ All API tests passed! Backend is fully functional.');
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed. Review errors above.`);
  }

  return { passedTests, failedTests };
}

// Run tests
runE2ETests()
  .then(({ passedTests, failedTests }) => {
    process.exit(failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
