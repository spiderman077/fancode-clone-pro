import { useState, useEffect } from 'react';
import { Match } from '@/types/match';
import { CloudflareProxyService } from '@/services/CloudflareProxyService';
import { GitHubDataService } from '@/services/GitHubDataService';
import { matches as fallbackMatches } from '@/data/matches';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>(fallbackMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch matches from GitHub JSON data
  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching matches from GitHub JSON...');
      const githubMatches = await GitHubDataService.fetchMatches();
      
      if (githubMatches.length > 0) {
        setMatches(githubMatches);
        console.log(`Loaded ${githubMatches.length} matches from GitHub`);
      } else {
        console.log('No matches found, using fallback data');
        setMatches(fallbackMatches);
      }
    } catch (error) {
      console.error('Error loading matches from GitHub:', error);
      console.log('Using fallback matches due to error');
      setMatches(fallbackMatches);
      setError('Using offline data - GitHub source unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Get stream URLs for a specific match with CORS bypass
  const fetchStreamUrls = async (matchId: string): Promise<{dai?: string; adfree?: string}> => {
    try {
      // First look in current matches, then fallback matches
      const match = matches.find(m => m.id === matchId) || fallbackMatches.find(m => m.id === matchId);
      if (match?.streams) {
        return {
          dai: await CloudflareProxyService.getStreamProxy(match.streams.dai || ''),
          adfree: await CloudflareProxyService.getStreamProxy(match.streams.adfree || '')
        };
      }
      
      // If no streams found but match exists, return the stream URLs directly
      if (match) {
        return match.streams || {};
      }
      
      throw new Error('No streams found for match');
    } catch (error) {
      console.error(`Failed to fetch streams for match ${matchId}:`, error);
      return {};
    }
  };

  // Load live data and set up auto-refresh
  useEffect(() => {
    fetchLiveData();
    
    // Auto-refresh every 2 minutes to keep data fresh
    const interval = setInterval(fetchLiveData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    matches,
    loading,
    error,
    refetch: fetchLiveData,
    fetchStreamUrls
  };
};
