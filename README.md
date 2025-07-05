# 🌍 SMAP Soil Moisture Intelligence Platform

A cutting-edge web application that harnesses NASA's SMAP (Soil Moisture Active Passive) satellite data with AI-powered insights for precision agricultural decision-making.

## 🛰️ Features

- **Real NASA SMAP Data**: Direct integration with NASA's Earthdata servers
- **Global Coverage**: 15+ agricultural regions worldwide
- **AI-Powered Insights**: OpenAI-powered agricultural recommendations
- **Interactive Globe**: 3D globe interface for region selection
- **Historical Analysis**: Date-based soil moisture tracking
- **Follow-up Q&A**: Interactive AI assistant for agricultural queries

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Shadcn/ui
- **Backend**: Python FastAPI with real NASA data processing
- **AI**: OpenAI GPT-4 for agricultural insights
- **Data**: NASA SMAP satellite HDF5 files via Earthdata

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+ with conda
- NASA Earthdata account (free)
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd smap-project-sampadaap
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:8080` (or next available port)

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up NASA Earthdata credentials
# Create .netrc file with your Earthdata credentials
echo "machine urs.earthdata.nasa.gov login YOUR_USERNAME password YOUR_PASSWORD" > .netrc
chmod 600 .netrc

# Set environment variables
export OPENAI_API_KEY="your_openai_api_key_here"

# Start the backend server
python3 main.py
```

Backend will be available at `http://localhost:8000`

### 4. Test the Application

1. Open `http://localhost:8080` in your browser
2. Select a region on the 3D globe
3. Choose a subregion and date
4. Click "Analyze" to get real NASA SMAP data
5. Ask follow-up questions using the AI assistant

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# NASA Earthdata Credentials (or use .netrc file)
NASA_USERNAME=your_nasa_username
NASA_PASSWORD=your_nasa_password
```

### NASA Earthdata Setup

1. Sign up for a free account at [NASA Earthdata](https://urs.earthdata.nasa.gov/)
2. Create a `.netrc` file in the backend directory:
   ```
   machine urs.earthdata.nasa.gov login YOUR_USERNAME password YOUR_PASSWORD
   ```
3. Set permissions: `chmod 600 .netrc`

## 📊 Data Sources

- **SMAP Satellite**: NASA's Soil Moisture Active Passive mission
- **Data Format**: HDF5 files with soil moisture measurements
- **Coverage**: Global with 9km resolution
- **Frequency**: Daily measurements
- **Access**: Via NASA Earthdata servers

## 🏛️ Project Structure

```
smap-project-sampadaap/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── integrations/      # External integrations
├── backend/               # Python FastAPI backend
│   ├── main.py           # Main API server
│   ├── requirements.txt  # Python dependencies
│   └── DEPLOY.md         # Deployment guide
├── supabase/             # Supabase edge functions
│   └── functions/        # Serverless functions
└── README.md             # This file
```

## 🚀 Deployment

### Backend Deployment

See `backend/DEPLOY.md` for detailed deployment instructions to:
- Railway (recommended)
- Render
- Heroku
- AWS

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or any static hosting
```

## 🔍 API Endpoints

### Backend API (localhost:8000)

- `POST /analyze` - Analyze SMAP data for a region
- `POST /followup` - Handle AI follow-up questions
- `GET /health` - Health check endpoint

### Request Format

```json
{
  "region": "India",
  "subregion": "Punjab",
  "bbox": [73.8, 29.5, 76.5, 32.5],
  "date": "2025-07-01"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NASA for providing SMAP satellite data
- OpenAI for AI capabilities
- The open-source community for amazing tools

## 📞 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ for the agricultural community**
