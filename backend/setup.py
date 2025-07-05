#!/usr/bin/env python3
"""
Setup script for SMAP Analysis Backend
This script helps configure NASA Earthdata credentials and install dependencies.
"""

import os
import sys
import subprocess
from pathlib import Path

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def setup_netrc():
    """Setup .netrc file for NASA Earthdata authentication"""
    home_dir = Path.home()
    netrc_path = home_dir / ".netrc"
    
    print("🔐 Setting up NASA Earthdata authentication...")
    print("You need to create a NASA Earthdata account at: https://urs.earthdata.nasa.gov/")
    
    username = input("Enter your NASA Earthdata username: ").strip()
    password = input("Enter your NASA Earthdata password: ").strip()
    
    if not username or not password:
        print("❌ Username and password are required")
        return False
    
    # Create .netrc file
    netrc_content = f"""machine urs.earthdata.nasa.gov
    login {username}
    password {password}
"""
    
    try:
        with open(netrc_path, 'w') as f:
            f.write(netrc_content)
        
        # Set proper permissions (read/write for owner only)
        os.chmod(netrc_path, 0o600)
        
        print(f"✅ .netrc file created at {netrc_path}")
        print("🔒 File permissions set to secure mode (600)")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create .netrc file: {e}")
        return False

def setup_env_file():
    """Setup environment file"""
    env_path = Path(".env")
    
    if env_path.exists():
        print("⚠️ .env file already exists")
        overwrite = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if overwrite != 'y':
            return True
    
    print("🔧 Setting up environment file...")
    
    openai_key = input("Enter your OpenAI API key (or press Enter to skip): ").strip()
    
    env_content = "# SMAP Analysis Backend Environment Variables\n\n"
    if openai_key:
        env_content += f"OPENAI_API_KEY={openai_key}\n"
    else:
        env_content += "OPENAI_API_KEY=your_openai_api_key_here\n"
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print("✅ .env file created")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def test_connection():
    """Test the NASA Earthdata connection"""
    print("🧪 Testing NASA Earthdata connection...")
    try:
        # Import and test earthaccess
        from earthaccess import login, DataGranules
        
        print("🔐 Attempting to login to NASA Earthdata...")
        login(strategy="netrc")
        
        print("🔍 Testing SMAP data search...")
        query = DataGranules().short_name("SPL3SMP_E").temporal("2024-01-01", "2024-01-01")
        results = list(query.get())
        
        if results:
            print(f"✅ Connection successful! Found {len(results)} SMAP granules for test date")
            return True
        else:
            print("⚠️ Connection successful but no data found for test date (this is normal)")
            return True
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        print("Please check your .netrc file and Earthdata credentials")
        return False

def main():
    """Main setup function"""
    print("🚀 SMAP Analysis Backend Setup")
    print("=" * 40)
    
    # Check if we're in the backend directory
    if not Path("main.py").exists():
        print("❌ Please run this script from the backend directory")
        return
    
    steps = [
        ("Install Dependencies", install_dependencies),
        ("Setup NASA Earthdata Authentication", setup_netrc),
        ("Setup Environment File", setup_env_file),
        ("Test NASA Connection", test_connection)
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        if not step_func():
            print(f"❌ Setup failed at: {step_name}")
            return
    
    print("\n🎉 Setup completed successfully!")
    print("\nTo start the backend server, run:")
    print("  python main.py")
    print("\nOr with uvicorn:")
    print("  uvicorn main:app --host 0.0.0.0 --port 8000 --reload")

if __name__ == "__main__":
    main() 