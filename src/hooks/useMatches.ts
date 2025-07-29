import { useState, useEffect } from 'react';
import { Match, MatchFilters } from '@/types/match';
import { FancodeApiService } from '@/services/FancodeApiService';
import { matches as fallbackMatches } from '@/data/matches';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  // Fetch live data from fancode
  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching live data from fancode API...');
      
      // Fetch live and upcoming matches simultaneously
      const [liveMatches, upcomingMatches] = await Promise.allSettled([
        FancodeApiService.fetchLiveMatches(),
        FancodeApiService.fetchUpcomingMatches()
      ]);

      const allMatches: Match[] = [];

      // Process live matches
      if (liveMatches.status === 'fulfilled') {
        allMatches.push(...liveMatches.value);
      } else {
        console.error('Failed to fetch live matches:', liveMatches.reason);
      }

      // Process upcoming matches  
      if (upcomingMatches.status === 'fulfilled') {
        allMatches.push(...upcomingMatches.value);
      } else {
        console.error('Failed to fetch upcoming matches:', upcomingMatches.reason);
      }

      // If we got some data, use it; otherwise keep fallback
      if (allMatches.length > 0) {
        setMatches(allMatches);
        console.log(`Successfully fetched ${allMatches.length} matches from fancode`);
      } else {
        console.warn('No matches fetched, using fallback data');
        setError('Failed to fetch live data, showing cached matches');
      }

    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to fetch live data, showing cached matches');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stream URLs for a specific match
  const fetchStreamUrls = async (matchId: string): Promise<{dai?: string; adfree?: string}> => {
    try {
      return await FancodeApiService.fetchStreamUrls(matchId);
    } catch (error) {
      console.error(`Failed to fetch streams for match ${matchId}:`, error);
      return {};
    }
  };

  // Auto-refresh live data
  useEffect(() => {
    fetchLiveData();
    
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchLiveData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate filters
  const filters: MatchFilters = {
    all: matches.length,
    live: matches.filter(match => match.status === 'live').length,
    upcoming: matches.filter(match => match.status === 'upcoming').length
  };

  // Filter matches based on active filter
  const filteredMatches = activeFilter === 'all' 
    ? matches 
    : matches.filter(match => match.status === activeFilter);

  const liveMatches = matches.filter(match => match.status === 'live');
  const upcomingMatches = matches.filter(match => match.status === 'upcoming');

  return {
    matches: filteredMatches,
    liveMatches,
    upcomingMatches,
    filters,
    activeFilter,
    setActiveFilter,
    loading,
    error,
    refetch: fetchLiveData,
    fetchStreamUrls
  };
};
