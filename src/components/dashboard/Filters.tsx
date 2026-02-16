import { useMemo, type FC } from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import type { ProcessedContact } from '../../types';

interface FiltersProps {
  data: ProcessedContact[];
  filters: {
    departments: string[];
    locations: string[];
    levels: string[];
    statuses: string[];
  };
  onFilterChange: (type: 'departments' | 'locations' | 'levels' | 'statuses', value: string[]) => void;
}

export const Filters: FC<FiltersProps> = ({ data, filters, onFilterChange }) => {
  // Extract unique options from data
  const uniqueDepts = useMemo(() => Array.from(new Set(data.map(c => c.department).filter(Boolean))).sort(), [data]);
  const uniqueLocs = useMemo(() => Array.from(new Set(data.map(c => c.location).filter(Boolean))).sort(), [data]);
  const uniqueLevels = useMemo(() => Array.from(new Set(data.map(c => c.level || c.position).filter(Boolean))).sort(), [data]);
  const uniqueStatuses = ['Severe', 'Moderate', 'Slight', 'Safe', 'No Response'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MultiSelect 
        label="Department" 
        options={uniqueDepts} 
        selected={filters.departments} 
        onChange={(val) => onFilterChange('departments', val)} 
        placeholder="Select Department"
      />
      <MultiSelect 
        label="Location" 
        options={uniqueLocs} 
        selected={filters.locations} 
        onChange={(val) => onFilterChange('locations', val)} 
        placeholder="Select Location"
      />
      <MultiSelect 
        label="Level/Position" 
        options={uniqueLevels} 
        selected={filters.levels} 
        onChange={(val) => onFilterChange('levels', val)} 
        placeholder="Select Level"
      />
      <MultiSelect 
        label="Status" 
        options={uniqueStatuses} 
        selected={filters.statuses} 
        onChange={(val) => onFilterChange('statuses', val)} 
        placeholder="Select Status"
      />
    </div>
  );
};
