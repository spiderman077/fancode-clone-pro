import { Match } from '@/types/match';

interface GitHubMatchData {
  event_category: string;
  title: string;
  src: string;
  team_1: string;
  team_2: string;
  status: string;
  event_name: string;
  match_name: string;
  match_id: number;
  startTime: string;
  dai_url?: string;
  adfree_url?: string;
}

interface GitHubResponse {
  name: string;
  telegram: string;
  "last update time": string;
  matches: GitHubMatchData[];
}

export class GitHubDataService {
  private static readonly API_URL = 'https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json';

  static async fetchMatches(): Promise<Match[]> {
    try {
      console.log('Fetching matches from GitHub JSON...');
      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: GitHubResponse = await response.json();
      
      if (!data.matches || !Array.isArray(data.matches)) {
        throw new Error('Invalid data structure received');
      }
      
      const transformedMatches = data.matches
        .filter(match => match.status === 'LIVE' || match.status === 'UPCOMING' || match.status === 'PAUSED')
        .map(GitHubDataService.transformMatch);
      
      console.log(`Successfully loaded ${transformedMatches.length} matches from GitHub`);
      return transformedMatches;
    } catch (error) {
      console.error('Error fetching matches from GitHub:', error);
      throw error;
    }
  }

  private static transformMatch(githubMatch: GitHubMatchData): Match {
    return {
      id: githubMatch.match_id.toString(),
      title: githubMatch.title,
      tournament: githubMatch.event_name,
      team1: githubMatch.team_1,
      team2: githubMatch.team_2,
      datetime: GitHubDataService.parseDateTime(githubMatch.startTime),
      status: githubMatch.status === 'LIVE' || githubMatch.status === 'PAUSED' ? 'live' : 'upcoming',
      thumbnail: githubMatch.src,
      category: githubMatch.event_category,
      streams: githubMatch.dai_url || githubMatch.adfree_url ? {
        dai: githubMatch.dai_url,
        adfree: githubMatch.adfree_url
      } : undefined
    };
  }

  private static parseDateTime(startTime: string): string {
    try {
      // Input format: "11:00:00 AM 21-08-2025"
      const [time, period, date] = startTime.split(' ');
      const [day, month, year] = date.split('-');
      const [hours, minutes, seconds] = time.split(':');
      
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      // Create ISO string: YYYY-MM-DDTHH:mm:ss
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour24.toString().padStart(2, '0')}:${minutes}:${seconds}`;
      return isoString;
    } catch (error) {
      console.error('Error parsing datetime:', startTime, error);
      return new Date().toISOString();
    }
  }
}