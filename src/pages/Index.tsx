import { useState } from 'react';
import { Header } from '@/components/Header';
import { MatchFilters } from '@/components/MatchFilters';
import { MatchCard } from '@/components/MatchCard';
import { VideoPlayer } from '@/components/VideoPlayer';
import { BackgroundImage } from '@/components/BackgroundImage';
import { Footer } from '@/components/Footer';
import { useMatches } from '@/hooks/useMatches';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { 
    matches, 
    liveMatches, 
    upcomingMatches, 
    filters, 
    activeFilter, 
    setActiveFilter 
  } = useMatches();

  const [currentStream, setCurrentStream] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleWatchStream = (streamUrl: string, type: 'dai' | 'adfree', title: string) => {
    setCurrentStream({
      url: streamUrl,
      title: `${title} - ${type.toUpperCase()} Stream`
    });
  };

  const closePlayer = () => {
    setCurrentStream(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundImage />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Section */}
        <Header filters={filters} />

        {/* Match Filters */}
        <div className="mb-12">
          <MatchFilters 
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Live Matches Section */}
        {liveMatches.length > 0 && (activeFilter === 'all' || activeFilter === 'live') && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                LIVE Matches - Watch Now!
              </h2>
              <Badge variant="live" className="px-3 py-1 text-sm font-bold">
                {liveMatches.length} STREAMING
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onWatchStream={(streamUrl, type) => 
                    handleWatchStream(streamUrl, type, match.title)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches Section */}
        {upcomingMatches.length > 0 && (activeFilter === 'all' || activeFilter === 'upcoming') && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Coming Up Next
              </h2>
              <Badge variant="upcoming" className="px-3 py-1 text-sm font-bold">
                {upcomingMatches.length} SCHEDULED
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Matches Section (when filter is active) */}
        {activeFilter !== 'all' && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {activeFilter === 'live' ? 'Live' : 'Upcoming'} Matches
              </h2>
              <Badge 
                variant={activeFilter === 'live' ? 'live' : 'upcoming'} 
                className="px-3 py-1 text-sm font-bold"
              >
                {matches.length} {activeFilter === 'live' ? 'STREAMING' : 'SCHEDULED'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onWatchStream={(streamUrl, type) => 
                    handleWatchStream(streamUrl, type, match.title)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* No Matches State */}
        {matches.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-muted-foreground">
              No matches found for the selected filter
            </h3>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>

      {/* Video Player Modal */}
      {currentStream && (
        <VideoPlayer
          streamUrl={currentStream.url}
          title={currentStream.title}
          onClose={closePlayer}
        />
      )}
    </div>
  );
};

export default Index;
