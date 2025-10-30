import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';
import { DashboardStats as StatsType } from './types';

interface DashboardStatsProps {
  stats: StatsType;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isLoading = false,
  error = null,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        <Card className="col-span-full border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">Error loading dashboard statistics: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: stats.recentGrowth.users,
      icon: '👥',
      color: 'text-blue-600',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents.toLocaleString(),
      change: stats.recentGrowth.events,
      icon: '📅',
      color: 'text-green-600',
    },
    {
      title: 'Applications',
      value: stats.totalApplications.toLocaleString(),
      change: stats.recentGrowth.applications,
      icon: '📝',
      color: 'text-yellow-600',
    },
    {
      title: 'Volunteer Ops',
      value: stats.totalVolunteerOps.toLocaleString(),
      change: stats.recentGrowth.volunteerOps,
      icon: '🤝',
      color: 'text-purple-600',
    },
  ];

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➡️';
  };

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {statCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <span className="text-2xl" role="img" aria-label={card.title}>
              {card.icon}
            </span>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', card.color)}>
              {card.value}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              <span className={cn('font-medium', getChangeColor(card.change))}>
                {getChangeIcon(card.change)} {Math.abs(card.change)}
              </span>
              {' '}from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
