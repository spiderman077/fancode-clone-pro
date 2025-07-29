import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer = ({ streamUrl, title, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && streamUrl) {
      const video = videoRef.current;
      
      // Check if HLS is supported natively
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else {
        // For browsers that don't support HLS natively, we'd need hls.js
        // For now, we'll just show the URL or an iframe
        console.log('HLS not supported natively, stream URL:', streamUrl);
      }
    }
  }, [streamUrl]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl bg-card border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black relative overflow-hidden">
          {streamUrl.includes('.m3u8') ? (
            // HLS Stream
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              crossOrigin="anonymous"
            >
              <source src={streamUrl} type="application/x-mpegURL" />
              Your browser does not support HLS video.
            </video>
          ) : (
            // Fallback: embed as iframe or show message
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <p className="text-lg mb-4">Stream Loading...</p>
                <p className="text-sm text-gray-400">
                  Stream URL: {streamUrl}
                </p>
                <Button
                  variant="stream"
                  className="mt-4"
                  onClick={() => window.open(streamUrl, '_blank')}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <div className="w-2 h-2 bg-live rounded-full animate-pulse"></div>
                LIVE STREAM
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(streamUrl, '_blank')}
            >
              Open in External Player
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};