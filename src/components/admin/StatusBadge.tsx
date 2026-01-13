import React from 'react';
import { cn } from '@/lib/utils';

type Status = 'active' | 'pending' | 'completed' | 'rejected' | 'processed' | 'inactive';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  active: 'status-badge status-active',
  pending: 'status-badge status-pending',
  completed: 'status-badge status-completed',
  rejected: 'status-badge status-rejected',
  processed: 'status-badge status-completed',
  inactive: 'status-badge bg-gray-100 text-gray-800',
};

const statusLabels: Record<Status, string> = {
  active: 'Active',
  pending: 'Pending',
  completed: 'Completed',
  rejected: 'Rejected',
  processed: 'Processed',
  inactive: 'Inactive',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span className={cn(statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
