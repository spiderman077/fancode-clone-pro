import { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Play, Pause, Maximize, Settings, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudflareProxyService } from '@/services/CloudflareProxyService';
import { HLSPlayerManager } from '@/utils/HLSPlayerManager';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  matchId?: string;
  onClose: () => void;
}

export const VideoPlayer = ({ streamUrl, title, matchId, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [hlsPlayer, setHlsPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Process stream URL and setup video
  useEffect(() => {
    if (!streamUrl) return;

    const setupVideo = async () => {
      setLoading(true);
      setError(null);

      try {
        // For direct HLS streams, try without proxy first
        let processed = streamUrl;
        
        // Only use proxy if it's not already a direct CDN stream
        if (!streamUrl.includes('cdn-asia.styxsports.live') && !streamUrl.includes('.m3u8?')) {
          processed = await CloudflareProxyService.getStreamProxy(streamUrl);
        }
        
        setProcessedUrl(processed);

        if (videoRef.current) {
          const video = videoRef.current;
          
          // Reset video state
          video.currentTime = 0;
          
          // Set up event listeners
          const handleLoadStart = () => setLoading(true);
          const handleCanPlay = () => {
            setLoading(false);
            setError(null);
          };
          const handleError = (e: Event) => {
            console.error('Video error:', e);
            setError('Stream failed to load. Trying HLS player...');
            
            // Try HLS player as fallback
            if (processed.includes('.m3u8')) {
              setupHLSPlayer(video, processed);
            }
          };
          const handlePlay = () => setIsPlaying(true);
          const handlePause = () => setIsPlaying(false);
          const handleTimeUpdate = () => setCurrentTime(video.currentTime);
          const handleLoadedMetadata = () => setDuration(video.duration);

          video.addEventListener('loadstart', handleLoadStart);
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);
          video.addEventListener('play', handlePlay);
          video.addEventListener('pause', handlePause);
          video.addEventListener('timeupdate', handleTimeUpdate);
          video.addEventListener('loadedmetadata', handleLoadedMetadata);

          // Try direct video first
          if (processed.includes('.m3u8')) {
            // For HLS streams, try HLS.js first
            const hlsResult = await setupHLSPlayer(video, processed);
            if (!hlsResult.success) {
              // Fallback to direct URL
              if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = processed;
              } else {
                setError('HLS streaming not supported on this browser');
              }
            }
          } else {
            // Direct video URL
            video.src = processed;
          }

          return () => {
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
        }
      } catch (error) {
        console.error('Failed to setup video:', error);
        setError('Failed to process stream URL');
        setLoading(false);
      }
    };

    const setupHLSPlayer = async (video: HTMLVideoElement, url: string) => {
      try {
        const result = await HLSPlayerManager.setupHLSPlayer(video, url);
        if (result.success) {
          setHlsPlayer(result.player);
          setLoading(false);
          setError(null);
        } else {
          setError(result.error || 'Failed to setup HLS player');
        }
        return result;
      } catch (error) {
        console.error('HLS setup error:', error);
        setError('HLS player initialization failed');
        return { success: false };
      }
    };

    setupVideo();

    // Cleanup
    return () => {
      if (hlsPlayer) {
        HLSPlayerManager.destroyInstance(hlsPlayer);
      }
    };
  }, [streamUrl]);

  // Video control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const restartStream = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openInNewTab = () => {
    window.open(processedUrl || streamUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl bg-card border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Badge variant="live" className="animate-pulse">LIVE</Badge>
            <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video bg-black overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center text-white">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading stream...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center text-white max-w-md">
                <p className="text-red-400 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button variant="stream" onClick={openInNewTab}>
                    Open in External Player
                  </Button>
                  <p className="text-xs text-gray-400">
                    Stream URL: {streamUrl}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            autoPlay
            crossOrigin="anonymous"
            playsInline
          />

          {/* Enhanced Progress Bar with Seek Control */}
          <div className="absolute bottom-16 left-4 right-4">
            <div className="flex items-center gap-3 text-white text-sm mb-2">
              <span className="text-xs font-mono bg-black/60 px-2 py-1 rounded">
                {formatTime(currentTime)}
              </span>
              
              {/* Main Seek Slider */}
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
                  <div 
                    className="absolute top-1 w-3 h-3 bg-primary rounded-full transform -translate-y-1/2 transition-all duration-150"
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
              </div>

              {/* Forward/Backward Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(-30)}
                  className="text-white hover:bg-white/20 px-2 py-1 text-xs"
                  title="Back 30s"
                >
                  -30s
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(30)}
                  className="text-white hover:bg-white/20 px-2 py-1 text-xs"
                  title="Forward 30s"
                >
                  +30s
                </Button>
              </div>
            </div>
          </div>

          {/* Simplified Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={restartStream}
                  className="text-white hover:bg-white/20"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20 w-10 h-10"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 accent-primary"
                />

                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                  className="bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openInNewTab}
                  className="text-white hover:bg-white/20"
                  title="External Player"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Info Footer */}
        <div className="p-4 border-t border-border/50 bg-card/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-live rounded-full animate-pulse"></div>
                <span>LIVE STREAM</span>
              </div>
              {processedUrl && (
                <Badge variant="outline" className="text-xs">
                  CORS Protected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                External Player
              </Button>
              <Button variant="stream" size="sm" onClick={() => navigator.clipboard.writeText(streamUrl)}>
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};