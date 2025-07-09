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
from openai import OpenAI

load_dotenv()

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
        "https://smap-project-sampadaap-ca9gnu6kg-seepiiis-projects.vercel.app",
        "https://*.onrender.com",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client (will be initialized when needed)
client = None

def get_openai_client():
    global client
    if client is None:
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        except TypeError:
            # Handle older OpenAI client versions
            try:
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), http_client=None)
            except TypeError:
                # Fallback for very old versions
                import httpx
                http_client = httpx.Client()
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), http_client=http_client)
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

@app.on_event("startup")
async def startup_event():
    """Initialize Earthdata login on startup"""
    try:
        print("🔐 Logging into NASA Earthdata...")
        
        # Get NASA credentials from environment variables
        nasa_username = os.getenv("NASA_USERNAME")
        nasa_password = os.getenv("NASA_PASSWORD")
        
        if nasa_username and nasa_password:
            print(f"🔑 Using environment variables for NASA credentials (username: {nasa_username})")
            # Create .netrc content dynamically
            netrc_content = f"machine urs.earthdata.nasa.gov\n    login {nasa_username}\n    password {nasa_password}"
            
            # Write to temporary .netrc file
            import tempfile
            temp_netrc = tempfile.NamedTemporaryFile(mode='w', delete=False)
            temp_netrc.write(netrc_content)
            temp_netrc.close()
            
            # Set environment variable to point to our .netrc file
            os.environ['NETRC'] = temp_netrc.name
            
            login(strategy="netrc")
            print("✅ Successfully logged into NASA Earthdata using environment variables")
        else:
            print("❌ NASA credentials not found in environment variables")
            print("Please set NASA_USERNAME and NASA_PASSWORD in Render environment variables")
            
    except Exception as e:
        print(f"⚠️ Earthdata login failed: {e}")
        print("Please ensure you have configured NASA credentials in environment variables")

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
        response = get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=chat_context,
            temperature=0.7,
            max_tokens=400
        )
        
        answer = response.choices[0].message.content.strip()
        
        # Format long answers with bullet points
        if len(answer) > 200 and not answer.startswith('•'):
            # Split into sentences and format as bullet points
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

        response = get_openai_client().chat.completions.create(
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

def applyRegionalCharacteristics(baseMoisture: float, region: str, subregion: str) -> float:
    """Apply regional climate characteristics to soil moisture values"""
    region_lower = region.lower()
    subregion_lower = subregion.lower()
    
    # Southeast Asian adjustments
    if region_lower in ['thailand', 'central thailand']:
        if 'bangkok' in subregion_lower:
            # Bangkok area has urban influence and irrigation
            return max(0.15, min(0.4, baseMoisture * 1.1))
        elif 'chao phraya' in subregion_lower:
            # Chao Phraya basin has good irrigation
            return max(0.2, min(0.45, baseMoisture * 1.2))
        else:
            # Central plains have moderate moisture
            return max(0.15, min(0.35, baseMoisture * 1.0))
    
    elif region_lower in ['vietnam', 'mekong delta']:
        # Mekong Delta has high rainfall and irrigation
        return max(0.25, min(0.5, baseMoisture * 1.3))
    
    elif region_lower in ['indonesia', 'java island']:
        if 'west java' in subregion_lower:
            # West Java has high rainfall
            return max(0.25, min(0.45, baseMoisture * 1.2))
        elif 'central java' in subregion_lower:
            # Central Java has moderate rainfall
            return max(0.2, min(0.4, baseMoisture * 1.1))
        else:
            # East Java tends to be drier
            return max(0.15, min(0.35, baseMoisture * 0.9))
    
    elif region_lower in ['malaysia', 'peninsular malaysia']:
        # Malaysia has high rainfall year-round
        return max(0.25, min(0.5, baseMoisture * 1.3))
    
    elif region_lower in ['philippines', 'luzon island']:
        if 'northern luzon' in subregion_lower:
            # Northern Luzon has typhoon influence
            return max(0.2, min(0.45, baseMoisture * 1.1))
        elif 'central luzon' in subregion_lower:
            # Central Luzon has good irrigation
            return max(0.2, min(0.4, baseMoisture * 1.0))
        else:
            # Southern Luzon has moderate rainfall
            return max(0.18, min(0.38, baseMoisture * 0.95))
    
    # India adjustments (existing)
    elif region_lower in ['india', 'punjab']:
        if 'punjab' in subregion_lower:
            # Punjab is heavily irrigated
            return max(0.2, min(0.35, baseMoisture * 1.1))
        elif 'kerala' in subregion_lower:
            # Kerala has high rainfall
            return max(0.25, min(0.45, baseMoisture * 1.3))
        elif 'ganges' in subregion_lower:
            # Ganges basin has variable moisture
            return max(0.15, min(0.35, baseMoisture * 1.0))
    
    # Default: ensure reasonable range
    return max(0.05, min(0.45, baseMoisture))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SMAP Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 