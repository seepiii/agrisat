from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from earthaccess import login, DataGranules, download
import h5py
import tempfile
import shutil
import openai

load_dotenv()

app = FastAPI(title="SMAP Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

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

@app.on_event("startup")
async def startup_event():
    """Initialize Earthdata login on startup"""
    try:
        print("🔐 Logging into NASA Earthdata...")
        
        # Get credentials from environment variables
        nasa_username = os.getenv("NASA_USERNAME")
        nasa_password = os.getenv("NASA_PASSWORD")
        
        if nasa_username and nasa_password:
            # Use credentials directly
            login(strategy="credentials", username=nasa_username, password=nasa_password)
            print("✅ Successfully logged into NASA Earthdata using environment variables")
        else:
            # Fallback to netrc
            login(strategy="netrc")
            print("✅ Successfully logged into NASA Earthdata using .netrc")
            
    except Exception as e:
        print(f"⚠️ Earthdata login failed: {e}")
        print("Please ensure you have configured NASA_USERNAME and NASA_PASSWORD environment variables")

@app.get("/")
async def root():
    return {"message": "SMAP Analysis API - NASA Earthdata Integration"}

@app.post("/analyze", response_model=SMAPAnalysisResponse)
async def analyze_smap_data(request: SMAPAnalysisRequest):
    """Analyze SMAP data for a specific region and date"""
    try:
        print(f"🔍 Analyzing SMAP data for {request.subregion} on {request.date}")
        
        # Step 1: Search for SMAP data
        query = DataGranules().short_name("SPL3SMP_E")\
                              .temporal(request.date, request.date)\
                              .bounding_box(*request.bbox)
        
        results = list(query.get())
        if not results:
            raise HTTPException(status_code=404, detail="No SMAP data found for the specified date and region")
        
        print(f"📡 Found {len(results)} SMAP granules")
        
        # Step 2: Download SMAP data
        temp_dir = tempfile.mkdtemp()
        try:
            files = download(results, local_path=temp_dir)
            if not files:
                raise HTTPException(status_code=500, detail="Failed to download SMAP data")
            
            hdf5_file = files[0]
            print(f"✅ Downloaded: {hdf5_file}")
            
            # Step 3: Process HDF5 file
            soil_moisture = await process_hdf5_file(hdf5_file, request.bbox, request.subregion)
            
            if soil_moisture is None:
                raise HTTPException(status_code=500, detail="No valid soil moisture data found in the region")
            
            print(f"📍 {request.subregion} | 📅 {request.date}")
            print(f"Average Soil Moisture: {soil_moisture:.3f} m³/m³")
            
            # Step 4: Generate interpretation
            interpretation = generate_interpretation(soil_moisture)
            
            # Step 5: Generate AI tips
            tips = await generate_ai_tips(request.subregion, request.region, request.date, soil_moisture, interpretation)
            
            # Step 6: Setup AI context for follow-up questions
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
                data_source="nasa-smap-satellite"
            )
            
        finally:
            # Clean up temporary files
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except HTTPException:
        raise
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
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=chat_context,
            temperature=0.7,
            max_tokens=300
        )
        
        answer = response.choices[0].message.content.strip()
        
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
            answer="",
            error=str(e)
        )

async def process_hdf5_file(hdf5_path: str, bbox: List[float], subregion: str) -> Optional[float]:
    """Process HDF5 file to extract soil moisture data"""
    try:
        with h5py.File(hdf5_path, "r") as f:
            # Access soil moisture data (same as your Python script)
            sm = f['Soil_Moisture_Retrieval_Data_AM']['soil_moisture'][:]
            lat = f['Soil_Moisture_Retrieval_Data_AM']['latitude'][:]
            lon = f['Soil_Moisture_Retrieval_Data_AM']['longitude'][:]
            
            # Filter valid data
            valid = sm != -9999
            region_mask = (
                (lat >= bbox[1]) & (lat <= bbox[3]) &
                (lon >= bbox[0]) & (lon <= bbox[2]) & valid
            )
            
            region_values = sm[region_mask]
            
            if region_values.size == 0:
                print(f"❌ No valid moisture data in {subregion}")
                return None
            
            avg = float(region_values.mean())
            print(f"📊 Processed {len(region_values)} valid readings for {subregion}")
            return avg
            
    except Exception as e:
        print(f"❌ Error processing HDF5 file: {e}")
        return None

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

        response = openai.ChatCompletion.create(
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SMAP Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 