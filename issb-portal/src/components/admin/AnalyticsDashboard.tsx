/**
 * Phase 3C.3: Analytics Dashboard
 * Comprehensive analytics dashboard with trend charts, KPIs, and insights
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Activity,
} from 'lucide-react';
import { useComprehensiveAnalytics, useCalculateAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  success: '#22c55e',
  primary: '#6366f1',
};

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const { data: analytics, isLoading, error, refetch } = useComprehensiveAnalytics(period);
  const calculateAnalytics = useCalculateAnalytics();

  const handleRefreshAnalytics = async () => {
    try {
      await calculateAnalytics.mutateAsync({ period: 'daily' });
      await refetch();
      toast({
        title: 'Analytics refreshed',
        description: 'Analytics data has been recalculated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (analytics.overview.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = () => {
    switch (analytics.overview.trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  // Prepare severity breakdown data for pie chart
  const severityData = Object.entries(analytics.issueBreakdown.bySeverity).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count as number,
    color: COLORS[severity as keyof typeof COLORS] || COLORS.primary,
  }));

  // Prepare status breakdown data
  const statusData = Object.entries(analytics.issueBreakdown.byStatus).map(([status, count]) => ({
    name: status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: count as number,
  }));

  // Prepare compliance trend data
  const complianceTrendData = analytics.complianceHistory.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.score,
  }));

  // Get active trend data based on period
  const activeTrendData = period === 'week' 
    ? analytics.trends.daily 
    : period === 'month' 
    ? analytics.trends.weekly 
    : analytics.trends.monthly;

  const trendChartData = activeTrendData.map(item => ({
    label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    created: item.created,
    resolved: item.resolved,
  }));

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive accessibility compliance insights and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleRefreshAnalytics} variant="outline" disabled={calculateAnalytics.isPending}>
            {calculateAnalytics.isPending ? 'Refreshing...' : 'Refresh Analytics'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalAudits}</div>
            <p className="text-xs text-muted-foreground">
              Across {analytics.overview.totalPages} pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.averageComplianceScore.toFixed(1)}%
            </div>
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{analytics.overview.trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.issueBreakdown.bySeverity.critical || 0} critical,{' '}
              {analytics.issueBreakdown.bySeverity.high || 0} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.teamPerformance.reduce((sum, t) => sum + t.resolved, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Compliance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Trend</CardTitle>
            <CardDescription>Compliance score over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Compliance Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Trend</CardTitle>
            <CardDescription>Issues created vs resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill={COLORS.high} name="Created" />
                <Bar dataKey="resolved" fill={COLORS.success} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
            <CardDescription>Distribution of issue severity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
            <CardDescription>Current status of all issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Issues and Team Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Top Issues</CardTitle>
            <CardDescription>Most frequent accessibility issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.type}</p>
                  </div>
                  <div className="text-sm font-bold">{issue.count}</div>
                </div>
              ))}
              {analytics.topIssues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No issues data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Issues resolved by team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.teamPerformance.map((team, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{team.team_name}</p>
                    <p className="text-sm font-bold">
                      {team.resolved} / {team.total}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${team.total > 0 ? (team.resolved / team.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {team.avg_time_hours.toFixed(1)}h avg
                    </span>
                  </div>
                </div>
              ))}
              {analytics.teamPerformance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team performance data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
