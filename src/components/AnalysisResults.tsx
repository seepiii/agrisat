import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Droplets, Brain, MessageCircle, TrendingUp, MapPin, Calendar } from 'lucide-react';

interface AnalysisData {
  region: string;
  subregion: string;
  date: string;
  soilMoisture: number;
  interpretation: string;
  tips: string[];
  aiContext: Array<{ role: string; content: string }>;
}

interface AnalysisResultsProps {
  data: AnalysisData;
  onFollowUpQuestion: (question: string) => void;
  isProcessing: boolean;
  followUpResponses: Array<{ question: string; answer: string }>;
}

const AnalysisResults = ({ 
  data, 
  onFollowUpQuestion, 
  isProcessing, 
  followUpResponses 
}: AnalysisResultsProps) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('');

  const handleSubmitQuestion = () => {
    if (followUpQuestion.trim()) {
      onFollowUpQuestion(followUpQuestion);
      setFollowUpQuestion('');
    }
  };

  const getMoistureLevel = (value: number) => {
    if (value < 0.15) return { level: 'Dry', color: 'destructive', icon: '🏜️' };
    if (value < 0.3) return { level: 'Moderate', color: 'default', icon: '🌱' };
    return { level: 'Wet', color: 'secondary', icon: '💧' };
  };

  const moistureInfo = getMoistureLevel(data.soilMoisture);

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Main Results Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Soil Moisture Analysis
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.subregion}, {data.region}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {data.date}
                </span>
              </CardDescription>
            </div>
            <Badge variant={moistureInfo.color as "default" | "secondary" | "destructive"} className="text-lg px-3 py-1">
              {moistureInfo.icon} {moistureInfo.level}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Moisture Reading */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Average Soil Moisture</div>
              <div className="text-3xl font-bold text-primary">
                {data.soilMoisture.toFixed(3)}
                <span className="text-lg text-muted-foreground ml-2">m³/m³</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Volumetric Water Content
              </div>
              <div className="mt-2">
                <div className="w-full bg-muted/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(data.soilMoisture * 200, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Interpretation</div>
              <p className="text-sm leading-relaxed">{data.interpretation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            AI-Generated Agricultural Tips
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on current soil conditions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {data.tips.map((tip, index) => (
              <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Q&A Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-nasa.orange" />
            Ask Follow-up Questions
          </CardTitle>
          <CardDescription>
            Get specific advice about this region and soil conditions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Previous Q&A */}
          {followUpResponses.length > 0 && (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {followUpResponses.map((qa, index) => (
                <div key={index} className="space-y-2">
                  <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
                    <div className="text-sm font-medium text-accent mb-1">Your Question:</div>
                    <p className="text-sm">{qa.question}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary ml-4">
                    <div className="text-sm font-medium text-primary mb-1">AI Response:</div>
                    <div className="text-sm leading-relaxed">
                      {qa.answer.includes('•') || qa.answer.length > 200 ? (
                        <div className="whitespace-pre-line">{qa.answer}</div>
                      ) : (
                        <p>{qa.answer}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* New Question Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Ask about crop recommendations, irrigation timing, seasonal planning, etc..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              className="min-h-20"
            />
            <Button 
              onClick={handleSubmitQuestion}
              disabled={!followUpQuestion.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Ask Question'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;