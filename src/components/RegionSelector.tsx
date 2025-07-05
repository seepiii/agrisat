import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import LoadingProgress from '@/components/LoadingProgress';

interface Region {
  id: string;
  name: string;
  country: string;
  position: { lat: number; lon: number };
  subregions: string[];
  bbox: [number, number, number, number];
}

interface RegionSelectorProps {
  selectedRegion: Region;
  onAnalyze: (subregion: string, date: Date) => void;
  isAnalyzing: boolean;
}

const RegionSelector = ({ selectedRegion, onAnalyze, isAnalyzing }: RegionSelectorProps) => {
  const [selectedSubregion, setSelectedSubregion] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'searching' | 'downloading' | 'processing' | 'analyzing' | 'complete'>('searching');
  const [progress, setProgress] = useState(0);

  // Simulate progress updates when analyzing
  useEffect(() => {
    if (isAnalyzing) {
      setProgress(0);
      setLoadingStage('searching');
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 25) {
            setLoadingStage('searching');
            return prev + 5;
          } else if (prev < 50) {
            setLoadingStage('downloading');
            return prev + 4;
          } else if (prev < 75) {
            setLoadingStage('processing');
            return prev + 3;
          } else if (prev < 95) {
            setLoadingStage('analyzing');
            return prev + 2;
          } else {
            setLoadingStage('complete');
            return 100;
          }
        });
      }, 300);

      return () => clearInterval(progressInterval);
    } else {
      setProgress(0);
    }
  }, [isAnalyzing]);

  const handleAnalyze = () => {
    if (selectedSubregion) {
      onAnalyze(selectedSubregion, selectedDate);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {isAnalyzing ? (
        <LoadingProgress stage={loadingStage} progress={progress} />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              {selectedRegion.name}
            </CardTitle>
            <CardDescription>{selectedRegion.country}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Subregion Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Select Subregion</label>
              <div className="grid gap-2">
                {selectedRegion.subregions.map((subregion) => (
                  <Button
                    key={subregion}
                    variant={selectedSubregion === subregion ? "default" : "outline"}
                    onClick={() => setSelectedSubregion(subregion)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{subregion}</div>
                      <div className="text-xs text-muted-foreground">
                        Analysis available
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Analysis Date</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2015-03-31")
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                SMAP data available from March 31, 2015
              </p>
            </div>

            {/* Coordinate Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs font-medium mb-1">Coordinates</div>
              <div className="text-xs text-muted-foreground font-mono">
                [{selectedRegion.bbox.join(', ')}]
              </div>
            </div>

            {/* Analyze Button */}
            <Button 
              onClick={handleAnalyze}
              disabled={!selectedSubregion}
              className="w-full"
              size="lg"
            >
              Analyze Real SMAP Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegionSelector;