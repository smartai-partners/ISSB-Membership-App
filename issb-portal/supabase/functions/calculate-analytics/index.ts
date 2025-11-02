/**
 * Phase 3C.3: Calculate Analytics
 * 
 * This edge function calculates daily compliance metrics and analytics snapshots.
 * It should be run on a daily schedule via cron job.
 * 
 * Expected input:
 * {
 *   period: 'daily' | 'weekly' | 'monthly',
 *   date?: string // ISO date, defaults to today
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
        const body = await req.json().catch(() => ({}));
        const period = body.period || 'daily';
        const targetDate = body.date || new Date().toISOString().split('T')[0];

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Calculate date range based on period
        let startDate, endDate;
        const targetDateObj = new Date(targetDate);
        
        if (period === 'daily') {
            startDate = targetDate;
            endDate = targetDate;
        } else if (period === 'weekly') {
            // Get start of week (Monday)
            const dayOfWeek = targetDateObj.getDay();
            const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const weekStart = new Date(targetDateObj);
            weekStart.setDate(targetDateObj.getDate() + diff);
            startDate = weekStart.toISOString().split('T')[0];
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            endDate = weekEnd.toISOString().split('T')[0];
        } else {
            // Monthly
            startDate = `${targetDate.substring(0, 7)}-01`;
            const nextMonth = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0);
            endDate = nextMonth.toISOString().split('T')[0];
        }

        // Fetch audits in the date range
        const auditsResponse = await fetch(
            `${supabaseUrl}/rest/v1/accessibility_audits?audit_date=gte.${startDate}&audit_date=lte.${endDate}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!auditsResponse.ok) {
            throw new Error('Failed to fetch audits');
        }

        const audits = await auditsResponse.json();

        // Fetch issues in the date range
        const issuesResponse = await fetch(
            `${supabaseUrl}/rest/v1/accessibility_issues?created_at=gte.${startDate}T00:00:00&created_at=lte.${endDate}T23:59:59&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!issuesResponse.ok) {
            throw new Error('Failed to fetch issues');
        }

        const issues = await issuesResponse.json();

        // Calculate metrics
        const totalAudits = audits.length;
        const totalPagesAudited = new Set(audits.map((a: any) => a.page_url)).size;
        const averageComplianceScore = totalAudits > 0
            ? audits.reduce((sum: number, a: any) => sum + (a.compliance_score || 0), 0) / totalAudits
            : 0;

        const totalIssues = issues.length;
        const criticalIssues = issues.filter((i: any) => i.severity === 'critical').length;
        const highIssues = issues.filter((i: any) => i.severity === 'high').length;
        const mediumIssues = issues.filter((i: any) => i.severity === 'medium').length;
        const lowIssues = issues.filter((i: any) => i.severity === 'low').length;

        const issuesOpened = issues.filter((i: any) => i.status === 'open' || i.status === 'assigned').length;
        const issuesResolved = issues.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;

        // Calculate average resolution time
        const resolvedIssues = issues.filter((i: any) => i.status === 'resolved' && i.updated_at && i.created_at);
        const avgResolutionTimeHours = resolvedIssues.length > 0
            ? resolvedIssues.reduce((sum: number, i: any) => {
                const created = new Date(i.created_at).getTime();
                const updated = new Date(i.updated_at).getTime();
                return sum + ((updated - created) / (1000 * 60 * 60));
              }, 0) / resolvedIssues.length
            : 0;

        // Calculate status breakdown
        const statusBreakdown: Record<string, number> = {};
        issues.forEach((i: any) => {
            statusBreakdown[i.status] = (statusBreakdown[i.status] || 0) + 1;
        });

        // Calculate severity breakdown
        const severityBreakdown = {
            critical: criticalIssues,
            high: highIssues,
            medium: mediumIssues,
            low: lowIssues
        };

        // Calculate priority breakdown
        const priorityBreakdown: Record<string, number> = {};
        issues.forEach((i: any) => {
            if (i.priority) {
                priorityBreakdown[i.priority] = (priorityBreakdown[i.priority] || 0) + 1;
            }
        });

        // Calculate team performance
        const teamPerformance: Record<string, any> = {};
        const teamMembersResponse = await fetch(
            `${supabaseUrl}/rest/v1/team_members?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (teamMembersResponse.ok) {
            const teamMembers = await teamMembersResponse.json();
            teamMembers.forEach((tm: any) => {
                const memberIssues = issues.filter((i: any) => i.assigned_to === tm.id);
                const resolved = memberIssues.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;
                
                if (tm.team) {
                    if (!teamPerformance[tm.team]) {
                        teamPerformance[tm.team] = { resolved: 0, total: 0, avg_time_hours: 0 };
                    }
                    teamPerformance[tm.team].resolved += resolved;
                    teamPerformance[tm.team].total += memberIssues.length;
                }
            });
        }

        // Calculate component breakdown
        const componentBreakdown: Record<string, number> = {};
        issues.forEach((i: any) => {
            if (i.component_name) {
                componentBreakdown[i.component_name] = (componentBreakdown[i.component_name] || 0) + 1;
            }
        });

        // Calculate top issues
        const issueTypes: Record<string, number> = {};
        issues.forEach((i: any) => {
            issueTypes[i.issue_type] = (issueTypes[i.issue_type] || 0) + 1;
        });
        const topIssues = Object.entries(issueTypes)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Determine trend
        let complianceTrend = 'stable';
        // Simple trend: compare with previous period (can be enhanced)
        if (period === 'daily' && totalAudits > 0) {
            const prevDate = new Date(targetDateObj);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            
            const prevMetricsResponse = await fetch(
                `${supabaseUrl}/rest/v1/compliance_metrics?metric_date=eq.${prevDateStr}&metric_period=eq.daily&select=average_compliance_score`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (prevMetricsResponse.ok) {
                const prevMetrics = await prevMetricsResponse.json();
                if (prevMetrics.length > 0) {
                    const prevScore = prevMetrics[0].average_compliance_score;
                    if (averageComplianceScore > prevScore + 2) complianceTrend = 'improving';
                    else if (averageComplianceScore < prevScore - 2) complianceTrend = 'declining';
                }
            }
        }

        // Insert or update compliance metrics
        const metricsData = {
            metric_date: targetDate,
            metric_period: period,
            total_audits: totalAudits,
            total_pages_audited: totalPagesAudited,
            average_compliance_score: parseFloat(averageComplianceScore.toFixed(2)),
            total_issues: totalIssues,
            critical_issues: criticalIssues,
            high_issues: highIssues,
            medium_issues: mediumIssues,
            low_issues: lowIssues,
            issues_opened: issuesOpened,
            issues_resolved: issuesResolved,
            average_resolution_time_hours: parseFloat(avgResolutionTimeHours.toFixed(2)),
            compliance_trend: complianceTrend,
            metadata: {
                statusBreakdown,
                priorityBreakdown,
                teamPerformance,
                componentBreakdown
            }
        };

        // Upsert metrics
        const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_metrics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(metricsData)
        });

        if (!metricsResponse.ok) {
            console.error('Failed to insert metrics:', await metricsResponse.text());
        }

        // Create analytics snapshot
        const snapshotData = {
            snapshot_date: targetDate,
            snapshot_type: period,
            total_audits: totalAudits,
            average_compliance_score: parseFloat(averageComplianceScore.toFixed(2)),
            total_issues: totalIssues,
            status_breakdown: statusBreakdown,
            severity_breakdown: severityBreakdown,
            priority_breakdown: priorityBreakdown,
            team_performance: teamPerformance,
            component_breakdown: componentBreakdown,
            trend_data: [], // Can be calculated from historical data
            top_issues: topIssues
        };

        const snapshotResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_snapshots`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(snapshotData)
        });

        if (!snapshotResponse.ok) {
            console.error('Failed to insert snapshot:', await snapshotResponse.text());
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                period,
                date: targetDate,
                metrics: metricsData,
                snapshot: snapshotData
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Calculate analytics error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_CALCULATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
