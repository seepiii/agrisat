import { Satellite } from 'lucide-react';
import smapSatelliteImage from '@/assets/smap-satellite.jpg';

const Header = () => {
  return (
    <header className="relative border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 animate-satellite-orbit">
              <img 
                src={smapSatelliteImage} 
                alt="SMAP Satellite"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-space.green bg-clip-text text-transparent">
                SMAP Soil Insights
              </h1>
              <p className="text-sm text-muted-foreground">NASA Satellite Soil Moisture Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Satellite className="h-4 w-4" />
            <span>Powered by NASA SMAP Data</span>
          </div>
        </div>
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
    </header>
  );
};

export default Header;