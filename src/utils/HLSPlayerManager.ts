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
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: Infinity,
          liveDurationInfinity: false,
          enableSoftwareAES: true,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 1,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
          startFragPrefetch: true,
          xhrSetup: (xhr: XMLHttpRequest, url: string) => {
            // Add CORS headers
            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
            xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            xhr.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type');
          }
        });

        // Error handling
        hls.on(Hls.Events.ERROR, (event: string, data: any) => {
          console.error('HLS Error:', event, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, destroying HLS instance');
                hls.destroy();
                break;
            }
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