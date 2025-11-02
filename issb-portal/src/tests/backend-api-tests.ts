/**
 * Backend API Testing Script for Phase 3C.2
 * Tests all new enhanced APIs to verify functionality
 */

import { supabase } from '../lib/supabase';

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'yjrchfcr@minimax.com',
  adminPassword: '6rzVXJ2DqX',
};

async function authenticateAsAdmin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.adminEmail,
    password: TEST_CONFIG.adminPassword,
  });

  if (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }

  console.log('✅ Authenticated as admin');
  return true;
}

async function testTeamMembersAPI() {
  console.log('\n--- Testing Team Members API ---');
  
  try {
    // Test: Get all team members
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    console.log(`✅ Retrieved ${members?.length || 0} team members`);
    console.log('   Sample:', members?.[0]?.full_name);

    return true;
  } catch (error: any) {
    console.error('❌ Team Members API failed:', error.message);
    return false;
  }
}

async function testEnhancedFiltering() {
  console.log('\n--- Testing Enhanced Filtering ---');
  
  try {
    // Test: Multi-criteria filtering
    const { data: issues, error } = await supabase
      .from('accessibility_issues')
      .select('*, team_members(full_name, email)')
      .in('severity', ['critical', 'high'])
      .in('status', ['open', 'assigned', 'in_progress'])
      .limit(10);

    if (error) throw error;

    console.log(`✅ Filtered issues: ${issues?.length || 0} results`);
    
    // Test: Search functionality
    const { data: searchResults, error: searchError } = await supabase
      .from('accessibility_issues')
      .select('*')
      .or('description.ilike.%image%,wcag_criteria.ilike.%1.1%');

    if (searchError) throw searchError;

    console.log(`✅ Search results: ${searchResults?.length || 0} matches`);

    return true;
  } catch (error: any) {
    console.error('❌ Enhanced Filtering failed:', error.message);
    return false;
  }
}

async function testAuditTimeline() {
  console.log('\n--- Testing Audit Timeline ---');
  
  try {
    // Test: Get timeline entries
    const { data: timeline, error } = await supabase
      .from('audit_timeline')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log(`✅ Timeline entries: ${timeline?.length || 0} records`);
    if (timeline && timeline.length > 0) {
      console.log('   Latest:', timeline[0].action_type, '-', timeline[0].changed_by_name);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Audit Timeline failed:', error.message);
    return false;
  }
}

async function testProgressCalculation() {
  console.log('\n--- Testing Progress Calculation ---');
  
  try {
    // Test: Get audit with progress
    const { data: audit, error } = await supabase
      .from('accessibility_audits')
      .select('id, page_title, progress_percentage, compliance_score')
      .limit(1)
      .single();

    if (error) throw error;

    console.log(`✅ Audit progress: ${audit.progress_percentage}%`);
    console.log('   Page:', audit.page_title);
    console.log('   Compliance:', audit.compliance_score);

    return true;
  } catch (error: any) {
    console.error('❌ Progress Calculation failed:', error.message);
    return false;
  }
}

async function testEnhancedAuditData() {
  console.log('\n--- Testing Enhanced Audit Data ---');
  
  try {
    // Test: Get audits with enhanced fields
    const { data: audits, error } = await supabase
      .from('accessibility_audits')
      .select('*')
      .not('assigned_team', 'is', null);

    if (error) throw error;

    console.log(`✅ Audits with team assignment: ${audits?.length || 0}`);
    if (audits && audits.length > 0) {
      console.log('   Sample team:', audits[0].assigned_team);
      console.log('   Priority:', audits[0].priority);
      console.log('   Tags:', audits[0].tags);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Enhanced Audit Data failed:', error.message);
    return false;
  }
}

async function testEnhancedIssueData() {
  console.log('\n--- Testing Enhanced Issue Data ---');
  
  try {
    // Test: Get issues with enhanced fields
    const { data: issues, error } = await supabase
      .from('accessibility_issues')
      .select('*')
      .not('assigned_to', 'is', null)
      .limit(5);

    if (error) throw error;

    console.log(`✅ Issues with assignments: ${issues?.length || 0}`);
    if (issues && issues.length > 0) {
      console.log('   Assigned to:', issues[0].assigned_to_name);
      console.log('   Priority:', issues[0].priority);
      console.log('   Estimated effort:', issues[0].estimated_effort);
      console.log('   Component:', issues[0].component_name);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Enhanced Issue Data failed:', error.message);
    return false;
  }
}

async function testFilterPresets() {
  console.log('\n--- Testing Filter Presets ---');
  
  try {
    // Test: Create a test preset
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️  Skipping filter presets (no user)');
      return true;
    }

    const { data: preset, error } = await supabase
      .from('filter_presets')
      .insert({
        user_id: user.id,
        preset_name: 'Test Preset - Backend Validation',
        filters: {
          severity: ['critical'],
          status: ['open'],
        },
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Created filter preset: ${preset.preset_name}`);

    // Clean up: Delete test preset
    await supabase.from('filter_presets').delete().eq('id', preset.id);
    console.log('✅ Cleaned up test preset');

    return true;
  } catch (error: any) {
    console.error('❌ Filter Presets failed:', error.message);
    return false;
  }
}

async function testAnalyticsData() {
  console.log('\n--- Testing Analytics Data ---');
  
  try {
    // Test: Get all audits
    const { data: audits, error: auditsError } = await supabase
      .from('accessibility_audits')
      .select('*');

    if (auditsError) throw auditsError;

    // Test: Get all issues
    const { data: issues, error: issuesError } = await supabase
      .from('accessibility_issues')
      .select('*');

    if (issuesError) throw issuesError;

    console.log(`✅ Total audits: ${audits?.length || 0}`);
    console.log(`✅ Total issues: ${issues?.length || 0}`);

    // Calculate basic analytics
    const avgCompliance = audits && audits.length > 0
      ? audits.reduce((sum, a) => sum + Number(a.compliance_score), 0) / audits.length
      : 0;

    const statusBreakdown = (issues || []).reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`✅ Average compliance: ${avgCompliance.toFixed(2)}%`);
    console.log('✅ Status breakdown:', statusBreakdown);

    return true;
  } catch (error: any) {
    console.error('❌ Analytics Data failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=================================================');
  console.log('  Phase 3C.2 Backend API Testing');
  console.log('=================================================');

  // Authenticate first
  const authenticated = await authenticateAsAdmin();
  if (!authenticated) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  const results = {
    teamMembers: await testTeamMembersAPI(),
    enhancedFiltering: await testEnhancedFiltering(),
    auditTimeline: await testAuditTimeline(),
    progressCalculation: await testProgressCalculation(),
    enhancedAuditData: await testEnhancedAuditData(),
    enhancedIssueData: await testEnhancedIssueData(),
    filterPresets: await testFilterPresets(),
    analyticsData: await testAnalyticsData(),
  };

  console.log('\n=================================================');
  console.log('  Test Results Summary');
  console.log('=================================================');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });

  console.log(`\nTotal: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All backend APIs are working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }
}

// Run tests
runAllTests().catch(console.error);
