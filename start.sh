#!/bin/bash

echo "🚀 Starting SMAP Analysis Platform..."

# Check if Python backend is running
if ! curl -s http://localhost:8000/ > /dev/null; then
    echo "📡 Starting Python backend..."
    cd backend
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    sleep 5
    
    # Check if backend started successfully
    if curl -s http://localhost:8000/ > /dev/null; then
        echo "✅ Backend started successfully"
    else
        echo "❌ Backend failed to start"
        exit 1
    fi
else
    echo "✅ Backend is already running"
fi

# Start frontend
echo "🌐 Starting frontend..."
npm run dev 