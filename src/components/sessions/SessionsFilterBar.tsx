'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';

export type FilterType = 'all' | 'recent' | 'with-processes' | 'with-opportunities';
export type SortType = 'updated' | 'created' | 'name';
export type ViewType = 'grid' | 'list';

type SessionsFilterBarProps = {
  activeFilter: FilterType;
  sortBy: SortType;
  viewType: ViewType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onViewChange: (view: ViewType) => void;
};

export function SessionsFilterBar({
  activeFilter,
  sortBy,
  viewType,
  onFilterChange,
  onSortChange,
  onViewChange,
}: SessionsFilterBarProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Sessions' },
    { value: 'recent', label: 'Recent' },
    { value: 'with-processes', label: 'With Processes' },
    { value: 'with-opportunities', label: 'With Opportunities' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6"
    >
      {/* Left - Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeFilter === filter.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Right - Sort & View */}
      <div className="flex items-center gap-3">
        {/* Sort Select */}
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortType)}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          <button
            onClick={() => onViewChange('grid')}
            className={`
              p-2 rounded transition-colors
              ${viewType === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}
            `}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`
              p-2 rounded transition-colors
              ${viewType === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}
            `}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
