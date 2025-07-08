import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Satellite, Database, Brain } from 'lucide-react';

interface LoadingProgressProps {
  stage: 'searching' | 'downloading' | 'processing' | 'analyzing' | 'complete';
  progress: number;
}

const LoadingProgress = ({ stage, progress }: LoadingProgressProps) => {
  const stages = {
    searching: { icon: Satellite, text: 'Searching SMAP data...', color: 'text-blue-500' },
    downloading: { icon: Database, text: 'Downloading satellite data...', color: 'text-yellow-500' },
    processing: { icon: Brain, text: 'Processing soil moisture...', color: 'text-orange-500' },
    analyzing: { icon: Brain, text: 'Generating AI insights...', color: 'text-green-500' },
    complete: { icon: Satellite, text: 'Analysis complete!', color: 'text-primary' }
  };

  const currentStage = stages[stage];
  const Icon = currentStage.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon className={`h-5 w-5 ${currentStage.color} animate-pulse`} />
          <span className="text-sm font-medium">{currentStage.text}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {progress}% complete
        </div>
        
        {/* Terminal-like output */}
        <div className="mt-4 bg-black/90 rounded p-3 font-mono text-xs text-green-400">
          <div className="space-y-1">
            {progress > 0 && <div>🔍 QUEUEING TASKS | ████████████████████ 100%</div>}
            {progress > 25 && <div>📡 PROCESSING TASKS | ████████████████████ 100%</div>}
            {progress > 50 && <div>📊 COLLECTING RESULTS | ████████████████████ 100%</div>}
            {progress > 75 && <div>🤖 GENERATING AI INSIGHTS | ████████████████████ 100%</div>}
            {progress === 100 && <div className="text-yellow-400">⏳ Analysis Loading...</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingProgress;