export interface Match {
  id: string;
  title: string;
  tournament: string;
  team1: string;
  team2: string;
  datetime: string;
  status: 'live' | 'upcoming';
  thumbnail: string;
  category: string;
  streams?: {
    dai?: string;
    adfree?: string;
  };
}

export interface MatchFilters {
  all: number;
  live: number;
  upcoming: number;
}