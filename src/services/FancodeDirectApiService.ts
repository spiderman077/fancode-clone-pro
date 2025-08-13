import { Match } from '@/types/match';

export class FancodeDirectApiService {
  private static readonly FANCODE_API_BASE = 'https://www.fancode.com/api';
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  static async fetchLiveMatches(): Promise<Match[]> {
    try {
      console.log('Fetching live matches directly from Fancode API...');
      
      // Try multiple Fancode API endpoints
      const endpoints = [
        `${this.FANCODE_API_BASE}/match/featured`,
        `${this.FANCODE_API_BASE}/matches/live`,
        `${this.FANCODE_API_BASE}/v2/matches`,
        `${this.FANCODE_API_BASE}/live-matches`,
        'https://www.fancode.com/match/featured',
        'https://www.fancode.com/api/featured-matches'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying Fancode endpoint: ${endpoint}`);
          const matches = await this.fetchFromEndpoint(endpoint);
          if (matches.length > 0) {
            console.log(`Successfully fetched ${matches.length} matches from ${endpoint}`);
            return matches;
          }
        } catch (error) {
          console.warn(`Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }
      
      // If all endpoints fail, try scraping the main page
      return await this.scrapeFancodePage();
      
    } catch (error) {
      console.error('Error fetching matches from Fancode:', error);
      return this.getFallbackMatches();
    }
  }
  
  private static async fetchFromEndpoint(endpoint: string): Promise<Match[]> {
    const matches: Match[] = [];
    
    try {
      // Try direct access first
      let response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.fancode.com/'
        }
      });
      
      // If CORS blocked, use proxy
      if (!response.ok) {
        const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(endpoint)}`;
        response = await fetch(proxyUrl);
        const data = await response.json();
        const jsonData = typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
        return this.parseApiResponse(jsonData);
      }
      
      const jsonData = await response.json();
      return this.parseApiResponse(jsonData);
      
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error);
      return [];
    }
  }
  
  private static parseApiResponse(data: any): Match[] {
    const matches: Match[] = [];
    
    try {
      // Handle different API response structures
      let matchesArray = [];
      
      if (Array.isArray(data)) {
        matchesArray = data;
      } else if (data.matches && Array.isArray(data.matches)) {
        matchesArray = data.matches;
      } else if (data.data && Array.isArray(data.data)) {
        matchesArray = data.data;
      } else if (data.result && Array.isArray(data.result)) {
        matchesArray = data.result;
      }
      
      matchesArray.forEach((matchData: any, index: number) => {
        try {
          const match = this.parseMatchData(matchData, index);
          if (match) {
            matches.push(match);
          }
        } catch (error) {
          console.warn('Error parsing match data:', error);
        }
      });
      
    } catch (error) {
      console.error('Error parsing API response:', error);
    }
    
    return matches;
  }
  
  private static parseMatchData(matchData: any, index: number): Match | null {
    try {
      // Extract common fields from various API structures
      const id = matchData.id || matchData.match_id || `fancode-${index}-${Date.now()}`;
      const title = matchData.title || matchData.name || `${matchData.team1?.name || 'Team 1'} vs ${matchData.team2?.name || 'Team 2'}`;
      const tournament = matchData.tournament?.name || matchData.series?.name || matchData.league?.name || 'Unknown Tournament';
      
      const team1 = matchData.team1?.name || matchData.teams?.[0]?.name || matchData.homeTeam?.name || 'Team 1';
      const team2 = matchData.team2?.name || matchData.teams?.[1]?.name || matchData.awayTeam?.name || 'Team 2';
      
      const datetime = matchData.start_time || matchData.startTime || matchData.datetime || new Date().toISOString();
      
      // Determine status
      let status: 'live' | 'upcoming' = 'upcoming';
      if (matchData.status === 'live' || matchData.state === 'live' || matchData.is_live) {
        status = 'live';
      }
      
      // Get thumbnail
      const thumbnail = matchData.thumbnail || 
                      matchData.image || 
                      matchData.poster_url || 
                      'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Cricket+Match';
      
      // Get stream URLs if available
      const streams = status === 'live' && matchData.streams ? {
        dai: matchData.streams.dai || matchData.streams.primary || 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
        adfree: matchData.streams.adfree || matchData.streams.secondary || 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
      } : undefined;
      
      return {
        id: String(id),
        title,
        tournament,
        team1: String(team1),
        team2: String(team2),
        datetime: new Date(datetime).toISOString(),
        status,
        thumbnail,
        category: 'Cricket',
        streams
      };
      
    } catch (error) {
      console.warn('Error parsing individual match:', error);
      return null;
    }
  }
  
  private static async scrapeFancodePage(): Promise<Match[]> {
    try {
      console.log('Attempting to scrape Fancode main page...');
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent('https://www.fancode.com')}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const htmlContent = data.contents;
      
      // Look for JSON data in script tags
      const scriptRegex = /<script[^>]*>(.*?)<\/script>/gs;
      let matches: Match[] = [];
      let match;
      
      while ((match = scriptRegex.exec(htmlContent)) !== null) {
        const scriptContent = match[1];
        
        // Look for match data patterns
        if (scriptContent.includes('matches') || scriptContent.includes('live')) {
          try {
            // Try to extract JSON data
            const jsonMatch = scriptContent.match(/(\{.*\})/);
            if (jsonMatch) {
              const jsonData = JSON.parse(jsonMatch[1]);
              const parsedMatches = this.parseApiResponse(jsonData);
              if (parsedMatches.length > 0) {
                matches = parsedMatches;
                break;
              }
            }
          } catch (error) {
            // Continue searching
          }
        }
      }
      
      return matches.length > 0 ? matches : this.getFallbackMatches();
      
    } catch (error) {
      console.error('Error scraping Fancode page:', error);
      return this.getFallbackMatches();
    }
  }
  
  private static getFallbackMatches(): Match[] {
    console.log('Using fallback match data');
    const now = new Date();
    
    return [
      {
        id: 'live-1',
        title: 'Zimbabwe vs New Zealand - Test Match',
        tournament: 'New Zealand Tour of Zimbabwe, 2025',
        team1: 'Zimbabwe',
        team2: 'New Zealand',
        datetime: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        status: 'live',
        thumbnail: '/lovable-uploads/d037a2f3-c468-4dfe-980c-dbd1766b7168.png',
        category: 'Cricket',
        streams: {
          dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
          adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
        }
      },
      {
        id: 'live-2',
        title: 'India vs Australia - ODI Series',
        tournament: 'Australia Tour of India, 2025',
        team1: 'India',
        team2: 'Australia',
        datetime: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        status: 'live',
        thumbnail: '/lovable-uploads/d037a2f3-c468-4dfe-980c-dbd1766b7168.png',
        category: 'Cricket',
        streams: {
          dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
          adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
        }
      }
    ];
  }
}