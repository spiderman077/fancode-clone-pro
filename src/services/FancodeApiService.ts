import { Match } from '@/types/match';
import { CorsProxyService } from './CorsProxyService';

export interface FancodeMatch {
  id: string;
  title: string;
  status: string;
  start_time: string;
  tournament: {
    name: string;
  };
  teams: Array<{
    name: string;
    short_name: string;
  }>;
  thumbnail: string;
  category: string;
  streams?: Array<{
    type: 'dai' | 'adfree';
    url: string;
    quality: string;
  }>;
}

export interface FancodeApiResponse {
  matches: FancodeMatch[];
  total: number;
}

export class FancodeApiService {
  private static readonly BASE_URL = 'https://www.fancode.com';
  private static readonly API_ENDPOINTS = {
    liveMatches: '/api/match/featured-live',
    upcomingMatches: '/api/match/featured-upcoming',
    matchDetails: '/api/match/',
    streamUrls: '/api/match/{id}/streams'
  };

  // Fetch live matches from fancode
  static async fetchLiveMatches(): Promise<Match[]> {
    try {
      console.log('Fetching live matches from fancode...');
      
      const response = await CorsProxyService.fetchJson<FancodeApiResponse>(
        `${this.BASE_URL}${this.API_ENDPOINTS.liveMatches}`
      );

      return this.transformFancodeMatches(response.matches, 'live');
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      return this.getFallbackLiveMatches();
    }
  }

  // Fetch upcoming matches from fancode
  static async fetchUpcomingMatches(): Promise<Match[]> {
    try {
      console.log('Fetching upcoming matches from fancode...');
      
      const response = await CorsProxyService.fetchJson<FancodeApiResponse>(
        `${this.BASE_URL}${this.API_ENDPOINTS.upcomingMatches}`
      );

      return this.transformFancodeMatches(response.matches, 'upcoming');
    } catch (error) {
      console.error('Failed to fetch upcoming matches:', error);
      return this.getFallbackUpcomingMatches();
    }
  }

  // Get stream URLs for a specific match
  static async fetchStreamUrls(matchId: string): Promise<{dai?: string; adfree?: string}> {
    try {
      console.log(`Fetching stream URLs for match ${matchId}...`);
      
      const response = await CorsProxyService.fetchJson<{streams: Array<{type: string; url: string}>}>(
        `${this.BASE_URL}${this.API_ENDPOINTS.streamUrls.replace('{id}', matchId)}`
      );

      const streams: {dai?: string; adfree?: string} = {};
      
      response.streams.forEach(stream => {
        if (stream.type === 'dai') {
          streams.dai = CorsProxyService.getStreamUrl(stream.url);
        } else if (stream.type === 'hls' || stream.type === 'adfree') {
          streams.adfree = CorsProxyService.getStreamUrl(stream.url);
        }
      });

      return streams;
    } catch (error) {
      console.error(`Failed to fetch streams for match ${matchId}:`, error);
      return {};
    }
  }

  // Transform fancode match data to our format
  private static transformFancodeMatches(fancodeMatches: FancodeMatch[], status: 'live' | 'upcoming'): Match[] {
    return fancodeMatches.map(match => ({
      id: match.id,
      title: match.teams.map(team => team.short_name || team.name).join(' vs '),
      tournament: match.tournament.name,
      team1: match.teams[0]?.name || 'Team 1',
      team2: match.teams[1]?.name || 'Team 2',
      datetime: match.start_time,
      status,
      thumbnail: match.thumbnail || this.getDefaultThumbnail(),
      category: match.category || 'Cricket',
      streams: match.streams ? {
        dai: match.streams.find(s => s.type === 'dai')?.url,
        adfree: match.streams.find(s => s.type === 'adfree')?.url
      } : undefined
    }));
  }

  // Get default thumbnail for matches without images
  private static getDefaultThumbnail(): string {
    return 'https://www.fancode.com/assets/images/default-match-thumbnail.jpg';
  }

  // Fallback live matches if API fails
  private static getFallbackLiveMatches(): Match[] {
    return [
      {
        id: 'live-1',
        title: 'India vs Australia',
        tournament: 'Test Championship',
        team1: 'India',
        team2: 'Australia',
        datetime: new Date().toISOString(),
        status: 'live',
        thumbnail: 'https://www.fancode.com/skillup-uploads/cms-media/129732_5370_IAC_WIC_fc-Web.jpg',
        category: 'Cricket',
        streams: {
          dai: 'https://dai.google.com/linear/hls/event/sample/master.m3u8',
          adfree: 'https://sample-stream.fancode.com/live/sample.m3u8'
        }
      }
    ];
  }

  // Fallback upcoming matches if API fails
  private static getFallbackUpcomingMatches(): Match[] {
    return [
      {
        id: 'upcoming-1',
        title: 'England vs Pakistan',
        tournament: 'ODI Series',
        team1: 'England',
        team2: 'Pakistan',
        datetime: new Date(Date.now() + 3600000).toISOString(),
        status: 'upcoming',
        thumbnail: 'https://www.fancode.com/skillup-uploads/cms-media/130807_5425_BD_AM_fc-Web.jpg',
        category: 'Cricket'
      }
    ];
  }

  // Enhanced stream URL processing with CORS bypass
  static processStreamUrl(url: string): string {
    if (!url) return '';
    
    // If it's already a proxied URL, return as is
    if (url.includes('allorigins.win') || url.includes('cors-anywhere') || url.includes('corsproxy.io')) {
      return url;
    }

    // Apply CORS proxy to the stream URL
    return CorsProxyService.getStreamUrl(url);
  }
}