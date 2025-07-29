import { Button } from '@/components/ui/button';
import { MatchFilters as Filters } from '@/types/match';

interface MatchFiltersProps {
  filters: Filters;
  activeFilter: 'all' | 'live' | 'upcoming';
  onFilterChange: (filter: 'all' | 'live' | 'upcoming') => void;
}

export const MatchFilters = ({ filters, activeFilter, onFilterChange }: MatchFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
        className="min-w-[120px]"
      >
        All Matches ({filters.all})
      </Button>
      <Button
        variant={activeFilter === 'live' ? 'live' : 'outline'}
        onClick={() => onFilterChange('live')}
        className="min-w-[120px]"
      >
        LIVE ({filters.live})
      </Button>
      <Button
        variant={activeFilter === 'upcoming' ? 'upcoming' : 'outline'}
        onClick={() => onFilterChange('upcoming')}
        className="min-w-[120px]"
      >
        Upcoming ({filters.upcoming})
      </Button>
    </div>
  );
};