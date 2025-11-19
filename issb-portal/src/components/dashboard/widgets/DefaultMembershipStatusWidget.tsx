/**
 * DefaultMembershipStatusWidget
 * Basic membership status display for regular members
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface MembershipStatus {
  status: 'active' | 'pending' | 'expired' | 'inactive';
  start_date?: string;
  end_date?: string;
  balance_due?: number;
}

interface DefaultMembershipStatusWidgetProps {
  membershipStatus: MembershipStatus | null;
  className?: string;
}

export const DefaultMembershipStatusWidget: React.FC<DefaultMembershipStatusWidgetProps> = ({
  membershipStatus,
  className = '',
}) => {
  const getStatusIcon = () => {
    switch (membershipStatus?.status) {
      case 'active':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-amber-600" />;
    }
  };

  const getStatusBadge = () => {
    const status = membershipStatus?.status || 'pending';
    const styles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-amber-100 text-amber-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Membership Status</h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-3">
        <div className="flex items-center">{getStatusBadge()}</div>

        {membershipStatus && (
          <div className="text-sm text-gray-600 mt-4 space-y-1">
            {membershipStatus.end_date && (
              <div>
                <span className="font-medium">Valid until:</span>{' '}
                {new Date(membershipStatus.end_date).toLocaleDateString()}
              </div>
            )}
            {membershipStatus.start_date && (
              <div className="text-xs">
                <span className="font-medium">Started:</span>{' '}
                {new Date(membershipStatus.start_date).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {membershipStatus?.balance_due && membershipStatus.balance_due > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Balance Due:</span> ${membershipStatus.balance_due.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
