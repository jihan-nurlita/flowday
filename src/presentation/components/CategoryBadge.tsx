import React from 'react';
import { useFlow } from '../state/FlowContext';

interface CategoryBadgeProps {
  categoryId: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ categoryId, className = '' }) => {
  const { categories } = useFlow();
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#898493] dark:text-[#9E99A8] ${className}`}>
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span>{category.name}</span>
    </span>
  );
};
