import { useState } from 'react';
import { Header } from '@/components/Header';
import { MatchFilters } from '@/components/MatchFilters';
import { MatchCard } from '@/components/MatchCard';
import { VideoPlayer } from '@/components/VideoPlayer';
import { BackgroundImage } from '@/components/BackgroundImage';
import { Footer } from '@/components/Footer';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useMatches } from '@/hooks/useMatches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { 
    matches, 
    liveMatches, 
    upcomingMatches, 
    filters, 
    activeFilter, 
    setActiveFilter,
    loading,
    error,
    refetch,
    fetchStreamUrls
  } = useMatches();

  const [currentStream, setCurrentStream] = useState<{
    url: string;
    title: string;
    matchId?: string;
  } | null>(null);

  const handleWatchStream = async (streamUrl: string, type: 'dai' | 'adfree', title: string, matchId?: string) => {
    // Try to get fresh stream URLs if matchId is available
    if (matchId) {
      try {
        const freshStreams = await fetchStreamUrls(matchId);
        const freshUrl = type === 'dai' ? freshStreams.dai : freshStreams.adfree;
        if (freshUrl) {
          streamUrl = freshUrl;
        }
      } catch (error) {
        console.error('Failed to fetch fresh stream URLs:', error);
      }
    }

    setCurrentStream({
      url: streamUrl,
      title: `${title} - ${type.toUpperCase()} Stream`,
      matchId
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

        {/* Loading/Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Fetching live matches from fancode...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4 mb-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-destructive text-sm mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mb-8">
          <ConnectionStatus 
            isConnected={!loading && !error && matches.length > 0}
            isLoading={loading}
            error={error}
            onRetry={refetch}
          />
        </div>

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
                    handleWatchStream(streamUrl, type, match.title, match.id)
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
                    handleWatchStream(streamUrl, type, match.title, match.id)
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
          matchId={currentStream.matchId}
          onClose={closePlayer}
        />
      )}
    </div>
  );
};

export default Index;
