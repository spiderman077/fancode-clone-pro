import { Match } from '@/types/match';

export const matches: Match[] = [
  {
    id: 'zim-nz-test',
    title: 'Zimbabwe vs New Zealand - 1st Test',
    tournament: 'New Zealand Tour of Zimbabwe, 2025',
    team1: 'Zimbabwe',
    team2: 'New Zealand',
    datetime: '2025-01-30T06:00:00',
    status: 'live',
    thumbnail: 'https://www.fancode.com/skillup-uploads/cms-media/New-Zealand-Tour-of-Zimbabwe-(Tests)Sporty-match-card-.jpg',
    category: 'Cricket',
    streams: {
      dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
      adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
    }
  },
  {
    id: 'zim-nz-test-day2',
    title: 'Zimbabwe vs New Zealand - 1st Test (Day 2)',
    tournament: 'New Zealand Tour of Zimbabwe, 2025',
    team1: 'Zimbabwe',
    team2: 'New Zealand',
    datetime: '2025-01-31T06:00:00',
    status: 'live',
    thumbnail: 'https://www.fancode.com/skillup-uploads/cms-media/New-Zealand-Tour-of-Zimbabwe-(Tests)Sporty-match-card-.jpg',
    category: 'Cricket',
    streams: {
      dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
      adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
    }
  }
];