import { useState, useEffect } from 'react';
import { Match, MatchFilters } from '@/types/match';
import { CloudflareProxyService } from '@/services/CloudflareProxyService';
import { matches as fallbackMatches } from '@/data/matches';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use static matches for reliable streaming
  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading static matches for reliable streaming...');
      setMatches(fallbackMatches);
      console.log(`Loaded ${fallbackMatches.length} static matches`);
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Get stream URLs for a specific match with CORS bypass
  const fetchStreamUrls = async (matchId: string): Promise<{dai?: string; adfree?: string}> => {
    try {
      const match = fallbackMatches.find(m => m.id === matchId);
      if (match?.streams) {
        return {
          dai: await CloudflareProxyService.getStreamProxy(match.streams.dai || ''),
          adfree: await CloudflareProxyService.getStreamProxy(match.streams.adfree || '')
        };
      }
      throw new Error('No streams found for match');
    } catch (error) {
      console.error(`Failed to fetch streams for match ${matchId}:`, error);
      return {};
    }
  };

  // Load static data once
  useEffect(() => {
    fetchLiveData();
  }, []);

  return {
    matches,
    loading,
    error,
    refetch: fetchLiveData,
    fetchStreamUrls
  };
};
