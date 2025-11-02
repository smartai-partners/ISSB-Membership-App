/**
 * Phase 3C.3: Check Quality Gate
 * 
 * This edge function checks if a test run passes quality gate criteria.
 * Used in CI/CD pipelines to enforce accessibility standards.
 * 
 * Expected input:
 * {
 *   gateId: string, // Quality gate ID to check against
 *   testRunId: string, // Test run ID to evaluate
 *   commitHash?: string,
 *   buildNumber?: string
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
        const { gateId, testRunId, commitHash, buildNumber } = await req.json();

        if (!gateId || !testRunId) {
            throw new Error('Missing required fields: gateId, testRunId');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch quality gate configuration
        const gateResponse = await fetch(
            `${supabaseUrl}/rest/v1/quality_gates?id=eq.${gateId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!gateResponse.ok) {
            throw new Error('Failed to fetch quality gate');
        }

        const gates = await gateResponse.json();
        if (gates.length === 0) {
            throw new Error('Quality gate not found');
        }

        const gate = gates[0];

        if (!gate.is_active) {
            return new Response(JSON.stringify({
                data: {
                    passed: true,
                    skipped: true,
                    message: 'Quality gate is not active'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Fetch test run results
        const testRunResponse = await fetch(
            `${supabaseUrl}/rest/v1/test_runs?id=eq.${testRunId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!testRunResponse.ok) {
            throw new Error('Failed to fetch test run');
        }

        const testRuns = await testRunResponse.json();
        if (testRuns.length === 0) {
            throw new Error('Test run not found');
        }

        const testRun = testRuns[0];

        if (testRun.status !== 'completed') {
            throw new Error('Test run not completed');
        }

        // Fetch associated audit for issue counts
        const auditResponse = await fetch(
            `${supabaseUrl}/rest/v1/accessibility_audits?id=eq.${testRun.audit_id}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let criticalIssues = 0;
        let highIssues = 0;
        let mediumIssues = 0;
        let lowIssues = 0;

        if (auditResponse.ok) {
            const audits = await auditResponse.json();
            if (audits.length > 0) {
                const audit = audits[0];
                criticalIssues = audit.critical_issues || 0;
                highIssues = audit.high_issues || 0;
                mediumIssues = audit.medium_issues || 0;
                lowIssues = audit.low_issues || 0;
            }
        }

        // Check against quality gate criteria
        const failureReasons: string[] = [];
        
        const complianceScore = testRun.compliance_score || 0;
        if (complianceScore < gate.min_compliance_score) {
            failureReasons.push(
                `Compliance score ${complianceScore}% is below minimum ${gate.min_compliance_score}%`
            );
        }

        if (criticalIssues > gate.max_critical_issues) {
            failureReasons.push(
                `Critical issues (${criticalIssues}) exceed maximum allowed (${gate.max_critical_issues})`
            );
        }

        if (highIssues > gate.max_high_issues) {
            failureReasons.push(
                `High severity issues (${highIssues}) exceed maximum allowed (${gate.max_high_issues})`
            );
        }

        const passed = failureReasons.length === 0;

        // Record quality gate result
        const resultData = {
            gate_id: gateId,
            test_run_id: testRunId,
            check_timestamp: new Date().toISOString(),
            passed: passed,
            compliance_score: complianceScore,
            critical_issues: criticalIssues,
            high_issues: highIssues,
            medium_issues: mediumIssues,
            low_issues: lowIssues,
            failure_reasons: failureReasons.length > 0 ? failureReasons : null,
            commit_hash: commitHash || null,
            build_number: buildNumber || null,
            metadata: {
                gate_name: gate.gate_name,
                repository: gate.repository,
                branch: gate.branch,
                test_url: testRun.target_url
            }
        };

        const resultResponse = await fetch(`${supabaseUrl}/rest/v1/quality_gate_results`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(resultData)
        });

        if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            console.error('Failed to record quality gate result:', errorText);
        }

        // Update quality gate with last check info
        const gateUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/quality_gates?id=eq.${gateId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                last_check_at: new Date().toISOString(),
                last_check_passed: passed
            })
        });

        if (!gateUpdateResponse.ok) {
            console.error('Failed to update quality gate:', await gateUpdateResponse.text());
        }

        return new Response(JSON.stringify({
            data: {
                passed: passed,
                gateName: gate.gate_name,
                complianceScore: complianceScore,
                requiredScore: gate.min_compliance_score,
                issues: {
                    critical: criticalIssues,
                    high: highIssues,
                    medium: mediumIssues,
                    low: lowIssues
                },
                limits: {
                    maxCritical: gate.max_critical_issues,
                    maxHigh: gate.max_high_issues
                },
                failureReasons: failureReasons,
                blockDeployment: gate.block_deployment && !passed,
                resultId: (await resultResponse.json())[0]?.id
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Quality gate check error:', error);

        const errorResponse = {
            error: {
                code: 'QUALITY_GATE_CHECK_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
