import React from 'react';
import { TaskPriority } from '../../domain/entities/task';
import { PRIORITY_CONFIG } from '../../core/constants/defaults';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showSubLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showSubLabel = false }) => {
  const config = (PRIORITY_CONFIG as any)[priority] || PRIORITY_CONFIG.low;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
      <span>{config.label}</span>
      {showSubLabel && (
        <span className="opacity-75 hidden sm:inline">· {config.subLabel}</span>
      )}
    </span>
  );
};
