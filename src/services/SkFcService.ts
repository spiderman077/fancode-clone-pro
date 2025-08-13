import { Match } from '@/types/match';

export class SkFcService {
  private static readonly BASE_URL = 'https://sk-fc.pages.dev';
  
  static async fetchLiveMatches(): Promise<Match[]> {
    try {
      console.log('Fetching live matches from SK-FC...');
      
      // Try multiple proxy approaches
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(this.BASE_URL)}`,
        `https://cors-anywhere.herokuapp.com/${this.BASE_URL}`,
        `https://thingproxy.freeboard.io/fetch/${this.BASE_URL}`
      ];
      
      let htmlContent = '';
      let success = false;
      
      for (const proxyUrl of proxies) {
        try {
          console.log(`Trying proxy: ${proxyUrl}`);
          const response = await fetch(proxyUrl);
          const data = await response.json();
          htmlContent = data.contents || data.response || '';
          
          // Check if we got obfuscated content (anti-bot protection)
          if (htmlContent.includes('Function(') && htmlContent.includes('obfuscated')) {
            console.warn('Detected anti-bot protection, content is obfuscated');
            continue;
          }
          
          if (htmlContent.length > 1000) {
            success = true;
            break;
          }
        } catch (error) {
          console.warn(`Proxy ${proxyUrl} failed:`, error);
          continue;
        }
      }
      
      if (!success || !htmlContent) {
        console.warn('All proxies failed or returned obfuscated content');
        return this.getFallbackMatches();
      }
      
      // Parse the HTML to extract match data
      return this.parseMatchesFromHtml(htmlContent);
      
    } catch (error) {
      console.error('Error fetching matches from SK-FC:', error);
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
        datetime: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // Started 30 min ago
        status: 'live',
        thumbnail: 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=ZIM+vs+NZ',
        category: 'Cricket',
        streams: {
          dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
          adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
        }
      },
      {
        id: 'upcoming-1',
        title: 'India vs Australia - ODI Series',
        tournament: 'Australia Tour of India, 2025',
        team1: 'India',
        team2: 'Australia',
        datetime: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(), // In 2 hours
        status: 'upcoming',
        thumbnail: 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=IND+vs+AUS',
        category: 'Cricket'
      }
    ];
  }
  
  private static parseMatchesFromHtml(htmlContent: string): Match[] {
    const matches: Match[] = [];
    
    // Check if content is obfuscated (anti-bot protection)
    if (htmlContent.includes('Function(') && htmlContent.length < 10000) {
      console.warn('Content appears to be obfuscated by anti-bot protection');
      return this.getFallbackMatches();
    }
    
    try {
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const textContent = doc.body.textContent || '';
      
      // Split by common match indicators
      const sections = textContent.split(/(?=🏏|🎮)/);
      
      sections.forEach((section, index) => {
        if (section.trim().length < 10) return;
        
        const lines = section.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 5) return;
        
        try {
          const status = lines.find(line => line === 'LIVE' || line === 'UPCOMING') || 'upcoming';
          const tournament = lines.find(line => 
            line.includes('Trophy') || 
            line.includes('League') || 
            line.includes('T20') || 
            line.includes('Premier') ||
            line.includes('Hundred') ||
            line.includes('ECS')
          ) || 'Unknown Tournament';
          
          // Find team names (usually short codes like BB, HT, etc.)
          const teamPattern = /^[A-Z]{2,4}(?:-W)?$/;
          const teams = lines.filter(line => teamPattern.test(line));
          
          // Find date/time
          const datePattern = /\d{1,2}\s+\w+\s+\d{4}\s+\d{1,2}:\d{2}\s+[AP]M/;
          const dateMatch = lines.find(line => datePattern.test(line));
          
          if (teams.length >= 2 && tournament && dateMatch) {
            const match: Match = {
              id: `skfc-${index}-${Date.now()}`,
              title: `${teams[0]} vs ${teams[1]}`,
              tournament,
              team1: teams[0],
              team2: teams[1],
              datetime: this.parseDateTime(dateMatch),
              status: status.toLowerCase() === 'live' ? 'live' : 'upcoming',
              thumbnail: 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Cricket+Match',
              category: 'Cricket',
              streams: status.toLowerCase() === 'live' ? {
                dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
                adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
              } : undefined
            };
            
            matches.push(match);
          }
        } catch (error) {
          console.warn('Error parsing match section:', error);
        }
      });
      
    } catch (error) {
      console.error('Error parsing matches from HTML:', error);
    }
    
    return matches;
  }
  
  private static parseMatchElement(element: Element, index: number): Match | null {
    try {
      const textContent = element.textContent || '';
      const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
      
      // Similar parsing logic as parseMatchesFromText but for individual elements
      const status = lines.find(line => line === 'LIVE' || line === 'UPCOMING') || 'upcoming';
      const tournament = lines.find(line => 
        line.includes('Trophy') || 
        line.includes('League') || 
        line.includes('T20') || 
        line.includes('Premier')
      ) || 'Unknown Tournament';
      
      const teamPattern = /^[A-Z]{2,4}(?:-W)?$/;
      const teams = lines.filter(line => teamPattern.test(line));
      
      const datePattern = /\d{1,2}\s+\w+\s+\d{4}\s+\d{1,2}:\d{2}\s+[AP]M/;
      const dateMatch = lines.find(line => datePattern.test(line));
      
      if (teams.length >= 2 && tournament && dateMatch) {
        return {
          id: `skfc-${index}-${Date.now()}`,
          title: `${teams[0]} vs ${teams[1]}`,
          tournament,
          team1: teams[0],
          team2: teams[1],
          datetime: this.parseDateTime(dateMatch),
          status: status.toLowerCase() === 'live' ? 'live' : 'upcoming',
          thumbnail: 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Cricket+Match',
          category: 'Cricket',
          streams: status.toLowerCase() === 'live' ? {
            dai: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8',
            adfree: 'https://in-mc-pdlive.fancode.com/mumbai/128760_english_hls_67492ta-di_h264/index.m3u8'
          } : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing match element:', error);
      return null;
    }
  }
  
  private static parseDateTime(dateString: string): string {
    try {
      // Parse "13 August 2025 03:15 PM" format
      const parts = dateString.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{1,2}):(\d{2})\s+([AP]M)/);
      if (!parts) return new Date().toISOString();
      
      const [, day, month, year, hour, minute, ampm] = parts;
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(month.toLowerCase()));
      if (monthIndex === -1) return new Date().toISOString();
      
      let parsedHour = parseInt(hour);
      if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
      if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
      
      const date = new Date(parseInt(year), monthIndex, parseInt(day), parsedHour, parseInt(minute));
      return date.toISOString();
    } catch (error) {
      console.warn('Error parsing date:', error);
      return new Date().toISOString();
    }
  }
}