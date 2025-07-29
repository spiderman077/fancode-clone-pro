import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ConnectionStatus = ({ isConnected, isLoading, error, onRetry }: ConnectionStatusProps) => {
  if (isLoading) {
    return (
      <Card className="p-4 bg-card/50 border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">
            Connecting to fancode servers...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Connection Issue</p>
              <p className="text-xs text-destructive/70">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-center gap-3">
          <Wifi className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">Connected to Fancode</p>
            <p className="text-xs text-primary/70">Live data streaming</p>
          </div>
          <Badge variant="live" className="ml-auto">LIVE</Badge>
        </div>
      </Card>
    );
  }

  return null;
};