import { Match } from '@/types/match';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Play, Users } from 'lucide-react';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
  onWatchStream?: (streamUrl: string, type: 'dai' | 'adfree') => void;
}

export const MatchCard = ({ match, onWatchStream }: MatchCardProps) => {
  const formatTime = (datetime: string) => {
    return format(new Date(datetime), 'hh:mm:ss a dd-MM-yyyy');
  };

  const isLive = match.status === 'live';

  return (
    <Card className="group relative overflow-hidden card-shadow hover:shadow-lg smooth-transition border border-border/50 hover:border-primary/30">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={match.thumbnail}
          alt={match.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={isLive ? 'live' : 'upcoming'} className="text-xs font-bold">
            {isLive ? 'LIVE' : 'UPCOMING'}
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="cricket" className="text-xs">
            {match.category}
          </Badge>
        </div>

        {/* Live Indicator Overlay */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Match Title */}
        <h3 className="font-bold text-lg leading-tight text-card-foreground group-hover:text-primary smooth-transition">
          {match.title}
        </h3>

        {/* Tournament */}
        <p className="text-sm text-muted-foreground font-medium">
          {match.tournament}
        </p>

        {/* Teams */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{match.team1} vs {match.team2}</span>
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatTime(match.datetime)}</span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {isLive ? (
            <>
              <p className="text-primary font-semibold text-sm animate-pulse">
                LIVE NOW - Watch Free!
              </p>
              <div className="flex gap-2">
                {match.streams?.dai && (
                  <Button 
                    variant="stream" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onWatchStream?.(match.streams!.dai!, 'dai')}
                  >
                    <Play className="w-4 h-4" />
                    DAI Stream
                  </Button>
                )}
                {match.streams?.adfree && (
                  <Button 
                    variant="adfree" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onWatchStream?.(match.streams!.adfree!, 'adfree')}
                  >
                    <Play className="w-4 h-4" />
                    Ad-Free
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-upcoming font-semibold text-sm">
              Starts Soon
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};