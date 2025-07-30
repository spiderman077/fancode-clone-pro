// Enhanced CORS Proxy Service optimized for Cloudflare deployment
export class CloudflareProxyService {
  private static readonly PROXY_SERVICES = [
    {
      name: 'AllOrigins',
      url: 'https://api.allorigins.win/raw?url=',
      streamUrl: 'https://api.allorigins.win/raw?url='
    },
    {
      name: 'CORS.sh',
      url: 'https://cors.sh/',
      streamUrl: 'https://cors.sh/'
    },
    {
      name: 'Proxy.cors.sh',
      url: 'https://proxy.cors.sh/',
      streamUrl: 'https://proxy.cors.sh/'
    },
    {
      name: 'ThingProxy',
      url: 'https://thingproxy.freeboard.io/fetch/',
      streamUrl: 'https://thingproxy.freeboard.io/fetch/'
    }
  ];

  private static currentIndex = 0;

  // Get next working proxy
  private static getNextProxy() {
    const proxy = this.PROXY_SERVICES[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.PROXY_SERVICES.length;
    return proxy;
  }

  // Test if proxy is working
  private static async testProxy(proxyUrl: string): Promise<boolean> {
    try {
      const testUrl = proxyUrl + encodeURIComponent('https://httpbin.org/json');
      const response = await fetch(testUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get working proxy URL for streaming
  static async getStreamProxy(streamUrl: string): Promise<string> {
    // For HLS streams, use direct CORS headers approach first
    if (streamUrl.includes('.m3u8')) {
      try {
        // Try direct access first
        const directResponse = await fetch(streamUrl, { 
          method: 'HEAD',
          mode: 'cors'
        });
        if (directResponse.ok) {
          return streamUrl; // Direct access works
        }
      } catch (e) {
        console.log('Direct access failed, using proxy');
      }
    }

    // Find working proxy
    for (const proxy of this.PROXY_SERVICES) {
      const isWorking = await this.testProxy(proxy.streamUrl);
      if (isWorking) {
        console.log(`Using proxy: ${proxy.name}`);
        return proxy.streamUrl + encodeURIComponent(streamUrl);
      }
    }

    // Fallback: return with first proxy anyway
    return this.PROXY_SERVICES[0].streamUrl + encodeURIComponent(streamUrl);
  }

  // Enhanced fetch with retry logic
  static async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.PROXY_SERVICES.length; attempt++) {
      try {
        const proxy = this.getNextProxy();
        const proxiedUrl = proxy.url + encodeURIComponent(url);
        
        const response = await fetch(proxiedUrl, {
          ...options,
          headers: {
            'Accept': 'application/json, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; StreamBot/1.0)',
            'Referer': 'https://fancode.com',
            ...options.headers
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Proxy attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    throw lastError || new Error('All proxy attempts failed');
  }

  // Optimized for Cloudflare Pages deployment
  static createCloudflareCompatibleUrl(originalUrl: string): string {
    // Use multiple fallback strategies for Cloudflare
    const strategies = [
      // Strategy 1: AllOrigins (most reliable)
      `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
      // Strategy 2: CORS.sh 
      `https://cors.sh/${originalUrl}`,
      // Strategy 3: Proxy with custom headers
      `https://proxy.cors.sh/${originalUrl}`,
    ];

    return strategies[0]; // Return primary strategy
  }
}