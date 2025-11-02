/**
 * Phase 3C.3: Automated Testing Panel
 * Interface for running automated accessibility tests using axe-core
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRunAccessibilityTest, useTestRuns } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import axe from 'axe-core';

interface AutomatedTestingPanelProps {
  className?: string;
}

export function AutomatedTestingPanel({ className }: AutomatedTestingPanelProps) {
  const { toast } = useToast();
  const [targetUrl, setTargetUrl] = useState('');
  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const runTest = useRunAccessibilityTest();
  const { data: recentTests, refetch: refetchTests } = useTestRuns(10);

  const handleRunTest = async () => {
    if (!targetUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a URL to test',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setTestResult(null);

    try {
      // Create an iframe to load the page
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1280px';
      iframe.style.height = '720px';
      document.body.appendChild(iframe);

      // Load the URL
      iframe.src = targetUrl;

      await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        iframe.onerror = () => reject(new Error('Failed to load URL'));
        setTimeout(() => reject(new Error('Timeout loading URL')), 15000);
      });

      // Run axe-core tests
      const results = await axe.run(iframe.contentDocument || document, {
        runOnly: {
          type: 'tag',
          values: wcagLevel === 'A' ? ['wcag2a'] : wcagLevel === 'AA' ? ['wcag2a', 'wcag2aa'] : ['wcag2a', 'wcag2aa', 'wcag2aaa'],
        },
      });

      // Clean up iframe
      document.body.removeChild(iframe);

      // Record test results
      const recordedResult = await runTest.mutateAsync({
        runType: 'manual',
        targetUrl,
        testResults: results,
        wcagLevel,
      });

      setTestResult(recordedResult);
      await refetchTests();

      toast({
        title: 'Test completed',
        description: `Found ${results.violations.length} violations with ${recordedResult.complianceScore}% compliance`,
      });
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: 'Test failed',
        description: error.message || 'Failed to run accessibility test',
        variant: 'destructive',
      });
      setTestResult({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'serious':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Run Accessibility Test</CardTitle>
            <CardDescription>
              Test any URL for WCAG compliance using automated axe-core scanning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wcagLevel">WCAG Level</Label>
              <Select value={wcagLevel} onValueChange={(v: any) => setWcagLevel(v)} disabled={isRunning}>
                <SelectTrigger id="wcagLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Level A</SelectItem>
                  <SelectItem value="AA">Level AA (Recommended)</SelectItem>
                  <SelectItem value="AAA">Level AAA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleRunTest} disabled={isRunning || !targetUrl} className="w-full">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && !testResult.error && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Automated accessibility test results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold">{testResult.complianceScore}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold">{testResult.issuesDetected}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{testResult.severityCounts.critical}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-2xl font-bold text-orange-600">{testResult.severityCounts.serious}</p>
                </div>
              </div>

              {testResult.issuesDetected > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Test created audit record #{testResult.auditId?.substring(0, 8)} with {testResult.issuesDetected} issues.
                    View details in the Accessibility Audit page.
                  </AlertDescription>
                </Alert>
              )}

              {testResult.issuesDetected === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No accessibility violations found! The page meets WCAG {wcagLevel} standards.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {testResult && testResult.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{testResult.error}</AlertDescription>
          </Alert>
        )}

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Runs</CardTitle>
            <CardDescription>History of automated accessibility tests</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTests && recentTests.length > 0 ? (
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{test.target_url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(test.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {test.compliance_score !== null && (
                        <p className="text-sm font-bold">{test.compliance_score}%</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {test.issues_detected} issues
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent tests available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
