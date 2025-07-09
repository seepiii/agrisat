import { useState } from 'react';
import Header from '@/components/Header';
import Globe from '@/components/Globe';
import RegionSelector from '@/components/RegionSelector';
import AnalysisResults from '@/components/AnalysisResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Satellite, Database, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const Index = () => {
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
        title: "🔍 Searching SMAP Data",
        description: "Connecting to NASA's satellite database...",
      });

      // Use environment variable for backend URL, fallback to localhost for development
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      // Debug: Log the backend URL being used
      console.log('🔗 Backend URL:', backendUrl);
      console.log('🌍 Environment:', import.meta.env.MODE);
      
      // Call backend for real NASA data
      const response = await fetch(`${backendUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region: selectedRegion.name,
          subregion,
          bbox: selectedRegion.bbox,
          date: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const analysisResult: AnalysisData = {
        region: data.region,
        subregion: data.subregion,
        date: new Date(data.date).toLocaleDateString(),
        soilMoisture: data.soil_moisture,
        interpretation: data.interpretation,
        tips: data.tips,
        aiContext: data.ai_context
      };
      setAnalysisData(analysisResult);
      toast({
        title: "✅ Analysis Complete",
        description: `Real SMAP data retrieved for ${subregion}`,
      });

    } catch (error: unknown) {
      console.error('SMAP Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unable to retrieve SMAP data. Please try again.";
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

      // Use environment variable for backend URL, fallback to localhost for development
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

      // Debug: Log the backend URL being used
      console.log('🔗 Follow-up Backend URL:', backendUrl);

      // Call backend for follow-up questions
      const response = await fetch(`${backendUrl}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          region: analysisData.region,
          subregion: analysisData.subregion,
          soil_moisture: analysisData.soilMoisture,
          date: analysisData.date,
          ai_context: analysisData.aiContext
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate response');
      }

      setFollowUpResponses(prev => [...prev, { question: data.question, answer: data.answer }]);
      
      toast({
        title: "🤖 AI Response Generated",
        description: "Your question has been answered using real agricultural AI.",
      });

    } catch (error: unknown) {
      console.error('Follow-up AI Error:', error);
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Agrisat - Soil Moisture Intelligence from Space
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Harness the power of NASA's SMAP satellite data with cutting-edge AI insights for precision agricultural decision-making
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
                        Ready for Analysis
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

        {/* Live Integration Notice */}
        <Alert className="mt-12 max-w-4xl mx-auto border-primary/20 bg-primary/5">
          <Satellite className="h-4 w-4" />
          <AlertDescription>
            <strong>🛰️ Live SMAP Integration:</strong> This application now uses real NASA SMAP satellite data and OpenAI for agricultural insights. 
            Data is fetched directly from NASA's Earth Data servers for authentic soil moisture analysis.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
};

export default Index;
