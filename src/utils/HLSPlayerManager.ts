// Advanced HLS Player with CORS support and error handling
export class HLSPlayerManager {
  private static instances = new Map<string, any>();

  // Load HLS.js dynamically if needed
  static async loadHLSLibrary(): Promise<any> {
    try {
      // Try to load HLS.js from CDN
      if (typeof (window as any).Hls === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest');
      }
      return (window as any).Hls;
    } catch (error) {
      console.error('Failed to load HLS.js:', error);
      return null;
    }
  }

  // Load external script
  private static loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Setup HLS player with CORS handling
  static async setupHLSPlayer(videoElement: HTMLVideoElement, streamUrl: string): Promise<{
    success: boolean;
    player?: any;
    error?: string;
  }> {
    try {
      const Hls = await this.loadHLSLibrary();
      
      if (!Hls) {
        return { success: false, error: 'HLS.js not available' };
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          // Enhanced buffering for smoother playback
          enableWorker: true,
          lowLatencyMode: false, // Disable for better buffering
          backBufferLength: 90,
          maxBufferLength: 60, // Increased buffer
          maxMaxBufferLength: 120, // Larger max buffer  
          maxBufferSize: 120 * 1000 * 1000, // 120MB buffer
          maxBufferHole: 0.3,
          highBufferWatchdogPeriod: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 5, // More retries
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 5, // More sync buffer
          liveMaxLatencyDurationCount: 15,
          liveDurationInfinity: false,
          enableSoftwareAES: true,
          
          // Network timeouts and retries
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 500,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 6,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 30000, // Longer fragment timeout
          fragLoadingMaxRetry: 8, // More fragment retries
          fragLoadingRetryDelay: 1000,
          startFragPrefetch: true,
          
          // CORS configuration
          xhrSetup: (xhr: XMLHttpRequest, url: string) => {
            xhr.setRequestHeader('Accept', '*/*');
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('Pragma', 'no-cache');
          }
        });

        // Enhanced error handling
        hls.on(Hls.Events.ERROR, (event: string, data: any) => {
          console.warn('HLS Event:', data.type, data.details);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, attempting recovery...');
                setTimeout(() => hls.startLoad(), 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, destroying player');
                hls.destroy();
                break;
            }
          } else if (data.details === 'bufferStalledError') {
            // Handle buffer stalls gracefully
            console.log('Buffer stall, attempting smooth recovery...');
            setTimeout(() => {
              if (videoElement.paused && data.buffer < 5) {
                videoElement.play().catch(e => console.log('Auto-play prevented'));
              }
            }, 2000);
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);

        // Store instance for cleanup
        const instanceId = Math.random().toString(36);
        this.instances.set(instanceId, hls);

        return { success: true, player: hls };
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoElement.src = streamUrl;
        return { success: true };
      } else {
        return { success: false, error: 'HLS not supported on this browser' };
      }
    } catch (error) {
      console.error('Failed to setup HLS player:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Cleanup HLS instances
  static cleanup(): void {
    this.instances.forEach(hls => {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
    this.instances.clear();
  }

  // Destroy specific instance
  static destroyInstance(player: any): void {
    if (player && typeof player.destroy === 'function') {
      player.destroy();
    }
  }
}