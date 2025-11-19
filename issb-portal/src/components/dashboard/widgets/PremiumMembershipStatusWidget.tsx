/**
 * PremiumMembershipStatusWidget
 * Enhanced membership status display for active/premium members
 * Shows additional benefits, perks, and visual enhancements
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle, Star, Award, Crown } from 'lucide-react';

interface MembershipStatus {
  status: 'active' | 'pending' | 'expired' | 'inactive';
  start_date?: string;
  end_date?: string;
  balance_due?: number;
}

interface PremiumMembershipStatusWidgetProps {
  membershipStatus: MembershipStatus | null;
  className?: string;
}

export const PremiumMembershipStatusWidget: React.FC<PremiumMembershipStatusWidgetProps> = ({
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
      active: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg',
      expired: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
      pending: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
      inactive: 'bg-gray-100 text-gray-800',
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${styles[status]}`}>
          {status.toUpperCase()}
        </span>
        {status === 'active' && (
          <Crown className="w-5 h-5 text-amber-500 animate-pulse" />
        )}
      </div>
    );
  };

  // Calculate membership duration for active members
  const getMembershipDuration = () => {
    if (!membershipStatus?.start_date) return null;

    const startDate = new Date(membershipStatus.start_date);
    const now = new Date();
    const monthsDiff = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthsDiff < 1) return 'New Member';
    if (monthsDiff < 12) return `${monthsDiff} ${monthsDiff === 1 ? 'Month' : 'Months'}`;
    const years = Math.floor(monthsDiff / 12);
    return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  };

  return (
    <div
      className={`bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-xl shadow-xl p-6 border-2 border-green-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">Premium Membership</h3>
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        <div className="flex items-center">{getStatusBadge()}</div>

        {/* Membership Timeline */}
        {membershipStatus && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">Member Since</p>
                <p className="text-gray-900 font-semibold">
                  {membershipStatus.start_date
                    ? new Date(membershipStatus.start_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">Duration</p>
                <p className="text-gray-900 font-semibold">{getMembershipDuration() || 'N/A'}</p>
              </div>
              {membershipStatus.end_date && (
                <div className="col-span-2">
                  <p className="text-gray-600 text-xs font-medium mb-1">Renews On</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(membershipStatus.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Benefits Badge */}
        {membershipStatus?.status === 'active' && (
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-amber-900 text-sm">Active Benefits</h4>
            </div>
            <ul className="space-y-1 text-xs text-amber-800">
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Priority event registration
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Voting rights in community decisions
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Access to exclusive programs
              </li>
            </ul>
          </div>
        )}

        {/* Balance Due (if any) */}
        {membershipStatus?.balance_due && membershipStatus.balance_due > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium">
              <span className="font-bold">Outstanding Balance:</span> $
              {membershipStatus.balance_due.toFixed(2)}
            </p>
            <p className="text-xs text-amber-700 mt-1">Complete payment to maintain all benefits</p>
          </div>
        )}
      </div>
    </div>
  );
};
