// Demo data service for Lovable export
// Provides realistic soil moisture data without requiring NASA credentials

interface DemoSoilMoistureData {
  region: string;
  subregion: string;
  date: string;
  soilMoisture: number;
  interpretation: string;
  tips: string[];
  aiContext: Array<{ role: string; content: string }>;
}

// Realistic soil moisture ranges for different regions and seasons
const getSeasonalMoisture = (region: string, date: Date): number => {
  const month = date.getMonth();
  const baseValues: { [key: string]: { winter: number; spring: number; summer: number; fall: number } } = {
    'Punjab': { winter: 0.25, spring: 0.35, summer: 0.15, fall: 0.30 },
    'California': { winter: 0.30, spring: 0.25, summer: 0.10, fall: 0.20 },
    'Brazil': { winter: 0.40, spring: 0.35, summer: 0.30, fall: 0.35 },
    'Australia': { winter: 0.20, spring: 0.25, summer: 0.15, fall: 0.20 },
    'India': { winter: 0.25, spring: 0.30, summer: 0.20, fall: 0.25 }
  };

  let season: keyof typeof baseValues.Punjab;
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else season = 'winter';

  const baseValue = baseValues[region]?.[season] || 0.25;
  // Add some realistic variation (±10%)
  const variation = (Math.random() - 0.5) * 0.2;
  return Math.max(0.05, Math.min(0.6, baseValue + variation));
};

const getInterpretation = (moisture: number, region: string): string => {
  if (moisture < 0.15) {
    return `Soil moisture in ${region} is critically low (${(moisture * 100).toFixed(1)}%). This indicates severe drought conditions requiring immediate irrigation intervention.`;
  } else if (moisture < 0.25) {
    return `Soil moisture in ${region} is below optimal levels (${(moisture * 100).toFixed(1)}%). Consider supplemental irrigation for sensitive crops.`;
  } else if (moisture < 0.35) {
    return `Soil moisture in ${region} is within normal range (${(moisture * 100).toFixed(1)}%). Conditions are suitable for most agricultural activities.`;
  } else if (moisture < 0.45) {
    return `Soil moisture in ${region} is above average (${(moisture * 100).toFixed(1)}%). Excellent conditions for crop growth and development.`;
  } else {
    return `Soil moisture in ${region} is very high (${(moisture * 100).toFixed(1)}%). Monitor for potential drainage issues or waterlogging.`;
  }
};

const getTips = (moisture: number, region: string): string[] => {
  const tips: string[] = [];
  
  if (moisture < 0.15) {
    tips.push(
      "🚨 Implement emergency irrigation protocols",
      "💧 Consider drought-resistant crop varieties",
      "🌱 Apply soil moisture retention techniques",
      "📊 Monitor weather forecasts for rain events"
    );
  } else if (moisture < 0.25) {
    tips.push(
      "💧 Schedule supplemental irrigation",
      "🌾 Focus on drought-tolerant crops",
      "🛡️ Implement water conservation measures",
      "📈 Track soil moisture trends daily"
    );
  } else if (moisture < 0.35) {
    tips.push(
      "✅ Optimal conditions for planting",
      "🌱 Proceed with normal irrigation schedule",
      "📊 Continue regular moisture monitoring",
      "🌾 Good time for fertilizer application"
    );
  } else if (moisture < 0.45) {
    tips.push(
      "🌱 Excellent growing conditions",
      "💧 Reduce irrigation frequency",
      "🌾 Monitor for disease pressure",
      "📈 Expect strong crop yields"
    );
  } else {
    tips.push(
      "⚠️ Monitor for drainage issues",
      "🌧️ Reduce irrigation immediately",
      "🌱 Consider raised bed planting",
      "📊 Check for waterlogging damage"
    );
  }
  
  return tips;
};

const getAIContext = (region: string, moisture: number): Array<{ role: string; content: string }> => {
  return [
    {
      role: "system",
      content: `You are an agricultural AI expert analyzing SMAP satellite data for ${region}. Current soil moisture: ${(moisture * 100).toFixed(1)}%.`
    },
    {
      role: "user",
      content: `Analyze the soil moisture conditions in ${region} and provide agricultural recommendations.`
    },
    {
      role: "assistant",
      content: `Based on SMAP satellite data, ${region} shows ${(moisture * 100).toFixed(1)}% soil moisture. ${getInterpretation(moisture, region)}`
    }
  ];
};

export const getDemoAnalysis = async (
  region: string,
  subregion: string,
  date: Date
): Promise<DemoSoilMoistureData> => {
  // Simulate API delay for realistic experience
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const soilMoisture = getSeasonalMoisture(region, date);
  
  return {
    region,
    subregion,
    date: date.toLocaleDateString(),
    soilMoisture,
    interpretation: getInterpretation(soilMoisture, region),
    tips: getTips(soilMoisture, region),
    aiContext: getAIContext(region, soilMoisture)
  };
};

export const getDemoFollowUp = async (
  question: string,
  region: string,
  subregion: string,
  soilMoisture: number
): Promise<{ question: string; answer: string }> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const moistureLevel = soilMoisture < 0.2 ? "low" : soilMoisture < 0.35 ? "moderate" : "high";
  
  const responses = {
    "irrigation": `Based on the current soil moisture of ${(soilMoisture * 100).toFixed(1)}% in ${subregion}, ${region}, I recommend ${moistureLevel === "low" ? "immediate irrigation" : moistureLevel === "moderate" ? "scheduled irrigation" : "reducing irrigation frequency"}.`,
    "crops": `For ${moistureLevel} soil moisture conditions in ${subregion}, consider ${moistureLevel === "low" ? "drought-resistant varieties like millet or sorghum" : moistureLevel === "moderate" ? "standard crop varieties with normal care" : "moisture-loving crops like rice or water-intensive vegetables"}.`,
    "weather": `The current soil moisture patterns in ${subregion} suggest ${moistureLevel === "low" ? "recent dry weather conditions" : moistureLevel === "moderate" ? "balanced precipitation" : "recent rainfall or high humidity"}. Monitor local weather forecasts for upcoming changes.`,
    "default": `Regarding your question about ${subregion}, ${region}: The current soil moisture of ${(soilMoisture * 100).toFixed(1)}% indicates ${moistureLevel} conditions. This affects agricultural planning and crop management strategies in the region.`
  };
  
  const questionLower = question.toLowerCase();
  let answer = responses.default;
  
  if (questionLower.includes("irrigat")) answer = responses.irrigation;
  else if (questionLower.includes("crop") || questionLower.includes("plant")) answer = responses.crops;
  else if (questionLower.includes("weather") || questionLower.includes("rain")) answer = responses.weather;
  
  return {
    question,
    answer
  };
}; 