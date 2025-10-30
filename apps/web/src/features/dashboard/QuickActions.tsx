import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { QuickAction } from './types';

interface QuickActionsProps {
  actions: QuickAction[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  isLoading = false,
  error = null,
  className,
}) => {
  const { user } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  const getActionColorClasses = (color: QuickAction['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  const canPerformAction = (action: QuickAction): boolean => {
    if (!user) return false;

    // Check role-based access
    if (action.roles.length > 0 && !hasRole(user, action.roles)) {
      return false;
    }

    // Check tier-based access
    if (action.tier && !hasTier(user, [action.tier])) {
      return false;
    }

    return true;
  };

  const filteredActions = actions.filter(canPerformAction);

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading actions: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quick Actions
          <span className="text-sm font-normal text-gray-500">
            {filteredActions.length} available
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No actions available for your role</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredActions.map((action) => (
              <a
                key={action.id}
                href={action.url}
                className={cn(
                  'block p-4 border rounded-lg transition-all duration-200 transform hover:scale-105',
                  getActionColorClasses(action.color)
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl" role="img" aria-label={action.title}>
                      {action.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {action.title}
                    </h3>
                    <p className="text-xs opacity-80 truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
