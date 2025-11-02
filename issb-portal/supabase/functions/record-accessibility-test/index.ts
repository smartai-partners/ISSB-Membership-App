/**
 * Phase 3C.3: Record Accessibility Test
 * 
 * This edge function records automated accessibility test results.
 * The frontend runs axe-core tests and sends results to this function for storage.
 * 
 * Expected input:
 * {
 *   scheduleId?: string,
 *   runType: 'scheduled' | 'manual' | 'ci_cd' | 'ad_hoc',
 *   targetUrl: string,
 *   testResults: object, // axe-core results
 *   wcagLevel?: 'A' | 'AA' | 'AAA'
 * }
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { scheduleId, runType, targetUrl, testResults, wcagLevel } = await req.json();

        if (!runType || !targetUrl || !testResults) {
            throw new Error('Missing required fields: runType, targetUrl, testResults');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.id;
            }
        }

        const startedAt = new Date().toISOString();

        // Calculate compliance score from test results
        const violations = testResults.violations || [];
        const passes = testResults.passes || [];
        const incomplete = testResults.incomplete || [];
        
        const totalChecks = violations.length + passes.length + incomplete.length;
        const complianceScore = totalChecks > 0 
            ? ((passes.length / totalChecks) * 100).toFixed(2)
            : 0;

        const issuesDetected = violations.length;

        // Count issues by severity
        const severityCounts = {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0
        };

        violations.forEach((violation: any) => {
            const impact = violation.impact || 'moderate';
            if (impact === 'critical') severityCounts.critical++;
            else if (impact === 'serious') severityCounts.serious++;
            else if (impact === 'moderate') severityCounts.moderate++;
            else if (impact === 'minor') severityCounts.minor++;
        });

        // Create audit record
        const auditData = {
            page_url: targetUrl,
            page_title: testResults.url || targetUrl,
            audit_date: startedAt,
            compliance_score: parseFloat(complianceScore),
            wcag_level: wcagLevel || 'AA',
            auditor_id: userId,
            total_issues: issuesDetected,
            critical_issues: severityCounts.critical,
            high_issues: severityCounts.serious,
            medium_issues: severityCounts.moderate,
            low_issues: severityCounts.minor,
            notes: `Automated test via ${runType}`,
            priority: severityCounts.critical > 0 ? 'critical' : 
                     severityCounts.serious > 2 ? 'high' : 'medium'
        };

        // Insert audit record
        const auditResponse = await fetch(`${supabaseUrl}/rest/v1/accessibility_audits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(auditData)
        });

        if (!auditResponse.ok) {
            const errorText = await auditResponse.text();
            throw new Error(`Failed to create audit record: ${errorText}`);
        }

        const auditRecords = await auditResponse.json();
        const auditId = auditRecords[0]?.id;

        // Create issues from violations
        if (auditId && violations.length > 0) {
            const issues = violations.map((violation: any) => {
                const impact = violation.impact || 'moderate';
                let severity: string;
                
                if (impact === 'critical') severity = 'critical';
                else if (impact === 'serious') severity = 'high';
                else if (impact === 'moderate') severity = 'medium';
                else severity = 'low';

                return {
                    audit_id: auditId,
                    issue_type: violation.id || 'unknown',
                    severity: severity,
                    wcag_criteria: violation.tags?.filter((t: string) => t.startsWith('wcag')).join(', ') || null,
                    description: violation.description || violation.help || 'No description',
                    affected_component: violation.nodes?.[0]?.target?.join(', ') || null,
                    recommendation: violation.helpUrl || null,
                    element_selector: violation.nodes?.[0]?.html || null,
                    status: 'open',
                    priority: severity,
                    affected_users: `${violation.nodes?.length || 0} elements affected`
                };
            });

            const issuesResponse = await fetch(`${supabaseUrl}/rest/v1/accessibility_issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(issues)
            });

            if (!issuesResponse.ok) {
                console.error('Failed to create issues:', await issuesResponse.text());
            }
        }

        // Record test run
        const completedAt = new Date().toISOString();
        const durationSeconds = Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);

        const testRunData = {
            schedule_id: scheduleId || null,
            audit_id: auditId,
            run_type: runType,
            target_url: targetUrl,
            status: 'completed',
            started_at: startedAt,
            completed_at: completedAt,
            duration_seconds: durationSeconds,
            issues_detected: issuesDetected,
            compliance_score: parseFloat(complianceScore),
            test_results: testResults,
            executed_by: userId
        };

        const testRunResponse = await fetch(`${supabaseUrl}/rest/v1/test_runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testRunData)
        });

        if (!testRunResponse.ok) {
            const errorText = await testRunResponse.text();
            throw new Error(`Failed to create test run record: ${errorText}`);
        }

        const testRunRecords = await testRunResponse.json();

        return new Response(JSON.stringify({
            data: {
                success: true,
                auditId: auditId,
                testRunId: testRunRecords[0]?.id,
                complianceScore: parseFloat(complianceScore),
                issuesDetected: issuesDetected,
                severityCounts: severityCounts
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Record accessibility test error:', error);

        const errorResponse = {
            error: {
                code: 'TEST_RECORDING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
