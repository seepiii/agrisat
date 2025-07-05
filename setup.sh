#!/bin/bash

echo "🚀 Setting up SMAP Soil Moisture Intelligence Platform"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.12+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "🐍 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# NASA Earthdata Credentials
NASA_USERNAME=your_nasa_username
NASA_PASSWORD=your_nasa_password
EOF
    echo "⚠️  Please edit .env file with your actual credentials"
fi

# Create .netrc file if it doesn't exist
if [ ! -f backend/.netrc ]; then
    echo "🔧 Creating .netrc file for NASA Earthdata..."
    cat > backend/.netrc << EOF
machine urs.earthdata.nasa.gov login your_username password your_password
EOF
    chmod 600 backend/.netrc
    echo "⚠️  Please edit backend/.netrc file with your NASA Earthdata credentials"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your OpenAI API key"
echo "2. Edit backend/.netrc with your NASA Earthdata credentials"
echo "3. Start the backend: cd backend && python3 main.py"
echo "4. Start the frontend: npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:8080"
echo "🔧 Backend will be available at: http://localhost:8000"
echo ""
echo "📚 For detailed instructions, see README.md" 