import { useState } from 'react';
import Header from '@/components/Header';
import Globe from '@/components/Globe';
import RegionSelector from '@/components/RegionSelector';
import AnalysisResults from '@/components/AnalysisResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Satellite, Database, Brain, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDemoAnalysis, getDemoFollowUp } from '@/services/demoData';

interface Region {
  id: string;
  name: string;
  country: string;
  position: { lat: number; lon: number };
  subregions: string[];
  bbox: [number, number, number, number];
}

interface AnalysisData {
  region: string;
  subregion: string;
  date: string;
  soilMoisture: number;
  interpretation: string;
  tips: string[];
  aiContext: Array<{ role: string; content: string }>;
}

const Demo = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>();
  const [analysisData, setAnalysisData] = useState<AnalysisData | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [followUpResponses, setFollowUpResponses] = useState<Array<{ question: string; answer: string }>>([]);
  const [isProcessingFollowUp, setIsProcessingFollowUp] = useState(false);
  const { toast } = useToast();

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setAnalysisData(undefined);
    setFollowUpResponses([]);
  };

  const handleAnalyze = async (subregion: string, date: Date) => {
    setIsAnalyzing(true);
    
    try {
      if (!selectedRegion) {
        throw new Error('No region selected');
      }

      toast({
        title: "🔍 Analyzing Demo Data",
        description: "Processing realistic soil moisture simulation...",
      });

      // Use demo data service instead of real API
      const data = await getDemoAnalysis(selectedRegion.name, subregion, date);
      
      const analysisResult: AnalysisData = {
        region: data.region,
        subregion: data.subregion,
        date: data.date,
        soilMoisture: data.soilMoisture,
        interpretation: data.interpretation,
        tips: data.tips,
        aiContext: data.aiContext
      };
      
      setAnalysisData(analysisResult);
      toast({
        title: "✅ Demo Analysis Complete",
        description: `Realistic data generated for ${subregion}`,
      });

    } catch (error: unknown) {
      console.error('Demo Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unable to generate demo data. Please try again.";
      toast({
        title: "❌ Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUpQuestion = async (question: string) => {
    setIsProcessingFollowUp(true);
    
    try {
      if (!analysisData) {
        throw new Error('No analysis data available. Please analyze a region first.');
      }

      // Use demo follow-up service
      const data = await getDemoFollowUp(
        question,
        analysisData.region,
        analysisData.subregion,
        analysisData.soilMoisture
      );

      setFollowUpResponses(prev => [...prev, { question: data.question, answer: data.answer }]);
      
      toast({
        title: "🤖 Demo AI Response Generated",
        description: "Your question has been answered using simulated agricultural AI.",
      });

    } catch (error: unknown) {
      console.error('Demo Follow-up Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Please try your question again.";
      toast({
        title: "❌ Failed to Generate Response",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingFollowUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Demo Banner */}
        <Alert className="mb-8 border-orange-200 bg-orange-50">
          <Play className="h-4 w-4" />
          <AlertDescription>
            <strong>🎮 Demo Mode:</strong> This is a demonstration version using realistic simulated data. 
            The full version connects to real NASA SMAP satellite data and OpenAI for live agricultural insights.
          </AlertDescription>
        </Alert>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Soil Moisture Intelligence from Space
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the power of NASA's SMAP satellite data with cutting-edge AI insights for precision agricultural decision-making
          </p>
        </div>

        {!selectedRegion ? (
          /* Globe Selection View */
          <div className="space-y-8">
            <Globe onRegionSelect={handleRegionSelect} />
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Satellite className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">NASA SMAP Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    Access real-time soil moisture measurements from NASA's Soil Moisture Active Passive satellite with global coverage
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center group hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Database className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Regional Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    Deep-dive analysis for 15+ agricultural regions worldwide with historical trends and comparative insights
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center group hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-8 w-8 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl">AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    Get intelligent, context-aware recommendations powered by advanced machine learning algorithms
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Analysis View - Vertical Layout */
          <div className="space-y-8">
            {/* Globe Section - Full Width */}
            <div className="flex justify-center">
              <Globe onRegionSelect={handleRegionSelect} selectedRegion={selectedRegion} />
            </div>
            
            {/* Analysis Section - Below Globe */}
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
              {/* Region Selector */}
              <div className="flex justify-center lg:justify-end">
                <RegionSelector 
                  selectedRegion={selectedRegion}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              </div>
              
              {/* Analysis Results */}
              <div className="lg:col-span-1">
                {analysisData ? (
                  <AnalysisResults 
                    data={analysisData}
                    onFollowUpQuestion={handleFollowUpQuestion}
                    isProcessing={isProcessingFollowUp}
                    followUpResponses={followUpResponses}
                  />
                ) : (
                  <Card className="h-96 flex items-center justify-center">
                    <CardContent className="text-center">
                      <Satellite className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <CardTitle className="text-muted-foreground mb-2">
                        Ready for Demo Analysis
                      </CardTitle>
                      <CardDescription>
                        Select a subregion and date to begin soil moisture analysis
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <Alert className="mt-12 max-w-4xl mx-auto border-orange-200 bg-orange-50">
          <Play className="h-4 w-4" />
          <AlertDescription>
            <strong>🎮 Interactive Demo:</strong> This demonstration showcases the SMAP soil moisture analysis interface using realistic simulated data. 
            In the full version, this connects to real NASA Earth Data servers and OpenAI for authentic agricultural insights.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
};

export default Demo; 