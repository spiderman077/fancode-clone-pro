import { useState, useMemo } from 'react';
import { Match, MatchFilters } from '@/types/match';
import { matches as initialMatches } from '@/data/matches';

export const useMatches = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const filters: MatchFilters = useMemo(() => {
    const live = initialMatches.filter(match => match.status === 'live').length;
    const upcoming = initialMatches.filter(match => match.status === 'upcoming').length;
    return {
      all: initialMatches.length,
      live,
      upcoming
    };
  }, []);

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'all') return initialMatches;
    return initialMatches.filter(match => match.status === activeFilter);
  }, [activeFilter]);

  const liveMatches = useMemo(() => 
    initialMatches.filter(match => match.status === 'live'), []
  );

  const upcomingMatches = useMemo(() => 
    initialMatches.filter(match => match.status === 'upcoming'), []
  );

  return {
    matches: filteredMatches,
    liveMatches,
    upcomingMatches,
    filters,
    activeFilter,
    setActiveFilter
  };
};