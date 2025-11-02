/**
 * Phase 3C.3: Accessibility Audit Analytics & Automation Page
 * Comprehensive page integrating analytics dashboard, automated testing, scheduling, and quality gates
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Bot, Calendar, Shield } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AutomatedTestingPanel } from '@/components/admin/AutomatedTestingPanel';
import { SchedulingInterface } from '@/components/admin/SchedulingInterface';
import { QualityGatesPanel } from '@/components/admin/QualityGatesPanel';

export function AccessibilityAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Accessibility Analytics & Automation
        </h1>
        <p className="text-muted-foreground mt-2">
          Advanced analytics, automated testing, scheduling, and quality management for accessibility compliance
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="automated-testing" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>Testing</span>
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Schedules</span>
          </TabsTrigger>
          <TabsTrigger value="quality-gates" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Quality Gates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="automated-testing" className="space-y-4">
          <AutomatedTestingPanel />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <SchedulingInterface />
        </TabsContent>

        <TabsContent value="quality-gates" className="space-y-4">
          <QualityGatesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
