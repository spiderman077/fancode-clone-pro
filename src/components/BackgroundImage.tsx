import cricketHero from '@/assets/cricket-hero.jpg';

export const BackgroundImage = () => {
  return (
    <div className="fixed inset-0 z-[-1]">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${cricketHero})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
    </div>
  );
};