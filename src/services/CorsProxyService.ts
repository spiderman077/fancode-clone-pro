// CORS Proxy Service for bypassing fancode CORS restrictions
export class CorsProxyService {
  private static readonly PROXY_URLS = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  private static currentProxyIndex = 0;

  // Get the current proxy URL
  private static getCurrentProxy(): string {
    return this.PROXY_URLS[this.currentProxyIndex];
  }

  // Rotate to next proxy if current one fails
  private static rotateProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.PROXY_URLS.length;
  }

  // Fetch with CORS proxy and automatic retry
  static async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;
    
    // Try each proxy
    for (let i = 0; i < this.PROXY_URLS.length; i++) {
      try {
        const proxyUrl = this.getCurrentProxy();
        const proxiedUrl = proxyUrl + encodeURIComponent(url);
        
        console.log(`Attempting fetch with proxy ${i + 1}:`, proxyUrl);
        
        const response = await fetch(proxiedUrl, {
          ...options,
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...options.headers
          }
        });

        if (response.ok) {
          console.log('Successful fetch with proxy:', proxyUrl);
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Proxy ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.rotateProxy();
      }
    }

    throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
  }

  // Fetch JSON data with CORS bypass
  static async fetchJson<T>(url: string): Promise<T> {
    const response = await this.fetchWithProxy(url);
    return response.json();
  }

  // Get direct stream URL (bypass CORS for streaming)
  static getStreamUrl(originalUrl: string): string {
    // For HLS streams, we need a different approach
    if (originalUrl.includes('.m3u8')) {
      // Use a streaming proxy that supports m3u8
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
    }
    return this.getCurrentProxy() + encodeURIComponent(originalUrl);
  }
}