import { Match } from '@/types/match';

export class SkFcService {
  private static readonly BASE_URL = 'https://sk-fc.pages.dev';
  
  static async fetchLiveMatches(): Promise<Match[]> {
    try {
      console.log('Fetching live matches from SK-FC...');
      
      // Use CORS proxy to fetch the page
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(this.BASE_URL)}`);
      const data = await response.json();
      const htmlContent = data.contents;
      
      // Parse the HTML to extract match data
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const matches: Match[] = [];
      
      // Find all match cards in the HTML
      const matchElements = doc.querySelectorAll('.match-card, [class*="match"], [class*="card"]');
      
      if (matchElements.length === 0) {
        // If no specific match cards found, try to parse from the text content
        return this.parseMatchesFromText(htmlContent);
      }
      
      matchElements.forEach((element, index) => {
        try {
          const match = this.parseMatchElement(element, index);
          if (match) {
            matches.push(match);
          }
        } catch (error) {
          console.warn('Error parsing match element:', error);
        }
      });
      
      console.log(`Parsed ${matches.length} matches from SK-FC`);
      return matches;
      
    } catch (error) {
      console.error('Error fetching matches from SK-FC:', error);
      throw new Error('Failed to fetch live matches');
    }
  }
  
  private static parseMatchesFromText(htmlContent: string): Match[] {
    const matches: Match[] = [];
    
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
      console.error('Error parsing matches from text:', error);
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