from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
import random

app = FastAPI(title="SMAP Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000", 
        "https://agrisat.world",
        "https://www.agrisat.world",
        "https://smap-project-sampadaap-oqw54delw-seepiiis-projects.vercel.app",
        "https://smap-project-sampadaap-ca9gnu6kg-seepiiis-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = None

def get_openai_client():
    global client
    if client is None:
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        except Exception as e:
            print(f"OpenAI client initialization failed: {e}")
            return None
    return client

# Request models
class SMAPAnalysisRequest(BaseModel):
    region: str
    subregion: str
    bbox: List[float]  # [lon_min, lat_min, lon_max, lat_max]
    date: str

class FollowUpRequest(BaseModel):
    question: str
    region: str
    subregion: str
    soil_moisture: float
    date: str
    ai_context: List[dict]

# Response models
class SMAPAnalysisResponse(BaseModel):
    success: bool
    region: str
    subregion: str
    date: str
    soil_moisture: float
    interpretation: str
    tips: List[str]
    ai_context: List[dict]
    data_source: str
    error: Optional[str] = None

class FollowUpResponse(BaseModel):
    success: bool
    question: str
    answer: str
    error: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "SMAP Analysis API - Simplified Version"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SMAP Backend"}

@app.post("/analyze", response_model=SMAPAnalysisResponse)
async def analyze_smap_data(request: SMAPAnalysisRequest):
    """Analyze SMAP data for a specific region and date"""
    try:
        print(f"🔍 Analyzing SMAP data for {request.subregion} on {request.date}")
        
        # Generate simulated soil moisture data (0.1 to 0.4 range)
        soil_moisture = round(random.uniform(0.1, 0.4), 3)
        
        print(f"📍 {request.subregion} | 📅 {request.date}")
        print(f"Simulated Soil Moisture: {soil_moisture:.3f} m³/m³")
        
        # Generate interpretation
        interpretation = generate_interpretation(soil_moisture)
        
        # Generate AI tips
        tips = await generate_ai_tips(request.subregion, request.region, request.date, soil_moisture, interpretation)
        
        # Setup AI context for follow-up questions
        ai_context = [
            {
                "role": "system",
                "content": f"You are an agricultural assistant helping interpret SMAP soil moisture satellite data. Current context: {request.subregion}, {request.region} on {request.date} has {soil_moisture:.3f} m³/m³ soil moisture. {interpretation}"
            },
            {
                "role": "user",
                "content": f"The average soil moisture for {request.subregion} on {request.date} is {soil_moisture:.3f} m³/m³. {interpretation}"
            },
            {
                "role": "assistant",
                "content": f"Based on the SMAP satellite data, here are the key insights:\n\n" + "\n".join([f"• {tip}" for tip in tips])
            }
        ]
        
        return SMAPAnalysisResponse(
            success=True,
            region=request.region,
            subregion=request.subregion,
            date=request.date,
            soil_moisture=soil_moisture,
            interpretation=interpretation,
            tips=tips,
            ai_context=ai_context,
            data_source="simulated-smap-data"
        )
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return SMAPAnalysisResponse(
            success=False,
            region=request.region,
            subregion=request.subregion,
            date=request.date,
            soil_moisture=0.0,
            interpretation="",
            tips=[],
            ai_context=[],
            data_source="error",
            error=str(e)
        )

@app.post("/followup", response_model=FollowUpResponse)
async def handle_followup_question(request: FollowUpRequest):
    """Handle follow-up questions about SMAP analysis"""
    try:
        # Prepare chat context
        chat_context = request.ai_context.copy()
        chat_context.append({"role": "user", "content": request.question})
        
        # Generate response using OpenAI
        openai_client = get_openai_client()
        if openai_client:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=chat_context,
                temperature=0.7,
                max_tokens=400
            )
            answer = response.choices[0].message.content.strip()
        else:
            answer = "I'm sorry, but I'm currently unable to process your question due to a configuration issue. Please try again later."
        
        # Format long answers with bullet points
        if len(answer) > 200 and not answer.startswith('•'):
            sentences = [s.strip() for s in answer.split('.') if s.strip()]
            if len(sentences) > 2:
                answer = '\n'.join([f"• {sentence}" for sentence in sentences if sentence])
        
        return FollowUpResponse(
            success=True,
            question=request.question,
            answer=answer
        )
        
    except Exception as e:
        print(f"❌ Follow-up error: {e}")
        return FollowUpResponse(
            success=False,
            question=request.question,
            answer="I'm sorry, but I encountered an error while processing your question. Please try again.",
            error=str(e)
        )

def generate_interpretation(soil_moisture: float) -> str:
    """Generate interpretation based on soil moisture value"""
    if soil_moisture < 0.15:
        return "This indicates dry soil, which may require irrigation."
    elif soil_moisture < 0.3:
        return "This indicates moderately moist soil, likely suitable for most crops."
    else:
        return "This indicates very moist or saturated soil, which may delay planting or increase risk of root diseases."

async def generate_ai_tips(subregion: str, region: str, date: str, soil_moisture: float, interpretation: str) -> List[str]:
    """Generate AI-powered agricultural tips"""
    try:
        from datetime import datetime
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        current_month = date_obj.strftime('%B')
        current_season = get_season(date)
        
        prompt = f"""You are an agricultural expert. The average soil moisture for {subregion}, {region} on {date} ({current_month}, {current_season}) is {soil_moisture:.3f} m³/m³.
{interpretation}
Consider the seasonal timing and regional climate patterns.
Provide 3 concise, specific tips for farmers or land managers in this region based on this soil condition and time of year."""

        openai_client = get_openai_client()
        if openai_client:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=250
            )
            
            ai_tips = response.choices[0].message.content.strip()
            
            # Parse tips into array
            tips_array = []
            for line in ai_tips.split('\n'):
                line = line.strip()
                if line and (line.startswith(('1.', '2.', '3.', '-'))):
                    tip = line.replace('1.', '').replace('2.', '').replace('3.', '').replace('-', '').strip()
                    tips_array.append(tip)
            
            tips_array = tips_array[:3]
            
            return tips_array if tips_array else ["Monitor soil conditions regularly", "Consider irrigation needs based on crop requirements", "Consult local agricultural extension services"]
        else:
            return ["Monitor soil conditions regularly", "Consider irrigation needs based on crop requirements", "Consult local agricultural extension services"]
        
    except Exception as e:
        print(f"⚠️ Failed to generate AI tips: {e}")
        return ["Monitor soil conditions regularly", "Consider irrigation needs based on crop requirements", "Consult local agricultural extension services"]

def get_season(date_str: str) -> str:
    """Get season from date string"""
    from datetime import datetime
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    month = date_obj.month
    
    if month >= 3 and month <= 5:
        return "Spring"
    elif month >= 6 and month <= 8:
        return "Summer"
    elif month >= 9 and month <= 11:
        return "Fall"
    else:
        return "Winter"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 