export const Footer = () => {
  return (
    <footer className="mt-16 py-8 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold cricket-gradient bg-clip-text text-transparent">
              CrickOnTime
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Your Ultimate Cricket Streaming Hub - Watch Live & Free
          </p>
          <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground">
            <span>© 2025 CrickOnTime</span>
            <span>•</span>
            <span>All Rights Reserved</span>
            <span>•</span>
            <span>Premium Cricket Streaming</span>
          </div>
        </div>
      </div>
    </footer>
  );
};