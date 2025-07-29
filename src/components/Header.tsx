import { Badge } from '@/components/ui/badge';
import { MatchFilters } from '@/types/match';

interface HeaderProps {
  filters: MatchFilters;
}

export const Header = ({ filters }: HeaderProps) => {
  return (
    <div className="text-center space-y-6 py-12">
      {/* Logo & Title */}
      <div className="space-y-4">
        <h1 className="text-6xl md:text-7xl font-bold cricket-gradient bg-clip-text text-transparent animate-float">
          CrickOnTime
        </h1>
        <p className="text-xl text-muted-foreground font-medium">
          Your Ultimate Cricket Streaming Hub
        </p>
      </div>

      {/* Live Status Badges */}
      <div className="flex flex-wrap justify-center gap-4">
        <Badge variant="live" className="text-sm px-4 py-2 font-bold">
          {filters.live} LIVE NOW
        </Badge>
        <Badge variant="upcoming" className="text-sm px-4 py-2 font-bold">
          {filters.upcoming} UPCOMING
        </Badge>
      </div>

      {/* Hero Content */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Watch Cricket LIVE & FREE!
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Experience the thrill of cricket with crystal-clear HD streams. No subscriptions, no hassle - just pure cricket action!
        </p>
      </div>
    </div>
  );
};